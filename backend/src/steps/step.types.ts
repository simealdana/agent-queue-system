export interface StepContext {
  workflowId: string;
  stepIndex: number;
  attempt: number;
  accumulated: Record<string, unknown>;
}

export interface StepResult {
  data: Record<string, unknown>;
}

/**
 * Thrown by step handlers to signal a transient (retryable) error.
 * Any other thrown error is treated as fatal and stops the workflow.
 */
export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
  }
}

export type StepHandler = (ctx: StepContext) => Promise<StepResult>;
