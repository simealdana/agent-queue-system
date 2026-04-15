import { useState, useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { EDITOR_VALIDATION } from '../constants/editor';

export interface EditorStep {
  id: string;
  name: string;
}

interface EditorState {
  name: string;
  steps: EditorStep[];
}

interface EditorActions {
  setName: (name: string) => void;
  addStep: (stepName: string) => void;
  removeStep: (id: string) => void;
  reorderSteps: (activeId: string, overId: string) => void;
}

interface ValidationResult {
  isValid: boolean;
  nameError: string | null;
  stepsError: string | null;
}

export interface UseWorkflowEditorReturn {
  state: EditorState;
  actions: EditorActions;
  validation: ValidationResult;
  stepNames: () => string[];
}

interface EditorInitial {
  name: string;
  steps: string[];
}

export const useWorkflowEditor = (initial?: EditorInitial): UseWorkflowEditorReturn => {
  const [name, setName] = useState(initial?.name ?? '');
  const [steps, setSteps] = useState<EditorStep[]>(
    () => initial?.steps.map((s) => ({ id: crypto.randomUUID(), name: s })) ?? [],
  );

  const addStep = useCallback((stepName: string): void => {
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), name: stepName }]);
  }, []);

  const removeStep = useCallback((id: string): void => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const reorderSteps = useCallback((activeId: string, overId: string): void => {
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === activeId);
      const newIndex = prev.findIndex((s) => s.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const validation = useMemo((): ValidationResult => {
    const nameError = name.trim().length === 0 ? EDITOR_VALIDATION.NAME_REQUIRED : null;
    const stepsError = steps.length === 0 ? EDITOR_VALIDATION.STEPS_REQUIRED : null;
    return { isValid: !nameError && !stepsError, nameError, stepsError };
  }, [name, steps.length]);

  const stepNames = useCallback((): string[] => steps.map((s) => s.name), [steps]);

  return {
    state: { name, steps },
    actions: { setName, addStep, removeStep, reorderSteps },
    validation,
    stepNames,
  };
};
