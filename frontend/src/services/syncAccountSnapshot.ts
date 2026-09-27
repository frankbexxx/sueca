/**
 * SYNC-01D — account-scoped Class A snapshots.
 *
 * HARD GATE: Class A local storage is device-global. Before applying another
 * Account’s cloud view, we snapshot the previous bound Account’s Class A data
 * so it is not silently destroyed. Outbox items remain account-bound separately.
 *
 * Key: sueca-sync-account-snapshot-v1:<accountId>
 */

import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import { loadLegacyStatsSeed, type LegacyStatsSeedV1, clearLegacyStatsSeed, LEGACY_STATS_SEED_KEY } from './legacyStatsSeed';
import {
  loadMatchHistory,
  MATCH_HISTORY_KEY,
  MAX_MATCH_HISTORY,
  type MatchHistoryRecord
} from './matchHistoryStorage';
import { buildSyncablePrefsDocument, type SyncablePrefsDocumentV1 } from './syncablePrefs';
import { applyRemoteSyncablePrefs } from './syncApply';
import { runWithoutSyncEnqueue } from './syncablePrefsRevision';
import { SETUP_PREFS_KEY } from './setupPreferences';
import { ACCOUNT_SNAPSHOT_PREFIX } from './syncStorageKeys';

export function accountSnapshotKey(accountId: string): string {
  return `${ACCOUNT_SNAPSHOT_PREFIX}${accountId.trim()}`;
}

export type AccountClassASnapshotV1 = {
  schemaVersion: 1;
  accountId: string;
  savedAt: string;
  history: MatchHistoryRecord[];
  prefsDocument: SyncablePrefsDocumentV1;
  legacyStatsSeed: LegacyStatsSeedV1 | null;
  historyRevision: number | null;
  prefsRevision: number | null;
};

function isSnapshot(data: unknown): data is AccountClassASnapshotV1 {
  if (!data || typeof data !== 'object') return false;
  const s = data as AccountClassASnapshotV1;
  return (
    s.schemaVersion === 1 &&
    typeof s.accountId === 'string' &&
    Array.isArray(s.history) &&
    s.prefsDocument != null
  );
}

/** Persist current device Class A view under accountId (overwrite prior snapshot). */
export function saveAccountClassASnapshot(
  accountId: string,
  revisions?: { historyRevision?: number | null; prefsRevision?: number | null }
): AccountClassASnapshotV1 {
  const id = accountId.trim();
  const snap: AccountClassASnapshotV1 = {
    schemaVersion: 1,
    accountId: id,
    savedAt: new Date().toISOString(),
    history: loadMatchHistory().slice(0, MAX_MATCH_HISTORY),
    prefsDocument: buildSyncablePrefsDocument(),
    legacyStatsSeed: loadLegacyStatsSeed(),
    historyRevision: revisions?.historyRevision ?? null,
    prefsRevision: revisions?.prefsRevision ?? null
  };
  writeDurableEnvelope(accountSnapshotKey(id), snap, DURABLE_SCHEMA_VERSION);
  return snap;
}

export function loadAccountClassASnapshot(accountId: string): AccountClassASnapshotV1 | null {
  const result = loadDurableJson<AccountClassASnapshotV1 | null>({
    key: accountSnapshotKey(accountId),
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: null,
    validateData: (d): d is AccountClassASnapshotV1 | null => d === null || isSnapshot(d),
    migrateLegacy: (raw) => (isSnapshot(raw) ? raw : null)
  });
  return result.data && isSnapshot(result.data) ? result.data : null;
}

/** Replace visible device Class A with a snapshot (no outbox enqueue). */
export function restoreAccountClassASnapshot(snap: AccountClassASnapshotV1): boolean {
  const wrote = writeDurableEnvelope(
    MATCH_HISTORY_KEY,
    { records: snap.history.slice(0, MAX_MATCH_HISTORY), legacyFinishedMigrated: true },
    DURABLE_SCHEMA_VERSION
  );
  if (!wrote) return false;

  runWithoutSyncEnqueue(() => {
    applyRemoteSyncablePrefs(snap.prefsDocument.data as unknown as Record<string, unknown>);
  });

  if (snap.legacyStatsSeed) {
    writeDurableEnvelope(LEGACY_STATS_SEED_KEY, snap.legacyStatsSeed, DURABLE_SCHEMA_VERSION);
  } else {
    clearLegacyStatsSeed();
  }
  return true;
}

export function clearAccountClassASnapshot(accountId: string): void {
  try {
    localStorage.removeItem(accountSnapshotKey(accountId));
  } catch {
    /* ignore */
  }
}

/** Replace local history store with provided records (first-link merge write). */
export function writeMergedMatchHistory(records: MatchHistoryRecord[]): boolean {
  return writeDurableEnvelope(
    MATCH_HISTORY_KEY,
    { records: records.slice(0, MAX_MATCH_HISTORY), legacyFinishedMigrated: true },
    DURABLE_SCHEMA_VERSION
  );
}

export function clearVisibleClassAToDefaults(): void {
  writeDurableEnvelope(
    MATCH_HISTORY_KEY,
    { records: [], legacyFinishedMigrated: true },
    DURABLE_SCHEMA_VERSION
  );
  clearLegacyStatsSeed();
  try {
    localStorage.removeItem(SETUP_PREFS_KEY);
  } catch {
    /* ignore */
  }
}
