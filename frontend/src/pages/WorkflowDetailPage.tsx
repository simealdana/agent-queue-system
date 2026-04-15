import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams, Link } from 'react-router';
import { useWorkflow, useStartWorkflow, useRestartWorkflow } from '../hooks/useWorkflows';
import { workflowEditPath } from '../constants/routes';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { StepTimeline } from '../components/StepTimeline';
import { WaitingBar } from '../components/WaitingBar';
import { FailedBar } from '../components/FailedBar';
import { useApproveWorkflow } from '../hooks/useWorkflows';
import { useElapsed } from '../hooks/useElapsed';
import { timeAgo } from '../utils/formatting';

export const WorkflowDetailPage = (): ReactElement => {
  const { id } = useParams<{ id: string }>();
  const { data: workflow, isLoading, error } = useWorkflow(id!);
  const startMutation = useStartWorkflow();
  const restartMutation = useRestartWorkflow();
  const approveMutation = useApproveWorkflow();
  const isLive = workflow?.status === 'running' || workflow?.status === 'waiting';
  const elapsed = useElapsed(workflow?.createdAt ?? null, isLive);

  const handleStart = useCallback((): void => {
    if (id) startMutation.mutate(id);
  }, [id, startMutation]);

  const handleRestart = useCallback((): void => {
    if (id) restartMutation.mutate(id);
  }, [id, restartMutation]);

  const handleApprove = useCallback((): void => {
    if (id) approveMutation.mutate(id);
  }, [id, approveMutation]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !workflow) {
    return <ErrorState message={error?.message ?? 'Workflow not found'} />;
  }

  const completedSteps = workflow.steps.filter((s) => s.status === 'completed').length;
  const waitingStep = workflow.steps.find((s) => s.status === 'waiting');

  return (
    <div>
      <div className="terminal-window">
        {/* Terminal titlebar */}
        <div className="terminal-titlebar min-h-[44px]">
          <span className="terminal-dot bg-red-500/40" />
          <span className="terminal-dot bg-yellow-500/40" />
          <span className="terminal-dot bg-emerald-500/40" />
          <span className="text-xs text-gray-600 ml-2 truncate">{workflow.name}</span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <StatusBadge status={workflow.status} />
          </div>
        </div>

        {/* Header info */}
        <div className="px-4 md:px-5 py-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 text-sm font-mono">
              <span className="text-emerald-500/60">$</span>
              <span className="text-gray-300">{workflow.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {workflow.status === 'pending' && (
                <>
                  <Link
                    to={workflowEditPath(workflow.id)}
                    className="px-3 py-2 text-xs min-h-[36px] inline-flex items-center font-mono bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-500 hover:text-gray-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    $ edit
                  </Link>
                  <button
                    onClick={handleStart}
                    disabled={startMutation.isPending}
                    className="px-3 py-2 text-xs min-h-[36px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    {startMutation.isPending ? '...' : '$ start'}
                  </button>
                </>
              )}
              {workflow.status === 'completed' && (
                <>
                  <Link
                    to="/"
                    className="px-3 py-2 text-xs min-h-[36px] inline-flex items-center gap-2 font-mono bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-500 hover:text-gray-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    $ home
                  </Link>
                  <button
                    onClick={handleRestart}
                    disabled={restartMutation.isPending}
                    className="px-3 py-2 text-xs min-h-[36px] inline-flex items-center gap-2 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    {restartMutation.isPending ? '...' : '$ run again'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 font-mono">
            <span>{workflow.id.slice(0, 8)}</span>
            <span>{timeAgo(workflow.createdAt)}</span>
            <span>{completedSteps}/{workflow.totalSteps} steps</span>
            {isLive && elapsed && <span className="text-emerald-500/60">{elapsed}</span>}
          </div>
          <div className="mt-3 w-52">
            <ProgressBar current={completedSteps} total={workflow.totalSteps} status={workflow.status} />
          </div>
        </div>

        {/* Steps */}
        <div className="py-2">
          <StepTimeline steps={workflow.steps} />
        </div>

        {workflow.status === 'waiting' && waitingStep && (
          <WaitingBar step={waitingStep} onApprove={handleApprove} isApproving={approveMutation.isPending} />
        )}
        {workflow.status === 'failed' && (
          <FailedBar workflowId={workflow.id} error={workflow.error} />
        )}
      </div>
    </div>
  );
};

const LoadingState = (): ReactElement => (
  <div className="flex items-center gap-2 py-24 justify-center text-sm text-gray-600 font-mono">
    <svg aria-label="Loading" className="w-4 h-4 text-emerald-500 animate-spin-slow" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    loading...
  </div>
);

const ErrorState = ({ message }: { message: string }): ReactElement => (
  <div className="terminal-window">
    <div className="px-4 py-6 text-center">
      <p className="text-sm text-red-400 font-mono"><span className="text-red-500">ERR</span> {message}</p>
      <Link to="/" className="text-sm text-gray-600 hover:text-emerald-400 mt-3 inline-block font-mono">$ cd ..</Link>
    </div>
  </div>
);
