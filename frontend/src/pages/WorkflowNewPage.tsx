import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCreateWorkflowWithSteps, useStartWorkflow } from '../hooks/useWorkflows';
import { useAvailableSteps } from '../hooks/useAvailableSteps';
import { WorkflowEditor } from '../components/editor/WorkflowEditor';
import { workflowDetailPath } from '../constants/routes';
import type { WorkflowDto } from '../types';

export const WorkflowNewPage = (): ReactElement => {
  const navigate = useNavigate();
  const createMutation = useCreateWorkflowWithSteps();
  const startMutation = useStartWorkflow();
  const { data: availableSteps, isLoading } = useAvailableSteps();
  const [created, setCreated] = useState<WorkflowDto | null>(null);

  const handleSave = useCallback((name: string, steps: string[]): void => {
    createMutation.mutate({ name, steps }, {
      onSuccess: (workflow) => setCreated(workflow),
    });
  }, [createMutation]);

  const handleCancel = useCallback((): void => {
    void navigate('/');
  }, [navigate]);

  const handleStartNow = useCallback((): void => {
    if (!created) return;
    startMutation.mutate(created.id, {
      onSuccess: () => void navigate(workflowDetailPath(created.id)),
    });
  }, [created, startMutation, navigate]);

  // Post-creation screen
  if (created) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="terminal-window">
          <div className="terminal-titlebar min-h-[44px]">
            <span className="terminal-dot bg-red-500/40" />
            <span className="terminal-dot bg-yellow-500/40" />
            <span className="terminal-dot bg-emerald-500" />
            <span className="text-xs text-gray-600 ml-2">workflow created</span>
          </div>
          <div className="px-5 py-8 text-center">
            <div className="text-emerald-400 text-lg font-mono mb-2">{'\u2713'} Saved</div>
            <p className="text-sm text-gray-400 font-mono mb-1">{created.name}</p>
            <p className="text-xs text-gray-700 font-mono">{created.totalSteps} steps configured</p>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-8">
              <Link
                to="/"
                className="flex-1 px-4 py-3 text-sm min-h-[44px] inline-flex items-center justify-center gap-2 font-mono bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-400 hover:text-gray-200 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Go to Workflows
              </Link>
              <button
                onClick={handleStartNow}
                disabled={startMutation.isPending}
                className="flex-1 px-4 py-3 text-sm min-h-[44px] inline-flex items-center justify-center gap-2 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 disabled:opacity-50 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                {startMutation.isPending ? 'Starting...' : 'Start Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !availableSteps) {
    return (
      <div className="flex items-center gap-2 py-24 justify-center text-sm text-gray-600 font-mono">
        <svg aria-label="Loading" className="w-4 h-4 text-emerald-500 animate-spin-slow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        loading steps...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-emerald-500/60 text-sm font-mono">$</span>
          <h2 className="text-base text-gray-300 font-mono">new workflow</h2>
        </div>
        <p className="text-xs text-gray-700 ml-6 font-mono">select steps and arrange their execution order</p>
      </div>
      <WorkflowEditor
        availableSteps={availableSteps}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={createMutation.isPending}
        saveLabel="Save"
      />
    </div>
  );
};
