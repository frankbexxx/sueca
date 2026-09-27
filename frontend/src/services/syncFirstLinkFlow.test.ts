/**
 * @vitest-environment jsdom
 * SYNC-01D — first-link / account-switch / merge / seed / crash recovery
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
import {
  loadMatchHistory,
  recordMatchHistory,
  type MatchHistoryRecord
} from './matchHistoryStorage';
import { loadSetupPrefs, persistSetupPrefs } from './setupPreferences';
import {
  __resetSyncMetadataForTests,
  getSyncMetadata,
  markFirstLinkCompleted
} from './syncMetadata';
import {
  __resetSyncOutboxForTests,
  enqueueHistoryMatch,
  listOutboxItems
} from './syncOutbox';
import {
  __resetSyncEngineForTests,
  __setSyncEngineFetchForTests
} from './syncEngine';
import { __resetSyncablePrefsMetaForTests } from './syncablePrefsRevision';
import {
  __resetLegacyStatsSeedForTests,
  LEGACY_STATS_SEED_KEY
} from './legacyStatsSeed';
import { writeDurableEnvelope, DURABLE_SCHEMA_VERSION } from './durableLocalStorage';
import { resolveFirstLinkCase } from './syncFirstLinkResolver';
import {
  hasMeaningfulLocalHistory,
  hasMeaningfulLocalPrefs,
  hasMeaningfulLocalSyncData,
  hasMeaningfulCloudSyncData
} from './syncMeaningfulData';
import { mergeMatchHistoryForFirstLink } from './syncHistoryMerge';
import {
  inspectFirstLink,
  completeFirstLink,
  resumeFirstLinkIfNeeded
} from './syncFirstLinkFlow';
import {
  __resetFirstLinkSessionForTests,
  loadFirstLinkSession,
  patchFirstLinkSession,
  startFirstLinkSession
} from './syncFirstLinkSession';
import {
  loadAccountClassASnapshot,
  saveAccountClassASnapshot
} from './syncAccountSnapshot';
import { SyncApiError } from './syncApiClient';

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
    idToken: `tok-${accountId}`,
    nonce: createGoogleSignInNonce()
  });
}

function sampleMatch(id: string, extra?: Partial<MatchHistoryRecord>): MatchHistoryRecord {
  return {
    id,
    schemaVersion: 1,
    completedAt: extra?.completedAt ?? '2024-01-01T00:00:00.000Z',
    gameVariant: 'sueca',
    rulesPresetId: 'sueca-pt-normal',
    players: [
      { index: 0, name: 'P1' },
      { index: 1, name: 'P2' },
      { index: 2, name: 'P3' },
      { index: 3, name: 'P4' }
    ],
    playerWon: true,
    resultKind: 'team',
    winner: 1,
    finalScores: { team1: 120, team2: 80 },
    summary: `Match ${id}`,
    ...extra
  };
}

function emptyStatus(over: Partial<Record<string, unknown>> = {}) {
  return {
    eligible: true,
    globalRevision: 0,
    historyRevision: 0,
    prefsRevision: 0,
    hasLegacyStatsSeed: false,
    updatedAt: null,
    ...over
  };
}

function emptySnapshot(over: Partial<Record<string, unknown>> = {}) {
  return {
    eligible: true,
    globalRevision: 0,
    historyRevision: 0,
    prefsRevision: 0,
    updatedAt: null,
    prefs: null,
    legacyStatsSeed: null,
    history: [],
    ...over
  };
}

function makeSyncFetch(handlers: {
  status?: () => unknown;
  snapshot?: () => unknown;
  putPrefs?: (body: unknown) => unknown;
  putSeed?: (body: unknown) => unknown;
  postHistory?: (body: unknown) => unknown;
}) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/auth/')) {
      return new Response('{}', { status: 404 });
    }
    if (url.includes('/sync/status')) {
      return new Response(JSON.stringify(handlers.status?.() ?? emptyStatus()), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/sync/snapshot')) {
      return new Response(JSON.stringify(handlers.snapshot?.() ?? emptySnapshot()), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/sync/prefs') && (init?.method || 'GET') === 'PUT') {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return new Response(
        JSON.stringify(handlers.putPrefs?.(body) ?? { prefsRevision: 1, globalRevision: 1 }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (url.includes('/sync/legacy-stats-seed') && (init?.method || 'GET') === 'PUT') {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return new Response(
        JSON.stringify(handlers.putSeed?.(body) ?? { ok: true }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (url.includes('/sync/history') && (init?.method || 'GET') === 'POST') {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return new Response(
        JSON.stringify(
          handlers.postHistory?.(body) ?? {
            accepted: (body.records || []).map((r: { id: string }) => r.id),
            deduped: [],
            conflicts: [],
            historyRevision: 1,
            prefsRevision: 0,
            globalRevision: 1
          }
        ),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    return new Response('{}', { status: 404 });
  };
}

function seedLocalNonZero() {
  writeDurableEnvelope(
    LEGACY_STATS_SEED_KEY,
    {
      schemaVersion: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      metrics: {
        gamesPlayed: 5,
        wins: 2,
        byVariant: {
          sueca: { played: 5, wins: 2 },
          hearts: { played: 0, wins: 0 },
          spades: { played: 0, wins: 0 },
          king: { played: 0, wins: 0 }
        }
      }
    },
    DURABLE_SCHEMA_VERSION
  );
}

function makeLocalPrefsMeaningful() {
  const prefs = loadSetupPrefs();
  prefs.p1Name = 'Jogador Local';
  persistSetupPrefs(prefs);
}

describe('SYNC-01D first-link', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetSyncMetadataForTests();
    __resetSyncOutboxForTests();
    __resetSyncEngineForTests();
    __resetSyncablePrefsMetaForTests();
    __resetLegacyStatsSeedForTests();
    __resetFirstLinkSessionForTests();
    __resetLocalGuestCacheForTests();
    __resetAuthSessionStorageForTests();
    __resetAuthStateForTests();
    setAuthPlatformForTests('web');
    delete process.env.VITE_GOOGLE_WEB_CLIENT_ID;
    delete process.env.VITE_AUTH_API_BASE_URL;
    vi.restoreAllMocks();
  });

  describe('meaningful data', () => {
    it('history / prefs / seed rules', () => {
      expect(hasMeaningfulLocalHistory()).toBe(false);
      expect(hasMeaningfulLocalPrefs()).toBe(false);
      expect(hasMeaningfulLocalSyncData()).toBe(false);

      recordMatchHistory({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 100, team2: 90 },
        summary: 'local'
      });
      expect(hasMeaningfulLocalHistory()).toBe(true);
      expect(hasMeaningfulLocalSyncData()).toBe(true);

      localStorage.clear();
      __resetLegacyStatsSeedForTests();
      makeLocalPrefsMeaningful();
      expect(hasMeaningfulLocalPrefs()).toBe(true);

      localStorage.clear();
      seedLocalNonZero();
      expect(hasMeaningfulLocalSyncData()).toBe(true);

      expect(
        hasMeaningfulCloudSyncData(emptyStatus(), emptySnapshot())
      ).toBe(false);
      expect(
        hasMeaningfulCloudSyncData(
          emptyStatus({ prefsRevision: 2 }),
          emptySnapshot({ prefsRevision: 2 })
        )
      ).toBe(true);
    });
  });

  describe('resolver A–E', () => {
    it('maps A/B/C/D/E', async () => {
      await signInAs('acc-a');
      expect(
        resolveFirstLinkCase({
          authenticatedAccountId: 'acc-a',
          cloudPresenceKnown: false
        })
      ).toBe('NEEDS_CLOUD_PROBE');

      recordMatchHistory({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'a'
      });
      expect(
        resolveFirstLinkCase({
          authenticatedAccountId: 'acc-a',
          cloudStatus: emptyStatus(),
          cloudSnapshot: emptySnapshot(),
          cloudPresenceKnown: true
        })
      ).toBe('CLOUD_EMPTY_LOCAL_HAS_DATA');

      localStorage.clear();
      __resetSyncMetadataForTests();
      expect(
        resolveFirstLinkCase({
          authenticatedAccountId: 'acc-a',
          cloudStatus: emptyStatus({ historyRevision: 3 }),
          cloudSnapshot: emptySnapshot({
            historyRevision: 3,
            history: [
              {
                id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                schemaVersion: 1,
                payload: sampleMatch('cccccccc-cccc-cccc-cccc-cccccccccccc')
              }
            ]
          }),
          cloudPresenceKnown: true
        })
      ).toBe('CLOUD_HAS_DATA_LOCAL_EMPTY');

      recordMatchHistory({
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'both'
      });
      expect(
        resolveFirstLinkCase({
          authenticatedAccountId: 'acc-a',
          cloudStatus: emptyStatus({ historyRevision: 1 }),
          cloudSnapshot: emptySnapshot({
            history: [
              {
                id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
                schemaVersion: 1,
                payload: sampleMatch('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
              }
            ]
          }),
          cloudPresenceKnown: true
        })
      ).toBe('BOTH_HAVE_DATA');

      markFirstLinkCompleted('acc-a');
      expect(
        resolveFirstLinkCase({ authenticatedAccountId: 'acc-a', cloudPresenceKnown: false })
      ).toBe('SAME_ACCOUNT_RESUME');

      expect(
        resolveFirstLinkCase({ authenticatedAccountId: 'acc-b', cloudPresenceKnown: false })
      ).toBe('ACCOUNT_SWITCH');
    });
  });

  describe('history merge', () => {
    it('dedupes by id and idempotencyKey; flags payload conflict; retains 2000', () => {
      const local = [
        sampleMatch('id-1', { summary: 'local', idempotencyKey: 'k1' }),
        sampleMatch('legacy-migrated-finished-sueca-1')
      ];
      const remote = [
        sampleMatch('id-1', { summary: 'local', idempotencyKey: 'k1' }),
        sampleMatch('id-2', { idempotencyKey: 'k1', summary: 'dup-key' }),
        sampleMatch('id-3', { summary: 'remote' })
      ];
      const m = mergeMatchHistoryForFirstLink(local, remote);
      expect(m.conflicts).toHaveLength(0);
      expect(m.merged.map((r) => r.id).sort()).toEqual(
        ['id-1', 'id-3', 'legacy-migrated-finished-sueca-1'].sort()
      );

      const conflict = mergeMatchHistoryForFirstLink(
        [sampleMatch('same', { summary: 'a' })],
        [sampleMatch('same', { summary: 'b' })]
      );
      expect(conflict.conflicts.length).toBe(1);

      const manyLocal = Array.from({ length: 2005 }, (_, i) =>
        sampleMatch(`id-${i}`, {
          completedAt: new Date(Date.UTC(2024, 0, 1, 0, 0, i)).toISOString()
        })
      );
      const capped = mergeMatchHistoryForFirstLink(manyLocal, []);
      expect(capped.merged.length).toBe(2000);
    });
  });

  describe('cases A/B/C/D/E flows', () => {
    it('Case A: cloud empty + local rich → bind + upload', async () => {
      await signInAs('acc-a');
      recordMatchHistory({
        id: '11111111-1111-1111-1111-111111111111',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'local-a'
      });
      makeLocalPrefsMeaningful();

      const fetchFn = makeSyncFetch({});
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);

      const inspected = await inspectFirstLink(fetchFn as typeof fetch);
      expect(inspected.ok).toBe(true);
      expect(inspected.case).toBe('CLOUD_EMPTY_LOCAL_HAS_DATA');

      const done = await completeFirstLink({ fetchFn: fetchFn as typeof fetch });
      expect(done.ok).toBe(true);
      expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');
      expect(getSyncMetadata().firstLinkCompletedForAccountId).toBe('acc-a');
      expect(loadFirstLinkSession()).toBeNull();
    });

    it('Case B: cloud rich + local empty → download', async () => {
      await signInAs('acc-b');
      const remote = sampleMatch('22222222-2222-2222-2222-222222222222', {
        summary: 'cloud-only'
      });
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 1, prefsRevision: 1 }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            prefsRevision: 1,
            history: [{ id: remote.id, schemaVersion: 1, payload: remote }],
            prefs: {
              schemaVersion: 1,
              payload: {
                setup: { ...loadSetupPrefs(), p1Name: 'CloudPlayer' },
                hand: { sortEnabled: true, suitOrderPreset: 'vpvp', trumpPosition: 'left' },
                activeTheme: 'classic',
                dealingMethod: 'clockwise',
                autoPauseTrick: false
              },
              serverRevision: 1,
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          })
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);

      const done = await completeFirstLink({ fetchFn: fetchFn as typeof fetch });
      expect(done.ok).toBe(true);
      expect(done.case).toBe('CLOUD_HAS_DATA_LOCAL_EMPTY');
      expect(loadMatchHistory().some((r) => r.id === remote.id)).toBe(true);
      expect(loadSetupPrefs().p1Name).toBe('CloudPlayer');
      expect(getSyncMetadata().firstLinkCompletedForAccountId).toBe('acc-b');
    });

    it('Case C: both rich → prefs chooser; device keeps local prefs', async () => {
      await signInAs('acc-c');
      recordMatchHistory({
        id: '33333333-3333-3333-3333-333333333333',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'local-c'
      });
      makeLocalPrefsMeaningful();
      const localName = loadSetupPrefs().p1Name;

      const remote = sampleMatch('44444444-4444-4444-4444-444444444444', {
        summary: 'cloud-c'
      });
      let serverPrefsRev = 2;
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 1, prefsRevision: serverPrefsRev }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            prefsRevision: serverPrefsRev,
            history: [{ id: remote.id, schemaVersion: 1, payload: remote }],
            prefs:
              serverPrefsRev > 2
                ? null
                : {
                    schemaVersion: 1,
                    payload: {
                      setup: { ...loadSetupPrefs(), p1Name: 'FromCloud' },
                      hand: { sortEnabled: true, suitOrderPreset: 'vpvp', trumpPosition: 'left' },
                      activeTheme: 'classic',
                      dealingMethod: 'clockwise',
                      autoPauseTrick: false
                    },
                    serverRevision: serverPrefsRev,
                    updatedAt: '2024-01-01T00:00:00.000Z'
                  },
            prefsUnchanged: serverPrefsRev > 2
          }),
        putPrefs: () => {
          serverPrefsRev += 1;
          return { prefsRevision: serverPrefsRev, globalRevision: serverPrefsRev };
        }
      });

      const inspected = await inspectFirstLink(fetchFn as typeof fetch);
      expect(inspected.ok).toBe(false);
      expect(inspected.code).toBe('prefs_choice_required');

      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const done = await completeFirstLink({
        prefsChoice: 'device',
        fetchFn: fetchFn as typeof fetch
      });
      expect(done.ok).toBe(true);
      expect(loadSetupPrefs().p1Name).toBe(localName);
      expect(loadMatchHistory().length).toBeGreaterThanOrEqual(2);
    });

    it('Case C cloud prefs → apply cloud', async () => {
      await signInAs('acc-c2');
      recordMatchHistory({
        id: '55555555-5555-5555-5555-555555555555',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'local'
      });
      makeLocalPrefsMeaningful();
      const remote = sampleMatch('66666666-6666-6666-6666-666666666666');
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 1, prefsRevision: 1 }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            prefsRevision: 1,
            history: [{ id: remote.id, schemaVersion: 1, payload: remote }],
            prefs: {
              schemaVersion: 1,
              payload: {
                setup: { ...loadSetupPrefs(), p1Name: 'CloudWins' },
                hand: { sortEnabled: true, suitOrderPreset: 'vpvp', trumpPosition: 'left' },
                activeTheme: 'classic',
                dealingMethod: 'clockwise',
                autoPauseTrick: false
              },
              serverRevision: 1,
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          })
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const done = await completeFirstLink({
        prefsChoice: 'cloud',
        fetchFn: fetchFn as typeof fetch
      });
      expect(done.ok).toBe(true);
      expect(loadSetupPrefs().p1Name).toBe('CloudWins');
    });

    it('Case D: same account resume → incremental, no chooser', async () => {
      await signInAs('acc-d');
      markFirstLinkCompleted('acc-d');
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 0, prefsRevision: 0 })
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const inspected = await inspectFirstLink(fetchFn as typeof fetch);
      expect(inspected.ok).toBe(true);
      expect(inspected.case).toBe('SAME_ACCOUNT_RESUME');
      const done = await completeFirstLink({ fetchFn: fetchFn as typeof fetch });
      expect(done.ok).toBe(true);
      expect(done.case).toBe('SAME_ACCOUNT_RESUME');
    });

    it('Case E: A→B never uploads A outbox; switch snapshots A', async () => {
      await signInAs('acc-a');
      markFirstLinkCompleted('acc-a');
      recordMatchHistory({
        id: '77777777-7777-7777-7777-777777777777',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'a-data'
      });
      makeLocalPrefsMeaningful();
      const aName = loadSetupPrefs().p1Name;
      const match = loadMatchHistory()[0];
      enqueueHistoryMatch('acc-a', match.id);
      expect(listOutboxItems().every((i) => i.boundAccountId === 'acc-a')).toBe(true);

      await signOut();
      await signInAs('acc-b');
      expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');

      const inspected = await inspectFirstLink();
      expect(inspected.ok).toBe(false);
      expect(inspected.code).toBe('account_switch_required');

      // stay unsynced — no mutation
      const stay = await completeFirstLink({ accountSwitchAction: 'stay_unsynced' });
      expect(stay.ok).toBe(true);
      expect(getSyncMetadata().syncBoundAccountId).toBe('acc-a');
      expect(listOutboxItems().every((i) => i.boundAccountId === 'acc-a')).toBe(true);

      const remote = sampleMatch('88888888-8888-8888-8888-888888888888', {
        summary: 'b-cloud'
      });
      const aMatchId = '77777777-7777-7777-7777-777777777777';
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 1, prefsRevision: 1 }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            prefsRevision: 1,
            history: [{ id: remote.id, schemaVersion: 1, payload: remote }],
            prefs: {
              schemaVersion: 1,
              payload: {
                setup: { ...loadSetupPrefs(), p1Name: 'AccountB' },
                hand: { sortEnabled: true, suitOrderPreset: 'vpvp', trumpPosition: 'left' },
                activeTheme: 'classic',
                dealingMethod: 'clockwise',
                autoPauseTrick: false
              },
              serverRevision: 1,
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          }),
        postHistory: (body) => {
          const records = (body as { records?: Array<{ id: string }> }).records || [];
          if (records.some((r) => r.id === aMatchId)) {
            throw new Error('must not upload A history to B');
          }
          return {
            accepted: records.map((r) => r.id),
            deduped: [],
            conflicts: [],
            historyRevision: 2,
            prefsRevision: 1,
            globalRevision: 2
          };
        }
      });
      // Re-open switch
      startFirstLinkSession({
        accountId: 'acc-b',
        case: 'ACCOUNT_SWITCH',
        previousBoundAccountId: 'acc-a'
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const switched = await completeFirstLink({
        accountSwitchAction: 'use_cloud_account',
        fetchFn: fetchFn as typeof fetch
      });
      expect(switched.ok).toBe(true);
      expect(getSyncMetadata().syncBoundAccountId).toBe('acc-b');
      const aSnap = loadAccountClassASnapshot('acc-a');
      expect(aSnap).not.toBeNull();
      expect(aSnap?.prefsDocument.data.setup.p1Name).toBe(aName);
      // A outbox items still bound to A (not sent as B)
      expect(listOutboxItems().filter((i) => i.boundAccountId === 'acc-a').length).toBeGreaterThan(
        0
      );
    });
  });

  describe('seed mismatch', () => {
    it('blocks completion when local and cloud seeds differ', async () => {
      await signInAs('acc-seed');
      seedLocalNonZero();
      recordMatchHistory({
        id: '99999999-9999-9999-9999-999999999999',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'x'
      });
      const fetchFn = makeSyncFetch({
        status: () =>
          emptyStatus({ historyRevision: 1, prefsRevision: 1, hasLegacyStatsSeed: true }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            prefsRevision: 1,
            history: [
              {
                id: 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
                schemaVersion: 1,
                payload: sampleMatch('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa')
              }
            ],
            prefs: {
              schemaVersion: 1,
              payload: {
                setup: loadSetupPrefs(),
                hand: { sortEnabled: true, suitOrderPreset: 'vpvp', trumpPosition: 'left' },
                activeTheme: 'classic',
                dealingMethod: 'clockwise',
                autoPauseTrick: false
              },
              serverRevision: 1,
              updatedAt: '2024-01-01T00:00:00.000Z'
            },
            legacyStatsSeed: {
              schemaVersion: 1,
              createdAt: '2024-01-01T00:00:00.000Z',
              payload: {
                metrics: {
                  gamesPlayed: 99,
                  wins: 50,
                  byVariant: {
                    sueca: { played: 99, wins: 50 },
                    hearts: { played: 0, wins: 0 },
                    spades: { played: 0, wins: 0 },
                    king: { played: 0, wins: 0 }
                  }
                }
              }
            }
          })
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const done = await completeFirstLink({
        prefsChoice: 'device',
        fetchFn: fetchFn as typeof fetch
      });
      expect(done.ok).toBe(false);
      expect(done.code).toBe('seed_mismatch');
      expect(getSyncMetadata().firstLinkCompletedForAccountId).toBeNull();
    });
  });

  describe('crash recovery + offline', () => {
    it('persists prefs choice across resume', async () => {
      await signInAs('acc-crash');
      recordMatchHistory({
        id: 'abababab-abab-abab-abab-abababababab',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'l'
      });
      makeLocalPrefsMeaningful();
      startFirstLinkSession({ accountId: 'acc-crash', case: 'BOTH_HAVE_DATA' });
      patchFirstLinkSession({ phase: 'SNAPSHOT_FETCHED', prefsChoice: 'device' });

      const remote = sampleMatch('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd');
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 1, prefsRevision: 0 }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            history: [{ id: remote.id, schemaVersion: 1, payload: remote }]
          })
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const resumed = await resumeFirstLinkIfNeeded(fetchFn as typeof fetch);
      expect(resumed?.ok).toBe(true);
      expect(loadFirstLinkSession()).toBeNull();
    });

    it('resume after HISTORY_MERGED does not duplicate history', async () => {
      await signInAs('acc-crash-hm');
      const localId = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
      recordMatchHistory({
        id: localId,
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'local'
      });
      makeLocalPrefsMeaningful();
      const remote = sampleMatch('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2');
      startFirstLinkSession({ accountId: 'acc-crash-hm', case: 'BOTH_HAVE_DATA' });
      patchFirstLinkSession({
        phase: 'HISTORY_MERGED',
        prefsChoice: 'cloud'
      });
      const fetchFn = makeSyncFetch({
        status: () => emptyStatus({ historyRevision: 1, prefsRevision: 1 }),
        snapshot: () =>
          emptySnapshot({
            historyRevision: 1,
            prefsRevision: 1,
            history: [{ id: remote.id, schemaVersion: 1, payload: remote }],
            prefs: {
              schemaVersion: 1,
              payload: {
                setup: { ...loadSetupPrefs(), p1Name: 'ResumedCloud' },
                hand: { sortEnabled: true, suitOrderPreset: 'vpvp', trumpPosition: 'left' },
                activeTheme: 'classic',
                dealingMethod: 'clockwise',
                autoPauseTrick: false
              },
              serverRevision: 1,
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          })
      });
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const resumed = await resumeFirstLinkIfNeeded(fetchFn as typeof fetch);
      expect(resumed?.ok).toBe(true);
      const ids = loadMatchHistory().map((r) => r.id);
      expect(ids.filter((id) => id === localId).length).toBe(1);
      expect(ids.filter((id) => id === remote.id).length).toBe(1);
      expect(loadSetupPrefs().p1Name).toBe('ResumedCloud');
    });

    it('resume after BOUND (Case A) finishes upload without rebinding wrong account', async () => {
      await signInAs('acc-crash-bound');
      recordMatchHistory({
        id: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'bound'
      });
      makeLocalPrefsMeaningful();
      // Simulate crash after bind+first-link mark, before session cleared / upload done.
      markFirstLinkCompleted('acc-crash-bound');
      startFirstLinkSession({
        accountId: 'acc-crash-bound',
        case: 'CLOUD_EMPTY_LOCAL_HAS_DATA'
      });
      patchFirstLinkSession({ phase: 'BOUND' });

      const fetchFn = makeSyncFetch({});
      __setSyncEngineFetchForTests(fetchFn as typeof fetch);
      const resumed = await resumeFirstLinkIfNeeded(fetchFn as typeof fetch);
      expect(resumed?.ok).toBe(true);
      expect(getSyncMetadata().syncBoundAccountId).toBe('acc-crash-bound');
      expect(getSyncMetadata().firstLinkCompletedForAccountId).toBe('acc-crash-bound');
    });

    it('network failure during inspect returns soft error without binding', async () => {
      await signInAs('acc-off');
      recordMatchHistory({
        id: 'efefefef-efef-efef-efef-efefefefefef',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'l'
      });
      const netFetch = async () => {
        throw new SyncApiError('offline', 0, 'network');
      };
      const result = await inspectFirstLink(netFetch as typeof fetch);
      expect(result.ok).toBe(false);
      expect(result.code).toBe('network');
      expect(getSyncMetadata().syncBoundAccountId).toBeNull();
      expect(getAuthState().status).toBe('authenticated');
    });

    it('saveAccountClassASnapshot stores only Class A fields', () => {
      recordMatchHistory({
        id: '12121212-1212-1212-1212-121212121212',
        gameVariant: 'sueca',
        players: [
          { index: 0, name: 'A' },
          { index: 1, name: 'B' },
          { index: 2, name: 'C' },
          { index: 3, name: 'D' }
        ],
        finalScores: { team1: 1, team2: 0 },
        summary: 'snap'
      });
      makeLocalPrefsMeaningful();
      const snap = saveAccountClassASnapshot('acc-snap');
      expect(snap.history.length).toBe(1);
      expect(loadAccountClassASnapshot('acc-snap')?.accountId).toBe('acc-snap');
      const raw = JSON.stringify(snap);
      expect(raw).not.toMatch(/accessToken|refreshToken|id_token|Bearer/i);
      expect(snap).not.toHaveProperty('email');
      expect(Object.keys(snap).sort()).toEqual(
        [
          'accountId',
          'history',
          'historyRevision',
          'legacyStatsSeed',
          'prefsDocument',
          'prefsRevision',
          'savedAt',
          'schemaVersion'
        ].sort()
      );
    });
  });
});
