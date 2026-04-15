/** Output shapes for each known step handler */
export interface StepOutputMap {
  'check-calendar': { available: boolean; slots: string[]; calendarId: string; timezone: string };
  'update-crm': { candidateId: string; previousStatus: string; newStatus: string; updatedFields: string[] };
  'generate-summary': { summary: string; sentiment: string; keyTopics: string[]; confidence: number };
  'send-followup': { messageId: string; recipient: string; subject: string; provider: string };
  'schedule-next': { eventId: string; scheduledAt: string; interviewType: string; panelSize: number; notificationsSent: boolean };
  'human-review': Record<string, unknown>;
  'external-approval': Record<string, unknown>;
}

export type StepName = keyof StepOutputMap;

/** Accumulated context from prior steps — typed per step name */
export type AccumulatedContext = {
  [K in StepName]?: StepOutputMap[K];
};

export interface StepContext {
  workflowId: string;
  stepIndex: number;
  attempt: number;
  accumulated: AccumulatedContext;
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

export type ApprovalType = 'dashboard' | 'external';

/**
 * Thrown by step handlers to signal that human intervention is required.
 *
 * - `dashboard`: approved directly in the UI via the Approve button
 * - `external`: generates a unique link that can be shared (email, slack, etc.)
 *    The workflow stays blocked until someone visits that link and approves.
 */
export class WaitForApproval extends Error {
  public readonly pendingData: Record<string, unknown>;
  public readonly approvalType: ApprovalType;

  constructor(
    message: string,
    pendingData: Record<string, unknown> = {},
    approvalType: ApprovalType = 'dashboard',
  ) {
    super(message);
    this.name = 'WaitForApproval';
    this.pendingData = pendingData;
    this.approvalType = approvalType;
  }
}

export type StepHandler = (ctx: StepContext) => Promise<StepResult>;
