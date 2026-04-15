import { useCallback } from 'react';
import type { ReactElement } from 'react';
import type { WorkflowDto } from '../types';
import { STATUS_FILTERS } from '../constants/status-config';

export type StatusFilter = 'all' | 'running' | 'waiting' | 'failed' | 'completed';

interface StatsBarProps {
  workflows: WorkflowDto[];
  filter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
}

export const StatsBar = ({ workflows, filter, onFilterChange }: StatsBarProps): ReactElement => {
  const count = useCallback((status: StatusFilter): number => {
    if (status === 'all') return workflows.length;
    return workflows.filter((w) => w.status === status).length;
  }, [workflows]);

  return (
    <nav
      aria-label="Filter workflows by status"
      className="flex flex-wrap items-center gap-1.5 font-mono text-sm"
    >
      <span className="text-gray-700 mr-1">$</span>
      <span className="text-emerald-500/60 mr-1">filter</span>
      {STATUS_FILTERS.map((f) => (
        <FilterChip
          key={f.key}
          label={f.label}
          dot={f.dot}
          count={count(f.key)}
          active={filter === f.key}
          ariaLabel={f.ariaLabel}
          onClick={onFilterChange}
          filterKey={f.key}
        />
      ))}
    </nav>
  );
};

interface FilterChipProps {
  label: string;
  dot: string;
  count: number;
  active: boolean;
  ariaLabel: string;
  onClick: (key: StatusFilter) => void;
  filterKey: StatusFilter;
}

const FilterChip = ({ label, dot, count, active, ariaLabel, onClick, filterKey }: FilterChipProps): ReactElement => {
  const handleClick = useCallback((): void => {
    onClick(filterKey);
  }, [onClick, filterKey]);

  return (
    <button
      onClick={handleClick}
      aria-label={`${ariaLabel} (${count})`}
      aria-pressed={active}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono min-h-[40px]
        transition-all duration-100 outline-none
        focus-visible:ring-2 focus-visible:ring-accent
        ${active
          ? 'bg-surface-3 text-gray-300 border border-border'
          : 'text-gray-600 hover:text-gray-400 border border-transparent hover:bg-surface-2'
        }
      `}
    >
      <span className={`w-2 h-2 rounded-full ${dot} ${active ? '' : 'opacity-50'}`} />
      <span>{label}</span>
      <span className={`tabular-nums ${active ? 'text-emerald-400' : 'text-gray-700'}`}>{count}</span>
    </button>
  );
};
