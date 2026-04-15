import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useWorkflowEditor } from '../../hooks/useWorkflowEditor';
import { EDITOR_LABELS } from '../../constants/editor';
import { EditorToolbar } from './EditorToolbar';
import { StepPalette } from './StepPalette';
import { StepCanvas } from './StepCanvas';

interface WorkflowEditorProps {
  availableSteps: string[];
  initialName?: string;
  initialSteps?: string[];
  onSave: (name: string, steps: string[]) => void;
  onCancel: () => void;
  isSaving: boolean;
  saveLabel?: string;
}

export const WorkflowEditor = ({
  availableSteps, initialName, initialSteps, onSave, onCancel, isSaving, saveLabel,
}: WorkflowEditorProps): ReactElement => {
  const initial = initialName !== undefined ? { name: initialName, steps: initialSteps ?? [] } : undefined;
  const { state, actions, validation, stepNames } = useWorkflowEditor(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent): void => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      actions.reorderSteps(String(active.id), String(over.id));
    }
  }, [actions]);

  const handleSave = useCallback((): void => {
    if (validation.isValid) {
      onSave(state.name, stepNames());
    }
  }, [validation.isValid, onSave, state.name, stepNames]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <EditorToolbar
          name={state.name}
          onNameChange={actions.setName}
          onSave={handleSave}
          onCancel={onCancel}
          isSaving={isSaving}
          isValid={validation.isValid}
          nameError={validation.nameError}
          saveLabel={saveLabel ?? EDITOR_LABELS.SAVE_CREATE}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <StepPalette steps={availableSteps} onAddStep={actions.addStep} />
          <StepCanvas steps={state.steps} onRemoveStep={actions.removeStep} stepsError={validation.stepsError} />
        </div>
      </div>
    </DndContext>
  );
};
