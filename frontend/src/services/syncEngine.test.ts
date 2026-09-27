/**
 * @vitest-environment jsdom
 * SYNC-01C — outbox + sync engine focused tests
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetAuthStateForTests,
  getAuthState,
  signInWithGoogleCredential,
  signOut
} from './authState';
import { __resetAuthSessionStorageForTests } from './authSessionStorage';
import { __resetLocalGuestCacheForTests } from './localGuestIdentity';
import { setAuthPlatformForTests } from '../platform/authPlatform';
import { createGoogleSignInNonce } from './googleWebSignIn';
import { getMatchById, recordMatchHistory } from './matchHistoryStorage';
import { persistSetupPrefs, loadSetupPrefs } from './setupPreferences';
import {
  __resetSyncMetadataForTests,
  assertCanSyncAccount,
  getSyncMetadata,
  markFirstLinkCompleted,
  bindSyncToAccount
} from './syncMetadata';
import {
  __resetSyncOutboxForTests,
  clearAllOutbox,
  enqueueHistoryMatch,
  listOutboxItems,
  loadSyncOutbox,
  SYNC_OUTBOX_KEY
} from './syncOutbox';
import {
  __resetSyncEngineForTests,
  __setSyncEngineFetchForTests,
  getSyncEngineState,
  onMatchHistoryRecorded,
  resumeSyncEngine,
  scheduleSync,
  stopSyncEngine,
  syncNow
} from './syncEngine';
import { __resetSyncablePrefsMetaForTests, getLocalPrefsRevision } from './syncablePrefsRevision';
import { clearLocalUserData, LOCAL_USER_DATA_KEYS } from './clearLocalUserData';
import { clearAllSyncLocalState } from './clearSyncLocalState';
import { ensureLegacyStatsSeed, __resetLegacyStatsSeedForTests } from './legacyStatsSeed';

function initMethod(init?: RequestInit): string {
  return init?.method || 'GET';
}

function mockSession(accountId: string) {
  return {
    account: { id: accountId, displayName: 'Sync', status: 'active' },
    accessToken: `access-${accountId}`,
    refreshToken: `refresh-${accountId}`,
    linkResult: 'created' as const
  };
}

async function signInAs(accountId: string) {
  process.env.VITE_GOOGLE_WEB_CLIENT_ID = 'web-client';
  process.env.VITE_AUTH_API_BASE_URL = 'http://auth.test';
  // Keep existing sync fetch mock if set; layer auth routes.
  const prev = globalThis.fetch;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes('/auth/google/id-token')) {
      return new Response(JSON.stringify(mockSession(accountId)), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/auth/logout')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (typeof prev === 'function' && !url.includes('/auth/')) {
      return prev(input as RequestInfo, init);
    }
    return new Response('{}', { status: 404 });
  });
  await signInWithGoogleCredential({
    idToken: 'tok',
    nonce: createGoogleSignInNonce()
  });
}

function historyRec(id: string) {
  return recordMatchHistory({
    id,
    gameVariant: 'sueca',
    rulesPresetId: 'sueca-pt-normal',
    players: [],
    finalScores: { team1: 60, team2: 60 },
    summary: 's',
    playerWon: true,
    idempotencyKey: `idem-${id}`
  });
}

describe('SYNC-01C outbox + engine', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetSyncMetadataForTests();
    __resetSyncOutboxForTests();
    __resetSyncEngineForTests();
    __resetSyncablePrefsMetaForTests();
    __resetLegacyStatsSeedForTests();
    __resetLocalGuestCacheForTests();
    __resetAuthSessionStorageForTests();
    __resetAuthStateForTests();
    setAuthPlatformForTests('web');
    delete process.env.VITE_GOOGLE_WEB_CLIENT_ID;
    delete process.env.VITE_AUTH_API_BASE_URL;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('guest: zero sync network calls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    __setSyncEngineFetchForTests(fetchMock as unknown as typeof fetch);
    historyRec('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'G' });
    const result = await syncNow('test');
    expect(result.state).toBe('AUTH_REQUIRED');
    expect(fetchMock.mock.calls.every((c) => !String(c[0]).includes('/sync/'))).toBe(true);
    expect(listOutboxItems()).toHaveLength(0);
  });

  it('first-link unresolved: zero push mutations', async () => {
    await signInAs('acc-a');
    bindSyncToAccount('acc-a'); // bound but first-link incomplete → BOUND_SAME_ACCOUNT
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/auth/')) {
        return new Response(JSON.stringify(mockSession('acc-a')), { status: 200 });
      }
      return new Response('{}', { status: 500 });
    });
    __setSyncEngineFetchForTests(fetchMock as unknown as typeof fetch);
    vi.stubGlobal('fetch', fetchMock);

    historyRec('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    const result = await syncNow();
    expect(result.state).toBe('FIRST_LINK_REQUIRED');
    expect(calls.some((u) => u.includes('/sync/'))).toBe(false);
    expect(listOutboxItems()).toHaveLength(0);
  });

  it('same account READY: sync runs pull+push', async () => {
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    const matchId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    historyRec(matchId);
    // Wait microtasks for enqueue
    await Promise.resolve();
    expect(listOutboxItems('acc-a').some((i) => i.payload.matchId === matchId)).toBe(true);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      if (url.includes('/auth/google/id-token')) {
        return new Response(JSON.stringify(mockSession('acc-a')), { status: 200 });
      }
      if (url.includes('/sync/status')) {
        return new Response(
          JSON.stringify({
            eligible: true,
            globalRevision: 0,
            historyRevision: 0,
            prefsRevision: 0,
            hasLegacyStatsSeed: false,
            updatedAt: null
          }),
          { status: 200 }
        );
      }
      if (url.includes('/sync/snapshot')) {
        return new Response(
          JSON.stringify({
            eligible: true,
            globalRevision: 0,
            historyRevision: 0,
            prefsRevision: 0,
            updatedAt: null,
            prefs: null,
            legacyStatsSeed: null,
            history: []
          }),
          { status: 200 }
        );
      }
      if (url.includes('/sync/history') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        return new Response(
          JSON.stringify({
            accepted: body.records.map((r: { id: string }) => r.id),
            deduped: [],
            conflicts: [],
            historyRevision: body.records.length,
            prefsRevision: 0,
            globalRevision: body.records.length
          }),
          { status: 200 }
        );
      }
      if (url.includes('/sync/prefs') && method === 'PUT') {
        return new Response(
          JSON.stringify({ ok: true, prefsRevision: 1, historyRevision: 1, globalRevision: 2 }),
          { status: 200 }
        );
      }
      if (url.includes('/sync/legacy-stats-seed')) {
        return new Response(JSON.stringify({ ok: true, created: true, idempotent: false }), {
          status: 200
        });
      }
      return new Response('{}', { status: 404 });
    });
    __setSyncEngineFetchForTests(fetchMock as unknown as typeof fetch);

    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'Ready' });
    await Promise.resolve();
    ensureLegacyStatsSeed();

    const result = await syncNow('manual');
    expect(result.ok).toBe(true);
    expect(getSyncEngineState()).toBe('IDLE');
    expect(listOutboxItems('acc-a')).toHaveLength(0);
    expect(getSyncMetadata().historyRevision).toBeGreaterThan(0);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/sync/history'))).toBe(true);
  });

  it('account switch: A outbox never uploads for B', async () => {
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    enqueueHistoryMatch('acc-a', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    await signOut();
    expect(listOutboxItems('acc-a')).toHaveLength(1);
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');

    await signInAs('acc-b');
    // Binding remains A across logout — B must not upload.
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');
    expect(assertCanSyncAccount('acc-b')).toEqual({ ok: false, reason: 'account_mismatch' });

    const syncUrls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/sync/')) syncUrls.push(`${initMethod(init)} ${url}`);
      return new Response('{}', { status: 500 });
    });
    __setSyncEngineFetchForTests(fetchMock as unknown as typeof fetch);

    stopSyncEngine();
    resumeSyncEngine();
    const result = await syncNow();
    expect(result.ok).toBe(false);
    expect(result.state).toBe('ACCOUNT_MISMATCH');
    expect(syncUrls.some((u) => u.includes('/sync/history') || u.includes('/sync/prefs'))).toBe(
      false
    );
    expect(listOutboxItems('acc-a')).toHaveLength(1);
  });

  it('prefs coalesce to one PUT_PREFS', async () => {
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'One' });
    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'Two' });
    persistSetupPrefs({ ...loadSetupPrefs(), p1Name: 'Three' });
    await Promise.resolve();
    const prefsItems = listOutboxItems('acc-a').filter((i) => i.operation === 'PUT_PREFS');
    expect(prefsItems).toHaveLength(1);
    expect(prefsItems[0].localRevision).toBe(getLocalPrefsRevision());
  });

  it('offline: local write succeeds, outbox retained, state OFFLINE', async () => {
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    const id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    historyRec(id);
    await Promise.resolve();

    const fetchMock = vi.fn(async () => {
      throw new TypeError('network down');
    });
    __setSyncEngineFetchForTests(fetchMock as unknown as typeof fetch);

    const result = await syncNow();
    expect(result.state).toBe('OFFLINE');
    expect(listOutboxItems('acc-a').length).toBeGreaterThan(0);
    expect(getMatchById(id)).toBeTruthy();
  });

  it('logout stops engine but keeps same-account outbox', async () => {
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    enqueueHistoryMatch('acc-a', 'ffffffff-ffff-4fff-8fff-ffffffffffff');
    stopSyncEngine();
    await signOut();
    expect(getAuthState().status).toBe('guest');
    expect(listOutboxItems('acc-a')).toHaveLength(1);
    expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');
  });

  it('local wipe clears outbox key', () => {
    enqueueHistoryMatch('acc-x', '11111111-1111-4111-8111-111111111111');
    expect(LOCAL_USER_DATA_KEYS).toContain(SYNC_OUTBOX_KEY);
    clearLocalUserData();
    expect(localStorage.getItem(SYNC_OUTBOX_KEY)).toBeNull();
    expect(loadSyncOutbox().items).toHaveLength(0);
  });

  it('clearAllSyncLocalState clears outbox', () => {
    enqueueHistoryMatch('acc-x', '12121212-1212-4121-8121-121212121212');
    clearAllSyncLocalState();
    expect(listOutboxItems()).toHaveLength(0);
  });

  it('legacy migrated-finished id can enqueue', async () => {
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    const legacy = 'migrated-finished-sueca-123';
    onMatchHistoryRecorded({
      id: legacy,
      schemaVersion: 1,
      completedAt: '2026-01-01T00:00:00.000Z',
      gameVariant: 'sueca',
      rulesPresetId: 'sueca-pt-normal',
      players: [],
      resultKind: 'unknown',
      finalScores: {},
      summary: 'legacy'
    });
    expect(listOutboxItems('acc-a')[0].payload.matchId).toBe(legacy);
  });

  it('scheduleSync is debounced (no polling)', async () => {
    vi.useFakeTimers();
    await signInAs('acc-a');
    markFirstLinkCompleted('acc-a');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/sync/status')) {
        return new Response(
          JSON.stringify({
            eligible: true,
            globalRevision: 0,
            historyRevision: 0,
            prefsRevision: 0,
            hasLegacyStatsSeed: true,
            updatedAt: null
          }),
          { status: 200 }
        );
      }
      if (url.includes('/sync/snapshot')) {
        return new Response(
          JSON.stringify({
            eligible: true,
            globalRevision: 0,
            historyRevision: 0,
            prefsRevision: 0,
            history: [],
            prefs: null,
            legacyStatsSeed: null
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });
    __setSyncEngineFetchForTests(fetchMock as unknown as typeof fetch);
    scheduleSync('a');
    scheduleSync('b');
    scheduleSync('c');
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1600);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/sync/status'))).toBe(true);
  });
});
