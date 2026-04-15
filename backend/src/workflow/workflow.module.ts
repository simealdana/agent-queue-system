import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowGateway } from './workflow.gateway';
import { StepsModule } from '../steps/steps.module';

@Module({
  imports: [StepsModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowRepository, WorkflowGateway],
  exports: [WorkflowService],
})
export class WorkflowModule {}
