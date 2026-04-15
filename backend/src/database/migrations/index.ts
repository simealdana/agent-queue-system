import type { Migration } from '../migration-runner';
import { migration as m001 } from './001_initial_schema';

/**
 * All migrations in order. To add a new migration:
 * 1. Create `NNN_description.ts` exporting a Migration object
 * 2. Import and append it to this array
 */
export const migrations: Migration[] = [m001];
