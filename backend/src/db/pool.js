/**
 * Postgres pool for Account auth. Optional until DATABASE_URL is set.
 */
import pg from 'pg';

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export function getPool() {
  return pool;
}

export function isDbConfigured(databaseUrl = process.env.DATABASE_URL) {
  return typeof databaseUrl === 'string' && databaseUrl.trim().length > 0;
}

/**
 * @param {string} databaseUrl
 * @param {{ max?: number }} [opts]
 */
export function createPool(databaseUrl, opts = {}) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Account auth');
  }
  const ssl =
    /localhost|127\.0\.0\.1/i.test(databaseUrl)
      ? false
      : { rejectUnauthorized: false };

  return new Pool({
    connectionString: databaseUrl,
    max: opts.max ?? 10,
    ssl
  });
}

export async function initDb(databaseUrl = process.env.DATABASE_URL) {
  if (!isDbConfigured(databaseUrl)) {
    pool = null;
    return null;
  }
  if (pool) return pool;
  pool = createPool(databaseUrl);
  pool.on('error', (err) => {
    console.error('[db] idle client error', err.message);
  });
  // Verify connectivity early.
  const client = await pool.connect();
  client.release();
  return pool;
}

export async function closeDb() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export async function withTransaction(fn) {
  if (!pool) throw new Error('Database not initialized');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}
