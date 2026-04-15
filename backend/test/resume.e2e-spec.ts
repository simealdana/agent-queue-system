import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import { WorkflowService } from '../src/workflow/workflow.service';
import { WorkflowRepository } from '../src/workflow/workflow.repository';
import { StepRegistry } from '../src/steps/step-registry.service';
import { WorkflowGateway } from '../src/workflow/workflow.gateway';
import {
  TransientError,
  WaitForApproval,
  StepHandler,
  StepContext,
} from '../src/steps/step.types';
import { MigrationRunner } from '../src/database/migration-runner';
import { migrations } from '../src/database/migrations/index';

/* ── Test helpers ──────────────────────────────────────────────── */

const TEST_DB_PATH = path.join(__dirname, `test-${uuid().slice(0, 8)}.db`);

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

class MockGateway {
  server = { emit: () => {} };
  emitWorkflowUpdate() {}
  emitStepUpdate() {}
}

const STEP_NAMES = [
  'check-calendar',
  'update-crm',
  'generate-summary',
  'send-followup',
  'schedule-next',
];

function trackingHandler(name: string, log: string[]): StepHandler {
  return async (ctx: StepContext) => {
    log.push(`${name}:${ctx.stepIndex}`);
    return { data: { step: name, ok: true } };
  };
}

function registerAll(
  registry: StepRegistry,
  log: string[],
  overrides: Record<string, StepHandler> = {},
): void {
  for (const name of STEP_NAMES) {
    registry.register(name, overrides[name] ?? trackingHandler(name, log));
  }
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('Workflow Engine', () => {
  let db: Database.Database;
  let repo: WorkflowRepository;
  let registry: StepRegistry;
  let service: WorkflowService;
  let log: string[];

  function rebuild() {
    registry = new StepRegistry();
    const gw = new MockGateway() as unknown as WorkflowGateway;
    service = new WorkflowService(repo, registry, gw);
  }

  beforeEach(() => {
    cleanupDb();
    db = createTestDb();
    repo = new WorkflowRepository(db);
    log = [];
    rebuild();
  });

  afterEach(() => {
    db.close();
    cleanupDb();
  });

  /* ── 1. Resume after crash ──────────────────────────────────── */

  describe('Resume after crash', () => {
    it('resumes from the last completed step — skips already-completed steps', async () => {
      // Phase 1: crash at step 2
      registerAll(registry, log, {
        'generate-summary': async () => {
          throw new Error('SIMULATED_CRASH');
        },
      });

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      expect(repo.getWorkflow(wf.id)!.status).toBe('failed');
      const steps = repo.getSteps(wf.id);
      expect(steps[0]!.status).toBe('completed');
      expect(steps[1]!.status).toBe('completed');
      expect(steps[2]!.status).toBe('failed');
      expect(steps[3]!.status).toBe('pending');
      expect(steps[4]!.status).toBe('pending');

      // Phase 2: resume — only steps 2-4 should execute
      log = [];
      repo.resetFailedStep(wf.id);
      rebuild();
      registerAll(registry, log);

      await service.executeWorkflow(wf.id);

      expect(log).toEqual([
        'generate-summary:2',
        'send-followup:3',
        'schedule-next:4',
      ]);

      const final = repo.getWorkflow(wf.id)!;
      expect(final.status).toBe('completed');
      expect(final.current_step).toBe(5);
      repo.getSteps(wf.id).forEach((s) => expect(s.status).toBe('completed'));
    });
  });

  /* ── 2. Transient retry ─────────────────────────────────────── */

  describe('Transient error retry', () => {
    it('retries transient errors and succeeds after backoff', async () => {
      let attempt = 0;

      registerAll(registry, log, {
        'update-crm': async (ctx) => {
          attempt++;
          log.push(`update-crm:attempt-${ctx.attempt}`);
          if (attempt <= 2) throw new TransientError('CRM timeout');
          return { data: { ok: true } };
        },
      });

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      const crmAttempts = log.filter((l) => l.startsWith('update-crm:'));
      expect(crmAttempts).toHaveLength(3);
      expect(repo.getWorkflow(wf.id)!.status).toBe('completed');

      const crmStep = repo.getSteps(wf.id).find((s) => s.name === 'update-crm')!;
      expect(crmStep.attempt).toBe(3);
    });

    it('fails workflow after exhausting all retries', async () => {
      registerAll(registry, log, {
        'update-crm': async () => {
          throw new TransientError('always fails');
        },
      });

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      expect(repo.getWorkflow(wf.id)!.status).toBe('failed');
      const crmStep = repo.getSteps(wf.id).find((s) => s.name === 'update-crm')!;
      expect(crmStep.status).toBe('failed');
      expect(crmStep.attempt).toBe(4); // max_retries(3) + 1
    });
  });

  /* ── 3. Fatal error ─────────────────────────────────────────── */

  describe('Fatal error handling', () => {
    it('stops immediately without retrying on non-transient error', async () => {
      registerAll(registry, log, {
        'update-crm': async () => {
          log.push('update-crm');
          throw new Error('FATAL: Invalid candidate');
        },
      });

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      expect(log).toEqual(['check-calendar:0', 'update-crm']);
      expect(repo.getWorkflow(wf.id)!.status).toBe('failed');
      expect(repo.getWorkflow(wf.id)!.error).toContain('Invalid candidate');

      const steps = repo.getSteps(wf.id);
      expect(steps[1]!.status).toBe('failed');
      expect(steps[2]!.status).toBe('pending');
      expect(steps[3]!.status).toBe('pending');
      expect(steps[4]!.status).toBe('pending');
    });
  });

  /* ── 4. Dashboard approval (human intervention) ─────────────── */

  describe('Dashboard approval', () => {
    const STEPS_WITH_REVIEW = [
      'check-calendar',
      'update-crm',
      'human-review',
      'send-followup',
    ];

    it('pauses workflow at a WaitForApproval step', async () => {
      registerAll(registry, log);
      registry.register('human-review', async () => {
        throw new WaitForApproval('Needs review', { summary: 'Good candidate' }, 'dashboard');
      });

      const wf = service.createWorkflow('Test', STEPS_WITH_REVIEW);
      await service.executeWorkflow(wf.id);

      expect(repo.getWorkflow(wf.id)!.status).toBe('waiting');
      const steps = repo.getSteps(wf.id);
      expect(steps[0]!.status).toBe('completed');
      expect(steps[1]!.status).toBe('completed');
      expect(steps[2]!.status).toBe('waiting');
      expect(steps[3]!.status).toBe('pending');

      // Verify pending data is stored
      const result = JSON.parse(steps[2]!.result!);
      expect(result.summary).toBe('Good candidate');
      expect(result._approvalType).toBe('dashboard');
    });

    it('continues execution after approval', async () => {
      registerAll(registry, log);
      registry.register('human-review', async () => {
        throw new WaitForApproval('Needs review', { summary: 'ok' }, 'dashboard');
      });

      const wf = service.createWorkflow('Test', STEPS_WITH_REVIEW);
      await service.executeWorkflow(wf.id);
      expect(repo.getWorkflow(wf.id)!.status).toBe('waiting');

      // Clear log to track only post-approval execution
      log.length = 0;

      // Approve and continue
      service.approveWorkflow(wf.id);
      // Wait for async execution
      await new Promise((r) => setTimeout(r, 200));

      // Only send-followup should have executed (check-calendar, update-crm were already done)
      expect(log).toEqual(['send-followup:3']);
      expect(repo.getWorkflow(wf.id)!.status).toBe('completed');
      repo.getSteps(wf.id).forEach((s) => expect(s.status).toBe('completed'));
    });
  });

  /* ── 5. External link approval ──────────────────────────────── */

  describe('External link approval', () => {
    const STEPS_WITH_EXTERNAL = [
      'check-calendar',
      'external-approval',
      'send-followup',
    ];

    it('generates a token and pauses workflow', async () => {
      registerAll(registry, log);
      registry.register('external-approval', async () => {
        throw new WaitForApproval('Manager must approve', { reason: 'next round' }, 'external');
      });

      const wf = service.createWorkflow('Test', STEPS_WITH_EXTERNAL);
      await service.executeWorkflow(wf.id);

      expect(repo.getWorkflow(wf.id)!.status).toBe('waiting');

      const steps = repo.getSteps(wf.id);
      const waitingStep = steps.find((s) => s.status === 'waiting')!;
      const result = JSON.parse(waitingStep.result!);

      expect(result._approvalType).toBe('external');
      expect(result._token).toBeDefined();
      expect(typeof result._token).toBe('string');
      expect(result._token.length).toBeGreaterThan(0);
    });

    it('can be approved by token and continues execution', async () => {
      registerAll(registry, log);
      registry.register('external-approval', async () => {
        throw new WaitForApproval('Manager must approve', {}, 'external');
      });

      const wf = service.createWorkflow('Test', STEPS_WITH_EXTERNAL);
      await service.executeWorkflow(wf.id);

      // Extract the token
      const steps = repo.getSteps(wf.id);
      const waitingStep = steps.find((s) => s.status === 'waiting')!;
      const token = JSON.parse(waitingStep.result!)._token;

      // Verify token lookup works
      const found = repo.findStepByToken(token);
      expect(found).toBeDefined();
      expect(found!.workflowId).toBe(wf.id);

      // Approve by token
      log.length = 0;
      service.approveByToken(token);
      await new Promise((r) => setTimeout(r, 200));

      expect(log).toEqual(['send-followup:2']);
      expect(repo.getWorkflow(wf.id)!.status).toBe('completed');
    });

    it('rejects invalid tokens', () => {
      expect(() => service.approveByToken('nonexistent-token')).toThrow();
    });
  });

  /* ── 6. Restart from scratch ────────────────────────────────── */

  describe('Restart from scratch', () => {
    it('resets all steps and context, re-executes from step 0', async () => {
      registerAll(registry, log, {
        'generate-summary': async () => {
          throw new Error('FATAL');
        },
      });

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      expect(repo.getWorkflow(wf.id)!.status).toBe('failed');
      expect(repo.getWorkflow(wf.id)!.current_step).toBe(2);

      // Restart from scratch
      log = [];
      rebuild();
      registerAll(registry, log); // No more crash

      service.restartWorkflow(wf.id);
      await new Promise((r) => setTimeout(r, 200));

      // ALL 5 steps executed — including the ones that were previously completed
      expect(log).toEqual([
        'check-calendar:0',
        'update-crm:1',
        'generate-summary:2',
        'send-followup:3',
        'schedule-next:4',
      ]);

      const final = repo.getWorkflow(wf.id)!;
      expect(final.status).toBe('completed');
      expect(final.current_step).toBe(5);
      expect(JSON.parse(final.context)).toHaveProperty('check-calendar');
      expect(JSON.parse(final.context)).toHaveProperty('schedule-next');
    });

    it('clears previous context on restart', async () => {
      registerAll(registry, log, {
        'update-crm': async () => {
          throw new Error('FAIL');
        },
      });

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      // Context should have check-calendar data
      const ctxBefore = JSON.parse(repo.getWorkflow(wf.id)!.context);
      expect(ctxBefore['check-calendar']).toBeDefined();

      // Restart
      repo.restartWorkflow(wf.id);
      const ctxAfter = JSON.parse(repo.getWorkflow(wf.id)!.context);
      expect(ctxAfter).toEqual({});
      expect(repo.getWorkflow(wf.id)!.current_step).toBe(0);

      // All steps reset
      repo.getSteps(wf.id).forEach((s) => {
        expect(s.status).toBe('pending');
        expect(s.result).toBeNull();
        expect(s.attempt).toBe(0);
      });
    });
  });

  /* ── 7. Context accumulation ────────────────────────────────── */

  describe('Context accumulation', () => {
    it('passes accumulated context from prior steps to subsequent steps', async () => {
      const receivedContexts: Record<string, Record<string, unknown>> = {};

      for (const name of STEP_NAMES) {
        registry.register(name, async (ctx) => {
          receivedContexts[name] = { ...ctx.accumulated };
          return { data: { [name]: `result-of-${name}` } };
        });
      }

      const wf = service.createWorkflow('Test', STEP_NAMES);
      await service.executeWorkflow(wf.id);

      // Step 0 gets empty context
      expect(receivedContexts['check-calendar']).toEqual({});

      // Step 1 gets step 0's output
      expect(receivedContexts['update-crm']).toHaveProperty('check-calendar');
      expect(receivedContexts['update-crm']!['check-calendar']).toEqual({
        'check-calendar': 'result-of-check-calendar',
      });

      // Step 4 gets all prior outputs
      const lastCtx = receivedContexts['schedule-next']!;
      expect(Object.keys(lastCtx)).toHaveLength(4);
      expect(lastCtx).toHaveProperty('check-calendar');
      expect(lastCtx).toHaveProperty('update-crm');
      expect(lastCtx).toHaveProperty('generate-summary');
      expect(lastCtx).toHaveProperty('send-followup');

      // Final workflow context has all 5
      const finalCtx = JSON.parse(repo.getWorkflow(wf.id)!.context);
      expect(Object.keys(finalCtx)).toHaveLength(5);
    });
  });

  /* ── 8. Migration runner ────────────────────────────────────── */

  describe('Migration runner', () => {
    it('applies migrations in order and records them in the ledger', () => {
      // Migrations already ran in beforeEach — verify the ledger
      const applied = db
        .prepare('SELECT * FROM _migrations ORDER BY version ASC')
        .all() as { version: number; name: string }[];

      expect(applied.length).toBeGreaterThanOrEqual(2);
      expect(applied[0]!.version).toBe(1);
      expect(applied[0]!.name).toBe('initial_schema');
      expect(applied[1]!.version).toBe(2);
      expect(applied[1]!.name).toBe('add_waiting_status');
    });

    it('does not re-apply already-applied migrations', () => {
      // Run migrations again — should be a no-op
      const runner = new MigrationRunner(db);
      expect(() => runner.run(migrations)).not.toThrow();

      const applied = db
        .prepare('SELECT * FROM _migrations ORDER BY version ASC')
        .all() as { version: number }[];

      // Still same count — no duplicates
      expect(applied.length).toBe(2);
    });

    it('supports rollback', () => {
      const runner = new MigrationRunner(db);

      // Rollback migration 2
      runner.rollback(migrations, 2);

      const applied = db
        .prepare('SELECT * FROM _migrations ORDER BY version ASC')
        .all() as { version: number }[];

      expect(applied.length).toBe(1);
      expect(applied[0]!.version).toBe(1);

      // Re-apply
      runner.run(migrations);
      const reapplied = db
        .prepare('SELECT * FROM _migrations ORDER BY version ASC')
        .all() as { version: number }[];
      expect(reapplied.length).toBe(2);
    });
  });
});
