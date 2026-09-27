/**
 * SYNC-01A — legacyStatsSeed (immutable residual aggregates).
 *
 * seed = max(0, S − H) for subtractable metrics only.
 * Never fabricates match-history rows.
 */

import { GameVariant } from '../types/game';
import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import { loadLocalStats, type LocalStats } from './gameSessionStorage';
import { loadMatchHistory, type MatchHistoryRecord } from './matchHistoryStorage';
import { LEGACY_STATS_SEED_KEY } from './syncStorageKeys';

export { LEGACY_STATS_SEED_KEY };

const VARIANTS: GameVariant[] = ['sueca', 'hearts', 'spades', 'king'];

export type LegacyStatsSeedMetrics = {
  gamesPlayed: number;
  wins: number;
  byVariant: Record<GameVariant, { played: number; wins: number }>;
};

export type LegacyStatsSeedV1 = {
  schemaVersion: 1;
  createdAt: string;
  /** Device LocalGuest id at seed time (context only). */
  localGuestId?: string | null;
  metrics: LegacyStatsSeedMetrics;
};

function emptyVariant(): Record<GameVariant, { played: number; wins: number }> {
  return {
    sueca: { played: 0, wins: 0 },
    hearts: { played: 0, wins: 0 },
    spades: { played: 0, wins: 0 },
    king: { played: 0, wins: 0 }
  };
}

function emptyMetrics(): LegacyStatsSeedMetrics {
  return { gamesPlayed: 0, wins: 0, byVariant: emptyVariant() };
}

export function deriveStatsFromHistory(records: MatchHistoryRecord[]): LegacyStatsSeedMetrics {
  const byVariant = emptyVariant();
  let wins = 0;
  for (const r of records) {
    const v = r.gameVariant;
    if (VARIANTS.includes(v)) {
      byVariant[v].played += 1;
      if (r.playerWon === true) {
        byVariant[v].wins += 1;
        wins += 1;
      }
    }
  }
  return {
    gamesPlayed: records.length,
    wins,
    byVariant
  };
}

function residual(s: number, h: number): number {
  if (!Number.isFinite(s) || !Number.isFinite(h)) return 0;
  return Math.max(0, Math.floor(s) - Math.floor(h));
}

/**
 * Compute seed candidate = max(0, S − H) for supported metrics.
 * Unsupported: lastPlayedAt, lastPlayedVariant (not seeded).
 */
export function computeLegacyStatsSeedMetrics(
  stats: LocalStats,
  records: MatchHistoryRecord[]
): LegacyStatsSeedMetrics {
  const h = deriveStatsFromHistory(records);
  const byVariant = emptyVariant();
  for (const v of VARIANTS) {
    byVariant[v] = {
      played: residual(stats.byVariant[v]?.played ?? 0, h.byVariant[v].played),
      wins: residual(stats.byVariant[v]?.wins ?? 0, h.byVariant[v].wins)
    };
  }
  return {
    gamesPlayed: residual(stats.gamesPlayed, h.gamesPlayed),
    wins: residual(stats.wins, h.wins),
    byVariant
  };
}

function isSeed(data: unknown): data is LegacyStatsSeedV1 {
  if (!data || typeof data !== 'object') return false;
  const s = data as LegacyStatsSeedV1;
  return (
    s.schemaVersion === 1 &&
    typeof s.createdAt === 'string' &&
    s.metrics != null &&
    typeof s.metrics.gamesPlayed === 'number'
  );
}

export function loadLegacyStatsSeed(): LegacyStatsSeedV1 | null {
  const result = loadDurableJson<LegacyStatsSeedV1 | null>({
    key: LEGACY_STATS_SEED_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: null,
    validateData: (d): d is LegacyStatsSeedV1 | null => d === null || isSeed(d),
    migrateLegacy: (raw) => (isSeed(raw) ? raw : null)
  });
  return result.data && isSeed(result.data) ? result.data : null;
}

/**
 * Create seed once from current local stats − history. Idempotent.
 * Does not update after new matches.
 */
export function ensureLegacyStatsSeed(options?: {
  localGuestId?: string | null;
}): LegacyStatsSeedV1 {
  const existing = loadLegacyStatsSeed();
  if (existing) return existing;

  const metrics = computeLegacyStatsSeedMetrics(loadLocalStats(), loadMatchHistory());
  const seed: LegacyStatsSeedV1 = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    localGuestId: options?.localGuestId ?? null,
    metrics
  };
  writeDurableEnvelope(LEGACY_STATS_SEED_KEY, seed, DURABLE_SCHEMA_VERSION);
  return seed;
}

/** Visible career stats for UI once sync lands: seed + derived history. */
export function combineLegacySeedWithHistory(
  seed: LegacyStatsSeedMetrics | null,
  records: MatchHistoryRecord[]
): LegacyStatsSeedMetrics {
  const h = deriveStatsFromHistory(records);
  if (!seed) return h;
  const byVariant = emptyVariant();
  for (const v of VARIANTS) {
    byVariant[v] = {
      played: seed.byVariant[v].played + h.byVariant[v].played,
      wins: seed.byVariant[v].wins + h.byVariant[v].wins
    };
  }
  return {
    gamesPlayed: seed.gamesPlayed + h.gamesPlayed,
    wins: seed.wins + h.wins,
    byVariant
  };
}

export function clearLegacyStatsSeed(): void {
  try {
    localStorage.removeItem(LEGACY_STATS_SEED_KEY);
  } catch {
    /* ignore */
  }
}

/** Test-only */
export function __resetLegacyStatsSeedForTests(): void {
  clearLegacyStatsSeed();
}

export { emptyMetrics as __emptyLegacyMetricsForTests };
