import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { STEP_LABELS, STEP_DESCRIPTIONS } from '../../constants/step-labels';

interface StepPaletteItemProps {
  stepName: string;
  onAdd: (stepName: string) => void;
  index: number;
}

export const StepPaletteItem = ({ stepName, onAdd, index }: StepPaletteItemProps): ReactElement => {
  const handleAdd = useCallback((): void => {
    onAdd(stepName);
  }, [onAdd, stepName]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface-2/50 transition-colors group log-line">
      <span className="log-line-number">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-mono">{STEP_LABELS[stepName] ?? stepName}</p>
        <p className="text-[10px] text-gray-700 font-mono truncate">{STEP_DESCRIPTIONS[stepName] ?? ''}</p>
      </div>
      <button
        onClick={handleAdd}
        aria-label={`Add ${STEP_LABELS[stepName] ?? stepName}`}
        className="shrink-0 text-[10px] font-mono text-gray-700 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none rounded px-1.5 py-0.5"
      >
        [+add]
      </button>
    </div>
  );
};
