/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DURABLE_BACKUP_REGISTRY_KEY,
  DURABLE_QUARANTINE_KEY,
  DURABLE_SCHEMA_VERSION,
  getDurableBackup,
  getQuarantineEntriesForKey,
  hasDurableQuarantine,
  listDurableQuarantineDiagnostics,
  loadDurableJson,
  quarantineCorruptRaw,
  writeDurableEnvelope
} from './durableLocalStorage';
import {
  STATS_KEY,
  SESSIONS_KEY,
  loadLocalStats,
  recordGameResult,
  saveGameSession,
  loadGameSession,
  loadAllGameSessions,
  isObsoleteKingSavedSession
} from './gameSessionStorage';
import {
  FINISHED_KEY,
  PINNED_KEY,
  MAX_FINISHED,
  loadFinishedGames,
  recordFinishedGame,
  pinGameSession,
  loadPinnedSession
} from './gameHistoryStorage';
import {
  SETUP_PREFS_KEY,
  loadSetupPrefs,
  getP1Name
} from './setupPreferences';
import { GameConfig } from '../types/gameConfig';
import { GameState } from '../types/game';

const mockConfig = (variant: GameConfig['gameVariant'] = 'sueca'): GameConfig => ({
  playerNames: ['Alice', 'Bot 2', 'Bot 3', 'Bot 4'],
  aiDifficulty: 'medium',
  dealingMethod: 'A',
  multiplayerEnabled: false,
  gameVariant: variant,
  rulesPresetId:
    variant === 'king'
      ? 'king-pt-normal'
      : variant === 'hearts'
        ? 'hearts-us-normal'
        : variant === 'spades'
          ? 'spades-pt-normal'
          : 'sueca-pt-normal'
});

const mockState = (
  variant: GameConfig['gameVariant'] = 'sueca',
  extras: Partial<GameState> = {}
): GameState =>
  ({
    players: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: true,
    dealingMethod: 'A',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'Alice',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variantState:
      variant === 'king'
        ? { kingPt: {}, rulesPresetId: 'king-pt-normal' }
        : variant === 'hearts'
          ? { hearts: {} }
          : undefined,
    ...extras
  }) as GameState;

describe('REL-DATA-01 durable local storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('stats', () => {
    it('migrates unversioned stats and preserves King played=160', () => {
      const legacy = {
        gamesPlayed: 200,
        wins: 90,
        lastPlayedAt: 1_700_000_000_000,
        lastPlayedVariant: 'king',
        byVariant: {
          sueca: { played: 20, wins: 10 },
          hearts: { played: 10, wins: 4 },
          spades: { played: 10, wins: 5 },
          king: { played: 160, wins: 71 }
        }
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(legacy));

      const first = loadLocalStats();
      expect(first.byVariant.king.played).toBe(160);
      expect(first.gamesPlayed).toBe(200);
      expect(first.wins).toBe(90);
      expect(first.lastPlayedVariant).toBe('king');

      const stored = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
      expect(stored.schemaVersion).toBe(DURABLE_SCHEMA_VERSION);
      expect(stored.data.byVariant.king.played).toBe(160);
      expect(getDurableBackup(STATS_KEY)?.raw).toBe(JSON.stringify(legacy));

      // Idempotent reload — no quarantine, count stable
      expect(loadLocalStats().byVariant.king.played).toBe(160);
      expect(hasDurableQuarantine(STATS_KEY)).toBe(false);

      recordGameResult('king', true);
      const after = loadLocalStats();
      expect(after.byVariant.king.played).toBe(161);
      expect(after.gamesPlayed).toBe(201);
      expect(after.wins).toBe(91);
    });

    it('quarantines malformed JSON and does not leave permanent silent zeros in-place', () => {
      localStorage.setItem(STATS_KEY, '{not-json');
      const stats = loadLocalStats();
      expect(stats.gamesPlayed).toBe(0);
      expect(hasDurableQuarantine(STATS_KEY)).toBe(true);
      expect(getQuarantineEntriesForKey(STATS_KEY)[0].raw).toBe('{not-json');
      // Source key removed only after successful quarantine
      expect(localStorage.getItem(STATS_KEY)).toBeNull();
      const diag = listDurableQuarantineDiagnostics();
      expect(diag.some((d) => d.sourceKey === STATS_KEY && d.reason === 'json_parse_error')).toBe(
        true
      );
    });

    it('loads versioned envelope without re-backup', () => {
      writeDurableEnvelope(STATS_KEY, {
        gamesPlayed: 3,
        wins: 1,
        byVariant: {
          sueca: { played: 3, wins: 1 },
          hearts: { played: 0, wins: 0 },
          spades: { played: 0, wins: 0 },
          king: { played: 0, wins: 0 }
        }
      });
      expect(loadLocalStats().gamesPlayed).toBe(3);
      expect(getDurableBackup(STATS_KEY)).toBeNull();
      expect(localStorage.getItem(DURABLE_BACKUP_REGISTRY_KEY)).toBeNull();
    });
  });

  describe('sessions', () => {
    it('migrates bare sessions map to envelope for all variants', () => {
      const bare = {
        sueca: { config: mockConfig('sueca'), state: mockState('sueca'), savedAt: 1 },
        hearts: { config: mockConfig('hearts'), state: mockState('hearts'), savedAt: 2 },
        spades: { config: mockConfig('spades'), state: mockState('spades'), savedAt: 3 },
        king: {
          config: { ...mockConfig('king'), rulesPresetId: 'king-pt-synthetic' },
          state: mockState('king', {
            variantState: { kingPt: {}, rulesPresetId: 'king-pt-synthetic' }
          }),
          savedAt: 4
        }
      };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(bare));

      expect(loadGameSession('sueca')?.config.gameVariant).toBe('sueca');
      expect(loadGameSession('hearts')?.config.gameVariant).toBe('hearts');
      expect(loadGameSession('spades')?.config.gameVariant).toBe('spades');
      expect(loadGameSession('king')?.config.rulesPresetId).toBe('king-pt-synthetic');

      const stored = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
      expect(stored.schemaVersion).toBe(DURABLE_SCHEMA_VERSION);
      expect(stored.data.king.config.rulesPresetId).toBe('king-pt-synthetic');
      expect(getDurableBackup(SESSIONS_KEY)).toBeTruthy();

      // Idempotent
      expect(loadAllGameSessions().king?.savedAt).toBe(4);
    });

    it('keeps valid variants when one entry is invalid', () => {
      const mixed = {
        sueca: { config: mockConfig('sueca'), state: mockState('sueca'), savedAt: 1 },
        hearts: { broken: true },
        king: {
          config: mockConfig('king'),
          state: mockState('king'),
          savedAt: 2
        }
      };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(mixed));
      const all = loadAllGameSessions();
      expect(all.sueca).toBeTruthy();
      expect(all.hearts).toBeUndefined();
      expect(all.king).toBeTruthy();
    });

    it('rejects obsolete king-simplified session', () => {
      const obsolete = {
        config: { ...mockConfig('king'), rulesPresetId: 'king-simplified' },
        state: mockState('king', {
          variantState: { kingSimplified: true, rulesPresetId: 'king-simplified' }
        }),
        savedAt: 1
      };
      expect(isObsoleteKingSavedSession(obsolete)).toBe(true);
      localStorage.setItem(
        SESSIONS_KEY,
        JSON.stringify({
          sueca: { config: mockConfig('sueca'), state: mockState('sueca'), savedAt: 1 },
          king: obsolete
        })
      );
      expect(loadGameSession('king')).toBeNull();
      expect(loadGameSession('sueca')).toBeTruthy();
    });

    it('quarantines malformed sessions JSON', () => {
      localStorage.setItem(SESSIONS_KEY, 'NOT_JSON');
      expect(loadAllGameSessions()).toEqual({});
      expect(hasDurableQuarantine(SESSIONS_KEY)).toBe(true);
      expect(localStorage.getItem(SESSIONS_KEY)).toBeNull();
    });

    it('new saves write versioned envelopes', () => {
      saveGameSession(mockConfig('sueca'), mockState('sueca'));
      const stored = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
      expect(stored.schemaVersion).toBe(DURABLE_SCHEMA_VERSION);
      expect(stored.buildVersion).toBeTruthy();
      expect(stored.data.sueca.config.gameVariant).toBe('sueca');
    });
  });

  describe('finished + pinned', () => {
    it('migrates finished array; keeps MAX_FINISHED=3', () => {
      const legacy = [
        { variant: 'king', finishedAt: 3, playerWon: true, summary: 'a' },
        { variant: 'sueca', finishedAt: 2, playerWon: false, summary: 'b' },
        { variant: 'hearts', finishedAt: 1, playerWon: true, summary: 'c' },
        { variant: 'spades', finishedAt: 0, playerWon: false, summary: 'd' }
      ];
      localStorage.setItem(FINISHED_KEY, JSON.stringify(legacy));
      const loaded = loadFinishedGames();
      expect(loaded).toHaveLength(MAX_FINISHED);
      expect(loaded[0].finishedAt).toBe(3);
      const stored = JSON.parse(localStorage.getItem(FINISHED_KEY) || '{}');
      expect(stored.schemaVersion).toBe(DURABLE_SCHEMA_VERSION);

      recordFinishedGame({
        variant: 'king',
        finishedAt: 99,
        playerWon: true,
        summary: 'new'
      });
      expect(loadFinishedGames()).toHaveLength(3);
      expect(loadFinishedGames()[0].finishedAt).toBe(99);
    });

    it('quarantines malformed finished JSON', () => {
      localStorage.setItem(FINISHED_KEY, '{bad');
      expect(loadFinishedGames()).toEqual([]);
      expect(hasDurableQuarantine(FINISHED_KEY)).toBe(true);
    });

    it('migrates pinned map to envelope', () => {
      localStorage.setItem(
        PINNED_KEY,
        JSON.stringify({
          sueca: {
            config: mockConfig('sueca'),
            state: mockState('sueca'),
            savedAt: 1,
            pinnedAt: 2,
            label: 'pin'
          }
        })
      );
      expect(loadPinnedSession('sueca')?.label).toBe('pin');
      expect(JSON.parse(localStorage.getItem(PINNED_KEY) || '{}').schemaVersion).toBe(
        DURABLE_SCHEMA_VERSION
      );
    });

    it('pin writes envelope', () => {
      pinGameSession(mockConfig('hearts'), mockState('hearts'), 'h');
      expect(JSON.parse(localStorage.getItem(PINNED_KEY) || '{}').data.hearts.label).toBe('h');
    });
  });

  describe('setup prefs', () => {
    it('keeps valid v1 without quarantine', () => {
      localStorage.setItem(
        SETUP_PREFS_KEY,
        JSON.stringify({
          version: 1,
          p1Name: 'Francisco',
          botNamesByVariant: {
            sueca: ['A', 'B', 'C'],
            hearts: ['A', 'B', 'C'],
            spades: ['A', 'B', 'C'],
            king: ['A', 'B', 'C']
          },
          difficultyByVariant: {
            sueca: 'hard',
            hearts: 'medium',
            spades: 'easy',
            king: 'medium'
          }
        })
      );
      expect(getP1Name()).toBe('Francisco');
      expect(hasDurableQuarantine(SETUP_PREFS_KEY)).toBe(false);
    });

    it('quarantines malformed setup prefs then seeds from legacy/defaults', () => {
      localStorage.setItem(SETUP_PREFS_KEY, 'CORRUPT');
      const prefs = loadSetupPrefs();
      expect(prefs.version).toBe(1);
      expect(hasDurableQuarantine(SETUP_PREFS_KEY)).toBe(true);
      expect(getQuarantineEntriesForKey(SETUP_PREFS_KEY)[0].raw).toBe('CORRUPT');
    });
  });

  describe('loadDurableJson helpers', () => {
    it('does not backup on empty key', () => {
      const r = loadDurableJson({
        key: 'sueca-test-empty',
        emptyFallback: { n: 0 },
        migrateLegacy: () => null
      });
      expect(r.ok).toBe(true);
      expect(r.migrated).toBe(false);
      expect(localStorage.getItem(DURABLE_BACKUP_REGISTRY_KEY)).toBeNull();
    });
  });

  describe('write-failure safety', () => {
    it('quarantine write failure leaves original source key untouched', () => {
      const sourceKey = 'sueca-local-stats';
      const corrupt = '{not-json-stats';
      localStorage.setItem(sourceKey, corrupt);

      const realSetItem = Storage.prototype.setItem;
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key: string,
        value: string
      ) {
        if (key === DURABLE_QUARANTINE_KEY) {
          const err = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw err;
        }
        return realSetItem.call(this, key, value);
      });

      try {
        const result = quarantineCorruptRaw(sourceKey, corrupt, 'json_parse_error');
        expect(result).toBe(false);
        expect(localStorage.getItem(sourceKey)).toBe(corrupt);
        expect(localStorage.getItem(DURABLE_QUARANTINE_KEY)).toBeNull();
        // Must not have been replaced with empty/default envelope
        expect(localStorage.getItem(sourceKey)).not.toContain('schemaVersion');
      } finally {
        spy.mockRestore();
      }
    });

    it('backup write failure does not replace the only old raw copy', () => {
      const sourceKey = 'sueca-local-stats';
      const legacy = {
        gamesPlayed: 160,
        wins: 70,
        byVariant: {
          sueca: { played: 0, wins: 0 },
          hearts: { played: 0, wins: 0 },
          spades: { played: 0, wins: 0 },
          king: { played: 160, wins: 70 }
        }
      };
      const legacyRaw = JSON.stringify(legacy);
      localStorage.setItem(sourceKey, legacyRaw);

      const realSetItem = Storage.prototype.setItem;
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key: string,
        value: string
      ) {
        if (key === DURABLE_BACKUP_REGISTRY_KEY) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        return realSetItem.call(this, key, value);
      });

      try {
        const result = loadDurableJson({
          key: sourceKey,
          emptyFallback: {
            gamesPlayed: 0,
            wins: 0,
            byVariant: {
              sueca: { played: 0, wins: 0 },
              hearts: { played: 0, wins: 0 },
              spades: { played: 0, wins: 0 },
              king: { played: 0, wins: 0 }
            }
          },
          migrateLegacy: (parsed) => {
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed as typeof legacy;
          }
        });
        // In-memory migration may succeed…
        expect(result.ok).toBe(true);
        expect((result.data as typeof legacy).byVariant.king.played).toBe(160);
        // …but the only durable raw must remain the legacy blob (not envelope, not empty).
        expect(localStorage.getItem(sourceKey)).toBe(legacyRaw);
        expect(localStorage.getItem(sourceKey)).not.toContain('"schemaVersion"');
        expect(localStorage.getItem(DURABLE_BACKUP_REGISTRY_KEY)).toBeNull();
      } finally {
        spy.mockRestore();
      }
    });
  });
});
