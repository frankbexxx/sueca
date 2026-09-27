/**
 * SYNC-01A — local syncable-prefs mutation revision (meta only).
 * Kept separate from syncablePrefs.ts to avoid cycles with setupPreferences.
 */

import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';

export const SYNCABLE_PREFS_META_KEY = 'sueca-syncable-prefs-v1';

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

/** Increment local prefs mutation revision (not server authority). */
export function bumpSyncablePrefsRevision(): SyncablePrefsMetaV1 {
  const current = getSyncablePrefsMeta();
  return persistMeta({
    schemaVersion: 1,
    localPrefsRevision: current.localPrefsRevision + 1,
    localUpdatedAt: Date.now()
  });
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
