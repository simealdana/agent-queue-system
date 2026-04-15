import type { ReactElement } from 'react';

const BASE = 'w-7 h-7 rounded-full flex items-center justify-center shrink-0';

export const StepIcon = ({ status }: { status: string }): ReactElement => {
  switch (status) {
    case 'completed':
      return (
        <div className={`${BASE} bg-emerald-500/15 ring-1 ring-emerald-500/40`}>
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'running':
      return (
        <div className={`${BASE} bg-indigo-500/15 ring-1 ring-indigo-500/40 relative`}>
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse-ring" />
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
        </div>
      );
    case 'failed':
      return (
        <div className={`${BASE} bg-red-500/15 ring-1 ring-red-500/40`}>
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case 'waiting':
      return (
        <div className={`${BASE} bg-orange-500/15 ring-1 ring-orange-500/40`}>
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${BASE} bg-surface-3 ring-1 ring-border`}>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        </div>
      );
  }
};
