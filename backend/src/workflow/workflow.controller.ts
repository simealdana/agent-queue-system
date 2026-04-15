import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './workflow.dto';
import { WorkflowDto } from './workflow.types';

const TEMPLATES: Record<string, string[]> = {
  default: [
    'check-calendar',
    'update-crm',
    'generate-summary',
    'human-review',
    'send-followup',
    'schedule-next',
  ],
  'with-external': [
    'check-calendar',
    'update-crm',
    'generate-summary',
    'external-approval',
    'send-followup',
    'schedule-next',
  ],
  'full-review': [
    'check-calendar',
    'update-crm',
    'generate-summary',
    'human-review',
    'send-followup',
    'external-approval',
    'schedule-next',
  ],
};

@Controller('api/workflows')
export class WorkflowController {
  constructor(private service: WorkflowService) {}

  @Post()
  create(@Body() body: CreateWorkflowDto): WorkflowDto {
    const stepNames = body.steps ?? TEMPLATES[body.template ?? 'default'] ?? TEMPLATES.default!;
    return this.service.createWorkflow(body.name, stepNames);
  }

  @Post('run')
  run(@Body() body: CreateWorkflowDto): WorkflowDto {
    const stepNames = body.steps ?? TEMPLATES[body.template ?? 'default'] ?? TEMPLATES.default!;
    const workflow = this.service.createWorkflow(body.name, stepNames);
    return this.service.startWorkflow(workflow.id);
  }

  @Get()
  list(): WorkflowDto[] {
    return this.service.listWorkflows();
  }

  @Get(':id')
  get(@Param('id') id: string): WorkflowDto {
    return this.service.getWorkflow(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateWorkflowDto): WorkflowDto {
    return this.service.updateWorkflow(id, body.name, body.steps);
  }

  @Post(':id/start')
  start(@Param('id') id: string): WorkflowDto {
    return this.service.startWorkflow(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string): WorkflowDto {
    return this.service.resumeWorkflow(id);
  }

  @Post(':id/restart')
  restart(@Param('id') id: string): WorkflowDto {
    return this.service.restartWorkflow(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string): WorkflowDto {
    return this.service.approveWorkflow(id);
  }
}
