import { StepHandler } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const generateSummaryHandler: StepHandler = async () => {
  await sleep(randomBetween(1000, 2000));

  return {
    data: {
      summary:
        'Candidate demonstrated strong technical skills in system design. ' +
        'Discussed distributed systems experience and showed good problem-solving approach. ' +
        'Recommended for next round.',
      sentiment: 'positive',
      keyTopics: ['system-design', 'distributed-systems', 'problem-solving'],
      confidence: 0.92,
      model: 'gpt-4o',
    },
  };
};
