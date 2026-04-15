import { StepHandler, WaitForApproval } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const externalApprovalHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(200, 400));

  const summary = ctx.accumulated['generate-summary'];

  throw new WaitForApproval(
    'Manager approval required before scheduling next interview round',
    {
      candidateRecommendation: summary?.sentiment === 'positive'
        ? 'Proceed to next round'
        : 'Needs further evaluation',
      summaryExcerpt: summary?.summary
        ? summary.summary.slice(0, 120) + '...'
        : 'No summary available',
      requestedBy: 'AI Interview Agent',
      requestedAt: new Date().toISOString(),
    },
    'external',
  );
};
