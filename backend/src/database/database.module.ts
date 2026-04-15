import { Global, Module, OnModuleInit, Inject } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DATABASE_TOKEN, databaseProvider } from './database.provider';
import { MigrationRunner } from './migration-runner';
import { migrations } from './migrations/index';

@Global()
@Module({
  providers: [databaseProvider],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule implements OnModuleInit {
  constructor(@Inject(DATABASE_TOKEN) private db: Database.Database) {}

  onModuleInit() {
    new MigrationRunner(this.db).run(migrations);
  }
}
