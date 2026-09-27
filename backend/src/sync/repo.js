/**
 * SYNC-01B — Postgres repository for account sync domains.
 */
import { getPool, withTransaction } from '../db/pool.js';
import { SYNC_HISTORY_MAX_RETAINED } from './constants.js';
import { stableEqualJson } from './validate.js';

/**
 * @param {import('pg').PoolClient} client
 * @param {string} accountId
 */
async function lockAccountState(client, accountId) {
  const existing = await client.query(
    `SELECT account_id, global_revision, history_revision, prefs_revision, updated_at
     FROM sync_account_state WHERE account_id = $1 FOR UPDATE`,
    [accountId]
  );
  if (existing.rowCount > 0) return existing.rows[0];

  await client.query(
    `INSERT INTO sync_account_state (account_id, global_revision, history_revision, prefs_revision)
     VALUES ($1, 0, 0, 0)
     ON CONFLICT (account_id) DO NOTHING`,
    [accountId]
  );
  const again = await client.query(
    `SELECT account_id, global_revision, history_revision, prefs_revision, updated_at
     FROM sync_account_state WHERE account_id = $1 FOR UPDATE`,
    [accountId]
  );
  return again.rows[0];
}

/**
 * @param {import('pg').PoolClient} client
 * @param {string} accountId
 * @param {{ history?: number, prefs?: number }} deltas
 */
async function bumpRevisions(client, accountId, deltas) {
  const hist = deltas.history ?? 0;
  const prefs = deltas.prefs ?? 0;
  const globalBump = hist + prefs;
  const { rows } = await client.query(
    `UPDATE sync_account_state
     SET history_revision = history_revision + $2,
         prefs_revision = prefs_revision + $3,
         global_revision = global_revision + $4,
         updated_at = NOW()
     WHERE account_id = $1
     RETURNING account_id, global_revision, history_revision, prefs_revision, updated_at`,
    [accountId, hist, prefs, globalBump]
  );
  return rows[0];
}

/**
 * Prune oldest excess rows (by created_at, then match_id). Soft-delete via deleted_at
 * is reserved for future; v1 hard-deletes pruned rows only after retention overflow.
 * Revision numbers are monotonic and never rewind.
 *
 * @param {import('pg').PoolClient} client
 * @param {string} accountId
 */
async function pruneHistoryRetention(client, accountId) {
  await client.query(
    `DELETE FROM sync_match_history
     WHERE account_id = $1
       AND match_id IN (
         SELECT match_id FROM sync_match_history
         WHERE account_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC, match_id DESC
         OFFSET $2
       )`,
    [accountId, SYNC_HISTORY_MAX_RETAINED]
  );
}

/**
 * @param {string} accountId
 * @param {Array<{ id: string, idempotencyKey: string|null, schemaVersion: number, payload: object }>} records
 */
export async function appendHistoryBatch(accountId, records) {
  return withTransaction(async (client) => {
    await lockAccountState(client, accountId);

    const accepted = [];
    const deduped = [];
    const conflicts = [];
    let newInserts = 0;

    for (const rec of records) {
      const byId = await client.query(
        `SELECT match_id, idempotency_key, schema_version, payload
         FROM sync_match_history
         WHERE account_id = $1 AND match_id = $2`,
        [accountId, rec.id]
      );

      if (byId.rowCount > 0) {
        const row = byId.rows[0];
        if (
          row.schema_version === rec.schemaVersion &&
          stableEqualJson(row.payload, rec.payload)
        ) {
          deduped.push(rec.id);
          continue;
        }
        conflicts.push({
          id: rec.id,
          code: 'history_record_conflict',
          message: 'Same match_id with different payload'
        });
        continue;
      }

      if (rec.idempotencyKey) {
        const byIdem = await client.query(
          `SELECT match_id, schema_version, payload
           FROM sync_match_history
           WHERE account_id = $1 AND idempotency_key = $2`,
          [accountId, rec.idempotencyKey]
        );
        if (byIdem.rowCount > 0) {
          const row = byIdem.rows[0];
          if (
            row.match_id !== rec.id &&
            row.schema_version === rec.schemaVersion &&
            stableEqualJson(row.payload, rec.payload)
          ) {
            // Same completion under different client id — treat as dedupe of existing.
            deduped.push(rec.id);
            continue;
          }
          if (row.match_id !== rec.id) {
            conflicts.push({
              id: rec.id,
              code: 'history_record_conflict',
              message: 'idempotencyKey already bound to a different match_id'
            });
            continue;
          }
        }
      }

      // Reserve next revision for this insert.
      const state = await bumpRevisions(client, accountId, { history: 1 });
      const serverRevision = Number(state.history_revision);

      try {
        await client.query(
          `INSERT INTO sync_match_history
             (account_id, match_id, idempotency_key, schema_version, payload, server_revision)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [
            accountId,
            rec.id,
            rec.idempotencyKey,
            rec.schemaVersion,
            JSON.stringify(rec.payload),
            serverRevision
          ]
        );
        accepted.push(rec.id);
        newInserts += 1;
      } catch (err) {
        // Concurrent insert race — re-read and classify.
        if (err?.code === '23505') {
          const again = await client.query(
            `SELECT match_id, schema_version, payload
             FROM sync_match_history
             WHERE account_id = $1 AND match_id = $2`,
            [accountId, rec.id]
          );
          if (
            again.rowCount > 0 &&
            again.rows[0].schema_version === rec.schemaVersion &&
            stableEqualJson(again.rows[0].payload, rec.payload)
          ) {
            // Revision already bumped; leave as-is (monotonic). Count as dedupe.
            deduped.push(rec.id);
            continue;
          }
          conflicts.push({
            id: rec.id,
            code: 'history_record_conflict',
            message: 'Concurrent insert conflict'
          });
          continue;
        }
        throw err;
      }
    }

    if (newInserts > 0) {
      await pruneHistoryRetention(client, accountId);
    }

    const finalState = await client.query(
      `SELECT history_revision, prefs_revision, global_revision, updated_at
       FROM sync_account_state WHERE account_id = $1`,
      [accountId]
    );

    return {
      accepted,
      deduped,
      conflicts,
      historyRevision: Number(finalState.rows[0].history_revision),
      prefsRevision: Number(finalState.rows[0].prefs_revision),
      globalRevision: Number(finalState.rows[0].global_revision)
    };
  });
}

/**
 * @param {string} accountId
 * @param {{ schemaVersion: number, baseRevision: number, payload: object }} input
 */
export async function putPrefs(accountId, input) {
  return withTransaction(async (client) => {
    const state = await lockAccountState(client, accountId);
    const current = Number(state.prefs_revision);

    if (input.baseRevision !== current) {
      const err = new Error('stale_revision');
      err.code = 'stale_revision';
      err.status = 409;
      err.currentRevision = current;
      throw err;
    }

    const nextState = await bumpRevisions(client, accountId, { prefs: 1 });
    const serverRevision = Number(nextState.prefs_revision);

    await client.query(
      `INSERT INTO sync_prefs (account_id, schema_version, payload, server_revision, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (account_id) DO UPDATE SET
         schema_version = EXCLUDED.schema_version,
         payload = EXCLUDED.payload,
         server_revision = EXCLUDED.server_revision,
         updated_at = NOW()`,
      [accountId, input.schemaVersion, JSON.stringify(input.payload), serverRevision]
    );

    return {
      prefsRevision: serverRevision,
      globalRevision: Number(nextState.global_revision),
      historyRevision: Number(nextState.history_revision)
    };
  });
}

/**
 * @param {string} accountId
 * @param {{ schemaVersion: number, payload: object }} input
 */
export async function putLegacyStatsSeed(accountId, input) {
  return withTransaction(async (client) => {
    await lockAccountState(client, accountId);

    const existing = await client.query(
      `SELECT schema_version, payload FROM sync_legacy_stats_seed WHERE account_id = $1 FOR UPDATE`,
      [accountId]
    );

    if (existing.rowCount > 0) {
      const row = existing.rows[0];
      if (
        row.schema_version === input.schemaVersion &&
        stableEqualJson(row.payload, input.payload)
      ) {
        return { created: false, idempotent: true };
      }
      const err = new Error('immutable_seed_conflict');
      err.code = 'immutable_seed_conflict';
      err.status = 409;
      throw err;
    }

    await client.query(
      `INSERT INTO sync_legacy_stats_seed (account_id, schema_version, payload)
       VALUES ($1, $2, $3::jsonb)`,
      [accountId, input.schemaVersion, JSON.stringify(input.payload)]
    );
    return { created: true, idempotent: false };
  });
}

/**
 * @param {string} accountId
 */
export async function getSyncStatus(accountId) {
  const pool = getPool();
  const stateRes = await pool.query(
    `SELECT global_revision, history_revision, prefs_revision, updated_at
     FROM sync_account_state WHERE account_id = $1`,
    [accountId]
  );
  const seedRes = await pool.query(
    `SELECT 1 FROM sync_legacy_stats_seed WHERE account_id = $1`,
    [accountId]
  );

  const state = stateRes.rows[0];
  return {
    eligible: true,
    globalRevision: state ? Number(state.global_revision) : 0,
    historyRevision: state ? Number(state.history_revision) : 0,
    prefsRevision: state ? Number(state.prefs_revision) : 0,
    hasLegacyStatsSeed: seedRes.rowCount > 0,
    updatedAt: state?.updated_at ? new Date(state.updated_at).toISOString() : null
  };
}

/**
 * @param {string} accountId
 * @param {{ sinceHistoryRevision?: number|null, sincePrefsRevision?: number|null }} [opts]
 */
export async function getSyncSnapshot(accountId, opts = {}) {
  const pool = getPool();
  const status = await getSyncStatus(accountId);

  const sinceHist =
    opts.sinceHistoryRevision != null && Number.isFinite(opts.sinceHistoryRevision)
      ? Number(opts.sinceHistoryRevision)
      : null;
  const sincePrefs =
    opts.sincePrefsRevision != null && Number.isFinite(opts.sincePrefsRevision)
      ? Number(opts.sincePrefsRevision)
      : null;

  let historySql = `
    SELECT match_id, idempotency_key, schema_version, payload, server_revision, created_at, updated_at
    FROM sync_match_history
    WHERE account_id = $1 AND deleted_at IS NULL`;
  const histParams = [accountId];
  if (sinceHist != null) {
    historySql += ` AND server_revision > $2`;
    histParams.push(sinceHist);
  }
  historySql += ` ORDER BY server_revision ASC, created_at ASC LIMIT $` + (histParams.length + 1);
  histParams.push(SYNC_HISTORY_MAX_RETAINED);

  const histRes = await pool.query(historySql, histParams);

  let prefs = null;
  let prefsChanged = true;
  if (sincePrefs != null && status.prefsRevision <= sincePrefs) {
    prefsChanged = false;
  } else {
    const prefsRes = await pool.query(
      `SELECT schema_version, payload, server_revision, updated_at
       FROM sync_prefs WHERE account_id = $1`,
      [accountId]
    );
    if (prefsRes.rowCount > 0) {
      const p = prefsRes.rows[0];
      prefs = {
        schemaVersion: p.schema_version,
        payload: p.payload,
        serverRevision: Number(p.server_revision),
        updatedAt: new Date(p.updated_at).toISOString()
      };
    }
  }

  const seedRes = await pool.query(
    `SELECT schema_version, payload, created_at
     FROM sync_legacy_stats_seed WHERE account_id = $1`,
    [accountId]
  );
  let legacyStatsSeed = null;
  if (seedRes.rowCount > 0) {
    const s = seedRes.rows[0];
    legacyStatsSeed = {
      schemaVersion: s.schema_version,
      payload: s.payload,
      createdAt: new Date(s.created_at).toISOString()
    };
  }

  return {
    eligible: true,
    globalRevision: status.globalRevision,
    historyRevision: status.historyRevision,
    prefsRevision: status.prefsRevision,
    updatedAt: status.updatedAt,
    prefs: prefsChanged ? prefs : undefined,
    prefsUnchanged: sincePrefs != null ? !prefsChanged : undefined,
    legacyStatsSeed,
    history: histRes.rows.map((r) => ({
      id: r.match_id,
      idempotencyKey: r.idempotency_key,
      schemaVersion: r.schema_version,
      payload: r.payload,
      serverRevision: Number(r.server_revision),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString()
    })),
    historyIncremental: sinceHist != null
  };
}
