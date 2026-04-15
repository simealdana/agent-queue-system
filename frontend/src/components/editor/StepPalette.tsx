import type { ReactElement } from 'react';
import { EDITOR_LABELS } from '../../constants/editor';
import { StepPaletteItem } from './StepPaletteItem';

interface StepPaletteProps {
  steps: string[];
  onAddStep: (stepName: string) => void;
}

export const StepPalette = ({ steps, onAddStep }: StepPaletteProps): ReactElement => (
  <div className="terminal-window">
    <div className="terminal-titlebar">
      <span className="terminal-dot bg-red-500/40" />
      <span className="terminal-dot bg-yellow-500/40" />
      <span className="terminal-dot bg-emerald-500/40" />
      <span className="text-[10px] text-gray-600 ml-1">{EDITOR_LABELS.PALETTE_HEADING.toLowerCase()}</span>
    </div>
    <div className="py-1">
      {steps.map((stepName, i) => (
        <StepPaletteItem key={stepName} stepName={stepName} onAdd={onAddStep} index={i} />
      ))}
    </div>
  </div>
);
