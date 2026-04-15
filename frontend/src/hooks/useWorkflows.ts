import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '../api/workflows';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.list,
    refetchInterval: 5000,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => workflowsApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useResumeWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workflowsApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}
