/**
 * @vitest-environment jsdom
 * AUTH-01A — LocalGuest identity + auth-state facade
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DURABLE_QUARANTINE_KEY,
  DURABLE_SCHEMA_VERSION,
  getQuarantineEntriesForKey,
  hasDurableQuarantine,
  isDurableEnvelope,
  writeDurableEnvelope
} from './durableLocalStorage';
import {
  LOCAL_GUEST_KEY,
  __resetLocalGuestCacheForTests,
  clearLinkedAccountId,
  createLocalGuestId,
  ensureLocalGuestIdentity,
  getLocalGuestId,
  getLocalGuestIdentity,
  setLinkedAccountId
} from './localGuestIdentity';
import {
  __resetAuthStateForTests,
  ensureAuthInitialized,
  getAuthState,
  subscribeAuthState
} from './authState';
import { SETUP_PREFS_KEY, getP1Name, setP1Name, loadSetupPrefs } from './setupPreferences';
import { STATS_KEY, loadLocalStats, SESSIONS_KEY } from './gameSessionStorage';
import { MATCH_HISTORY_KEY, loadMatchHistory } from './matchHistoryStorage';

describe('AUTH-01A LocalGuest + auth state', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetLocalGuestCacheForTests();
    __resetAuthStateForTests();
  });

  it('creates a durable guest with UUID once', () => {
    const first = ensureLocalGuestIdentity();
    expect(first.localGuestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(first.createdAt).toBeTruthy();
    expect(first.linkedAccountId ?? null).toBeNull();

    const raw = localStorage.getItem(LOCAL_GUEST_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(isDurableEnvelope(parsed)).toBe(true);
    expect(parsed.schemaVersion).toBe(DURABLE_SCHEMA_VERSION);
    expect(parsed.data.localGuestId).toBe(first.localGuestId);
  });

  it('is idempotent across repeated access and cache reset (reload)', () => {
    const a = getLocalGuestId();
    const b = getLocalGuestId();
    expect(a).toBe(b);

    __resetLocalGuestCacheForTests();
    const c = getLocalGuestId();
    expect(c).toBe(a);
  });

  it('does not create competing IDs on burst access', () => {
    const ids = Array.from({ length: 20 }, () => getLocalGuestId());
    expect(new Set(ids).size).toBe(1);
  });

  it('mints unique IDs across fresh stores', () => {
    const id1 = createLocalGuestId();
    const id2 = createLocalGuestId();
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(getLocalGuestId());
  });

  it('creates guest when old app data exists without guest key', () => {
    writeDurableEnvelope(STATS_KEY, {
      gamesPlayed: 40,
      wins: 12,
      lastPlayedAt: 1,
      lastPlayedVariant: 'sueca',
      byVariant: {
        sueca: { played: 40, wins: 12 },
        hearts: { played: 0, wins: 0 },
        spades: { played: 0, wins: 0 },
        king: { played: 0, wins: 0 }
      }
    });
    writeDurableEnvelope(MATCH_HISTORY_KEY, {
      records: [
        {
          id: 'm1',
          schemaVersion: 1,
          completedAt: new Date().toISOString(),
          gameVariant: 'sueca',
          rulesPresetId: 'sueca-pt-normal',
          players: [],
          resultKind: 'team',
          finalScores: { team1: 60, team2: 60 },
          summary: 'draw'
        }
      ],
      legacyFinishedMigrated: true
    });
    localStorage.setItem(
      SETUP_PREFS_KEY,
      JSON.stringify({
        version: 1,
        p1Name: 'Tester',
        botNamesByVariant: {
          sueca: ['A', 'B', 'C'],
          hearts: ['A', 'B', 'C'],
          spades: ['A', 'B', 'C'],
          king: ['A', 'B', 'C']
        },
        difficultyByVariant: {
          sueca: 'medium',
          hearts: 'medium',
          spades: 'medium',
          king: 'medium'
        }
      })
    );

    const statsBefore = localStorage.getItem(STATS_KEY);
    const historyBefore = localStorage.getItem(MATCH_HISTORY_KEY);
    const prefsBefore = localStorage.getItem(SETUP_PREFS_KEY);

    const guest = ensureLocalGuestIdentity();
    expect(guest.localGuestId).toBeTruthy();

    expect(localStorage.getItem(STATS_KEY)).toBe(statsBefore);
    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBe(historyBefore);
    expect(localStorage.getItem(SETUP_PREFS_KEY)).toBe(prefsBefore);
    expect(loadLocalStats().gamesPlayed).toBe(40);
    expect(loadMatchHistory()).toHaveLength(1);
    expect(getP1Name()).toBe('Tester');
  });

  it('quarantines corrupt guest and replaces safely without touching other DATA', () => {
    writeDurableEnvelope(STATS_KEY, {
      gamesPlayed: 7,
      wins: 3,
      lastPlayedAt: null,
      lastPlayedVariant: null,
      byVariant: {
        sueca: { played: 7, wins: 3 },
        hearts: { played: 0, wins: 0 },
        spades: { played: 0, wins: 0 },
        king: { played: 0, wins: 0 }
      }
    });
    localStorage.setItem(LOCAL_GUEST_KEY, '{not-json');

    const beforeStats = localStorage.getItem(STATS_KEY);
    const guest = ensureLocalGuestIdentity();

    expect(hasDurableQuarantine(LOCAL_GUEST_KEY)).toBe(true);
    expect(getQuarantineEntriesForKey(LOCAL_GUEST_KEY).length).toBeGreaterThan(0);
    expect(guest.localGuestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(localStorage.getItem(STATS_KEY)).toBe(beforeStats);

    __resetLocalGuestCacheForTests();
    expect(getLocalGuestId()).toBe(guest.localGuestId);
  });

  it('quarantines invalid envelope data shape', () => {
    writeDurableEnvelope(LOCAL_GUEST_KEY, { localGuestId: 'not-a-uuid', createdAt: 'x' });
    const guest = ensureLocalGuestIdentity();
    expect(hasDurableQuarantine(LOCAL_GUEST_KEY)).toBe(true);
    expect(guest.localGuestId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('set/clear linkedAccountId keeps localGuestId stable', () => {
    const id = getLocalGuestId();
    setLinkedAccountId('acc-123');
    expect(getLocalGuestIdentity().linkedAccountId).toBe('acc-123');
    expect(getLocalGuestId()).toBe(id);

    clearLinkedAccountId();
    expect(getLocalGuestIdentity().linkedAccountId).toBeNull();
    expect(getLocalGuestId()).toBe(id);

    // Auth-01A still reports guest even with a linked id stored for later.
    setLinkedAccountId('acc-456');
    expect(getAuthState()).toEqual({ status: 'guest', localGuestId: id });
  });

  it('P1 rename does not change localGuestId', () => {
    const id = getLocalGuestId();
    setP1Name('Novo Nome');
    expect(getP1Name()).toBe('Novo Nome');
    __resetLocalGuestCacheForTests();
    expect(getLocalGuestId()).toBe(id);
    expect(loadSetupPrefs().p1Name).toBe('Novo Nome');
  });

  it('difficulty / variant prefs do not affect LocalGuest', () => {
    const id = getLocalGuestId();
    const prefs = loadSetupPrefs();
    prefs.difficultyByVariant.hearts = 'hard';
    localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify(prefs));
    __resetLocalGuestCacheForTests();
    expect(getLocalGuestId()).toBe(id);
  });

  it('auth state API: guest only, subscribe, init', () => {
    const seen: string[] = [];
    const unsub = subscribeAuthState((s) => {
      seen.push(s.status + ':' + s.localGuestId);
    });
    const state = ensureAuthInitialized();
    expect(state.status).toBe('guest');
    expect(state.localGuestId).toBe(getLocalGuestId());
    expect(seen.length).toBeGreaterThanOrEqual(1);
    unsub();
  });

  it('does not introduce network / fetch on init', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network should not be used');
    });
    ensureAuthInitialized();
    getAuthState();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('sessions key remains untouched when only guest is created', () => {
    expect(localStorage.getItem(SESSIONS_KEY)).toBeNull();
    ensureLocalGuestIdentity();
    expect(localStorage.getItem(SESSIONS_KEY)).toBeNull();
    expect(localStorage.getItem(DURABLE_QUARANTINE_KEY)).toBeNull();
  });
});
