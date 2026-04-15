import { Module, OnModuleInit } from '@nestjs/common';
import { StepRegistry } from './step-registry.service';
import { checkCalendarHandler } from './handlers/check-calendar.handler';
import { updateCrmHandler } from './handlers/update-crm.handler';
import { generateSummaryHandler } from './handlers/generate-summary.handler';
import { sendFollowupHandler } from './handlers/send-followup.handler';
import { scheduleNextHandler } from './handlers/schedule-next.handler';

@Module({
  providers: [StepRegistry],
  exports: [StepRegistry],
})
export class StepsModule implements OnModuleInit {
  constructor(private registry: StepRegistry) {}

  onModuleInit() {
    this.registry.register('check-calendar', checkCalendarHandler);
    this.registry.register('update-crm', updateCrmHandler);
    this.registry.register('generate-summary', generateSummaryHandler);
    this.registry.register('send-followup', sendFollowupHandler);
    this.registry.register('schedule-next', scheduleNextHandler);
  }
}
