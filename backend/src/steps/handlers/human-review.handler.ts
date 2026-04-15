import { StepHandler, WaitForApproval } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

export const humanReviewHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(300, 600));

  const summary = ctx.accumulated['generate-summary'];

  throw new WaitForApproval(
    'AI summary requires human review before sending follow-up',
    {
      summaryToReview: summary?.summary ?? 'No summary available',
      sentiment: summary?.sentiment ?? 'unknown',
      confidence: summary?.confidence ?? 0,
    },
  );
};
