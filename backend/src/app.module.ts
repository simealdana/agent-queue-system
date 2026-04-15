import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [DatabaseModule, WorkflowModule],
})
export class AppModule {}
