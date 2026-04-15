export const ROUTES = {
  HOME: '/',
  WORKFLOW_NEW: '/workflows/new',
  WORKFLOW_DETAIL: '/workflows/:id',
  WORKFLOW_EDIT: '/workflows/:id/edit',
} as const;

export const workflowDetailPath = (id: string): string => `/workflows/${id}`;
export const workflowEditPath = (id: string): string => `/workflows/${id}/edit`;
