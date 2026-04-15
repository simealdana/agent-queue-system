import { Controller, Get, Post, Param, Header } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ApprovalTemplateService } from './approval-template.service';

@Controller('approve')
export class ApprovalController {
  constructor(
    private service: WorkflowService,
    private template: ApprovalTemplateService,
  ) {}

  @Get(':token')
  @Header('Content-Type', 'text/html')
  getApprovalPage(@Param('token') token: string): string {
    try {
      const { workflow, stepName, pendingData } = this.service.getByToken(token);

      return this.template.render({
        token,
        workflowName: workflow.name,
        workflowId: workflow.id,
        stepName,
        pendingData,
        status: 'pending',
      });
    } catch {
      return this.template.render({ status: 'not_found' });
    }
  }

  @Post(':token')
  @Header('Content-Type', 'text/html')
  processApproval(@Param('token') token: string): string {
    try {
      const { workflow } = this.service.getByToken(token);
      this.service.approveByToken(token);

      return this.template.render({
        token,
        workflowName: workflow.name,
        workflowId: workflow.id,
        status: 'approved',
      });
    } catch {
      return this.template.render({ status: 'already_approved' });
    }
  }
}
