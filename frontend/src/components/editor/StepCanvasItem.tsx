import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EditorStep } from '../../hooks/useWorkflowEditor';
import { STEP_LABELS, STEP_DESCRIPTIONS } from '../../constants/step-labels';

interface StepCanvasItemProps {
  step: EditorStep;
  index: number;
  onRemove: (id: string) => void;
}

export const StepCanvasItem = ({ step, index, onRemove }: StepCanvasItemProps): ReactElement => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };

  const handleRemove = useCallback((): void => {
    onRemove(step.id);
  }, [onRemove, step.id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`log-line group/item ${
        isDragging ? 'opacity-50 bg-surface-3' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-500 focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none rounded"
      >
        <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>

      <span className="log-line-number">{index + 1}</span>

      <span className="text-emerald-500/60 shrink-0">$</span>

      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-300 font-mono">{STEP_LABELS[step.name] ?? step.name}</span>
        <span className="text-[10px] text-gray-700 font-mono ml-2">{STEP_DESCRIPTIONS[step.name] ?? ''}</span>
      </div>

      <button
        onClick={handleRemove}
        aria-label={`Remove ${STEP_LABELS[step.name] ?? step.name}`}
        className="shrink-0 text-[10px] font-mono text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:outline-none rounded px-1"
      >
        [x]
      </button>
    </div>
  );
};
