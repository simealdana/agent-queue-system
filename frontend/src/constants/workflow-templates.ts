export interface WorkflowTemplate {
  name: string;
  template: string;
  description: string;
  badge: string;
  badgeColor: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: 'Post-Interview Follow-up',
    template: 'default',
    description: 'Dashboard approval — review AI summary in-app',
    badge: 'Dashboard Review',
    badgeColor: 'text-orange-400 bg-orange-500/10',
  },
  {
    name: 'Candidate Screening',
    template: 'with-external',
    description: 'External approval — manager approves via shared link',
    badge: 'External Link',
    badgeColor: 'text-purple-400 bg-purple-500/10',
  },
  {
    name: 'Full Review Pipeline',
    template: 'full-review',
    description: 'Both dashboard + external approval gates',
    badge: 'Both',
    badgeColor: 'text-cyan-400 bg-cyan-500/10',
  },
  {
    name: 'Error Recovery Demo',
    template: 'error-recovery',
    description: 'Simulates a fatal error — resume or restart to recover',
    badge: 'Crash Recovery',
    badgeColor: 'text-red-400 bg-red-500/10',
  },
];
