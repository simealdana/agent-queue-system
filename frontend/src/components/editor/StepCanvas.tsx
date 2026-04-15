import type { ReactElement } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { EditorStep } from '../../hooks/useWorkflowEditor';
import { EDITOR_LABELS } from '../../constants/editor';
import { StepCanvasItem } from './StepCanvasItem';

interface StepCanvasProps {
  steps: EditorStep[];
  onRemoveStep: (id: string) => void;
  stepsError: string | null;
}

export const StepCanvas = ({ steps, onRemoveStep, stepsError }: StepCanvasProps): ReactElement => (
  <div className="terminal-window">
    <div className="terminal-titlebar">
      <span className="terminal-dot bg-red-500/40" />
      <span className="terminal-dot bg-yellow-500/40" />
      <span className="terminal-dot bg-emerald-500/40" />
      <span className="text-[10px] text-gray-600 ml-1">{EDITOR_LABELS.CANVAS_HEADING.toLowerCase()}</span>
      <span className="ml-auto text-[10px] text-gray-700 font-mono">{steps.length} steps</span>
    </div>

    <div className="py-1 min-h-[200px]">
      {steps.length === 0 && (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-xs text-gray-700 font-mono">{stepsError ?? `// ${EDITOR_LABELS.CANVAS_EMPTY.toLowerCase()}`}</p>
        </div>
      )}

      {steps.length > 0 && (
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div>
            {steps.map((step, i) => (
              <StepCanvasItem key={step.id} step={step} index={i} onRemove={onRemoveStep} />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  </div>
);
