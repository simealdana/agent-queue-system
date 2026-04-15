import { StepHandler } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const updateCrmHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(800, 1500));

  return {
    data: {
      candidateId: 'cand_8f3k2m',
      previousStatus: 'applied',
      newStatus: 'interviewing',
      updatedFields: ['status', 'last_activity', 'stage'],
    },
  };
};
