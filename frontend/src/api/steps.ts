import { api } from './client';

export const stepsApi = {
  list: (): Promise<string[]> => api.get<string[]>('/steps'),
};
