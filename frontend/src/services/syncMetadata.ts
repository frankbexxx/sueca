/**
 * SYNC-01A — local sync metadata (no network).
 *
 * Durable envelope key `sueca-sync-meta-v1`.
 * Never stores tokens, email, Google subject, or cloud payloads.
 */

import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import { SYNC_META_KEY } from './syncStorageKeys';

export { SYNC_META_KEY };

export const SYNC_META_SCHEMA_VERSION = 1;

export type SyncMetaV1 = {
  schemaVersion: typeof SYNC_META_SCHEMA_VERSION;
  /** Last Account successfully bound for sync on this device. Kept across logout. */
  syncBoundAccountId: string | null;
  /** Account id for which first-link resolution completed (prefs choice + initial bind). */
  firstLinkCompletedForAccountId: string | null;
  lastSyncedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncError: { code: string; message?: string; at: string } | null;
  /** Server revisions last observed (placeholders until SYNC-01B). */
  historyRevision: number | null;
  prefsRevision: number | null;
  /** Reserved for SYNC-01C outbox; empty in 01A. */
  pendingOutboxCount: number;
};

const emptyMeta = (): SyncMetaV1 => ({
  schemaVersion: SYNC_META_SCHEMA_VERSION,
  syncBoundAccountId: null,
  firstLinkCompletedForAccountId: null,
  lastSyncedAt: null,
  lastSuccessfulSyncAt: null,
  lastSyncError: null,
  historyRevision: null,
  prefsRevision: null,
  pendingOutboxCount: 0
});

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isSyncMeta(data: unknown): data is SyncMetaV1 {
  if (!data || typeof data !== 'object') return false;
  const m = data as Record<string, unknown>;
  if (m.schemaVersion !== SYNC_META_SCHEMA_VERSION) return false;
  if (m.syncBoundAccountId !== null && !isNonEmptyString(m.syncBoundAccountId)) return false;
  if (
    m.firstLinkCompletedForAccountId !== null &&
    !isNonEmptyString(m.firstLinkCompletedForAccountId)
  ) {
    return false;
  }
  return true;
}

function normalizeMeta(data: unknown): SyncMetaV1 {
  const base = emptyMeta();
  if (!data || typeof data !== 'object') return base;
  const m = data as Partial<SyncMetaV1>;
  return {
    ...base,
    syncBoundAccountId: isNonEmptyString(m.syncBoundAccountId) ? m.syncBoundAccountId : null,
    firstLinkCompletedForAccountId: isNonEmptyString(m.firstLinkCompletedForAccountId)
      ? m.firstLinkCompletedForAccountId
      : null,
    lastSyncedAt: typeof m.lastSyncedAt === 'string' ? m.lastSyncedAt : null,
    lastSuccessfulSyncAt:
      typeof m.lastSuccessfulSyncAt === 'string' ? m.lastSuccessfulSyncAt : null,
    lastSyncError:
      m.lastSyncError &&
      typeof m.lastSyncError === 'object' &&
      typeof (m.lastSyncError as { code?: unknown }).code === 'string'
        ? {
            code: String((m.lastSyncError as { code: string }).code),
            message:
              typeof (m.lastSyncError as { message?: unknown }).message === 'string'
                ? (m.lastSyncError as { message: string }).message
                : undefined,
            at:
              typeof (m.lastSyncError as { at?: unknown }).at === 'string'
                ? (m.lastSyncError as { at: string }).at
                : new Date().toISOString()
          }
        : null,
    historyRevision: typeof m.historyRevision === 'number' ? m.historyRevision : null,
    prefsRevision: typeof m.prefsRevision === 'number' ? m.prefsRevision : null,
    pendingOutboxCount:
      typeof m.pendingOutboxCount === 'number' && m.pendingOutboxCount >= 0
        ? Math.floor(m.pendingOutboxCount)
        : 0
  };
}

function persist(meta: SyncMetaV1): SyncMetaV1 {
  const next: SyncMetaV1 = { ...meta, schemaVersion: SYNC_META_SCHEMA_VERSION };
  writeDurableEnvelope(SYNC_META_KEY, next, DURABLE_SCHEMA_VERSION);
  return next;
}

export function getSyncMetadata(): SyncMetaV1 {
  const result = loadDurableJson<SyncMetaV1>({
    key: SYNC_META_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: emptyMeta(),
    validateData: (d): d is SyncMetaV1 =>
      isSyncMeta(d) || (d != null && typeof d === 'object'),
    migrateLegacy: (raw) => {
      if (!raw || typeof raw !== 'object') return null;
      return normalizeMeta(raw);
    }
  });
  return normalizeMeta(result.data);
}

export function writeSyncMetadata(patch: Partial<SyncMetaV1>): SyncMetaV1 {
  const current = getSyncMetadata();
  return persist(normalizeMeta({ ...current, ...patch }));
}

export function clearSyncBinding(): SyncMetaV1 {
  return persist(emptyMeta());
}

export function bindSyncToAccount(accountId: string): SyncMetaV1 {
  const id = accountId.trim();
  if (!id) throw new Error('accountId required');
  const current = getSyncMetadata();
  return persist({
    ...current,
    syncBoundAccountId: id
  });
}

export function isSyncBoundToAccount(accountId: string): boolean {
  const bound = getSyncMetadata().syncBoundAccountId;
  return Boolean(bound && bound === accountId.trim());
}

export type AssertCanSyncResult =
  | { ok: true }
  | { ok: false; reason: 'unbound' | 'account_mismatch' | 'missing_account' };

/**
 * Guard for future sync engine: refuse upload when bound to a different Account.
 * Unbound is ok:false 'unbound' — caller must run first-link before upload.
 */
export function assertCanSyncAccount(accountId: string | null | undefined): AssertCanSyncResult {
  if (!accountId || !String(accountId).trim()) {
    return { ok: false, reason: 'missing_account' };
  }
  const id = String(accountId).trim();
  const bound = getSyncMetadata().syncBoundAccountId;
  if (!bound) return { ok: false, reason: 'unbound' };
  if (bound !== id) return { ok: false, reason: 'account_mismatch' };
  return { ok: true };
}

export function markFirstLinkCompleted(accountId: string): SyncMetaV1 {
  const id = accountId.trim();
  const current = getSyncMetadata();
  return persist({
    ...current,
    syncBoundAccountId: id,
    firstLinkCompletedForAccountId: id
  });
}

export function markSyncSuccess(input: {
  accountId: string;
  historyRevision?: number | null;
  prefsRevision?: number | null;
}): SyncMetaV1 {
  const now = new Date().toISOString();
  const current = getSyncMetadata();
  return persist({
    ...current,
    syncBoundAccountId: input.accountId.trim(),
    lastSyncedAt: now,
    lastSuccessfulSyncAt: now,
    lastSyncError: null,
    historyRevision:
      input.historyRevision !== undefined ? input.historyRevision : current.historyRevision,
    prefsRevision: input.prefsRevision !== undefined ? input.prefsRevision : current.prefsRevision
  });
}

export function markSyncError(code: string, message?: string): SyncMetaV1 {
  const current = getSyncMetadata();
  return persist({
    ...current,
    lastSyncedAt: new Date().toISOString(),
    lastSyncError: { code, message, at: new Date().toISOString() }
  });
}

/** Test-only */
export function __resetSyncMetadataForTests(): void {
  try {
    localStorage.removeItem(SYNC_META_KEY);
  } catch {
    /* ignore */
  }
}
