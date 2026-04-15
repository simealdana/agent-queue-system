import { useCallback } from 'react';
import type { ReactElement } from 'react';
import type { StepDto } from '../types';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface WaitingBarProps {
  step: StepDto;
  onApprove: () => void;
  isApproving: boolean;
}

export const WaitingBar = ({ step, onApprove, isApproving }: WaitingBarProps): ReactElement => {
  const isExternal = step.result?._approvalType === 'external';
  const token = step.result?._token as string | undefined;
  const approvalUrl = token ? `${window.location.origin}/approve/${token}` : null;
  const displayData = filterInternalFields(step.result);

  return (
    <div className="px-4 py-3 border-t border-orange-500/10 bg-orange-500/[0.03]">
      <div className="text-sm font-mono">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-orange-500">WAIT</span>
          <span className="text-orange-400/60">
            {isExternal ? 'external approval required' : 'dashboard approval required'}
          </span>
          <span className="text-[10px] text-gray-700 px-1.5 py-0.5 rounded bg-surface-2 border border-border">
            {isExternal ? 'via-link' : 'in-app'}
          </span>
        </div>
        {step.error && <p className="text-orange-400/40 mb-2 text-xs">{step.error}</p>}
        {displayData && <PendingDataView data={displayData} />}
        {isExternal && approvalUrl && <ExternalLinkRow url={approvalUrl} />}
        {!isExternal && (
          <div className="mt-3 flex justify-end">
            <ApproveButton onClick={onApprove} isPending={isApproving} />
          </div>
        )}
      </div>
    </div>
  );
};

const filterInternalFields = (result: Record<string, unknown> | null): Record<string, unknown> | null => {
  if (!result) return null;
  const filtered = Object.fromEntries(Object.entries(result).filter(([k]) => !k.startsWith('_')));
  return Object.keys(filtered).length > 0 ? filtered : null;
};

const PendingDataView = ({ data }: { data: Record<string, unknown> }): ReactElement => (
  <pre className="mt-2 px-3 py-2 rounded-lg bg-surface-0 border border-border text-xs text-gray-500 overflow-x-auto">
    {JSON.stringify(data, null, 2)}
  </pre>
);

const ExternalLinkRow = ({ url }: { url: string }): ReactElement => {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    copy(url);
  }, [copy, url]);

  return (
    <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-0 border border-border text-xs text-purple-400/80 truncate">
        {url}
      </div>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy approval link'}
        className="shrink-0 px-3 py-2 text-xs min-h-[36px] bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-500 hover:text-gray-300 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {copied ? 'copied!' : '$ copy'}
      </button>
    </div>
  );
};

const ApproveButton = ({ onClick, isPending }: { onClick: () => void; isPending: boolean }): ReactElement => {
  const handleClick = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={isPending ? 'Approving workflow' : 'Approve and continue workflow'}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-mono min-h-[40px] bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/25 disabled:opacity-50 border border-orange-500/30 text-orange-400 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:outline-none"
    >
      {isPending ? 'approving...' : '$ approve'}
    </button>
  );
};
