import { Injectable, Inject } from '@nestjs/common';
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { DATABASE_TOKEN } from '../database/database.provider';
import { WorkflowRow, StepRow } from './workflow.types';

@Injectable()
export class WorkflowRepository {
  constructor(@Inject(DATABASE_TOKEN) private db: Database.Database) {}

  createWorkflow(name: string, stepNames: string[]): WorkflowRow {
    const id = uuid();
    const now = new Date().toISOString();

    const txn = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO workflows (id, name, status, current_step, total_steps, context, created_at, updated_at)
           VALUES (?, ?, 'pending', 0, ?, '{}', ?, ?)`,
        )
        .run(id, name, stepNames.length, now, now);

      const insertStep = this.db.prepare(
        `INSERT INTO workflow_steps (id, workflow_id, step_index, name, status, attempt, max_retries, created_at)
         VALUES (?, ?, ?, ?, 'pending', 0, 3, ?)`,
      );

      for (let i = 0; i < stepNames.length; i++) {
        insertStep.run(uuid(), id, i, stepNames[i], now);
      }
    });

    txn();
    return this.getWorkflow(id)!;
  }

  getWorkflow(id: string): WorkflowRow | undefined {
    return this.db
      .prepare('SELECT * FROM workflows WHERE id = ?')
      .get(id) as WorkflowRow | undefined;
  }

  listWorkflows(): WorkflowRow[] {
    return this.db
      .prepare('SELECT * FROM workflows ORDER BY created_at DESC')
      .all() as WorkflowRow[];
  }

  getSteps(workflowId: string): StepRow[] {
    return this.db
      .prepare(
        'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_index ASC',
      )
      .all(workflowId) as StepRow[];
  }

  setWorkflowStatus(
    workflowId: string,
    status: string,
    error?: string,
  ): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        'UPDATE workflows SET status = ?, error = ?, updated_at = ? WHERE id = ?',
      )
      .run(status, error ?? null, now, workflowId);
  }

  markStepRunning(stepId: string, attempt: number): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE workflow_steps SET status = 'running', attempt = ?, started_at = ? WHERE id = ?`,
      )
      .run(attempt, now, stepId);
  }

  /**
   * Atomically: mark step completed, store result, advance workflow.current_step,
   * merge step result into workflow.context. This is the crash-safety primitive.
   */
  completeStep(
    stepId: string,
    workflowId: string,
    stepName: string,
    result: Record<string, unknown>,
  ): void {
    const txn = this.db.transaction(() => {
      const now = new Date().toISOString();

      // Complete the step
      const step = this.db
        .prepare('SELECT started_at FROM workflow_steps WHERE id = ?')
        .get(stepId) as { started_at: string } | undefined;

      const durationMs = step?.started_at
        ? Math.round(
            (new Date(now).getTime() - new Date(step.started_at).getTime()),
          )
        : null;

      this.db
        .prepare(
          `UPDATE workflow_steps
           SET status = 'completed', result = ?, completed_at = ?, duration_ms = ?
           WHERE id = ?`,
        )
        .run(JSON.stringify(result), now, durationMs, stepId);

      // Advance workflow: update current_step and merge context
      const workflow = this.db
        .prepare('SELECT context FROM workflows WHERE id = ?')
        .get(workflowId) as { context: string };

      const context = JSON.parse(workflow.context);
      context[stepName] = result;

      this.db
        .prepare(
          `UPDATE workflows
           SET current_step = current_step + 1, context = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(JSON.stringify(context), now, workflowId);
    });

    txn();
  }

  failStep(stepId: string, workflowId: string, error: string): void {
    const now = new Date().toISOString();

    const txn = this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE workflow_steps SET status = 'failed', error = ?, completed_at = ? WHERE id = ?`,
        )
        .run(error, now, stepId);

      this.db
        .prepare(
          `UPDATE workflows SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`,
        )
        .run(error, now, workflowId);
    });

    txn();
  }

  /**
   * Reset a failed step back to pending so it can be retried on resume.
   */
  resetFailedStep(workflowId: string): void {
    this.db
      .prepare(
        `UPDATE workflow_steps
         SET status = 'pending', error = NULL, attempt = 0
         WHERE workflow_id = ? AND status IN ('failed', 'running')`,
      )
      .run(workflowId);

    this.db
      .prepare(
        `UPDATE workflows SET status = 'pending', error = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(new Date().toISOString(), workflowId);
  }

  /**
   * Mark a step as waiting for human intervention.
   * Stores the pending data, approval type, and token for external approvals.
   */
  markStepWaiting(
    stepId: string,
    workflowId: string,
    message: string,
    pendingData: Record<string, unknown>,
    approvalType: 'dashboard' | 'external',
    token?: string,
  ): void {
    const now = new Date().toISOString();
    const resultPayload = { ...pendingData, _approvalType: approvalType, _token: token ?? null };

    const txn = this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE workflow_steps
           SET status = 'waiting', error = ?, result = ?, completed_at = ?
           WHERE id = ?`,
        )
        .run(message, JSON.stringify(resultPayload), now, stepId);

      this.db
        .prepare(
          `UPDATE workflows SET status = 'waiting', error = ?, updated_at = ? WHERE id = ?`,
        )
        .run(message, now, workflowId);
    });

    txn();
  }

  /**
   * Find a waiting step by its approval token (for external link approvals).
   */
  findStepByToken(token: string): { step: StepRow; workflowId: string } | undefined {
    const rows = this.db
      .prepare(
        `SELECT * FROM workflow_steps WHERE status = 'waiting'`,
      )
      .all() as StepRow[];

    for (const row of rows) {
      if (!row.result) continue;
      const result = JSON.parse(row.result);
      if (result._token === token) {
        return { step: row, workflowId: row.workflow_id };
      }
    }
    return undefined;
  }

  /**
   * Approve a waiting step — mark it completed and advance the workflow.
   */
  approveStep(workflowId: string): void {
    const txn = this.db.transaction(() => {
      const now = new Date().toISOString();

      const step = this.db
        .prepare(
          `SELECT id, name, result FROM workflow_steps
           WHERE workflow_id = ? AND status = 'waiting'
           LIMIT 1`,
        )
        .get(workflowId) as { id: string; name: string; result: string } | undefined;

      if (!step) return;

      const result = step.result ? JSON.parse(step.result) : {};

      // Mark step completed
      this.db
        .prepare(
          `UPDATE workflow_steps SET status = 'completed', error = NULL, completed_at = ? WHERE id = ?`,
        )
        .run(now, step.id);

      // Advance workflow and merge context
      const workflow = this.db
        .prepare('SELECT context FROM workflows WHERE id = ?')
        .get(workflowId) as { context: string };

      const context = JSON.parse(workflow.context);
      context[step.name] = { ...result, approved: true, approvedAt: now };

      this.db
        .prepare(
          `UPDATE workflows
           SET status = 'running', current_step = current_step + 1,
               context = ?, error = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .run(JSON.stringify(context), now, workflowId);
    });

    txn();
  }

  /**
   * Restart a workflow from scratch — reset all steps and context.
   */
  restartWorkflow(workflowId: string): void {
    const now = new Date().toISOString();

    const txn = this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE workflow_steps
           SET status = 'pending', result = NULL, error = NULL,
               attempt = 0, started_at = NULL, completed_at = NULL, duration_ms = NULL
           WHERE workflow_id = ?`,
        )
        .run(workflowId);

      this.db
        .prepare(
          `UPDATE workflows
           SET status = 'pending', current_step = 0, context = '{}',
               error = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .run(now, workflowId);
    });

    txn();
  }

  updateWorkflow(workflowId: string, name: string, stepNames: string[]): void {
    const now = new Date().toISOString();

    const txn = this.db.transaction(() => {
      this.db
        .prepare('DELETE FROM workflow_steps WHERE workflow_id = ?')
        .run(workflowId);

      const insertStep = this.db.prepare(
        `INSERT INTO workflow_steps (id, workflow_id, step_index, name, status, attempt, max_retries, created_at)
         VALUES (?, ?, ?, ?, 'pending', 0, 3, ?)`,
      );

      for (let i = 0; i < stepNames.length; i++) {
        insertStep.run(uuid(), workflowId, i, stepNames[i], now);
      }

      this.db
        .prepare(
          `UPDATE workflows
           SET name = ?, total_steps = ?, current_step = 0, context = '{}',
               error = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .run(name, stepNames.length, now, workflowId);
    });

    txn();
  }

  findInterruptedWorkflows(): WorkflowRow[] {
    return this.db
      .prepare("SELECT * FROM workflows WHERE status = 'running'")
      .all() as WorkflowRow[];
  }
}
