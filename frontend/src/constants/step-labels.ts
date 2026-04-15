export const STEP_LABELS: Record<string, string> = {
  'check-calendar': 'Check Calendar',
  'update-crm': 'Update CRM Record',
  'generate-summary': 'Generate AI Summary',
  'human-review': 'Human Review',
  'external-approval': 'External Approval',
  'send-followup': 'Send Follow-up Email',
  'schedule-next': 'Schedule Next Round',
};

export const STEP_DESCRIPTIONS: Record<string, string> = {
  'check-calendar': 'Verifying interviewer availability',
  'update-crm': 'Updating candidate status in CRM',
  'generate-summary': 'Running LLM inference for interview summary',
  'human-review': 'Waiting for human to review and approve AI summary',
  'send-followup': 'Dispatching follow-up email to candidate',
  'external-approval': 'Waiting for external approval via shared link',
  'schedule-next': 'Booking next interview round',
};
