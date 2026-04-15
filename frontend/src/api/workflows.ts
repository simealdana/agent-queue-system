import { api } from './client';
import type { WorkflowDto } from '../types';

export const workflowsApi = {
  list: (): Promise<WorkflowDto[]> => api.get<WorkflowDto[]>('/workflows'),

  get: (id: string): Promise<WorkflowDto> => api.get<WorkflowDto>(`/workflows/${id}`),

  create: (name: string, template?: string): Promise<WorkflowDto> =>
    api.post<WorkflowDto>('/workflows', { name, template }),

  resume: (id: string): Promise<WorkflowDto> => api.post<WorkflowDto>(`/workflows/${id}/resume`),

  restart: (id: string): Promise<WorkflowDto> => api.post<WorkflowDto>(`/workflows/${id}/restart`),

  approve: (id: string): Promise<WorkflowDto> => api.post<WorkflowDto>(`/workflows/${id}/approve`),

  createWithSteps: (name: string, steps: string[]): Promise<WorkflowDto> =>
    api.post<WorkflowDto>('/workflows', { name, steps }),

  update: (id: string, name: string, steps: string[]): Promise<WorkflowDto> =>
    api.put<WorkflowDto>(`/workflows/${id}`, { name, steps }),

  run: (name: string, steps?: string[], template?: string): Promise<WorkflowDto> =>
    api.post<WorkflowDto>('/workflows/run', { name, steps, template }),

  start: (id: string): Promise<WorkflowDto> => api.post<WorkflowDto>(`/workflows/${id}/start`),
};
