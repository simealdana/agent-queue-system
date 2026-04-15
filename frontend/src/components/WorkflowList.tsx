import { useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowCard } from './WorkflowCard';
import { CreateWorkflowButton } from './CreateWorkflowButton';
import { StatsBar } from './StatsBar';
import type { StatusFilter } from './StatsBar';
import { ROUTES } from '../constants/routes';

export const WorkflowList = (): ReactElement => {
  const { data: workflows, isLoading, error } = useWorkflows();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = workflows
    ? workflows.filter((w) => filter === 'all' || w.status === filter)
    : [];

  return (
    <div>
      <ListHeader />
      {workflows && workflows.length > 0 && (
        <div className="mb-5">
          <StatsBar workflows={workflows} filter={filter} onFilterChange={setFilter} />
        </div>
      )}
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error.message} />}
      {workflows && workflows.length === 0 && <EmptyState />}
      {workflows && workflows.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-gray-600 font-mono">// no {filter} workflows found</p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="space-y-3" role="feed" aria-label="Workflow list" aria-live="polite">
          {filtered.map((w) => (
            <WorkflowCard key={w.id} workflow={w} />
          ))}
        </div>
      )}
    </div>
  );
};

const ListHeader = (): ReactElement => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-emerald-500/60 text-sm">$</span>
        <h2 className="text-base text-gray-300">workflows</h2>
        <span className="text-gray-700 text-sm">--list</span>
      </div>
      <p className="text-xs text-gray-700 ml-6">AI agent task execution pipelines</p>
    </div>
    <div className="flex items-center gap-2">
      <Link
        to={ROUTES.WORKFLOW_NEW}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-mono bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-500 hover:text-gray-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create
      </Link>
      <CreateWorkflowButton />
    </div>
  </div>
);

const LoadingSpinner = (): ReactElement => (
  <div className="flex items-center gap-2 py-24 justify-center text-sm text-gray-600 font-mono">
    <svg aria-label="Loading workflows" className="w-4 h-4 text-emerald-500 animate-spin-slow" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    loading workflows...
  </div>
);

const ErrorMessage = ({ message }: { message: string }): ReactElement => (
  <div role="alert" className="terminal-window">
    <div className="px-4 py-3 text-sm font-mono">
      <span className="text-red-500">error:</span>
      <span className="text-red-400/80 ml-2">{message}</span>
    </div>
  </div>
);

const EmptyState = (): ReactElement => (
  <div className="terminal-window">
    <div className="terminal-titlebar">
      <span className="terminal-dot bg-red-500/40" />
      <span className="terminal-dot bg-yellow-500/40" />
      <span className="terminal-dot bg-emerald-500/40" />
      <span className="text-xs text-gray-600 ml-1">terminal</span>
    </div>
    <div className="px-5 py-10 text-center">
      <p className="text-sm text-gray-500 font-mono mb-1">
        <span className="text-emerald-500/60">$</span> No workflows yet
      </p>
      <p className="text-xs text-gray-700 font-mono">
        Create a workflow to see the AI agent execute steps in real-time
      </p>
    </div>
  </div>
);
