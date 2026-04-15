import type { Migration } from '../migration-runner';

/**
 * Adds 'waiting' status to workflows and workflow_steps.
 * Used when a step requires human intervention before continuing.
 *
 * SQLite doesn't support ALTER CHECK, so we recreate the tables.
 */
export const migration: Migration = {
  version: 2,
  name: 'add_waiting_status',

  up(db) {
    db.exec(`
      -- Recreate workflows with 'waiting' in CHECK constraint
      CREATE TABLE workflows_new (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','running','completed','failed','waiting')),
        current_step INTEGER NOT NULL DEFAULT 0,
        total_steps  INTEGER NOT NULL,
        context      TEXT NOT NULL DEFAULT '{}',
        error        TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO workflows_new SELECT * FROM workflows;
      DROP TABLE workflows;
      ALTER TABLE workflows_new RENAME TO workflows;

      CREATE INDEX idx_workflow_status ON workflows(status);

      -- Recreate workflow_steps with 'waiting' in CHECK constraint
      CREATE TABLE workflow_steps_new (
        id           TEXT PRIMARY KEY,
        workflow_id  TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        step_index   INTEGER NOT NULL,
        name         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','running','completed','failed','skipped','waiting')),
        result       TEXT,
        error        TEXT,
        attempt      INTEGER NOT NULL DEFAULT 0,
        max_retries  INTEGER NOT NULL DEFAULT 3,
        started_at   TEXT,
        completed_at TEXT,
        duration_ms  INTEGER,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (workflow_id, step_index)
      );

      INSERT INTO workflow_steps_new SELECT * FROM workflow_steps;
      DROP TABLE workflow_steps;
      ALTER TABLE workflow_steps_new RENAME TO workflow_steps;

      CREATE INDEX idx_steps_workflow ON workflow_steps(workflow_id, step_index);
    `);
  },

  down(db) {
    // Revert: remove 'waiting' status (recreate without it)
    db.exec(`
      UPDATE workflows SET status = 'failed' WHERE status = 'waiting';
      UPDATE workflow_steps SET status = 'failed' WHERE status = 'waiting';
    `);
  },
};
