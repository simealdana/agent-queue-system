import { useCallback } from 'react';
import type { ReactElement, ChangeEvent } from 'react';

interface EditorToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isValid: boolean;
  nameError: string | null;
  saveLabel: string;
}

export const EditorToolbar = ({
  name, onNameChange, onSave, onCancel, isSaving, isValid, nameError, saveLabel,
}: EditorToolbarProps): ReactElement => {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    onNameChange(e.target.value);
  }, [onNameChange]);

  return (
    <div className="terminal-window">
      <div className="terminal-titlebar">
        <span className="terminal-dot bg-red-500/40" />
        <span className="terminal-dot bg-yellow-500/40" />
        <span className="terminal-dot bg-emerald-500/40" />
        <span className="text-xs text-gray-600 ml-2">config</span>
      </div>
      <div className="px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500/60 text-sm font-mono shrink-0">name:</span>
              <input
                type="text"
                value={name}
                onChange={handleChange}
                placeholder="workflow-name"
                aria-label="Workflow name"
                className="flex-1 w-full bg-surface-0 border border-border rounded-lg px-3 py-2 text-sm font-mono text-gray-300 placeholder-gray-700 outline-none focus:ring-1 focus:ring-accent focus:border-transparent"
              />
            </div>
            {nameError && <p className="text-xs text-red-400 mt-1.5 ml-14 font-mono">{nameError}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="px-3 py-2 text-sm min-h-[38px] font-mono text-gray-500 hover:text-gray-300 bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!isValid || isSaving}
              className="px-4 py-2 text-sm min-h-[38px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 disabled:opacity-50 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              {isSaving ? 'Saving...' : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
