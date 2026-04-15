import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowDto } from './workflow.types';

interface CreateWorkflowBody {
  name: string;
  steps?: string[];
}

/** Default AI interview workflow steps */
const DEFAULT_STEPS = [
  'check-calendar',
  'update-crm',
  'generate-summary',
  'send-followup',
  'schedule-next',
];

@Controller('api/workflows')
export class WorkflowController {
  constructor(private service: WorkflowService) {}

  @Post()
  create(@Body() body: CreateWorkflowBody): WorkflowDto {
    const stepNames = body.steps ?? DEFAULT_STEPS;
    const workflow = this.service.createWorkflow(body.name, stepNames);

    // Fire and forget: start execution asynchronously
    this.service.executeWorkflow(workflow.id).catch(() => {});

    return workflow;
  }

  @Get()
  list(): WorkflowDto[] {
    return this.service.listWorkflows();
  }

  @Get(':id')
  get(@Param('id') id: string): WorkflowDto {
    return this.service.getWorkflow(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string): WorkflowDto {
    return this.service.resumeWorkflow(id);
  }
}
