/**
 * SYNC-01A/01C — clear all local sync-related metadata (not gameplay DATA).
 * Removes keys only — does not rewrite empty envelopes.
 *
 * Imports storage keys from the leaf module so authState can call this without
 * forming an init cycle through syncablePrefsRevision → syncEnqueue → authState.
 */
import {
  SYNC_META_KEY,
  SYNCABLE_PREFS_META_KEY,
  LEGACY_STATS_SEED_KEY,
  SYNC_OUTBOX_KEY,
  FIRST_LINK_SESSION_KEY,
  ACCOUNT_SNAPSHOT_PREFIX
} from './syncStorageKeys';
import { clearAllOutbox } from './syncOutbox';
import { clearFirstLinkSession } from './syncFirstLinkSession';

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
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(ACCOUNT_SNAPSHOT_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  for (const key of [
    SYNC_META_KEY,
    SYNCABLE_PREFS_META_KEY,
    FIRST_LINK_SESSION_KEY,
    LEGACY_STATS_SEED_KEY
  ]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  // Lazy: syncEngine may pull auth; only needed for in-memory engine cleanup.
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
