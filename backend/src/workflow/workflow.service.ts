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
import { TransientError, WaitForApproval } from '../steps/step.types';
import type { AccumulatedContext } from '../steps/step.types';
import { v4 as uuid } from 'uuid';
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

  cloneWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    const steps = this.repo.getSteps(id);
    const stepNames = steps.map((s) => s.name);
    return this.createWorkflow(row.name, stepNames);
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

  /** Update a pending (draft) workflow's name and steps */
  updateWorkflow(id: string, name: string, stepNames: string[]): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    if (row.status !== 'pending') {
      throw new BadRequestException('Can only edit pending (draft) workflows');
    }
    for (const stepName of stepNames) {
      if (!this.registry.has(stepName)) {
        throw new BadRequestException(`Unknown step handler: "${stepName}"`);
      }
    }
    this.repo.updateWorkflow(id, name, stepNames);
    return this.getWorkflow(id);
  }

  /** Start execution of a pending workflow */
  startWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    if (row.status !== 'pending') {
      throw new BadRequestException('Can only start pending workflows');
    }
    this.executeWorkflow(id).catch((err) =>
      this.logger.error(`Start failed for ${id}: ${err.message}`),
    );
    return this.getWorkflow(id);
  }

  /** Resume a failed workflow from the failed step */
  resumeWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    if (row.status !== 'failed') {
      throw new BadRequestException('Can only resume failed workflows');
    }

    this.repo.resetFailedStep(id);
    this.executeWorkflow(id).catch((err) =>
      this.logger.error(`Resume failed for ${id}: ${err.message}`),
    );

    return this.getWorkflow(id);
  }

  /** Restart a workflow from scratch — re-run all steps */
  restartWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    if (row.status !== 'failed' && row.status !== 'completed') {
      throw new BadRequestException('Can only restart failed or completed workflows');
    }

    this.repo.restartWorkflow(id);
    this.executeWorkflow(id).catch((err) =>
      this.logger.error(`Restart failed for ${id}: ${err.message}`),
    );

    return this.getWorkflow(id);
  }

  /** Approve a waiting step and continue execution */
  approveWorkflow(id: string): WorkflowDto {
    const row = this.repo.getWorkflow(id);
    if (!row) throw new NotFoundException(`Workflow ${id} not found`);
    if (row.status !== 'waiting') {
      throw new BadRequestException('Workflow is not waiting for approval');
    }

    this.repo.approveStep(id);
    this.emitFullUpdate(id);

    // Continue execution from the next step
    this.executeWorkflow(id).catch((err) =>
      this.logger.error(`Post-approval execution failed for ${id}: ${err.message}`),
    );

    return this.getWorkflow(id);
  }

  /** Approve by external token (from the approval link) */
  approveByToken(token: string): WorkflowDto {
    const found = this.repo.findStepByToken(token);
    if (!found) throw new NotFoundException('Invalid or expired approval token');
    return this.approveWorkflow(found.workflowId);
  }

  /** Get workflow info by approval token (for the approval page) */
  getByToken(token: string): { workflow: WorkflowDto; stepName: string; pendingData: Record<string, unknown> } {
    const found = this.repo.findStepByToken(token);
    if (!found) throw new NotFoundException('Invalid or expired approval token');

    const workflow = this.getWorkflow(found.workflowId);
    const result = found.step.result ? JSON.parse(found.step.result) : {};
    const { _approvalType: _, _token: __, ...pendingData } = result;

    return { workflow, stepName: found.step.name, pendingData };
  }

  /**
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

      const result = await this.executeStep(workflowId, step);

      if (result === 'waiting') {
        // Step needs human intervention — stop execution
        return;
      }

      if (result === 'failed') {
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
   * Returns 'completed', 'failed', or 'waiting'.
   */
  private async executeStep(
    workflowId: string,
    step: StepRow,
  ): Promise<'completed' | 'failed' | 'waiting'> {
    const handler = this.registry.get(step.name);
    const maxAttempts = step.max_retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.repo.markStepRunning(step.id, attempt);
      this.emitFullUpdate(workflowId);

      try {
        const workflow = this.repo.getWorkflow(workflowId)!;
        const accumulated = JSON.parse(workflow.context) as AccumulatedContext;

        const result = await handler({
          workflowId,
          stepIndex: step.step_index,
          attempt,
          accumulated,
        });

        this.repo.completeStep(step.id, workflowId, step.name, result.data);
        this.emitFullUpdate(workflowId);
        return 'completed';
      } catch (err) {
        const error = err as Error;

        // Human intervention required — pause workflow
        if (error instanceof WaitForApproval) {
          const token = error.approvalType === 'external' ? uuid() : undefined;
          this.logger.log(
            `Step "${step.name}" requires ${error.approvalType} approval: ${error.message}` +
            (token ? ` (token: ${token})` : ''),
          );
          this.repo.markStepWaiting(
            step.id,
            workflowId,
            error.message,
            error.pendingData,
            error.approvalType,
            token,
          );
          this.emitFullUpdate(workflowId);
          return 'waiting';
        }

        // Transient error — retry
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
        return 'failed';
      }
    }

    return 'failed';
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
