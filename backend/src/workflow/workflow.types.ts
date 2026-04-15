export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting';

/** Raw database row for a workflow */
export interface WorkflowRow {
  id: string;
  name: string;
  status: WorkflowStatus;
  current_step: number;
  total_steps: number;
  context: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/** Raw database row for a workflow step */
export interface StepRow {
  id: string;
  workflow_id: string;
  step_index: number;
  name: string;
  status: StepStatus;
  result: string | null;
  error: string | null;
  attempt: number;
  max_retries: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

/** API response DTO for a workflow */
export interface WorkflowDto {
  id: string;
  name: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  context: Record<string, unknown>;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  steps: StepDto[];
}

/** API response DTO for a step */
export interface StepDto {
  id: string;
  stepIndex: number;
  name: string;
  status: StepStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  attempt: number;
  maxRetries: number;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
}

/** Convert raw rows to API DTO */
export function toWorkflowDto(
  row: WorkflowRow,
  stepRows: StepRow[],
): WorkflowDto {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    context: JSON.parse(row.context),
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps: stepRows.map(toStepDto),
  };
}

export function toStepDto(row: StepRow): StepDto {
  return {
    id: row.id,
    stepIndex: row.step_index,
    name: row.name,
    status: row.status,
    result: row.result ? JSON.parse(row.result) : null,
    error: row.error,
    attempt: row.attempt,
    maxRetries: row.max_retries,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
  };
}
