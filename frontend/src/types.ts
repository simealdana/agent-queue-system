export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting';

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
