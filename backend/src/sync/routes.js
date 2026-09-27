/**
 * SYNC-01B — Account sync HTTP API (no client activation).
 *
 * Mounted at /sync/*
 * Account ownership always from Bearer JWT — never from body.
 */
import { Router } from 'express';
import { createRequireAccountAuth } from '../auth/middleware.js';
import { isDbConfigured, getPool } from '../db/pool.js';
import { createRateLimiter } from '../auth/rateLimit.js';
import {
  appendHistoryBatch,
  getSyncSnapshot,
  getSyncStatus,
  putLegacyStatsSeed,
  putPrefs
} from './repo.js';
import {
  SyncValidationError,
  parseHistoryBatch,
  parseLegacySeedPut,
  parsePrefsPut
} from './validate.js';

function requireDb(res) {
  if (!isDbConfigured() || !getPool()) {
    res.status(503).json({ error: 'Sync unavailable', code: 'db_unavailable' });
    return false;
  }
  return true;
}

function sendError(res, err) {
  if (err instanceof SyncValidationError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err?.code === 'stale_revision') {
    return res.status(409).json({
      error: 'Stale prefs revision',
      code: 'stale_revision',
      currentRevision: err.currentRevision
    });
  }
  if (err?.code === 'immutable_seed_conflict') {
    return res.status(409).json({
      error: 'Legacy stats seed is immutable',
      code: 'immutable_seed_conflict'
    });
  }
  console.error('[sync]', err);
  return res.status(500).json({ error: 'Internal error', code: 'internal_error' });
}

/**
 * @param {ReturnType<typeof import('../config.js').loadConfig>} config
 */
export function createSyncRouter(config) {
  const router = Router();
  const requireAccountAuth = createRequireAccountAuth(config);

  const writeLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: 'sync-write' });
  const readLimit = createRateLimiter({ windowMs: 60_000, max: 120, name: 'sync-read' });

  router.get('/status', readLimit, requireAccountAuth, async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const status = await getSyncStatus(req.account.id);
      return res.json(status);
    } catch (err) {
      return sendError(res, err);
    }
  });

  router.get('/snapshot', readLimit, requireAccountAuth, async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const sinceHistoryRevision =
        req.query.sinceHistoryRevision != null
          ? Number(req.query.sinceHistoryRevision)
          : null;
      const sincePrefsRevision =
        req.query.sincePrefsRevision != null ? Number(req.query.sincePrefsRevision) : null;

      if (
        sinceHistoryRevision != null &&
        (!Number.isInteger(sinceHistoryRevision) || sinceHistoryRevision < 0)
      ) {
        return res.status(400).json({
          error: 'sinceHistoryRevision must be a non-negative integer',
          code: 'invalid_payload'
        });
      }
      if (
        sincePrefsRevision != null &&
        (!Number.isInteger(sincePrefsRevision) || sincePrefsRevision < 0)
      ) {
        return res.status(400).json({
          error: 'sincePrefsRevision must be a non-negative integer',
          code: 'invalid_payload'
        });
      }

      const snapshot = await getSyncSnapshot(req.account.id, {
        sinceHistoryRevision,
        sincePrefsRevision
      });
      return res.json(snapshot);
    } catch (err) {
      return sendError(res, err);
    }
  });

  router.post('/history', writeLimit, requireAccountAuth, async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const { records } = parseHistoryBatch(req.body);
      const result = await appendHistoryBatch(req.account.id, records);
      const status =
        result.conflicts.length > 0 && result.accepted.length === 0 && result.deduped.length === 0
          ? 409
          : 200;
      return res.status(status).json({
        accepted: result.accepted,
        deduped: result.deduped,
        conflicts: result.conflicts,
        historyRevision: result.historyRevision,
        prefsRevision: result.prefsRevision,
        globalRevision: result.globalRevision
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  router.put('/prefs', writeLimit, requireAccountAuth, async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const input = parsePrefsPut(req.body);
      const result = await putPrefs(req.account.id, input);
      return res.json({
        ok: true,
        prefsRevision: result.prefsRevision,
        historyRevision: result.historyRevision,
        globalRevision: result.globalRevision
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  router.put('/legacy-stats-seed', writeLimit, requireAccountAuth, async (req, res) => {
    if (!requireDb(res)) return;
    try {
      const input = parseLegacySeedPut(req.body);
      const result = await putLegacyStatsSeed(req.account.id, input);
      return res.json({
        ok: true,
        created: result.created,
        idempotent: result.idempotent
      });
    } catch (err) {
      return sendError(res, err);
    }
  });

  return router;
}
