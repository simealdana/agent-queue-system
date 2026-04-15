import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import type { WorkflowDto } from '../types';
import { Link } from 'react-router';
import { workflowDetailPath } from '../constants/routes';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { StepTimeline } from './StepTimeline';
import { WaitingBar } from './WaitingBar';
import { FailedBar } from './FailedBar';
import { useElapsed } from '../hooks/useElapsed';
import { timeAgo } from '../utils/formatting';
import { useApproveWorkflow, useRestartWorkflow, useStartWorkflow } from '../hooks/useWorkflows';

export const WorkflowCard = ({ workflow }: { workflow: WorkflowDto }): ReactElement => {
  const [expanded, setExpanded] = useState(true);
  const approveMutation = useApproveWorkflow();
  const restartMutation = useRestartWorkflow();
  const startMutation = useStartWorkflow();
  const completedSteps = workflow.steps.filter((s) => s.status === 'completed').length;
  const hasRetries = workflow.steps.some((s) => s.attempt > 1);
  const waitingStep = workflow.steps.find((s) => s.status === 'waiting');
  const isLive = workflow.status === 'running' || workflow.status === 'waiting';
  const elapsed = useElapsed(workflow.createdAt, isLive);

  const toggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  const handleApprove = useCallback((): void => {
    approveMutation.mutate(workflow.id);
  }, [approveMutation, workflow.id]);

  const handleRestart = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    restartMutation.mutate(workflow.id);
  }, [restartMutation, workflow.id]);

  const handleStart = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    startMutation.mutate(workflow.id);
  }, [startMutation, workflow.id]);


  return (
    <article
      aria-label={`Workflow: ${workflow.name}, status: ${workflow.status}`}
      className="terminal-window group"
    >
      {/* Terminal titlebar */}
      <button
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={`${workflow.name} — ${expanded ? 'collapse' : 'expand'} details`}
        className="w-full terminal-titlebar cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset min-h-[44px]"
      >
        <div className="flex items-center gap-1.5 mr-3 shrink-0">
          <span className={`terminal-dot ${workflow.status === 'failed' ? 'bg-red-500' : 'bg-red-500/40'}`} />
          <span className={`terminal-dot ${workflow.status === 'waiting' ? 'bg-yellow-500' : 'bg-yellow-500/40'}`} />
          <span className={`terminal-dot ${workflow.status === 'completed' ? 'bg-emerald-500' : workflow.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500/40'}`} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <Link
            to={workflowDetailPath(workflow.id)}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-gray-300 hover:text-emerald-400 transition-colors truncate text-left"
          >
            {workflow.name}
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600 font-mono">{workflow.id.slice(0, 8)}</span>
            <StatusBadge status={workflow.status} />
            {hasRetries && (
              <span className="text-xs text-yellow-500/60">retried</span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <span className="text-xs text-gray-600">{timeAgo(workflow.createdAt)}</span>
          {isLive && elapsed && <span className="text-xs text-emerald-500/60">{elapsed}</span>}
          <div className="w-36">
            <ProgressBar current={completedSteps} total={workflow.totalSteps} status={workflow.status} />
          </div>
        </div>

        <svg
          aria-hidden="true"
          className={`w-4 h-4 text-gray-600 shrink-0 transition-transform duration-200 ml-2 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mobile-only progress row */}
      <div className="flex sm:hidden items-center gap-3 px-4 py-2 border-b border-border/30 text-xs text-gray-600">
        <span>{timeAgo(workflow.createdAt)}</span>
        {isLive && elapsed && <span className="text-emerald-500/60">{elapsed}</span>}
        <div className="flex-1">
          <ProgressBar current={completedSteps} total={workflow.totalSteps} status={workflow.status} />
        </div>
      </div>

      {/* Terminal body */}
      {expanded && (
        <div className="bg-surface-0/50">
          <div className="px-0 py-2">
            <StepTimeline steps={workflow.steps} />
          </div>

          {workflow.status === 'waiting' && waitingStep && (
            <WaitingBar step={waitingStep} onApprove={handleApprove} isApproving={approveMutation.isPending} />
          )}
          {workflow.status === 'failed' && (
            <FailedBar workflowId={workflow.id} error={workflow.error} />
          )}

          {/* Pending: Start */}
          {workflow.status === 'pending' && (
            <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-xs text-gray-700 font-mono">ready to run</span>
              <button
                onClick={handleStart}
                disabled={startMutation.isPending}
                aria-label="Start this workflow"
                className="px-3 py-2 text-xs min-h-[36px] inline-flex items-center gap-2 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                {startMutation.isPending ? 'Starting...' : '$ start'}
              </button>
            </div>
          )}

          {/* Completed: Run Again + Clone */}
          {workflow.status === 'completed' && (
            <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-xs text-gray-700 font-mono">completed</span>
              <button
                  onClick={handleRestart}
                  disabled={restartMutation.isPending}
                  aria-label="Run this workflow again"
                  className="px-3 py-2 text-xs min-h-[36px] inline-flex items-center gap-2 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  {restartMutation.isPending ? '...' : '$ run again'}
                </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
};
