import { Controller, Get } from '@nestjs/common';
import { StepRegistry } from './step-registry.service';

@Controller('api/steps')
export class StepsController {
  constructor(private registry: StepRegistry) {}

  @Get()
  list(): string[] {
    return this.registry.getAll();
  }
}
