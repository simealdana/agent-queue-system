import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { useCreateWorkflow, useWorkflows } from '../hooks/useWorkflows';
import { WORKFLOW_TEMPLATES } from '../constants/workflow-templates';
import type { WorkflowTemplate } from '../constants/workflow-templates';
import { workflowDetailPath } from '../constants/routes';
import { workflowsApi } from '../api/workflows';
import type { WorkflowDto } from '../types';

export const CreateWorkflowButton = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const createMutation = useCreateWorkflow();
  const navigate = useNavigate();
  const { data: workflows } = useWorkflows();

  const savedWorkflows = workflows?.filter((w) => w.status !== 'running') ?? [];

  const toggleOpen = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const handleCreateFromTemplate = useCallback((name: string, template: string): void => {
    setIsOpen(false);
    createMutation.mutate({ name, template }, {
      onSuccess: (workflow) => void navigate(workflowDetailPath(workflow.id)),
    });
  }, [createMutation, navigate]);

  const handleRunWorkflow = useCallback((source: WorkflowDto): void => {
    setIsOpen(false);
    const stepNames = source.steps.map((s) => s.name);
    workflowsApi.run(source.name, stepNames).then((workflow) => {
      void navigate(workflowDetailPath(workflow.id));
    }).catch(() => {});
  }, [navigate]);

  const handleEditWorkflow = useCallback((source: WorkflowDto): void => {
    setIsOpen(false);
    const stepNames = source.steps.map((s) => s.name);
    workflowsApi.createWithSteps(source.name, stepNames).then((workflow) => {
      void navigate(`/workflows/${workflow.id}/edit`);
    }).catch(() => {});
  }, [navigate]);

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Create new workflow"
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Workflow
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20 bg-black/30 sm:bg-transparent" onClick={close} aria-hidden="true" />
          <div role="menu" aria-label="Workflow templates" className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96 terminal-window z-30 shadow-xl shadow-black/40 max-h-[70vh] overflow-y-auto">
            {/* Built-in templates */}
            <div className="terminal-titlebar sticky top-0 z-10">
              <span className="terminal-dot bg-red-500/40" />
              <span className="terminal-dot bg-yellow-500/40" />
              <span className="terminal-dot bg-emerald-500/40" />
              <span className="text-xs text-gray-600 ml-2">templates</span>
            </div>
            {WORKFLOW_TEMPLATES.map((t, i) => (
              <TemplateItem key={t.template} template={t} onCreate={handleCreateFromTemplate} disabled={createMutation.isPending} index={i} />
            ))}

            {/* User's saved workflows */}
            {savedWorkflows.length > 0 && (
              <>
                <div className="px-4 py-2 border-t border-border bg-surface-2/30 sticky z-10">
                  <span className="text-xs text-gray-600 font-mono">your workflows</span>
                </div>
                {savedWorkflows.map((w) => (
                  <SavedWorkflowItem key={w.id} workflow={w} onRun={handleRunWorkflow} onEdit={handleEditWorkflow} />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface TemplateItemProps {
  template: WorkflowTemplate;
  onCreate: (name: string, template: string) => void;
  disabled: boolean;
  index: number;
}

const TemplateItem = ({ template: t, onCreate, disabled, index }: TemplateItemProps): ReactElement => {
  const handleClick = useCallback((): void => {
    onCreate(t.name, t.template);
  }, [onCreate, t.name, t.template]);

  return (
    <button
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
      className="w-full text-left px-4 py-3.5 hover:bg-surface-2 active:bg-surface-3 transition-colors group focus-visible:bg-surface-2 focus-visible:outline-none border-b border-border/30 last:border-0"
    >
      <div className="flex items-center gap-2.5 text-sm font-mono">
        <span className="text-gray-700">{index + 1}.</span>
        <span className="text-gray-300 group-hover:text-emerald-400 transition-colors">{t.name}</span>
        <span className={`text-[10px] tracking-wider px-1.5 py-0.5 rounded ${t.badgeColor}`}>
          {t.badge}
        </span>
      </div>
      <div className="text-xs text-gray-700 mt-1 ml-6 font-mono">{t.description}</div>
    </button>
  );
};

const SavedWorkflowItem = ({ workflow, onRun, onEdit }: { workflow: WorkflowDto; onRun: (w: WorkflowDto) => void; onEdit: (w: WorkflowDto) => void }): ReactElement => {
  const handleRun = useCallback((): void => { onRun(workflow); }, [onRun, workflow]);
  const handleEdit = useCallback((): void => { onEdit(workflow); }, [onEdit, workflow]);

  return (
    <div className="flex items-center px-4 py-3 border-b border-border/30 last:border-0 hover:bg-surface-2/50 transition-colors">
      <div className="flex-1 min-w-0 flex items-center gap-2.5 text-sm font-mono">
        <span className="text-gray-300 truncate">{workflow.name}</span>
        <span className="text-[10px] text-gray-700 shrink-0">{workflow.totalSteps} steps</span>
      </div>
      <div className="flex items-center gap-1.5 ml-3 shrink-0">
        <button
          role="menuitem"
          onClick={handleEdit}
          aria-label={`Edit ${workflow.name}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-surface-3 transition-colors"
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </button>
        <button
          role="menuitem"
          onClick={handleRun}
          aria-label={`Run ${workflow.name}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
        >
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
