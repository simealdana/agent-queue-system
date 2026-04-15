import { StepHandler, TransientError } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const updateCrmHandler: StepHandler = async () => {
  await sleep(randomBetween(600, 1200));

  // 40% chance: CRM API rate-limited or timeout — most likely step to retry
  if (Math.random() < 0.4) {
    throw new TransientError('CRM API rate limit exceeded — 429 Too Many Requests');
  }

  return {
    data: {
      candidateId: 'cand_8f3k2m',
      previousStatus: 'applied',
      newStatus: 'interviewing',
      updatedFields: ['status', 'last_activity', 'stage'],
    },
  };
};
