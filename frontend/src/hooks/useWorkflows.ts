import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '../api/workflows';
import type { WorkflowDto } from '../types';

export const useWorkflows = (): UseQueryResult<WorkflowDto[]> =>
  useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.list,
    refetchInterval: 5000,
  });

export const useCreateWorkflow = (): UseMutationResult<WorkflowDto, Error, { name: string; template?: string }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, template }: { name: string; template?: string }) =>
      workflowsApi.create(name, template),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};

export const useResumeWorkflow = (): UseMutationResult<WorkflowDto, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.resume(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};

export const useRestartWorkflow = (): UseMutationResult<WorkflowDto, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.restart(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};

export const useApproveWorkflow = (): UseMutationResult<WorkflowDto, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.approve(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};

export const useWorkflow = (id: string): UseQueryResult<WorkflowDto> =>
  useQuery({
    queryKey: ['workflows', id],
    queryFn: () => workflowsApi.get(id),
    refetchInterval: 5000,
  });

export const useCreateWorkflowWithSteps = (): UseMutationResult<WorkflowDto, Error, { name: string; steps: string[] }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, steps }: { name: string; steps: string[] }) =>
      workflowsApi.createWithSteps(name, steps),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};

export const useUpdateWorkflow = (): UseMutationResult<WorkflowDto, Error, { id: string; name: string; steps: string[] }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, steps }: { id: string; name: string; steps: string[] }) =>
      workflowsApi.update(id, name, steps),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['workflows'] });
      void queryClient.invalidateQueries({ queryKey: ['workflows', variables.id] });
    },
  });
};

export const useStartWorkflow = (): UseMutationResult<WorkflowDto, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.start(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });
};
