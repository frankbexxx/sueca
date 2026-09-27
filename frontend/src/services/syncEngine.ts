/**
 * SYNC-01C — client sync engine (offline-first, account-bound outbox).
 *
 * Network mutations only when READY_INCREMENTAL + assertCanSyncAccount.
 * First-link resolution is SYNC-01D — this engine never silently merges first-link.
 */

import { getAuthState } from './authState';
import {
  SyncApiError,
  syncGetSnapshot,
  syncGetStatus,
  syncPostHistory,
  syncPutLegacyStatsSeed,
  syncPutPrefs
} from './syncApiClient';
import {
  applyRemoteHistoryWires,
  applyRemoteSyncablePrefs,
  matchRecordToHistoryWire
} from './syncApply';
import { canUploadForAccount, deriveSyncLinkState } from './syncFirstLinkState';
import { loadLegacyStatsSeed } from './legacyStatsSeed';
import { getMatchById, type MatchHistoryRecord } from './matchHistoryStorage';
import {
  assertCanSyncAccount,
  getSyncMetadata,
  markSyncError,
  markSyncSuccess,
  writeSyncMetadata
} from './syncMetadata';
import {
  clearAllOutbox,
  clearOutboxForAccount,
  enqueueHistoryMatch,
  enqueueLegacySeed,
  enqueueOrCoalescePrefs,
  listOutboxItems,
  removeOutboxItems,
  updateOutboxItem,
  type SyncOutboxItem,
  __resetSyncOutboxForTests
} from './syncOutbox';
import { buildSyncablePrefsDocument } from './syncablePrefs';
import { getLocalPrefsRevision } from './syncablePrefsRevision';

export type SyncEngineState =
  | 'IDLE'
  | 'SYNCING'
  | 'OFFLINE'
  | 'AUTH_REQUIRED'
  | 'FIRST_LINK_REQUIRED'
  | 'ACCOUNT_MISMATCH'
  | 'ERROR';

export type SyncEngineListener = (state: SyncEngineState) => void;

const BACKOFF_MS = [60_000, 120_000, 300_000, 900_000, 1_800_000] as const;
const DEBOUNCE_MS = 1_500;
const HISTORY_BATCH = 100;

type FetchFn = typeof fetch;

let engineState: SyncEngineState = 'IDLE';
const listeners = new Set<SyncEngineListener>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<SyncNowResult> | null = null;
let stopped = false;
let fetchImpl: FetchFn = fetch;
let nowFn: () => number = () => Date.now();

export type SyncNowResult = {
  ok: boolean;
  state: SyncEngineState;
  reason?: string;
};

function setState(next: SyncEngineState): void {
  if (engineState === next) return;
  engineState = next;
  listeners.forEach((l) => {
    try {
      l(next);
    } catch {
      /* ignore */
    }
  });
}

export function getSyncEngineState(): SyncEngineState {
  return engineState;
}

export function subscribeSyncEngine(listener: SyncEngineListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function __setSyncEngineFetchForTests(fn: FetchFn): void {
  fetchImpl = fn;
}

export function __setSyncEngineNowForTests(fn: () => number): void {
  nowFn = fn;
}

export function __resetSyncEngineForTests(): void {
  stopped = false;
  syncInFlight = null;
  if (debounceTimer) clearTimeout(debounceTimer);
  if (retryTimer) clearTimeout(retryTimer);
  debounceTimer = null;
  retryTimer = null;
  fetchImpl = fetch;
  nowFn = () => Date.now();
  engineState = 'IDLE';
  __resetSyncOutboxForTests();
}

function currentAccountId(): string | null {
  const s = getAuthState();
  return s.status === 'authenticated' ? s.accountId : null;
}

function mapGuardState(accountId: string | null): SyncEngineState | null {
  if (!accountId) return 'AUTH_REQUIRED';
  const link = deriveSyncLinkState({ authenticatedAccountId: accountId });
  if (link === 'BOUND_DIFFERENT_ACCOUNT') return 'ACCOUNT_MISMATCH';
  if (link === 'FIRST_LINK_REQUIRED' || link === 'BOUND_SAME_ACCOUNT' || link === 'UNBOUND') {
    return 'FIRST_LINK_REQUIRED';
  }
  const guard = assertCanSyncAccount(accountId);
  if (!guard.ok) {
    if (guard.reason === 'account_mismatch') return 'ACCOUNT_MISMATCH';
    if (guard.reason === 'unbound' || guard.reason === 'missing_account') {
      return 'FIRST_LINK_REQUIRED';
    }
  }
  return null;
}

function clearTimers(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

/** Logout / teardown: cancel timers; keep outbox for same Account. */
export function stopSyncEngine(): void {
  stopped = true;
  clearTimers();
  if (engineState === 'SYNCING') setState('IDLE');
}

/** Resume after login (same device). */
export function resumeSyncEngine(): void {
  stopped = false;
}

function scheduleRetry(attemptCount: number): void {
  if (stopped) return;
  const idx = Math.min(Math.max(attemptCount, 0), BACKOFF_MS.length - 1);
  const delay = BACKOFF_MS[idx];
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void syncNow('retry');
  }, delay);
}

export function scheduleSync(_reason: string = 'debounce'): void {
  if (stopped) return;
  const accountId = currentAccountId();
  const blocked = mapGuardState(accountId);
  if (blocked) {
    setState(blocked);
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow('scheduled');
  }, DEBOUNCE_MS);
}

export function onMatchHistoryRecorded(record: MatchHistoryRecord): void {
  if (stopped) return;
  const accountId = currentAccountId();
  if (!accountId || !canUploadForAccount(accountId)) return;
  if (!assertCanSyncAccount(accountId).ok) return;
  enqueueHistoryMatch(accountId, record.id);
  scheduleSync('match');
}

export function onSyncablePrefsMutated(): void {
  if (stopped) return;
  const accountId = currentAccountId();
  if (!accountId || !canUploadForAccount(accountId)) return;
  if (!assertCanSyncAccount(accountId).ok) return;
  enqueueOrCoalescePrefs(accountId, getLocalPrefsRevision());
  scheduleSync('prefs');
}

/**
 * Authenticated app startup / resume — only when already READY_INCREMENTAL.
 * No first-link network probes (SYNC-01D).
 */
export function maybeSyncOnAuthenticatedStart(): void {
  resumeSyncEngine();
  const accountId = currentAccountId();
  const blocked = mapGuardState(accountId);
  if (blocked) {
    setState(blocked);
    return;
  }
  scheduleSync('startup');
}

export function maybeSyncOnResume(): void {
  maybeSyncOnAuthenticatedStart();
}

async function pullAndApply(accountId: string): Promise<void> {
  const meta = getSyncMetadata();
  const status = await syncGetStatus(fetchImpl);
  const sinceHist =
    meta.historyRevision != null && meta.historyRevision > 0 ? meta.historyRevision : null;
  const sincePrefs =
    meta.prefsRevision != null && meta.prefsRevision > 0 ? meta.prefsRevision : null;

  const snapshot = await syncGetSnapshot(
    { sinceHistoryRevision: sinceHist, sincePrefsRevision: sincePrefs },
    fetchImpl
  );

  // Validate response shape before mutating local stores.
  if (!Array.isArray(snapshot.history)) {
    throw new SyncApiError('Invalid snapshot history', 500, 'malformed');
  }

  if (snapshot.history.length > 0) {
    const ok = applyRemoteHistoryWires(snapshot.history);
    if (!ok) {
      throw new SyncApiError('Failed to apply history', 500, 'local_apply_failed');
    }
  }

  if (
    snapshot.prefs &&
    snapshot.prefsUnchanged !== true &&
    canUploadForAccount(accountId)
  ) {
    applyRemoteSyncablePrefs(snapshot.prefs.payload);
  }

  // Seed: never overwrite different local immutable seed; enqueue upload if local has and server lacks.
  const localSeed = loadLegacyStatsSeed();
  if (localSeed && !status.hasLegacyStatsSeed) {
    enqueueLegacySeed(accountId, {
      schemaVersion: localSeed.schemaVersion,
      metrics: localSeed.metrics
    });
  } else if (
    status.hasLegacyStatsSeed &&
    snapshot.legacyStatsSeed &&
    localSeed &&
    JSON.stringify(localSeed.metrics) !==
      JSON.stringify(
        (snapshot.legacyStatsSeed.payload as { metrics?: unknown }).metrics ??
          snapshot.legacyStatsSeed.payload
      )
  ) {
    // Surface for SYNC-01D — do not overwrite local.
    markSyncError('seed_conflict', 'Local and cloud legacyStatsSeed differ');
  }

  // Revisions updated LAST after successful apply.
  writeSyncMetadata({
    historyRevision: snapshot.historyRevision,
    prefsRevision: snapshot.prefsRevision
  });
}

async function pushSeed(accountId: string, items: SyncOutboxItem[]): Promise<void> {
  const seeds = items.filter((i) => i.operation === 'PUT_LEGACY_STATS_SEED');
  for (const item of seeds) {
    if (item.boundAccountId !== accountId) continue;
    try {
      await syncPutLegacyStatsSeed(
        {
          schemaVersion: Number(item.payload.schemaVersion) || 1,
          payload: item.payload as { schemaVersion: number; metrics: unknown } as Record<
            string,
            unknown
          >
        },
        fetchImpl
      );
      removeOutboxItems([item.id]);
    } catch (err) {
      if (err instanceof SyncApiError && err.code === 'immutable_seed_conflict') {
        markSyncError('immutable_seed_conflict', err.message);
        removeOutboxItems([item.id]);
        continue;
      }
      throw err;
    }
  }
}

async function pushHistory(accountId: string, items: SyncOutboxItem[]): Promise<void> {
  const histItems = items.filter((i) => i.operation === 'APPEND_MATCH');
  const wires: ReturnType<typeof matchRecordToHistoryWire>[] = [];
  const itemByMatch = new Map<string, SyncOutboxItem>();

  for (const item of histItems) {
    if (item.boundAccountId !== accountId) continue;
    const matchId = String(item.payload.matchId || '');
    const record = getMatchById(matchId);
    if (!record) {
      removeOutboxItems([item.id]);
      continue;
    }
    wires.push(matchRecordToHistoryWire(record));
    itemByMatch.set(record.id, item);
  }

  for (let i = 0; i < wires.length; i += HISTORY_BATCH) {
    const batch = wires.slice(i, i + HISTORY_BATCH);
    const result = await syncPostHistory(batch, fetchImpl);
    const done = new Set([...result.accepted, ...result.deduped]);
    const removeIds: string[] = [];
    for (const id of done) {
      const item = itemByMatch.get(id);
      if (item) removeIds.push(item.id);
    }
    removeOutboxItems(removeIds);

    if (result.conflicts?.length) {
      for (const c of result.conflicts) {
        const item = itemByMatch.get(c.id);
        if (item) {
          updateOutboxItem(item.id, {
            lastErrorCode: c.code || 'history_record_conflict',
            attemptCount: item.attemptCount + 1,
            nextAttemptAt: nowFn() + BACKOFF_MS[Math.min(item.attemptCount, BACKOFF_MS.length - 1)]
          });
        }
      }
      markSyncError('history_record_conflict', 'One or more history records conflicted');
    }

    writeSyncMetadata({ historyRevision: result.historyRevision });
  }
}

async function pushPrefs(accountId: string, items: SyncOutboxItem[]): Promise<void> {
  const prefsItem = items.find(
    (i) => i.operation === 'PUT_PREFS' && i.boundAccountId === accountId
  );
  if (!prefsItem) return;

  const doc = buildSyncablePrefsDocument();
  const baseRevision = getSyncMetadata().prefsRevision ?? 0;

  try {
    const result = await syncPutPrefs(
      {
        schemaVersion: doc.schemaVersion,
        baseRevision,
        payload: doc.data as unknown as Record<string, unknown>
      },
      fetchImpl
    );
    removeOutboxItems([prefsItem.id]);
    writeSyncMetadata({ prefsRevision: result.prefsRevision });
  } catch (err) {
    if (err instanceof SyncApiError && err.code === 'stale_revision') {
      // Pull latest; do not blind overwrite. Leave outbox for retry after pull.
      await pullAndApply(accountId);
      updateOutboxItem(prefsItem.id, {
        attemptCount: prefsItem.attemptCount + 1,
        nextAttemptAt: nowFn(),
        lastErrorCode: 'stale_revision'
      });
      markSyncError('stale_revision', 'Prefs baseRevision stale; pulled latest');
      return;
    }
    throw err;
  }
}

export async function syncNow(_reason: string = 'manual'): Promise<SyncNowResult> {
  if (stopped) {
    return { ok: false, state: engineState, reason: 'stopped' };
  }

  // Always evaluate guards before joining an in-flight run (account may have switched).
  const preAccountId = currentAccountId();
  const preBlocked = mapGuardState(preAccountId);
  if (preBlocked) {
    setState(preBlocked);
    return { ok: false, state: preBlocked, reason: preBlocked };
  }

  if (syncInFlight) return syncInFlight;

  const run = (async (): Promise<SyncNowResult> => {
    const accountId = currentAccountId();
    const blocked = mapGuardState(accountId);
    if (blocked) {
      setState(blocked);
      return { ok: false, state: blocked, reason: blocked };
    }
    if (!accountId || !canUploadForAccount(accountId)) {
      setState('FIRST_LINK_REQUIRED');
      return { ok: false, state: 'FIRST_LINK_REQUIRED' };
    }

    const guard = assertCanSyncAccount(accountId);
    if (!guard.ok) {
      const st =
        guard.reason === 'account_mismatch' ? 'ACCOUNT_MISMATCH' : 'FIRST_LINK_REQUIRED';
      setState(st);
      return { ok: false, state: st };
    }

    setState('SYNCING');
    try {
      // Drop any outbox items not bound to current Account (never send).
      const foreign = listOutboxItems().filter((i) => i.boundAccountId !== accountId);
      if (foreign.length) {
        // Leave foreign items intact but never process them.
      }

      await pullAndApply(accountId);

      const due = listOutboxItems(accountId).filter((i) => i.nextAttemptAt <= nowFn());
      // Push order: seed → history → prefs
      await pushSeed(accountId, due);
      await pushHistory(accountId, listOutboxItems(accountId));
      await pushPrefs(accountId, listOutboxItems(accountId));

      markSyncSuccess({
        accountId,
        historyRevision: getSyncMetadata().historyRevision,
        prefsRevision: getSyncMetadata().prefsRevision
      });
      setState('IDLE');
      return { ok: true, state: 'IDLE' };
    } catch (err) {
      if (err instanceof SyncApiError) {
        if (err.code === 'unauthorized' || err.status === 401) {
          setState('AUTH_REQUIRED');
          markSyncError('unauthorized', err.message);
          return { ok: false, state: 'AUTH_REQUIRED' };
        }
        if (err.code === 'network' || err.status === 0 || err.status === 503) {
          setState('OFFLINE');
          markSyncError(err.code || 'network', err.message);
          const pending = listOutboxItems(accountId);
          const attempts = pending.reduce((m, i) => Math.max(m, i.attemptCount), 0);
          for (const item of pending) {
            updateOutboxItem(item.id, {
              attemptCount: item.attemptCount + 1,
              nextAttemptAt:
                nowFn() + BACKOFF_MS[Math.min(item.attemptCount, BACKOFF_MS.length - 1)],
              lastErrorCode: err.code
            });
          }
          scheduleRetry(attempts + 1);
          return { ok: false, state: 'OFFLINE' };
        }
      }
      setState('ERROR');
      markSyncError('error', err instanceof Error ? err.message : 'sync failed');
      return { ok: false, state: 'ERROR' };
    } finally {
      syncInFlight = null;
    }
  })();

  syncInFlight = run;
  return run;
}

/** Account delete / wipe helpers used by auth + clear paths. */
export function onAccountDeletedSyncCleanup(accountId: string | null): void {
  stopSyncEngine();
  if (accountId) clearOutboxForAccount(accountId);
  else clearAllOutbox();
  setState('IDLE');
}

export function onLocalWipeSyncCleanup(): void {
  stopSyncEngine();
  clearAllOutbox();
  setState('IDLE');
}
