/**
 * @vitest-environment jsdom
 * SYNC-01A — legacyStatsSeed residual
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { writeDurableEnvelope, DURABLE_SCHEMA_VERSION } from './durableLocalStorage';
import { STATS_KEY, type LocalStats } from './gameSessionStorage';
import {
  MATCH_HISTORY_KEY,
  type MatchHistoryRecord,
  type MatchHistoryStore
} from './matchHistoryStorage';
import {
  LEGACY_STATS_SEED_KEY,
  __resetLegacyStatsSeedForTests,
  combineLegacySeedWithHistory,
  computeLegacyStatsSeedMetrics,
  ensureLegacyStatsSeed,
  loadLegacyStatsSeed
} from './legacyStatsSeed';

function baseStats(over: Partial<LocalStats> = {}): LocalStats {
  return {
    gamesPlayed: 10,
    wins: 4,
    lastPlayedAt: Date.parse('2026-01-01T00:00:00.000Z'),
    lastPlayedVariant: 'sueca',
    byVariant: {
      sueca: { played: 8, wins: 3 },
      hearts: { played: 2, wins: 1 },
      spades: { played: 0, wins: 0 },
      king: { played: 0, wins: 0 }
    },
    ...over
  };
}

function historyRecord(partial: Partial<MatchHistoryRecord> & { id: string }): MatchHistoryRecord {
  return {
    schemaVersion: 1,
    completedAt: '2026-02-01T00:00:00.000Z',
    gameVariant: 'sueca',
    rulesPresetId: 'sueca-pt-normal',
    players: [],
    playerWon: false,
    resultKind: 'unknown',
    winner: null,
    finalScores: { team1: 0, team2: 0 },
    summary: 't',
    ...partial
  };
}

describe('SYNC-01A legacyStatsSeed', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetLegacyStatsSeedForTests();
  });

  it('computes non-negative residual S − H', () => {
    const stats = baseStats();
    const records = [
      historyRecord({ id: '11111111-1111-4111-8111-111111111111', playerWon: true }),
      historyRecord({ id: '22222222-2222-4222-8222-222222222222', playerWon: false })
    ];
    const seed = computeLegacyStatsSeedMetrics(stats, records);
    expect(seed.gamesPlayed).toBe(8); // 10 - 2
    expect(seed.wins).toBe(3); // 4 - 1
    expect(seed.byVariant.sueca.played).toBe(6); // 8 - 2
    expect(seed.byVariant.sueca.wins).toBe(2); // 3 - 1
  });

  it('never allows negative seed when history exceeds stats', () => {
    const stats = baseStats({ gamesPlayed: 1, wins: 0 });
    const records = [
      historyRecord({ id: '11111111-1111-4111-8111-111111111111' }),
      historyRecord({ id: '22222222-2222-4222-8222-222222222222' }),
      historyRecord({ id: '33333333-3333-4333-8333-333333333333' })
    ];
    const seed = computeLegacyStatsSeedMetrics(stats, records);
    expect(seed.gamesPlayed).toBe(0);
    expect(seed.wins).toBe(0);
  });

  it('creates seed once and does not regenerate after new matches', () => {
    writeDurableEnvelope(STATS_KEY, baseStats(), DURABLE_SCHEMA_VERSION);
    const store: MatchHistoryStore = {
      records: [
        historyRecord({ id: '11111111-1111-4111-8111-111111111111', playerWon: true })
      ],
      legacyFinishedMigrated: true
    };
    writeDurableEnvelope(MATCH_HISTORY_KEY, store, DURABLE_SCHEMA_VERSION);

    const first = ensureLegacyStatsSeed();
    expect(first.metrics.gamesPlayed).toBe(9);
    expect(localStorage.getItem(LEGACY_STATS_SEED_KEY)).toBeTruthy();

    // Simulate new match + stats bump — seed must stay immutable.
    store.records.push(
      historyRecord({ id: '22222222-2222-4222-8222-222222222222', playerWon: true })
    );
    writeDurableEnvelope(MATCH_HISTORY_KEY, store, DURABLE_SCHEMA_VERSION);
    writeDurableEnvelope(
      STATS_KEY,
      baseStats({ gamesPlayed: 11, wins: 5 }),
      DURABLE_SCHEMA_VERSION
    );

    const second = ensureLegacyStatsSeed();
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.metrics.gamesPlayed).toBe(9);
    expect(loadLegacyStatsSeed()?.metrics.gamesPlayed).toBe(9);
  });

  it('combine avoids double-count of history already in seed residual model', () => {
    const seed = computeLegacyStatsSeedMetrics(baseStats(), [
      historyRecord({ id: '11111111-1111-4111-8111-111111111111', playerWon: true })
    ]);
    const combined = combineLegacySeedWithHistory(seed, [
      historyRecord({ id: '11111111-1111-4111-8111-111111111111', playerWon: true })
    ]);
    // seed residual (9 played) + 1 history = 10 = original S
    expect(combined.gamesPlayed).toBe(10);
    expect(combined.wins).toBe(4);
  });
});
