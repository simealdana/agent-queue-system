import type Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
}

/**
 * Versioned migration runner backed by a `_migrations` ledger table.
 *
 * - Each migration has a monotonically increasing version number.
 * - The runner applies pending migrations in order inside a transaction.
 * - `down` is available for rollback tooling but is never called automatically.
 */
export class MigrationRunner {
  constructor(private db: Database.Database) {}

  /** Ensure the ledger table exists (idempotent). */
  private ensureLedger(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version    INTEGER PRIMARY KEY,
        name       TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  /** Return all versions that have already been applied. */
  private applied(): Set<number> {
    const rows = this.db
      .prepare('SELECT version FROM _migrations ORDER BY version ASC')
      .all() as MigrationRecord[];
    return new Set(rows.map((r) => r.version));
  }

  /**
   * Run all pending migrations in order.
   * Each migration runs inside its own transaction — if it fails,
   * only that migration is rolled back and execution stops.
   */
  run(migrations: Migration[]): void {
    this.ensureLedger();

    const applied = this.applied();
    const pending = migrations
      .filter((m) => !applied.has(m.version))
      .sort((a, b) => a.version - b.version);

    if (pending.length === 0) return;

    for (const migration of pending) {
      const applyMigration = this.db.transaction(() => {
        migration.up(this.db);

        this.db
          .prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)')
          .run(migration.version, migration.name);
      });

      applyMigration();
    }
  }

  /** Roll back a single migration by version (for dev tooling). */
  rollback(migrations: Migration[], targetVersion: number): void {
    this.ensureLedger();

    const migration = migrations.find((m) => m.version === targetVersion);
    if (!migration) throw new Error(`Migration v${targetVersion} not found`);

    const revert = this.db.transaction(() => {
      migration.down(this.db);
      this.db
        .prepare('DELETE FROM _migrations WHERE version = ?')
        .run(targetVersion);
    });

    revert();
  }
}
