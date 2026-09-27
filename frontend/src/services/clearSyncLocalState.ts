/**
 * SYNC-01A/01C — clear all local sync-related metadata (not gameplay DATA).
 * Removes keys only — does not rewrite empty envelopes.
 */
import { LEGACY_STATS_SEED_KEY, clearLegacyStatsSeed } from './legacyStatsSeed';
import { SYNC_META_KEY } from './syncMetadata';
import { SYNCABLE_PREFS_META_KEY } from './syncablePrefsRevision';
import { SYNC_OUTBOX_KEY, clearAllOutbox } from './syncOutbox';

export function clearAllSyncLocalState(): void {
  try {
    clearAllOutbox();
  } catch {
    try {
      localStorage.removeItem(SYNC_OUTBOX_KEY);
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(SYNC_META_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(SYNCABLE_PREFS_META_KEY);
  } catch {
    /* ignore */
  }
  clearLegacyStatsSeed();
  try {
    void import('./syncEngine').then((m) => m.onLocalWipeSyncCleanup());
  } catch {
    /* ignore */
  }
}

export { SYNC_META_KEY, SYNCABLE_PREFS_META_KEY, LEGACY_STATS_SEED_KEY, SYNC_OUTBOX_KEY };
