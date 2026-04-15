import type { StepDto } from '../types';
import { STEP_LABELS } from '../types';

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'running':
      return (
        <div className="w-6 h-6 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center animate-step-pulse">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
        </div>
      );
    case 'failed':
      return (
        <div className="w-6 h-6 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-600" />
      );
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function StepTimeline({ steps }: { steps: StepDto[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          {/* Vertical line + icon */}
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {i < steps.length - 1 && (
              <div className={`w-px flex-1 min-h-[20px] ${
                step.status === 'completed' ? 'bg-emerald-800' : 'bg-gray-800'
              }`} />
            )}
          </div>

          {/* Content */}
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-gray-300' :
                step.status === 'running' ? 'text-blue-300' :
                step.status === 'failed' ? 'text-red-300' :
                'text-gray-500'
              }`}>
                {STEP_LABELS[step.name] ?? step.name}
              </span>
              <div className="flex items-center gap-2">
                {step.attempt > 1 && (
                  <span className="text-xs text-yellow-500">
                    attempt {step.attempt}/{step.maxRetries + 1}
                  </span>
                )}
                {step.durationMs !== null && (
                  <span className="text-xs text-gray-600 tabular-nums">
                    {formatDuration(step.durationMs)}
                  </span>
                )}
              </div>
            </div>
            {step.error && (
              <p className="text-xs text-red-400/80 mt-1 truncate">
                {step.error}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
