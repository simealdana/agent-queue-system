import { StepHandler } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const scheduleNextHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(500, 1000));

  const calendar = ctx.accumulated['check-calendar'] as
    | Record<string, unknown>
    | undefined;
  const slots = (calendar?.slots as string[]) || [];

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
