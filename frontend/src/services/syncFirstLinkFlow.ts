/**
 * SYNC-01D — first-link / account-switch execution (no Conta UI).
 *
 * History is never replaced — always merge + dedupe.
 * Prefs chooser only for BOTH_HAVE_DATA.
 * Account switch never uploads A→B.
 */

import { getAuthState } from './authState';
import {
  SyncApiError,
  syncGetSnapshot,
  syncGetStatus,
  syncPutLegacyStatsSeed,
  syncPutPrefs,
  type SyncSnapshotResponse,
  type SyncStatusResponse
} from './syncApiClient';
import {
  applyRemoteHistoryWires,
  applyRemoteSyncablePrefs
} from './syncApply';
import {
  clearVisibleClassAToDefaults,
  restoreAccountClassASnapshot,
  saveAccountClassASnapshot,
  writeMergedMatchHistory,
  loadAccountClassASnapshot
} from './syncAccountSnapshot';
import { resolveFirstLinkCase, type FirstLinkCase } from './syncFirstLinkResolver';
import {
  clearFirstLinkSession,
  loadFirstLinkSession,
  patchFirstLinkSession,
  startFirstLinkSession,
  type PrefsChoice
} from './syncFirstLinkSession';
import { mergeMatchHistoryForFirstLink } from './syncHistoryMerge';
import { loadLegacyStatsSeed, ensureLegacyStatsSeed, LEGACY_STATS_SEED_KEY } from './legacyStatsSeed';
import {
  DURABLE_SCHEMA_VERSION,
  writeDurableEnvelope
} from './durableLocalStorage';
import { loadMatchHistory, type MatchHistoryRecord } from './matchHistoryStorage';
import {
  bindSyncToAccount,
  clearSyncBinding,
  getSyncMetadata,
  markFirstLinkCompleted,
  writeSyncMetadata
} from './syncMetadata';
import { buildSyncablePrefsDocument } from './syncablePrefs';
import { syncNow } from './syncEngine';
import { stableEqualJson } from './syncJsonEqual';
import { isMatchHistoryRecord } from './matchHistoryStorage';

export type FirstLinkFlowResult =
  | { ok: true; case: FirstLinkCase; phase: string }
  | {
      ok: false;
      code:
        | 'auth_required'
        | 'needs_cloud_probe'
        | 'prefs_choice_required'
        | 'account_switch_required'
        | 'seed_mismatch'
        | 'history_conflict'
        | 'network'
        | 'stale_revision'
        | 'error';
      message?: string;
      case?: FirstLinkCase;
    };

type FetchFn = typeof fetch;

function wiresToRecords(snapshot: SyncSnapshotResponse): MatchHistoryRecord[] {
  const out: MatchHistoryRecord[] = [];
  for (const w of snapshot.history || []) {
    const payload = w.payload || {};
    const nested = (payload as { record?: unknown }).record;
    const candidate = (nested && typeof nested === 'object' ? nested : payload) as MatchHistoryRecord;
    const rec = {
      ...candidate,
      id: w.id,
      schemaVersion: (w.schemaVersion || 1) as 1,
      ...(w.idempotencyKey ? { idempotencyKey: w.idempotencyKey } : {})
    };
    if (isMatchHistoryRecord(rec)) out.push(rec);
  }
  return out;
}

function seedPayloadEqual(
  local: ReturnType<typeof loadLegacyStatsSeed>,
  cloud: SyncSnapshotResponse['legacyStatsSeed']
): boolean {
  if (!local && !cloud) return true;
  if (!local || !cloud) return false;
  const cloudMetrics =
    (cloud.payload as { metrics?: unknown })?.metrics ?? cloud.payload;
  return stableEqualJson(local.metrics, cloudMetrics);
}

async function probeCloud(fetchFn: FetchFn): Promise<{
  status: SyncStatusResponse;
  snapshot: SyncSnapshotResponse;
}> {
  const status = await syncGetStatus(fetchFn);
  const snapshot = await syncGetSnapshot({}, fetchFn);
  return { status, snapshot };
}

/**
 * Inspect current situation. May fetch cloud when needed (first-link Conta CTA).
 * Does not mutate. ACCOUNT_SWITCH / BOTH_HAVE_DATA return chooser-required codes.
 */
export async function inspectFirstLink(
  fetchFn: FetchFn = fetch
): Promise<FirstLinkFlowResult & { case?: FirstLinkCase }> {
  const auth = getAuthState();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'auth_required' };
  }

  const accountId = auth.accountId;
  const meta = getSyncMetadata();

  // Resume incomplete session for same Account.
  const session = loadFirstLinkSession();
  if (session && session.accountId === accountId && session.phase !== 'COMPLETE') {
    if (session.case === 'BOTH_HAVE_DATA' && !session.prefsChoice && session.phase === 'SNAPSHOT_FETCHED') {
      return { ok: false, code: 'prefs_choice_required', case: 'BOTH_HAVE_DATA' };
    }
    if (session.case === 'ACCOUNT_SWITCH' && session.phase === 'PENDING') {
      return { ok: false, code: 'account_switch_required', case: 'ACCOUNT_SWITCH' };
    }
  }

  let cloudStatus: SyncStatusResponse | null = null;
  let cloudSnapshot: SyncSnapshotResponse | null = null;
  let cloudKnown = false;

  const preliminary = resolveFirstLinkCase({
    authenticatedAccountId: accountId,
    cloudPresenceKnown: false
  });

  if (preliminary === 'SAME_ACCOUNT_RESUME') {
    return { ok: true, case: 'SAME_ACCOUNT_RESUME', phase: 'COMPLETE' };
  }
  if (preliminary === 'ACCOUNT_SWITCH') {
    const existing = loadFirstLinkSession();
    if (
      !existing ||
      existing.accountId !== accountId ||
      existing.case !== 'ACCOUNT_SWITCH'
    ) {
      startFirstLinkSession({
        accountId,
        case: 'ACCOUNT_SWITCH',
        previousBoundAccountId: meta.syncBoundAccountId
      });
    }
    return { ok: false, code: 'account_switch_required', case: 'ACCOUNT_SWITCH' };
  }

  try {
    const probed = await probeCloud(fetchFn);
    cloudStatus = probed.status;
    cloudSnapshot = probed.snapshot;
    cloudKnown = true;
  } catch (err) {
    if (err instanceof SyncApiError && (err.code === 'network' || err.status === 0)) {
      return { ok: false, code: 'network', message: err.message };
    }
    throw err;
  }

  const resolved = resolveFirstLinkCase({
    authenticatedAccountId: accountId,
    cloudStatus,
    cloudSnapshot,
    cloudPresenceKnown: cloudKnown
  });

  if (resolved === 'BOTH_HAVE_DATA') {
    const existing = loadFirstLinkSession();
    if (
      !existing ||
      existing.accountId !== accountId ||
      existing.case !== 'BOTH_HAVE_DATA'
    ) {
      startFirstLinkSession({ accountId, case: 'BOTH_HAVE_DATA' });
    }
    patchFirstLinkSession({
      phase: 'SNAPSHOT_FETCHED',
      cloudHistoryRevision: cloudStatus?.historyRevision ?? 0,
      cloudPrefsRevision: cloudStatus?.prefsRevision ?? 0,
      cloudHasSeed: Boolean(cloudStatus?.hasLegacyStatsSeed)
    });
    const session = loadFirstLinkSession();
    if (session?.prefsChoice) {
      return { ok: true, case: 'BOTH_HAVE_DATA', phase: 'READY_TO_RUN' };
    }
    return { ok: false, code: 'prefs_choice_required', case: 'BOTH_HAVE_DATA' };
  }

  if (resolved === 'CLOUD_EMPTY_LOCAL_HAS_DATA' || resolved === 'CLOUD_HAS_DATA_LOCAL_EMPTY') {
    return { ok: true, case: resolved, phase: 'READY_TO_RUN' };
  }

  return { ok: true, case: resolved as FirstLinkCase, phase: 'READY_TO_RUN' };
}

async function resolveSeed(
  accountId: string,
  snapshot: SyncSnapshotResponse,
  status: SyncStatusResponse,
  fetchFn: FetchFn
): Promise<{ ok: true } | { ok: false; code: 'seed_mismatch' }> {
  const local = loadLegacyStatsSeed() || ensureLegacyStatsSeed();
  const cloudHas = status.hasLegacyStatsSeed;
  const cloudSeed = snapshot.legacyStatsSeed;

  if (seedMetricsNonZero(local) && !cloudHas) {
    await syncPutLegacyStatsSeed(
      {
        schemaVersion: local.schemaVersion,
        payload: { schemaVersion: local.schemaVersion, metrics: local.metrics }
      },
      fetchFn
    );
    return { ok: true };
  }
  if (!seedMetricsNonZero(local) && cloudHas && cloudSeed) {
    // Adopt cloud seed locally (write durable).
    writeDurableEnvelope(
      LEGACY_STATS_SEED_KEY,
      {
        schemaVersion: cloudSeed.schemaVersion,
        createdAt: cloudSeed.createdAt,
        metrics:
          (cloudSeed.payload as { metrics?: LegacyStatsSeedMetrics }).metrics ??
          cloudSeed.payload
      },
      DURABLE_SCHEMA_VERSION
    );
    return { ok: true };
  }
  if (seedMetricsNonZero(local) && cloudHas) {
    if (seedPayloadEqual(local, cloudSeed)) return { ok: true };
    return { ok: false, code: 'seed_mismatch' };
  }
  return { ok: true };
}

type LegacyStatsSeedMetrics = {
  gamesPlayed: number;
  wins: number;
  byVariant?: Record<string, { played: number; wins: number }>;
};

function seedMetricsNonZero(seed: ReturnType<typeof loadLegacyStatsSeed>): boolean {
  if (!seed?.metrics) return false;
  return seed.metrics.gamesPlayed > 0 || seed.metrics.wins > 0;
}

async function putLocalPrefs(fetchFn: FetchFn, baseRevision: number): Promise<number> {
  const doc = buildSyncablePrefsDocument();
  try {
    const res = await syncPutPrefs(
      {
        schemaVersion: doc.schemaVersion,
        baseRevision,
        payload: doc.data as unknown as Record<string, unknown>
      },
      fetchFn
    );
    return res.prefsRevision;
  } catch (err) {
    if (err instanceof SyncApiError && err.code === 'stale_revision') {
      // Keep user intent: re-read status and retry once with latest base.
      const status = await syncGetStatus(fetchFn);
      const res = await syncPutPrefs(
        {
          schemaVersion: doc.schemaVersion,
          baseRevision: status.prefsRevision,
          payload: doc.data as unknown as Record<string, unknown>
        },
        fetchFn
      );
      return res.prefsRevision;
    }
    throw err;
  }
}

/**
 * Run auto cases A/B or complete C after prefsChoice, or account-switch apply B.
 */
export async function completeFirstLink(input: {
  prefsChoice?: PrefsChoice;
  accountSwitchAction?: 'use_cloud_account' | 'stay_unsynced';
  fetchFn?: FetchFn;
}): Promise<FirstLinkFlowResult> {
  const fetchFn = input.fetchFn || fetch;
  const auth = getAuthState();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'auth_required' };
  }
  const accountId = auth.accountId;

  try {
    // Account switch path
    if (input.accountSwitchAction === 'stay_unsynced') {
      clearFirstLinkSession();
      return { ok: true, case: 'ACCOUNT_SWITCH', phase: 'UNRESOLVED' };
    }

    if (input.accountSwitchAction === 'use_cloud_account') {
      return await runAccountSwitchToCloud(accountId, fetchFn);
    }

    // Probe / resume
    const inspected = await inspectFirstLink(fetchFn);
    if (!inspected.ok && inspected.code === 'prefs_choice_required') {
      if (!input.prefsChoice) return inspected;
      return await runCaseC(accountId, input.prefsChoice, fetchFn);
    }
    if (!inspected.ok) return inspected;

    if (inspected.case === 'SAME_ACCOUNT_RESUME') {
      await syncNow('first_link_resume');
      clearFirstLinkSession();
      return { ok: true, case: 'SAME_ACCOUNT_RESUME', phase: 'COMPLETE' };
    }

    if (inspected.case === 'CLOUD_EMPTY_LOCAL_HAS_DATA') {
      return await runCaseA(accountId, fetchFn);
    }
    if (inspected.case === 'CLOUD_HAS_DATA_LOCAL_EMPTY') {
      return await runCaseB(accountId, fetchFn);
    }
    if (inspected.case === 'BOTH_HAVE_DATA') {
      const choice = input.prefsChoice ?? loadFirstLinkSession()?.prefsChoice ?? null;
      if (!choice) {
        return { ok: false, code: 'prefs_choice_required', case: 'BOTH_HAVE_DATA' };
      }
      return await runCaseC(accountId, choice, fetchFn);
    }

    return { ok: false, code: 'error', message: 'Unhandled first-link case' };
  } catch (err) {
    if (err instanceof SyncApiError) {
      if (err.code === 'unauthorized' || err.status === 401) {
        clearFirstLinkSession();
        clearSyncBinding();
        return { ok: false, code: 'auth_required', message: err.message };
      }
      if (err.code === 'network' || err.status === 0) {
        return { ok: false, code: 'network', message: err.message };
      }
      if (err.code === 'stale_revision') {
        return { ok: false, code: 'stale_revision', message: err.message };
      }
    }
    patchFirstLinkSession({
      phase: 'ERROR',
      lastErrorCode: err instanceof Error ? err.message : 'error'
    });
    return {
      ok: false,
      code: 'error',
      message: err instanceof Error ? err.message : 'first-link failed'
    };
  }
}

async function runCaseA(accountId: string, fetchFn: FetchFn): Promise<FirstLinkFlowResult> {
  startFirstLinkSession({ accountId, case: 'CLOUD_EMPTY_LOCAL_HAS_DATA' });
  const { status, snapshot } = await probeCloud(fetchFn);
  patchFirstLinkSession({
    phase: 'SNAPSHOT_FETCHED',
    cloudHistoryRevision: status.historyRevision,
    cloudPrefsRevision: status.prefsRevision,
    cloudHasSeed: status.hasLegacyStatsSeed
  });

  const seed = await resolveSeed(accountId, snapshot, status, fetchFn);
  if (!seed.ok) {
    patchFirstLinkSession({ phase: 'BLOCKED_SEED_MISMATCH' });
    return { ok: false, code: 'seed_mismatch', case: 'CLOUD_EMPTY_LOCAL_HAS_DATA' };
  }

  bindSyncToAccount(accountId);
  markFirstLinkCompleted(accountId);
  patchFirstLinkSession({ phase: 'BOUND' });

  const prefsRev = await putLocalPrefs(fetchFn, status.prefsRevision);
  writeSyncMetadata({
    historyRevision: status.historyRevision,
    prefsRevision: prefsRev
  });

  // History upload via normal engine outbox after mark complete.
  const syncResult = await syncNow('first_link_a');
  patchFirstLinkSession({ phase: 'COMPLETE' });
  clearFirstLinkSession();
  if (!syncResult.ok) {
    return {
      ok: false,
      code: syncResult.state === 'OFFLINE' ? 'network' : 'error',
      message: syncResult.reason,
      case: 'CLOUD_EMPTY_LOCAL_HAS_DATA'
    };
  }
  return {
    ok: true,
    case: 'CLOUD_EMPTY_LOCAL_HAS_DATA',
    phase: 'COMPLETE'
  };
}

async function runCaseB(accountId: string, fetchFn: FetchFn): Promise<FirstLinkFlowResult> {
  startFirstLinkSession({ accountId, case: 'CLOUD_HAS_DATA_LOCAL_EMPTY' });
  const { status, snapshot } = await probeCloud(fetchFn);
  patchFirstLinkSession({
    phase: 'SNAPSHOT_FETCHED',
    cloudHistoryRevision: status.historyRevision,
    cloudPrefsRevision: status.prefsRevision,
    cloudHasSeed: status.hasLegacyStatsSeed
  });

  // Apply cloud history + prefs (local was trivial).
  if (snapshot.history?.length) {
    const ok = applyRemoteHistoryWires(snapshot.history);
    if (!ok) return { ok: false, code: 'error', message: 'history apply failed' };
  }
  patchFirstLinkSession({ phase: 'HISTORY_MERGED' });

  if (snapshot.prefs?.payload) {
    applyRemoteSyncablePrefs(snapshot.prefs.payload);
  }
  patchFirstLinkSession({ phase: 'PREFS_RESOLVED' });

  const seed = await resolveSeed(accountId, snapshot, status, fetchFn);
  if (!seed.ok) {
    patchFirstLinkSession({ phase: 'BLOCKED_SEED_MISMATCH' });
    return { ok: false, code: 'seed_mismatch', case: 'CLOUD_HAS_DATA_LOCAL_EMPTY' };
  }

  bindSyncToAccount(accountId);
  markFirstLinkCompleted(accountId);
  writeSyncMetadata({
    historyRevision: snapshot.historyRevision,
    prefsRevision: snapshot.prefsRevision
  });
  patchFirstLinkSession({ phase: 'COMPLETE' });
  clearFirstLinkSession();
  await syncNow('first_link_b');
  return { ok: true, case: 'CLOUD_HAS_DATA_LOCAL_EMPTY', phase: 'COMPLETE' };
}

async function runCaseC(
  accountId: string,
  prefsChoice: PrefsChoice,
  fetchFn: FetchFn
): Promise<FirstLinkFlowResult> {
  let session = loadFirstLinkSession();
  if (!session || session.accountId !== accountId) {
    session = startFirstLinkSession({ accountId, case: 'BOTH_HAVE_DATA' });
  }
  patchFirstLinkSession({ prefsChoice, phase: 'SNAPSHOT_FETCHED' });

  const { status, snapshot } = await probeCloud(fetchFn);
  patchFirstLinkSession({
    cloudHistoryRevision: status.historyRevision,
    cloudPrefsRevision: status.prefsRevision,
    cloudHasSeed: status.hasLegacyStatsSeed
  });

  const remoteRecords = wiresToRecords(snapshot);
  const merge = mergeMatchHistoryForFirstLink(loadMatchHistory(), remoteRecords);
  if (merge.conflicts.length > 0) {
    patchFirstLinkSession({ phase: 'ERROR', lastErrorCode: 'history_conflict' });
    return { ok: false, code: 'history_conflict', case: 'BOTH_HAVE_DATA' };
  }
  if (!writeMergedMatchHistory(merge.merged)) {
    return { ok: false, code: 'error', message: 'history merge write failed' };
  }
  patchFirstLinkSession({ phase: 'HISTORY_MERGED' });

  if (prefsChoice === 'cloud') {
    if (snapshot.prefs?.payload) applyRemoteSyncablePrefs(snapshot.prefs.payload);
  }
  // device choice: keep local prefs
  patchFirstLinkSession({ phase: 'PREFS_RESOLVED' });

  const seed = await resolveSeed(accountId, snapshot, status, fetchFn);
  if (!seed.ok) {
    patchFirstLinkSession({ phase: 'BLOCKED_SEED_MISMATCH' });
    return { ok: false, code: 'seed_mismatch', case: 'BOTH_HAVE_DATA' };
  }

  bindSyncToAccount(accountId);
  markFirstLinkCompleted(accountId);
  patchFirstLinkSession({ phase: 'BOUND' });

  if (prefsChoice === 'device') {
    const prefsRev = await putLocalPrefs(fetchFn, status.prefsRevision);
    writeSyncMetadata({
      historyRevision: Math.max(status.historyRevision, merge.merged.length),
      prefsRevision: prefsRev
    });
  } else {
    writeSyncMetadata({
      historyRevision: snapshot.historyRevision,
      prefsRevision: snapshot.prefsRevision
    });
  }

  await syncNow('first_link_c');
  patchFirstLinkSession({ phase: 'COMPLETE' });
  clearFirstLinkSession();
  return { ok: true, case: 'BOTH_HAVE_DATA', phase: 'COMPLETE' };
}

/**
 * Account switch Option 1: snapshot A, apply B cloud, rebind to B.
 * Never uploads A-bound outbox to B.
 */
async function runAccountSwitchToCloud(
  accountId: string,
  fetchFn: FetchFn
): Promise<FirstLinkFlowResult> {
  const meta = getSyncMetadata();
  const previous = meta.syncBoundAccountId;
  if (!previous || previous === accountId) {
    return { ok: false, code: 'error', message: 'Not an account switch' };
  }

  startFirstLinkSession({
    accountId,
    case: 'ACCOUNT_SWITCH',
    previousBoundAccountId: previous
  });

  // HARD GATE: snapshot A's current Class A before replacing visible local state.
  saveAccountClassASnapshot(previous, {
    historyRevision: meta.historyRevision,
    prefsRevision: meta.prefsRevision
  });

  const { status, snapshot } = await probeCloud(fetchFn);
  patchFirstLinkSession({
    phase: 'SNAPSHOT_FETCHED',
    cloudHistoryRevision: status.historyRevision,
    cloudPrefsRevision: status.prefsRevision,
    cloudHasSeed: status.hasLegacyStatsSeed
  });

  // Prefer restoring B's prior device snapshot if present; else apply cloud.
  const existingB = loadAccountClassASnapshot(accountId);
  if (existingB) {
    restoreAccountClassASnapshot(existingB);
  } else {
    clearVisibleClassAToDefaults();
    if (snapshot.history?.length) applyRemoteHistoryWires(snapshot.history);
    if (snapshot.prefs?.payload) applyRemoteSyncablePrefs(snapshot.prefs.payload);
  }
  patchFirstLinkSession({ phase: 'HISTORY_MERGED' });
  patchFirstLinkSession({ phase: 'PREFS_RESOLVED' });

  const seed = await resolveSeed(accountId, snapshot, status, fetchFn);
  if (!seed.ok) {
    // Restore A snapshot to avoid leaving device in half-B state.
    const aSnap = loadAccountClassASnapshot(previous);
    if (aSnap) restoreAccountClassASnapshot(aSnap);
    patchFirstLinkSession({ phase: 'BLOCKED_SEED_MISMATCH' });
    return { ok: false, code: 'seed_mismatch', case: 'ACCOUNT_SWITCH' };
  }

  bindSyncToAccount(accountId);
  markFirstLinkCompleted(accountId);
  writeSyncMetadata({
    historyRevision: snapshot.historyRevision,
    prefsRevision: snapshot.prefsRevision,
    // Keep pendingOutboxCount; A items remain but won't upload under B.
  });
  patchFirstLinkSession({ phase: 'COMPLETE' });
  clearFirstLinkSession();
  await syncNow('account_switch_b');
  return { ok: true, case: 'ACCOUNT_SWITCH', phase: 'COMPLETE' };
}

/** Resume after crash if session incomplete. */
export async function resumeFirstLinkIfNeeded(
  fetchFn: FetchFn = fetch
): Promise<FirstLinkFlowResult | null> {
  const session = loadFirstLinkSession();
  if (!session || session.phase === 'COMPLETE') return null;
  const auth = getAuthState();
  if (auth.status !== 'authenticated' || auth.accountId !== session.accountId) {
    return null;
  }

  // Account-switch mid-flight: never auto-cross-upload. If already rebound+complete, just clear session.
  if (session.case === 'ACCOUNT_SWITCH') {
    const meta = getSyncMetadata();
    if (
      meta.syncBoundAccountId === session.accountId &&
      meta.firstLinkCompletedForAccountId === session.accountId
    ) {
      clearFirstLinkSession();
      return { ok: true, case: 'ACCOUNT_SWITCH', phase: 'COMPLETE' };
    }
    // Visible Class A may have been partially replaced — restore A snapshot when still A-bound.
    if (
      session.previousBoundAccountId &&
      meta.syncBoundAccountId === session.previousBoundAccountId
    ) {
      const aSnap = loadAccountClassASnapshot(session.previousBoundAccountId);
      if (aSnap) restoreAccountClassASnapshot(aSnap);
    }
    return { ok: false, code: 'account_switch_required', case: 'ACCOUNT_SWITCH' };
  }

  if (session.case === 'BOTH_HAVE_DATA' && session.prefsChoice) {
    return completeFirstLink({ prefsChoice: session.prefsChoice, fetchFn });
  }
  if (session.case === 'BOTH_HAVE_DATA' && !session.prefsChoice) {
    return { ok: false, code: 'prefs_choice_required', case: 'BOTH_HAVE_DATA' };
  }
  if (
    session.case === 'CLOUD_EMPTY_LOCAL_HAS_DATA' ||
    session.case === 'CLOUD_HAS_DATA_LOCAL_EMPTY'
  ) {
    // Idempotent re-run: merge/upload paths dedupe by id.
    return completeFirstLink({ fetchFn });
  }
  if (session.phase === 'BLOCKED_SEED_MISMATCH') {
    return { ok: false, code: 'seed_mismatch', case: session.case ?? undefined };
  }
  return null;
}
