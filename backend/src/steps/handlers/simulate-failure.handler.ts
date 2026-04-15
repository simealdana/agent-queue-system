import { StepHandler } from '../step.types';
import { sleep, randomBetween } from '../../shared/utils';

/**
 * A step handler that always fails fatally on the first execution,
 * but succeeds when the workflow is resumed or restarted.
 *
 * Uses an in-memory Set to track which workflows have already failed
 * at this step. On the second run (resume/restart), it succeeds.
 */
const failedOnce = new Set<string>();

export const simulateFailureHandler: StepHandler = async (ctx) => {
  await sleep(randomBetween(500, 1000));

  if (!failedOnce.has(ctx.workflowId)) {
    failedOnce.add(ctx.workflowId);
    throw new Error(
      'External API returned 500: Connection refused (simulated failure)',
    );
  }

  return {
    data: {
      recovered: true,
      message: 'Service recovered successfully',
      resolvedAt: new Date().toISOString(),
    },
  };
};
