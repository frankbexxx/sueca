/**
 * SYNC-01A/01C — clear all local sync-related metadata (not gameplay DATA).
 * Removes keys only — does not rewrite empty envelopes.
 */
import { LEGACY_STATS_SEED_KEY, clearLegacyStatsSeed } from './legacyStatsSeed';
import { SYNC_META_KEY } from './syncMetadata';
import { SYNCABLE_PREFS_META_KEY } from './syncablePrefsRevision';
import { SYNC_OUTBOX_KEY, clearAllOutbox } from './syncOutbox';
import { FIRST_LINK_SESSION_KEY, clearFirstLinkSession } from './syncFirstLinkSession';

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
  clearFirstLinkSession();
  try {
    // Account Class A snapshots
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sueca-sync-account-snapshot-v1:')) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
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
  try {
    localStorage.removeItem(FIRST_LINK_SESSION_KEY);
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

export {
  SYNC_META_KEY,
  SYNCABLE_PREFS_META_KEY,
  LEGACY_STATS_SEED_KEY,
  SYNC_OUTBOX_KEY,
  FIRST_LINK_SESSION_KEY
};
