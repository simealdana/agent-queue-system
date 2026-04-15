import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';

interface StepResultViewerProps {
  result: Record<string, unknown>;
}

export const StepResultViewer = ({ result }: StepResultViewerProps): ReactElement | null => {
  const [open, setOpen] = useState(false);

  const display = Object.fromEntries(
    Object.entries(result).filter(([k]) => !k.startsWith('_')),
  );

  const toggle = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  if (Object.keys(display).length === 0) return null;

  return (
    <span className="inline-flex">
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'View'} step output`}
        className="text-[10px] text-gray-700 hover:text-emerald-500/60 transition-colors rounded focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none font-mono"
      >
        {open ? '[-]' : '[+]'}
      </button>

      {open && (
        <pre className="absolute mt-5 left-0 right-0 mx-3 px-3 py-2 rounded bg-surface-0 border border-border text-[10px] font-mono text-gray-500 overflow-x-auto max-h-32 leading-relaxed z-10">
          {JSON.stringify(display, null, 2)}
        </pre>
      )}
    </span>
  );
};
