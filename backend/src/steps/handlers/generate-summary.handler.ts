import { StepHandler, TransientError } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const generateSummaryHandler: StepHandler = async () => {
  // Slower step — simulates LLM inference
  await sleep(randomBetween(1500, 3000));

  // 20% chance: model overloaded
  if (Math.random() < 0.2) {
    throw new TransientError('LLM inference timeout — model capacity exceeded');
  }

  return {
    data: {
      summary:
        'Candidate demonstrated strong technical skills in system design. ' +
        'Discussed distributed systems experience and showed good problem-solving approach. ' +
        'Recommended for next round.',
      sentiment: 'positive',
      keyTopics: ['system-design', 'distributed-systems', 'problem-solving'],
      confidence: 0.92,
    },
  };
};
