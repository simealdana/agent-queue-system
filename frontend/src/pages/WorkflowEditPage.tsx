import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useWorkflow, useUpdateWorkflow } from '../hooks/useWorkflows';
import { useAvailableSteps } from '../hooks/useAvailableSteps';
import { WorkflowEditor } from '../components/editor/WorkflowEditor';
import { workflowDetailPath } from '../constants/routes';
import { EDITOR_LABELS } from '../constants/editor';

export const WorkflowEditPage = (): ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workflow, isLoading: loadingWorkflow } = useWorkflow(id!);
  const { data: availableSteps, isLoading: loadingSteps } = useAvailableSteps();
  const updateMutation = useUpdateWorkflow();

  const handleSave = useCallback((name: string, steps: string[]): void => {
    if (!id) return;
    updateMutation.mutate({ id, name, steps }, {
      onSuccess: () => void navigate(workflowDetailPath(id)),
    });
  }, [id, updateMutation, navigate]);

  const handleCancel = useCallback((): void => {
    if (id) {
      void navigate(workflowDetailPath(id));
    }
  }, [id, navigate]);

  if (loadingWorkflow || loadingSteps) {
    return (
      <div className="flex items-center gap-2 py-24 justify-center text-xs text-gray-600 font-mono">
        <svg aria-label="Loading" className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        loading...
      </div>
    );
  }

  if (!workflow || !availableSteps) {
    return <Navigate to="/" replace />;
  }

  if (workflow.status !== 'pending') {
    return <Navigate to={workflowDetailPath(workflow.id)} replace />;
  }

  const initialSteps = workflow.steps.map((s) => s.name);

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-emerald-500/60 text-xs font-mono">$</span>
          <h2 className="text-sm text-gray-300 font-mono">edit workflow</h2>
        </div>
        <p className="text-[11px] text-gray-700 ml-5 font-mono">modify steps before starting execution</p>
      </div>
      <WorkflowEditor
        availableSteps={availableSteps}
        initialName={workflow.name}
        initialSteps={initialSteps}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={updateMutation.isPending}
        saveLabel={EDITOR_LABELS.SAVE_UPDATE}
      />
    </div>
  );
};
