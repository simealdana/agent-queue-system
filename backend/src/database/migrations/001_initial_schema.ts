import type { Migration } from '../migration-runner';

export const migration: Migration = {
  version: 1,
  name: 'initial_schema',

  up(db) {
    db.exec(`
      CREATE TABLE workflows (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','running','completed','failed')),
        current_step INTEGER NOT NULL DEFAULT 0,
        total_steps  INTEGER NOT NULL,
        context      TEXT NOT NULL DEFAULT '{}',
        error        TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE workflow_steps (
        id           TEXT PRIMARY KEY,
        workflow_id  TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        step_index   INTEGER NOT NULL,
        name         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','running','completed','failed','skipped')),
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

      CREATE INDEX idx_workflow_status ON workflows(status);
      CREATE INDEX idx_steps_workflow  ON workflow_steps(workflow_id, step_index);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS workflow_steps;
      DROP TABLE IF EXISTS workflows;
    `);
  },
};
