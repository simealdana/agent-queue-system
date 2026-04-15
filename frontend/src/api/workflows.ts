import { api } from './client';
import type { WorkflowDto } from '../types';

export const workflowsApi = {
  list: () => api.get<WorkflowDto[]>('/workflows'),

  get: (id: string) => api.get<WorkflowDto>(`/workflows/${id}`),

  create: (name: string, steps?: string[]) =>
    api.post<WorkflowDto>('/workflows', { name, steps }),

  resume: (id: string) => api.post<WorkflowDto>(`/workflows/${id}/resume`),
};
