import { StepHandler, TransientError } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const sendFollowupHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(700, 1300));

  if (Math.random() < 0.25) {
    throw new TransientError('Email provider throttled — SMTP connection reset');
  }

  const summary = ctx.accumulated['generate-summary'];

  return {
    data: {
      emailId: 'msg_q9w2e4r6',
      recipient: 'candidate',
      subject: 'Thank you for your interview',
      templateUsed: summary?.sentiment === 'positive' ? 'positive-followup' : 'neutral-followup',
      sentAt: new Date().toISOString(),
    },
  };
};
