import type { ReactElement } from 'react';
import type { WorkflowStatus, StepStatus } from '../types';
import { STATUS_CONFIG } from '../constants/status-config';

export const StatusBadge = ({ status }: { status: WorkflowStatus | StepStatus }): ReactElement => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending!;

  return (
    <span
      role="status"
      aria-label={`Status: ${c.label}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono tracking-wider ${c.text}`}
    >
      <span className="text-gray-700">[</span>
      {status === 'running' && <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />}
      {c.label}
      <span className="text-gray-700">]</span>
    </span>
  );
};
