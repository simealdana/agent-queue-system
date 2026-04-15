export interface StatusStyle {
  dot: string;
  bg: string;
  text: string;
  label: string;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
  pending:   { dot: 'bg-gray-600',       bg: 'bg-gray-500/8',      text: 'text-gray-500',     label: 'PENDING' },
  running:   { dot: 'bg-emerald-400',    bg: 'bg-emerald-500/8',   text: 'text-emerald-400',  label: 'RUNNING' },
  completed: { dot: 'bg-emerald-400',    bg: 'bg-emerald-500/8',   text: 'text-emerald-400',  label: 'DONE' },
  failed:    { dot: 'bg-red-400',        bg: 'bg-red-500/8',       text: 'text-red-400',      label: 'FAIL' },
  skipped:   { dot: 'bg-yellow-400',     bg: 'bg-yellow-500/8',    text: 'text-yellow-400',   label: 'SKIP' },
  waiting:   { dot: 'bg-orange-400',     bg: 'bg-orange-500/8',    text: 'text-orange-400',   label: 'WAIT' },
};

export const PROGRESS_BAR_COLORS: Record<string, string> = {
  pending: 'bg-gray-600',
  running: 'bg-emerald-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
  waiting: 'bg-orange-500',
};

export const STEP_NAME_COLORS: Record<string, string> = {
  completed: 'text-emerald-300/80',
  running: 'text-emerald-300',
  failed: 'text-red-300',
  waiting: 'text-orange-300',
};

export const STEP_DESC_COLORS: Record<string, string> = {
  running: 'text-emerald-400/40',
  failed: 'text-red-400/40',
  waiting: 'text-orange-400/40',
};

export interface FilterItem {
  key: 'all' | 'running' | 'waiting' | 'failed' | 'completed';
  label: string;
  dot: string;
  ariaLabel: string;
}

export const STATUS_FILTERS: FilterItem[] = [
  { key: 'all',       label: 'all',       dot: 'bg-gray-400',     ariaLabel: 'Show all workflows' },
  { key: 'running',   label: 'running',   dot: 'bg-emerald-400',  ariaLabel: 'Show running workflows' },
  { key: 'waiting',   label: 'waiting',   dot: 'bg-orange-400',   ariaLabel: 'Show workflows awaiting approval' },
  { key: 'failed',    label: 'failed',    dot: 'bg-red-400',      ariaLabel: 'Show failed workflows' },
  { key: 'completed', label: 'done',      dot: 'bg-emerald-400',  ariaLabel: 'Show completed workflows' },
];
