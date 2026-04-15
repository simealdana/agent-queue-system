import { useState } from 'react';
import { useCreateWorkflow } from '../hooks/useWorkflows';

const WORKFLOW_TEMPLATES = [
  { label: 'Post-Interview Follow-up', name: 'Post-Interview Follow-up' },
  { label: 'Candidate Screening', name: 'Candidate Screening' },
  { label: 'Interview Scheduling', name: 'Interview Scheduling' },
];

export function CreateWorkflowButton() {
  const [isOpen, setIsOpen] = useState(false);
  const createMutation = useCreateWorkflow();

  const handleCreate = (name: string) => {
    createMutation.mutate(name);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Workflow
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
            {WORKFLOW_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => handleCreate(t.name)}
                disabled={createMutation.isPending}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
