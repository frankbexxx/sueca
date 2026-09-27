/**
 * SYNC-01B — limits and shared constants.
 */

export const SYNC_HISTORY_MAX_RETAINED = 2000;
export const SYNC_HISTORY_BATCH_MAX = 100;
export const SYNC_HISTORY_PAYLOAD_MAX_BYTES = 8 * 1024;
export const SYNC_PREFS_PAYLOAD_MAX_BYTES = 16 * 1024;
export const SYNC_SEED_PAYLOAD_MAX_BYTES = 4 * 1024;
export const SYNC_MATCH_ID_MAX_LEN = 128;
export const SYNC_IDEMPOTENCY_KEY_MAX_LEN = 128;

/** Forbidden keys anywhere in prefs/seed payloads (defense in depth). */
export const SYNC_FORBIDDEN_PAYLOAD_KEYS = new Set([
  'accessToken',
  'refreshToken',
  'token',
  'idToken',
  'password',
  'authorization',
  'accountId',
  'linkedAccountId',
  'localGuestId',
  'googleSubject',
  'providerSubject'
]);
