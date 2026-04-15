import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowCard } from './WorkflowCard';
import { CreateWorkflowButton } from './CreateWorkflowButton';

export function WorkflowList() {
  const { data: workflows, isLoading, error } = useWorkflows();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Workflows</h2>
          <p className="text-sm text-gray-500 mt-1">
            AI agent task execution pipelines
          </p>
        </div>
        <CreateWorkflowButton />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-400">
          Failed to load workflows: {error.message}
        </div>
      )}

      {workflows && workflows.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No workflows yet</p>
          <p className="text-gray-600 text-xs mt-1">
            Create one to see the AI agent in action
          </p>
        </div>
      )}

      {workflows && workflows.length > 0 && (
        <div className="space-y-4">
          {workflows.map((w) => (
            <WorkflowCard key={w.id} workflow={w} />
          ))}
        </div>
      )}
    </div>
  );
}
