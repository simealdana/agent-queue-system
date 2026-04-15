import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { useResumeWorkflow, useRestartWorkflow } from '../hooks/useWorkflows';

interface FailedBarProps {
  workflowId: string;
  error: string | null;
}

export const FailedBar = ({ workflowId, error }: FailedBarProps): ReactElement => {
  const resumeMutation = useResumeWorkflow();
  const restartMutation = useRestartWorkflow();

  const handleRestart = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    restartMutation.mutate(workflowId);
  }, [restartMutation, workflowId]);

  const handleResume = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    resumeMutation.mutate(workflowId);
  }, [resumeMutation, workflowId]);

  return (
    <div className="px-4 py-3 border-t border-red-500/10 bg-red-500/[0.03]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-red-500 shrink-0">ERR</span>
          <span role="alert" className="text-red-400/60 truncate text-xs">{error}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRestart}
            disabled={restartMutation.isPending}
            aria-label="Restart workflow from scratch"
            className="px-3 py-2 text-xs min-h-[36px] bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-500 hover:text-gray-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {restartMutation.isPending ? '...' : '$ restart'}
          </button>
          <button
            onClick={handleResume}
            disabled={resumeMutation.isPending}
            aria-label="Resume workflow from failed step"
            className="px-3 py-2 text-xs min-h-[36px] bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {resumeMutation.isPending ? '...' : '$ resume'}
          </button>
        </div>
      </div>
    </div>
  );
};
