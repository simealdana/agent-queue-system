import type { WorkflowDto } from '../types';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { StepTimeline } from './StepTimeline';
import { useResumeWorkflow } from '../hooks/useWorkflows';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr + 'Z').getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function WorkflowCard({ workflow }: { workflow: WorkflowDto }) {
  const resumeMutation = useResumeWorkflow();
  const completedSteps = workflow.steps.filter(
    (s) => s.status === 'completed',
  ).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">
              {workflow.name}
            </h3>
            <StatusBadge status={workflow.status} />
          </div>
          <span className="text-xs text-gray-600">
            {timeAgo(workflow.createdAt)}
          </span>
        </div>
        <ProgressBar current={completedSteps} total={workflow.totalSteps} />
      </div>

      {/* Steps */}
      <div className="px-5 py-4">
        <StepTimeline steps={workflow.steps} />
      </div>

      {/* Actions */}
      {workflow.status === 'failed' && (
        <div className="px-5 py-3 border-t border-gray-800/50 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-400 truncate flex-1 mr-4">
              {workflow.error}
            </p>
            <button
              onClick={() => resumeMutation.mutate(workflow.id)}
              disabled={resumeMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {resumeMutation.isPending ? 'Resuming...' : 'Resume'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
