import { GameConfig } from '../types/gameConfig';
import { GameState, GameVariant } from '../types/game';
import {
  resolvePresetId,
  getDefaultPresetId,
  isObsoleteKingPresetId
} from '../constants/rulesPresets';
import { getDifficultyForVariant, getPlayerNamesForVariant } from './setupPreferences';
import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';

export const SESSIONS_KEY = 'sueca-saved-sessions-v1';
export const LEGACY_SESSION_KEY = 'sueca-saved-session';
export const LAST_CONFIG_KEY = 'sueca-last-config';
export const STATS_KEY = 'sueca-local-stats';

export const MP_LOCAL_STORAGE_KEYS = {
  enabled: 'sueca-multiplayer-enabled',
  sessionId: 'sueca-multiplayer-session-id',
  legacyJoinMode: 'sueca-multiplayer-join-mode'
} as const;

const ALL_VARIANTS: GameVariant[] = ['sueca', 'hearts', 'spades', 'king'];

export interface SavedGameSession {
  config: GameConfig;
  state: GameState;
  savedAt: number;
}

export type SavedGameSessions = Partial<Record<GameVariant, SavedGameSession>>;

export interface LocalStats {
  gamesPlayed: number;
  wins: number;
  lastPlayedAt?: number;
  lastPlayedVariant?: GameVariant;
  byVariant: Record<GameVariant, { played: number; wins: number }>;
}

const emptyStats = (): LocalStats => ({
  gamesPlayed: 0,
  wins: 0,
  byVariant: {
    sueca: { played: 0, wins: 0 },
    hearts: { played: 0, wins: 0 },
    spades: { played: 0, wins: 0 },
    king: { played: 0, wins: 0 }
  }
});

function isVariantKey(value: string): value is GameVariant {
  return (ALL_VARIANTS as string[]).includes(value);
}

function normalizeVariantStats(
  raw: unknown
): { played: number; wins: number } {
  if (!raw || typeof raw !== 'object') return { played: 0, wins: 0 };
  const v = raw as Record<string, unknown>;
  return {
    played: typeof v.played === 'number' && Number.isFinite(v.played) ? v.played : 0,
    wins: typeof v.wins === 'number' && Number.isFinite(v.wins) ? v.wins : 0
  };
}

/** Normalize any recognized stats object (legacy or envelope data). */
export function normalizeLocalStats(parsed: unknown): LocalStats | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  // Reject durable envelopes mistaken as stats data.
  if ('schemaVersion' in p && 'data' in p) return null;
  if (typeof p.gamesPlayed !== 'number' && !p.byVariant) return null;

  const base = emptyStats();
  const byVariant = { ...base.byVariant };
  if (p.byVariant && typeof p.byVariant === 'object') {
    for (const key of ALL_VARIANTS) {
      byVariant[key] = normalizeVariantStats(
        (p.byVariant as Record<string, unknown>)[key]
      );
    }
  }

  return {
    gamesPlayed:
      typeof p.gamesPlayed === 'number' && Number.isFinite(p.gamesPlayed)
        ? p.gamesPlayed
        : base.gamesPlayed,
    wins: typeof p.wins === 'number' && Number.isFinite(p.wins) ? p.wins : base.wins,
    lastPlayedAt:
      typeof p.lastPlayedAt === 'number' ? p.lastPlayedAt : undefined,
    lastPlayedVariant:
      typeof p.lastPlayedVariant === 'string' && isVariantKey(p.lastPlayedVariant)
        ? p.lastPlayedVariant
        : undefined,
    byVariant
  };
}

function isLocalStats(data: unknown): data is LocalStats {
  return normalizeLocalStats(data) !== null;
}

function isValidSession(session: SavedGameSession | undefined): session is SavedGameSession {
  return Boolean(session && session.config?.gameVariant && session.state && !session.state.isGameOver);
}

/**
 * Mid-game saves for deleted `king-simplified` cannot restore safely (wrong engine state).
 * Reject/clear them — never launch the removed engine. Last-config prefs use resolvePresetId.
 */
export function isObsoleteKingSavedSession(session: SavedGameSession): boolean {
  if (session.config.gameVariant !== 'king') return false;
  const configPreset = session.config.rulesPresetId;
  const statePreset = session.state.variantState?.rulesPresetId as string | undefined;
  if (isObsoleteKingPresetId(configPreset) || isObsoleteKingPresetId(statePreset)) {
    return true;
  }
  const vs = session.state.variantState as Record<string, unknown> | undefined;
  if (vs?.kingSimplified && !vs?.kingPt) return true;
  return false;
}

function cleanSessionsMap(parsed: unknown): SavedGameSessions {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const cleaned: SavedGameSessions = {};
  for (const variant of ALL_VARIANTS) {
    const session = (parsed as SavedGameSessions)[variant];
    if (isValidSession(session) && !isObsoleteKingSavedSession(session)) {
      cleaned[variant] = session;
    }
  }
  return cleaned;
}

/** Legacy: bare map keyed by variant (pre-envelope). */
function migrateLegacySessionsMap(parsed: unknown): SavedGameSessions | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const p = parsed as Record<string, unknown>;
  if ('schemaVersion' in p && 'data' in p) return null;
  // Must look like a sessions map (at least one known variant key or empty object).
  const keys = Object.keys(p);
  if (keys.length > 0 && !keys.some((k) => isVariantKey(k))) return null;
  return cleanSessionsMap(parsed);
}

function isSessionsMap(data: unknown): data is SavedGameSessions {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return true;
}

function migrateLegacySessionInto(target: SavedGameSessions): void {
  const legacyRaw = localStorage.getItem(LEGACY_SESSION_KEY);
  if (!legacyRaw) return;
  try {
    const legacy = JSON.parse(legacyRaw) as SavedGameSession;
    if (isValidSession(legacy) && !isObsoleteKingSavedSession(legacy)) {
      target[legacy.config.gameVariant] = legacy;
    }
  } catch {
    /* ignore corrupt legacy — do not wipe sessions store */
  }
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function readSessionsRaw(): SavedGameSessions {
  const result = loadDurableJson<SavedGameSessions>({
    key: SESSIONS_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: {},
    migrateLegacy: migrateLegacySessionsMap,
    validateData: isSessionsMap
  });

  const fromStore = cleanSessionsMap(result.data);
  const sessions: SavedGameSessions = { ...fromStore };
  migrateLegacySessionInto(sessions);

  // Persist when legacy single-session was folded in, or obsolete/invalid
  // entries were filtered out of an otherwise readable store.
  if (JSON.stringify(sessions) !== JSON.stringify(fromStore)) {
    writeSessions(sessions);
  } else if (result.ok && result.migrated) {
    // Envelope already written by loadDurableJson; ensure cleaned shape.
    writeSessions(sessions);
  }

  return sessions;
}

function writeSessions(sessions: SavedGameSessions): void {
  const cleaned = cleanSessionsMap(sessions);
  const hasAny = ALL_VARIANTS.some((variant) => isValidSession(cleaned[variant]));
  if (!hasAny) {
    try {
      localStorage.removeItem(SESSIONS_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  writeDurableEnvelope(SESSIONS_KEY, cleaned, DURABLE_SCHEMA_VERSION);
}

function persistStats(stats: LocalStats): void {
  writeDurableEnvelope(STATS_KEY, stats, DURABLE_SCHEMA_VERSION);
}

export function touchLastPlayed(variant: GameVariant): void {
  const stats = loadLocalStats();
  stats.lastPlayedAt = Date.now();
  stats.lastPlayedVariant = variant;
  persistStats(stats);
}

export function saveLastConfig(config: GameConfig): void {
  try {
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(stripMultiplayerFields(config)));
  } catch {
    /* quota — last-config is preference-only */
  }
  touchLastPlayed(config.gameVariant);
}

/** Removes online-session fields — use when persisting solo preferences or exiting MP. */
export function stripMultiplayerFields(config: GameConfig): GameConfig {
  return {
    playerNames: config.playerNames,
    aiDifficulty: config.aiDifficulty,
    dealingMethod: config.dealingMethod,
    gameVariant: config.gameVariant,
    rulesPresetId: config.rulesPresetId,
    multiplayerEnabled: false
  };
}

export function clearMultiplayerLocalStorage(): void {
  localStorage.removeItem(MP_LOCAL_STORAGE_KEYS.enabled);
  localStorage.removeItem(MP_LOCAL_STORAGE_KEYS.sessionId);
  localStorage.removeItem(MP_LOCAL_STORAGE_KEYS.legacyJoinMode);
}

export function isOfflineMultiplayerSession(session: SavedGameSession): boolean {
  return Boolean(session.config.multiplayerEnabled && session.config.multiplayerSessionId);
}

export function loadLastConfig(): GameConfig | null {
  const raw = localStorage.getItem(LAST_CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameConfig>;
    if (!parsed.gameVariant) return null;
    return stripMultiplayerFields({
      playerNames: parsed.playerNames ?? ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      aiDifficulty: parsed.aiDifficulty ?? 'medium',
      dealingMethod: parsed.dealingMethod ?? 'A',
      multiplayerEnabled: false,
      gameVariant: parsed.gameVariant,
      rulesPresetId: resolvePresetId(parsed.gameVariant, parsed.rulesPresetId)
    });
  } catch {
    return null;
  }
}

/** Builds a fresh solo config from saved preferences — never resumes or enables MP. */
export function buildSoloConfigForVariant(variant: GameVariant): GameConfig {
  const last = loadLastConfig();
  const rulesPresetId =
    last?.gameVariant === variant
      ? resolvePresetId(variant, last.rulesPresetId)
      : getDefaultPresetId(variant);
  return {
    playerNames: getPlayerNamesForVariant(variant),
    aiDifficulty: getDifficultyForVariant(variant),
    dealingMethod: last?.dealingMethod ?? 'A',
    multiplayerEnabled: false,
    gameVariant: variant,
    rulesPresetId
  };
}

export function saveGameSession(config: GameConfig, state: GameState): void {
  const variant = config.gameVariant;
  const sessions = readSessionsRaw();
  if (state.isGameOver) {
    delete sessions[variant];
    writeSessions(sessions);
    return;
  }
  sessions[variant] = { config, state, savedAt: Date.now() };
  writeSessions(sessions);
}

export function loadGameSession(variant?: GameVariant): SavedGameSession | null {
  const sessions = readSessionsRaw();
  if (variant) {
    const session = sessions[variant];
    return isValidSession(session) ? session : null;
  }
  let latest: SavedGameSession | null = null;
  for (const v of ALL_VARIANTS) {
    const session = sessions[v];
    if (isValidSession(session) && (!latest || session.savedAt > latest.savedAt)) {
      latest = session;
    }
  }
  return latest;
}

export function loadAllGameSessions(): SavedGameSessions {
  return readSessionsRaw();
}

export function clearGameSession(variant?: GameVariant): void {
  if (!variant) {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    return;
  }
  const sessions = readSessionsRaw();
  delete sessions[variant];
  writeSessions(sessions);
}

export function loadLocalStats(): LocalStats {
  const result = loadDurableJson<LocalStats>({
    key: STATS_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: emptyStats(),
    migrateLegacy: (parsed) => normalizeLocalStats(parsed),
    validateData: isLocalStats
  });
  return normalizeLocalStats(result.data) ?? emptyStats();
}

export function recordGameResult(variant: GameVariant, playerWon: boolean): void {
  const stats = loadLocalStats();
  stats.gamesPlayed += 1;
  stats.byVariant[variant].played += 1;
  if (playerWon) {
    stats.wins += 1;
    stats.byVariant[variant].wins += 1;
  }
  stats.lastPlayedAt = Date.now();
  stats.lastPlayedVariant = variant;
  persistStats(stats);
}

export function getWinRate(stats: LocalStats): number | null {
  if (stats.gamesPlayed === 0) return null;
  return Math.round((stats.wins / stats.gamesPlayed) * 100);
}

export function formatRelativeTime(ms: number, locale: 'pt' | 'en'): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - ms);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) {
    return locale === 'pt' ? 'agora' : 'just now';
  }
  if (diffHours < 1) {
    return locale === 'pt' ? `há ${diffMinutes} min` : `${diffMinutes} min ago`;
  }
  if (diffHours < 24) {
    return locale === 'pt' ? `há ${diffHours} h` : `${diffHours} h ago`;
  }
  if (diffDays === 1) {
    return locale === 'pt' ? 'ontem' : 'yesterday';
  }
  if (diffDays < 7) {
    return locale === 'pt' ? `há ${diffDays} dias` : `${diffDays} days ago`;
  }

  const date = new Date(ms);
  return date.toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'short'
  });
}
