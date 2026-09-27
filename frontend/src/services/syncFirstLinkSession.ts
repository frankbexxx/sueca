/**
 * SYNC-01D — durable first-link session (crash recovery).
 * Key: sueca-sync-first-link-v1
 *
 * Does not store full cloud payloads (re-fetch on resume).
 */

import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import type { FirstLinkCase } from './syncFirstLinkResolver';
import { FIRST_LINK_SESSION_KEY } from './syncStorageKeys';

export { FIRST_LINK_SESSION_KEY };

export type FirstLinkPhase =
  | 'PENDING'
  | 'SNAPSHOT_FETCHED'
  | 'HISTORY_MERGED'
  | 'PREFS_RESOLVED'
  | 'BOUND'
  | 'COMPLETE'
  | 'BLOCKED_SEED_MISMATCH'
  | 'ERROR';

export type PrefsChoice = 'device' | 'cloud';

export type FirstLinkSessionV1 = {
  schemaVersion: 1;
  accountId: string;
  case: FirstLinkCase | null;
  phase: FirstLinkPhase;
  prefsChoice: PrefsChoice | null;
  /** Prior bound Account when ACCOUNT_SWITCH. */
  previousBoundAccountId: string | null;
  cloudHistoryRevision: number | null;
  cloudPrefsRevision: number | null;
  cloudHasSeed: boolean;
  lastErrorCode: string | null;
  updatedAt: string;
};

const empty = (): FirstLinkSessionV1 | null => null;

function isSession(data: unknown): data is FirstLinkSessionV1 {
  if (!data || typeof data !== 'object') return false;
  const s = data as FirstLinkSessionV1;
  return (
    s.schemaVersion === 1 &&
    typeof s.accountId === 'string' &&
    typeof s.phase === 'string' &&
    typeof s.updatedAt === 'string'
  );
}

export function loadFirstLinkSession(): FirstLinkSessionV1 | null {
  const result = loadDurableJson<FirstLinkSessionV1 | null>({
    key: FIRST_LINK_SESSION_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: empty(),
    validateData: (d): d is FirstLinkSessionV1 | null => d === null || isSession(d),
    migrateLegacy: (raw) => (isSession(raw) ? raw : null)
  });
  return result.data && isSession(result.data) ? result.data : null;
}

export function writeFirstLinkSession(session: FirstLinkSessionV1): FirstLinkSessionV1 {
  const next = { ...session, updatedAt: new Date().toISOString(), schemaVersion: 1 as const };
  writeDurableEnvelope(FIRST_LINK_SESSION_KEY, next, DURABLE_SCHEMA_VERSION);
  return next;
}

export function startFirstLinkSession(input: {
  accountId: string;
  case: FirstLinkCase;
  previousBoundAccountId?: string | null;
}): FirstLinkSessionV1 {
  return writeFirstLinkSession({
    schemaVersion: 1,
    accountId: input.accountId.trim(),
    case: input.case,
    phase: 'PENDING',
    prefsChoice: null,
    previousBoundAccountId: input.previousBoundAccountId ?? null,
    cloudHistoryRevision: null,
    cloudPrefsRevision: null,
    cloudHasSeed: false,
    lastErrorCode: null,
    updatedAt: new Date().toISOString()
  });
}

export function patchFirstLinkSession(
  patch: Partial<FirstLinkSessionV1>
): FirstLinkSessionV1 | null {
  const cur = loadFirstLinkSession();
  if (!cur) return null;
  return writeFirstLinkSession({ ...cur, ...patch });
}

export function clearFirstLinkSession(): void {
  try {
    localStorage.removeItem(FIRST_LINK_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Test-only */
export function __resetFirstLinkSessionForTests(): void {
  clearFirstLinkSession();
}
