import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { stepsApi } from '../api/steps';

export const useAvailableSteps = (): UseQueryResult<string[]> =>
  useQuery({
    queryKey: ['steps'],
    queryFn: stepsApi.list,
    staleTime: Infinity,
  });
