import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { ApprovalController } from './approval.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowRepository } from './workflow.repository';
import { WorkflowGateway } from './workflow.gateway';
import { ApprovalTemplateService } from './approval-template.service';
import { StepsModule } from '../steps/steps.module';

@Module({
  imports: [StepsModule],
  controllers: [WorkflowController, ApprovalController],
  providers: [WorkflowService, WorkflowRepository, WorkflowGateway, ApprovalTemplateService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
