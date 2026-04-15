import { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export const DATABASE_TOKEN = Symbol('DATABASE_CONNECTION');

export const databaseProvider: Provider = {
  provide: DATABASE_TOKEN,
  useFactory: () => {
    const dbPath =
      process.env.DB_PATH ||
      path.join(process.cwd(), 'data', 'silkchart.db');

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(dbPath);

    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');

    return db;
  },
};
