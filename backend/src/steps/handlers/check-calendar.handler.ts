import { StepHandler } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const checkCalendarHandler: StepHandler = async () => {
  await sleep(randomBetween(600, 1200));

  return {
    data: {
      available: true,
      slots: [
        '2026-04-15T10:00:00Z',
        '2026-04-15T14:00:00Z',
        '2026-04-16T09:00:00Z',
      ],
      calendarId: 'primary',
      timezone: 'America/New_York',
    },
  };
};
