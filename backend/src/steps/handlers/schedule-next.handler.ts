import { StepHandler, TransientError } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const scheduleNextHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(500, 1000));

  if (Math.random() < 0.1) {
    throw new TransientError('Scheduling conflict — slot was just booked');
  }

  const calendar = ctx.accumulated['check-calendar'];
  const slots = calendar?.slots ?? [];

  return {
    data: {
      eventId: 'evt_m3n5b7v9',
      scheduledAt: slots[0] || '2026-04-17T10:00:00Z',
      interviewType: 'technical-round-2',
      panelSize: 2,
      notificationsSent: true,
    },
  };
};
