import { Test, TestingModule } from '@nestjs/testing';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import { DatabaseModule } from '../src/database/database.module';
import { DATABASE_TOKEN } from '../src/database/database.provider';
import { WorkflowModule } from '../src/workflow/workflow.module';
import { WorkflowService } from '../src/workflow/workflow.service';
import { WorkflowRepository } from '../src/workflow/workflow.repository';
import { StepRegistry } from '../src/steps/step-registry.service';
import { StepsModule } from '../src/steps/steps.module';
import { WorkflowGateway } from '../src/workflow/workflow.gateway';
import { TransientError, StepHandler, StepContext } from '../src/steps/step.types';
import { MigrationRunner } from '../src/database/migration-runner';
import { migrations } from '../src/database/migrations/index';

const TEST_DB_PATH = path.join(__dirname, `test-resume-${uuid().slice(0, 8)}.db`);

function cleanupDb() {
  for (const ext of ['', '-wal', '-shm']) {
    const p = TEST_DB_PATH + ext;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

function createTestDb(): Database.Database {
  const dir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(TEST_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  new MigrationRunner(db).run(migrations);
  return db;
}

/** A no-op gateway that doesn't need a real WebSocket server */
class MockGateway {
  server = { emit: () => {} };
  emitWorkflowUpdate() {}
  emitStepUpdate() {}
}

describe('Workflow Resume After Crash', () => {
  let db: Database.Database;
  let repo: WorkflowRepository;
  let registry: StepRegistry;
  let service: WorkflowService;
  let executionLog: string[];

  beforeEach(() => {
    cleanupDb();
    db = createTestDb();
    repo = new WorkflowRepository(db);
    registry = new StepRegistry();
    executionLog = [];

    const mockGateway = new MockGateway() as unknown as WorkflowGateway;
    service = new WorkflowService(repo, registry, mockGateway);
  });

  afterEach(() => {
    db.close();
    cleanupDb();
  });

  function registerTrackingHandlers(failOnStep?: string): void {
    const handler = (name: string): StepHandler => async (ctx: StepContext) => {
      if (name === failOnStep) {
        throw new Error(`SIMULATED_CRASH at ${name}`);
      }
      executionLog.push(`${name}:${ctx.stepIndex}`);
      return { data: { executed: true, step: name } };
    };

    registry.register('check-calendar', handler('check-calendar'));
    registry.register('update-crm', handler('update-crm'));
    registry.register('generate-summary', handler('generate-summary'));
    registry.register('send-followup', handler('send-followup'));
    registry.register('schedule-next', handler('schedule-next'));
  }

  const STEP_NAMES = [
    'check-calendar',
    'update-crm',
    'generate-summary',
    'send-followup',
    'schedule-next',
  ];

  it('should resume from the last completed step after a simulated crash', async () => {
    // ----- PHASE 1: Run workflow, crash at step "generate-summary" (index 2) -----

    registerTrackingHandlers('generate-summary');

    const workflow = service.createWorkflow('Test Resume', STEP_NAMES);
    await service.executeWorkflow(workflow.id);

    // Verify: steps 0-1 completed, step 2 failed (crash), steps 3-4 still pending
    const afterCrash = repo.getWorkflow(workflow.id)!;
    expect(afterCrash.status).toBe('failed');

    const stepsAfterCrash = repo.getSteps(workflow.id);
    expect(stepsAfterCrash[0]!.status).toBe('completed');
    expect(stepsAfterCrash[1]!.status).toBe('completed');
    expect(stepsAfterCrash[2]!.status).toBe('failed');
    expect(stepsAfterCrash[3]!.status).toBe('pending');
    expect(stepsAfterCrash[4]!.status).toBe('pending');

    // Context should have results from steps 0-1 only
    const contextAfterCrash = JSON.parse(afterCrash.context);
    expect(contextAfterCrash['check-calendar']).toBeDefined();
    expect(contextAfterCrash['update-crm']).toBeDefined();
    expect(contextAfterCrash['generate-summary']).toBeUndefined();

    // Verify execution log: only steps 0-1 executed
    expect(executionLog).toEqual([
      'check-calendar:0',
      'update-crm:1',
    ]);

    // ----- PHASE 2: "Restart" — clear log, resume workflow -----

    executionLog = [];

    // Reset the failed step (simulates user clicking "Resume")
    repo.resetFailedStep(workflow.id);

    // Re-register handlers WITHOUT the crash
    // (simulates a new process where the transient issue is resolved)
    registry = new StepRegistry();
    const mockGateway = new MockGateway() as unknown as WorkflowGateway;
    service = new WorkflowService(repo, registry, mockGateway);

    const resumeHandler = (name: string): StepHandler => async (ctx) => {
      executionLog.push(`${name}:${ctx.stepIndex}`);
      return { data: { executed: true, step: name, resumed: true } };
    };

    registry.register('check-calendar', resumeHandler('check-calendar'));
    registry.register('update-crm', resumeHandler('update-crm'));
    registry.register('generate-summary', resumeHandler('generate-summary'));
    registry.register('send-followup', resumeHandler('send-followup'));
    registry.register('schedule-next', resumeHandler('schedule-next'));

    await service.executeWorkflow(workflow.id);

    // ----- ASSERTIONS: Only steps 2-4 were executed in Phase 2 -----

    expect(executionLog).toEqual([
      'generate-summary:2',
      'send-followup:3',
      'schedule-next:4',
    ]);

    // Steps 0-1 were NOT re-executed (the key proof of resume)
    expect(executionLog).not.toContain('check-calendar:0');
    expect(executionLog).not.toContain('update-crm:1');

    // All steps are now completed
    const finalSteps = repo.getSteps(workflow.id);
    for (const step of finalSteps) {
      expect(step.status).toBe('completed');
    }

    // Workflow is completed
    const finalWorkflow = repo.getWorkflow(workflow.id)!;
    expect(finalWorkflow.status).toBe('completed');
    expect(finalWorkflow.current_step).toBe(5);

    // Context has all 5 step outputs
    const finalContext = JSON.parse(finalWorkflow.context);
    expect(Object.keys(finalContext)).toHaveLength(5);
    expect(finalContext['check-calendar']).toBeDefined();
    expect(finalContext['generate-summary'].resumed).toBe(true);
  });

  it('should handle transient errors with retry', async () => {
    let attempt = 0;

    registry.register('check-calendar', async (ctx) => {
      executionLog.push(`check-calendar:attempt-${ctx.attempt}`);
      return { data: { ok: true } };
    });

    registry.register('update-crm', async (ctx) => {
      attempt++;
      executionLog.push(`update-crm:attempt-${ctx.attempt}`);
      if (attempt <= 2) {
        throw new TransientError('CRM API timeout');
      }
      return { data: { ok: true } };
    });

    registry.register('generate-summary', async (ctx) => {
      executionLog.push(`generate-summary:attempt-${ctx.attempt}`);
      return { data: { ok: true } };
    });

    registry.register('send-followup', async (ctx) => {
      executionLog.push(`send-followup:attempt-${ctx.attempt}`);
      return { data: { ok: true } };
    });

    registry.register('schedule-next', async (ctx) => {
      executionLog.push(`schedule-next:attempt-${ctx.attempt}`);
      return { data: { ok: true } };
    });

    const workflow = service.createWorkflow('Test Retry', STEP_NAMES);
    await service.executeWorkflow(workflow.id);

    // update-crm should have been attempted 3 times (2 transient failures + 1 success)
    const crmAttempts = executionLog.filter((l) =>
      l.startsWith('update-crm:'),
    );
    expect(crmAttempts.length).toBe(3);

    // Workflow should complete successfully
    const final = repo.getWorkflow(workflow.id)!;
    expect(final.status).toBe('completed');

    // The step should show attempt count
    const steps = repo.getSteps(workflow.id);
    const crmStep = steps.find((s) => s.name === 'update-crm')!;
    expect(crmStep.attempt).toBe(3);
  });

  it('should fail workflow on fatal error without retrying', async () => {
    registry.register('check-calendar', async (ctx) => {
      executionLog.push('check-calendar');
      return { data: {} };
    });

    registry.register('update-crm', async () => {
      executionLog.push('update-crm');
      throw new Error('FATAL: Invalid candidate ID');
    });

    // These should never be reached
    registry.register('generate-summary', async () => {
      executionLog.push('generate-summary');
      return { data: {} };
    });
    registry.register('send-followup', async () => {
      executionLog.push('send-followup');
      return { data: {} };
    });
    registry.register('schedule-next', async () => {
      executionLog.push('schedule-next');
      return { data: {} };
    });

    const workflow = service.createWorkflow('Test Fatal', STEP_NAMES);
    await service.executeWorkflow(workflow.id);

    // Only first 2 steps were attempted
    expect(executionLog).toEqual(['check-calendar', 'update-crm']);

    // Workflow failed
    const final = repo.getWorkflow(workflow.id)!;
    expect(final.status).toBe('failed');
    expect(final.error).toContain('Invalid candidate ID');

    // Step 2 failed, steps 3-4 still pending
    const steps = repo.getSteps(workflow.id);
    expect(steps[1]!.status).toBe('failed');
    expect(steps[2]!.status).toBe('pending');
    expect(steps[3]!.status).toBe('pending');
    expect(steps[4]!.status).toBe('pending');
  });
});
