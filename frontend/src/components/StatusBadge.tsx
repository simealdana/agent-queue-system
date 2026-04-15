import type { WorkflowStatus, StepStatus } from '../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-700/50 text-gray-300',
  running: 'bg-blue-600/20 text-blue-400 animate-step-pulse',
  completed: 'bg-emerald-600/20 text-emerald-400',
  failed: 'bg-red-600/20 text-red-400',
  skipped: 'bg-yellow-600/20 text-yellow-400',
};

export function StatusBadge({
  status,
}: {
  status: WorkflowStatus | StepStatus;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
    >
      {status}
    </span>
  );
}
