import type { ReactElement } from 'react';
import type { WorkflowStatus } from '../types';

interface ProgressBarProps {
  current: number;
  total: number;
  status: WorkflowStatus;
}

const BLOCK_COLORS: Record<string, string> = {
  pending: 'text-gray-600',
  running: 'text-emerald-500',
  completed: 'text-emerald-500',
  failed: 'text-red-500',
  waiting: 'text-orange-500',
};

export const ProgressBar = ({ current, total, status }: ProgressBarProps): ReactElement => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const filled = total > 0 ? Math.round((current / total) * 10) : 0;
  const empty = 10 - filled;
  const color = BLOCK_COLORS[status] ?? BLOCK_COLORS.pending!;

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Workflow progress: ${pct}%`}
      className="flex items-center gap-1.5 font-mono text-xs"
    >
      <span className="text-gray-700">[</span>
      <span className={color}>
        {'\u2588'.repeat(filled)}
      </span>
      <span className="text-gray-800">
        {'\u2591'.repeat(empty)}
      </span>
      <span className="text-gray-700">]</span>
      <span className="text-gray-600 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
};
