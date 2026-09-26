/**
 * Minimal SQL migration runner (AUTH-01B).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPool, isDbConfigured } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export async function runMigrations(databaseUrl = process.env.DATABASE_URL) {
  if (!isDbConfigured(databaseUrl)) {
    throw new Error('DATABASE_URL required to run migrations');
  }
  const pool = createPool(databaseUrl, { max: 2 });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const id = file;
      const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [id]);
      if (exists.rowCount > 0) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
        await client.query('COMMIT');
        console.log(`[migrate] applied ${id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runMigrations()
    .then(() => {
      console.log('[migrate] done');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[migrate] failed', err);
      process.exit(1);
    });
}
