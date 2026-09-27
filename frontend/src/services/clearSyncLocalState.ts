/**
 * SYNC-01A — clear all local sync-related metadata (not gameplay DATA).
 * Removes keys only — does not rewrite empty envelopes.
 */
import { LEGACY_STATS_SEED_KEY, clearLegacyStatsSeed } from './legacyStatsSeed';
import { SYNC_META_KEY } from './syncMetadata';
import { SYNCABLE_PREFS_META_KEY } from './syncablePrefsRevision';

export function clearAllSyncLocalState(): void {
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
}

export { SYNC_META_KEY, SYNCABLE_PREFS_META_KEY, LEGACY_STATS_SEED_KEY };
