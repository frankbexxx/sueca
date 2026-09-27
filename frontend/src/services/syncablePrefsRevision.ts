/**
 * SYNC-01A — local syncable-prefs mutation revision (meta only).
 * Kept separate from syncablePrefs.ts to avoid cycles with setupPreferences.
 */

import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import { tryEnqueuePrefsAfterLocalMutation } from './syncEnqueue';
import { SYNCABLE_PREFS_META_KEY } from './syncStorageKeys';

export { SYNCABLE_PREFS_META_KEY };

export type SyncablePrefsMetaV1 = {
  schemaVersion: 1;
  /** Monotonic local counter — outbox / dirty detection only. */
  localPrefsRevision: number;
  localUpdatedAt: number;
};

const emptyMeta = (): SyncablePrefsMetaV1 => ({
  schemaVersion: 1,
  localPrefsRevision: 0,
  localUpdatedAt: 0
});

function isMeta(data: unknown): data is SyncablePrefsMetaV1 {
  if (!data || typeof data !== 'object') return false;
  const m = data as SyncablePrefsMetaV1;
  return (
    m.schemaVersion === 1 &&
    typeof m.localPrefsRevision === 'number' &&
    typeof m.localUpdatedAt === 'number'
  );
}

export function getSyncablePrefsMeta(): SyncablePrefsMetaV1 {
  const result = loadDurableJson<SyncablePrefsMetaV1>({
    key: SYNCABLE_PREFS_META_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: emptyMeta(),
    validateData: isMeta,
    migrateLegacy: (raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const m = raw as Partial<SyncablePrefsMetaV1>;
      if (typeof m.localPrefsRevision !== 'number') return null;
      return {
        schemaVersion: 1 as const,
        localPrefsRevision: Math.max(0, Math.floor(m.localPrefsRevision)),
        localUpdatedAt: typeof m.localUpdatedAt === 'number' ? m.localUpdatedAt : Date.now()
      };
    }
  });
  return isMeta(result.data) ? result.data : emptyMeta();
}

function persistMeta(meta: SyncablePrefsMetaV1): SyncablePrefsMetaV1 {
  writeDurableEnvelope(SYNCABLE_PREFS_META_KEY, meta, DURABLE_SCHEMA_VERSION);
  return meta;
}

/** When > 0, local prefs mutations must not enqueue sync outbox (remote apply). */
let syncEnqueueSuppressDepth = 0;

export function runWithoutSyncEnqueue<T>(fn: () => T): T {
  syncEnqueueSuppressDepth += 1;
  try {
    return fn();
  } finally {
    syncEnqueueSuppressDepth -= 1;
  }
}

export function isSyncEnqueueSuppressed(): boolean {
  return syncEnqueueSuppressDepth > 0;
}

/** Increment local prefs mutation revision (not cross-device authority). */
export function bumpSyncablePrefsRevision(): SyncablePrefsMetaV1 {
  // Remote snapshot apply suppresses both revision bumps and outbox enqueue.
  if (isSyncEnqueueSuppressed()) {
    return getSyncablePrefsMeta();
  }
  const current = getSyncablePrefsMeta();
  const next = persistMeta({
    schemaVersion: 1,
    localPrefsRevision: current.localPrefsRevision + 1,
    localUpdatedAt: Date.now()
  });
  tryEnqueuePrefsAfterLocalMutation(next.localPrefsRevision);
  return next;
}

export function getLocalPrefsRevision(): number {
  return getSyncablePrefsMeta().localPrefsRevision;
}

/** Test-only */
export function __resetSyncablePrefsMetaForTests(): void {
  try {
    localStorage.removeItem(SYNCABLE_PREFS_META_KEY);
  } catch {
    /* ignore */
  }
}
