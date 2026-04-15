import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import type { StepDto } from '../types';
import { STEP_LABELS } from '../constants/step-labels';
import { formatDuration } from '../utils/formatting';

const STATUS_SYMBOL: Record<string, { char: string; color: string }> = {
  completed: { char: '\u2713', color: 'text-emerald-400' },
  running:   { char: '\u25B6', color: 'text-emerald-300 animate-pulse' },
  failed:    { char: '\u2717', color: 'text-red-400' },
  waiting:   { char: '\u25CF', color: 'text-orange-400 animate-blink' },
  pending:   { char: '\u2500', color: 'text-gray-700' },
};

export const StepTimeline = ({ steps }: { steps: StepDto[] }): ReactElement => (
  <div className="font-mono text-sm">
    {steps.map((step, i) => (
      <StepRow key={step.id} step={step} lineNum={i + 1} />
    ))}
  </div>
);

const StepRow = ({ step, lineNum }: { step: StepDto; lineNum: number }): ReactElement => {
  const [expanded, setExpanded] = useState(false);
  const sym = STATUS_SYMBOL[step.status] ?? STATUS_SYMBOL.pending!;
  const hasDetail = (step.status === 'completed' && step.result) || (step.status === 'failed' && step.error);
  const nameColor = step.status === 'completed' ? 'text-gray-500'
    : step.status === 'running' ? 'text-emerald-300'
    : step.status === 'failed' ? 'text-red-300'
    : step.status === 'waiting' ? 'text-orange-300'
    : 'text-gray-600';

  const toggle = useCallback((): void => {
    if (hasDetail) setExpanded((prev) => !prev);
  }, [hasDetail]);

  return (
    <div>
      <div
        className={`log-line ${hasDetail ? 'cursor-pointer' : ''}`}
        onClick={toggle}
        role={hasDetail ? 'button' : undefined}
        aria-expanded={hasDetail ? expanded : undefined}
      >
        <span className="log-line-number">{lineNum}</span>
        <span className={`w-5 text-center shrink-0 ${sym.color}`}>{sym.char}</span>
        <span className={`${nameColor} min-w-0 truncate`}>
          {STEP_LABELS[step.name] ?? step.name}
        </span>

        {step.attempt > 1 && (
          <span className="text-yellow-500/70 shrink-0 text-xs">
            retry:{step.attempt}/{step.maxRetries + 1}
          </span>
        )}

        <span className="ml-auto shrink-0 text-gray-700 text-xs">
          {step.durationMs !== null && formatDuration(step.durationMs)}
          {step.status === 'running' && step.durationMs === null && (
            <span className="text-emerald-500/40">...</span>
          )}
        </span>

        {step.error && step.status === 'failed' && (
          <span className="hidden sm:inline text-red-400/60 truncate max-w-[200px] text-xs" title={step.error}>
            {step.error}
          </span>
        )}

        {hasDetail && (
          <svg
            aria-hidden="true"
            className={`w-3 h-3 text-gray-700 shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </div>

      {expanded && (
        <div className="mx-4 mb-2 ml-14 rounded-lg border border-border bg-surface-0 overflow-hidden">
          {step.status === 'failed' && step.error && (
            <div className="px-4 py-3 border-b border-border/50 bg-red-500/[0.03]">
              <span className="text-red-500 text-xs font-mono">error: </span>
              <span className="text-red-400/80 text-xs font-mono">{step.error}</span>
            </div>
          )}
          {step.result && (
            <pre className="px-4 py-3 text-xs text-gray-500 overflow-x-auto max-h-48 leading-relaxed">
              {JSON.stringify(filterInternal(step.result), null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

const filterInternal = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('_')));
