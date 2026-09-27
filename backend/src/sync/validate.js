/**
 * SYNC-01B — request validation helpers.
 */
import {
  SYNC_FORBIDDEN_PAYLOAD_KEYS,
  SYNC_HISTORY_BATCH_MAX,
  SYNC_HISTORY_PAYLOAD_MAX_BYTES,
  SYNC_IDEMPOTENCY_KEY_MAX_LEN,
  SYNC_MATCH_ID_MAX_LEN,
  SYNC_PREFS_PAYLOAD_MAX_BYTES,
  SYNC_SEED_PAYLOAD_MAX_BYTES
} from './constants.js';

export class SyncValidationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status]
   */
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function utf8Bytes(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SyncValidationError('invalid_payload', `${label} must be an object`);
  }
}

function rejectForbiddenKeys(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) {
      rejectForbiddenKeys(obj[i], `${path}[${i}]`);
    }
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (SYNC_FORBIDDEN_PAYLOAD_KEYS.has(k)) {
      throw new SyncValidationError(
        'invalid_payload',
        `Forbidden field ${path ? `${path}.` : ''}${k}`
      );
    }
    if (v && typeof v === 'object') {
      rejectForbiddenKeys(v, path ? `${path}.${k}` : k);
    }
  }
}

/**
 * Stable JSON compare for history payload equality (key-order independent).
 * @param {unknown} a
 * @param {unknown} b
 */
export function stableEqualJson(a, b) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  return value;
}

/**
 * @param {unknown} body
 * @returns {{ records: Array<{ id: string, idempotencyKey: string|null, schemaVersion: number, payload: object }> }}
 */
export function parseHistoryBatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SyncValidationError('invalid_payload', 'Body must be an object');
  }
  if ('accountId' in body) {
    throw new SyncValidationError('invalid_payload', 'accountId must not be supplied');
  }
  const records = body.records;
  if (!Array.isArray(records)) {
    throw new SyncValidationError('invalid_payload', 'records must be an array');
  }
  if (records.length === 0) {
    throw new SyncValidationError('invalid_payload', 'records must not be empty');
  }
  if (records.length > SYNC_HISTORY_BATCH_MAX) {
    throw new SyncValidationError(
      'batch_too_large',
      `Max ${SYNC_HISTORY_BATCH_MAX} records per batch`,
      413
    );
  }

  const seenIds = new Set();
  const seenIdem = new Set();
  const parsed = [];

  for (const raw of records) {
    assertPlainObject(raw, 'record');
    if ('accountId' in raw) {
      throw new SyncValidationError('invalid_payload', 'accountId must not be supplied');
    }
    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!id || id.length > SYNC_MATCH_ID_MAX_LEN) {
      throw new SyncValidationError(
        'invalid_payload',
        `match id must be 1–${SYNC_MATCH_ID_MAX_LEN} chars`
      );
    }
    // Accept UUID-style and legacy migrated-finished-* stable strings.
    if (seenIds.has(id)) {
      throw new SyncValidationError('invalid_payload', `Duplicate id in batch: ${id}`);
    }
    seenIds.add(id);

    let idempotencyKey = null;
    if (raw.idempotencyKey != null) {
      if (typeof raw.idempotencyKey !== 'string' || !raw.idempotencyKey.trim()) {
        throw new SyncValidationError('invalid_payload', 'idempotencyKey must be a non-empty string');
      }
      idempotencyKey = raw.idempotencyKey.trim().slice(0, SYNC_IDEMPOTENCY_KEY_MAX_LEN);
      if (seenIdem.has(idempotencyKey)) {
        throw new SyncValidationError(
          'invalid_payload',
          `Duplicate idempotencyKey in batch: ${idempotencyKey}`
        );
      }
      seenIdem.add(idempotencyKey);
    }

    const schemaVersion = raw.schemaVersion;
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
      throw new SyncValidationError('invalid_payload', 'schemaVersion must be a positive integer');
    }

    assertPlainObject(raw.payload, 'payload');
    rejectForbiddenKeys(raw.payload);
    if (utf8Bytes(raw.payload) > SYNC_HISTORY_PAYLOAD_MAX_BYTES) {
      throw new SyncValidationError(
        'payload_too_large',
        `Record payload exceeds ${SYNC_HISTORY_PAYLOAD_MAX_BYTES} bytes`,
        413
      );
    }

    parsed.push({
      id,
      idempotencyKey,
      schemaVersion,
      payload: raw.payload
    });
  }

  return { records: parsed };
}

/**
 * @param {unknown} body
 */
export function parsePrefsPut(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SyncValidationError('invalid_payload', 'Body must be an object');
  }
  if ('accountId' in body) {
    throw new SyncValidationError('invalid_payload', 'accountId must not be supplied');
  }
  const schemaVersion = body.schemaVersion;
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new SyncValidationError('invalid_payload', 'schemaVersion must be a positive integer');
  }

  // Initial create: baseRevision 0 or null. Updates: positive integer matching current.
  let baseRevision = body.baseRevision;
  if (baseRevision === null || baseRevision === undefined) {
    baseRevision = 0;
  }
  if (!Number.isInteger(baseRevision) || baseRevision < 0) {
    throw new SyncValidationError(
      'invalid_payload',
      'baseRevision must be a non-negative integer or null'
    );
  }

  assertPlainObject(body.payload, 'payload');
  rejectForbiddenKeys(body.payload);
  if (utf8Bytes(body.payload) > SYNC_PREFS_PAYLOAD_MAX_BYTES) {
    throw new SyncValidationError(
      'payload_too_large',
      `Prefs payload exceeds ${SYNC_PREFS_PAYLOAD_MAX_BYTES} bytes`,
      413
    );
  }

  // Soft whitelist: expected top-level keys from Class A document (allow subset + extras under data).
  const allowedTop = new Set(['setup', 'hand', 'dealingMethod', 'autoPauseTrick', 'activeTheme', 'data']);
  for (const key of Object.keys(body.payload)) {
    if (!allowedTop.has(key)) {
      throw new SyncValidationError(
        'invalid_payload',
        `Unexpected prefs field: ${key}`
      );
    }
  }

  return { schemaVersion, baseRevision, payload: body.payload };
}

/**
 * @param {unknown} body
 */
export function parseLegacySeedPut(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SyncValidationError('invalid_payload', 'Body must be an object');
  }
  if ('accountId' in body) {
    throw new SyncValidationError('invalid_payload', 'accountId must not be supplied');
  }
  const schemaVersion = body.schemaVersion;
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new SyncValidationError('invalid_payload', 'schemaVersion must be a positive integer');
  }
  assertPlainObject(body.payload, 'payload');
  rejectForbiddenKeys(body.payload);
  if (utf8Bytes(body.payload) > SYNC_SEED_PAYLOAD_MAX_BYTES) {
    throw new SyncValidationError(
      'payload_too_large',
      `Seed payload exceeds ${SYNC_SEED_PAYLOAD_MAX_BYTES} bytes`,
      413
    );
  }

  const metrics = body.payload.metrics ?? body.payload;
  assertPlainObject(metrics, 'metrics');
  for (const key of ['gamesPlayed', 'wins']) {
    if (!(key in metrics)) {
      throw new SyncValidationError('invalid_payload', `metrics.${key} required`);
    }
    const n = metrics[key];
    if (!Number.isInteger(n) || n < 0) {
      throw new SyncValidationError('invalid_payload', `metrics.${key} must be a non-negative integer`);
    }
  }
  if (metrics.byVariant != null) {
    assertPlainObject(metrics.byVariant, 'byVariant');
    for (const [variant, row] of Object.entries(metrics.byVariant)) {
      assertPlainObject(row, `byVariant.${variant}`);
      for (const k of ['played', 'wins']) {
        if (!(k in row)) continue;
        const n = row[k];
        if (!Number.isInteger(n) || n < 0) {
          throw new SyncValidationError(
            'invalid_payload',
            `byVariant.${variant}.${k} must be a non-negative integer`
          );
        }
      }
    }
  }

  return {
    schemaVersion,
    payload: {
      schemaVersion,
      metrics: {
        gamesPlayed: metrics.gamesPlayed,
        wins: metrics.wins,
        ...(metrics.byVariant ? { byVariant: metrics.byVariant } : {})
      }
    }
  };
}
