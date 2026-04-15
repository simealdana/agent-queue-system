import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowGateway } from './workflow.gateway';
import { StepRegistry } from '../steps/step-registry.service';
import { TransientError } from '../steps/step.types';
import {
  WorkflowDto,
  StepRow,
  toWorkflowDto,
} from './workflow.types';
import { sleep, calculateBackoff } from '../shared/utils';

@Injectable()
export class WorkflowService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private repo: WorkflowRepository,
    private registry: StepRegistry,
    private gateway: WorkflowGateway,
  ) {}

  /** On startup, find and resume any interrupted workflows */
  onModuleInit(): void {
    const interrupted = this.repo.findInterruptedWorkflows();
    for (const wf of interrupted) {
      this.logger.warn(`Resuming interrupted workflow: ${wf.id} (${wf.name})`);
      this.executeWorkflow(wf.id).catch((err) =>
        this.logger.error(`Failed to resume ${wf.id}: ${err.message}`),
      );
    }
  }

  createWorkflow(name: string, stepNames: string[]): WorkflowDto {
    for (const stepName of stepNames) {
      if (!this.registry.has(stepName)) {
        throw new BadRequestException(`Unknown step handler: "${stepName}"`);
      }
    }

    const row = this.repo.createWorkflow(name, stepNames);
    const steps = this.repo.getSteps(row.id);
    return toWorkflowDto(row, steps);
  }

  getWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    const steps = this.repo.getSteps(id);
    return toWorkflowDto(row, steps);
  }

  listWorkflows(): WorkflowDto[] {
    const rows = this.repo.listWorkflows();
    return rows.map((row) => {
      const steps = this.repo.getSteps(row.id);
      return toWorkflowDto(row, steps);
    });
  }

  resumeWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    if (row.status !== 'failed') {
      throw new BadRequestException('Can only resume failed workflows');
    }

    this.repo.resetFailedStep(id);

    // Fire and forget
    this.executeWorkflow(id).catch((err) =>
      this.logger.error(`Resume failed for ${id}: ${err.message}`),
    );

    return this.getWorkflow(id);
  }

  /**
   * The main execution loop. Handles both new workflows and resume.
   * Skips completed steps — this is how crash recovery works.
   */
  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.repo.getWorkflow(workflowId);
    if (!workflow) throw new NotFoundException(`Workflow ${workflowId} not found`);

    this.repo.setWorkflowStatus(workflowId, 'running');
    this.emitFullUpdate(workflowId);

    const steps = this.repo.getSteps(workflowId);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;

      // Skip completed steps (the resume mechanism)
      if (step.status === 'completed') continue;

      const success = await this.executeStep(workflowId, step);
      if (!success) {
        // Fatal failure — workflow stops
        this.emitFullUpdate(workflowId);
        return;
      }
    }

    this.repo.setWorkflowStatus(workflowId, 'completed');
    this.emitFullUpdate(workflowId);
  }

  /**
   * Execute a single step with retry logic for transient errors.
   * Returns true if step completed, false if it failed fatally.
   */
  private async executeStep(
    workflowId: string,
    step: StepRow,
  ): Promise<boolean> {
    const handler = this.registry.get(step.name);
    const maxAttempts = step.max_retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.repo.markStepRunning(step.id, attempt);
      this.emitFullUpdate(workflowId);

      try {
        // Build context from current workflow state
        const workflow = this.repo.getWorkflow(workflowId)!;
        const accumulated = JSON.parse(workflow.context);

        const result = await handler({
          workflowId,
          stepIndex: step.step_index,
          attempt,
          accumulated,
        });

        // Atomically persist completion
        this.repo.completeStep(step.id, workflowId, step.name, result.data);
        this.emitFullUpdate(workflowId);
        return true;
      } catch (err) {
        const error = err as Error;

        if (error instanceof TransientError && attempt < maxAttempts) {
          const backoffMs = calculateBackoff(attempt);
          this.logger.warn(
            `Step "${step.name}" attempt ${attempt} failed (transient): ${error.message}. Retrying in ${backoffMs}ms`,
          );
          this.emitFullUpdate(workflowId);
          await sleep(backoffMs);
          continue;
        }

        // Fatal error or retries exhausted
        this.logger.error(
          `Step "${step.name}" failed fatally: ${error.message}`,
        );
        this.repo.failStep(step.id, workflowId, error.message);
        this.emitFullUpdate(workflowId);
        return false;
      }
    }

    return false;
  }

  private emitFullUpdate(workflowId: string): void {
    try {
      const dto = this.getWorkflow(workflowId);
      this.gateway.emitWorkflowUpdate(workflowId, dto as unknown as Record<string, unknown>);
    } catch {
      // Ignore errors during emit — non-critical
    }
  }
}
