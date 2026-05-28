import { GameConfig } from '../types/gameConfig';
import { GameState, GameVariant } from '../types/game';
import { resolvePresetId, getDefaultPresetId } from '../constants/rulesPresets';

const SESSIONS_KEY = 'sueca-saved-sessions-v1';
const LEGACY_SESSION_KEY = 'sueca-saved-session';
const LAST_CONFIG_KEY = 'sueca-last-config';
const STATS_KEY = 'sueca-local-stats';

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

function isValidSession(session: SavedGameSession | undefined): session is SavedGameSession {
  return Boolean(session && session.config?.gameVariant && session.state && !session.state.isGameOver);
}

function readSessionsRaw(): SavedGameSessions {
  migrateLegacySession();
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SavedGameSessions;
    if (!parsed || typeof parsed !== 'object') return {};
    const cleaned: SavedGameSessions = {};
    for (const variant of ALL_VARIANTS) {
      const session = parsed[variant];
      if (isValidSession(session)) {
        cleaned[variant] = session;
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function writeSessions(sessions: SavedGameSessions): void {
  const hasAny = ALL_VARIANTS.some((variant) => isValidSession(sessions[variant]));
  if (!hasAny) {
    localStorage.removeItem(SESSIONS_KEY);
    return;
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function migrateLegacySession(): void {
  const legacyRaw = localStorage.getItem(LEGACY_SESSION_KEY);
  if (!legacyRaw) return;
  try {
    const legacy = JSON.parse(legacyRaw) as SavedGameSession;
    if (isValidSession(legacy)) {
      const sessions = readSessionsWithoutMigration();
      sessions[legacy.config.gameVariant] = legacy;
      writeSessions(sessions);
    }
  } catch {
    /* ignore corrupt legacy */
  }
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function readSessionsWithoutMigration(): SavedGameSessions {
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SavedGameSessions;
  } catch {
    return {};
  }
}

export function touchLastPlayed(variant: GameVariant): void {
  const stats = loadLocalStats();
  stats.lastPlayedAt = Date.now();
  stats.lastPlayedVariant = variant;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function saveLastConfig(config: GameConfig): void {
  localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  touchLastPlayed(config.gameVariant);
}

export function loadLastConfig(): GameConfig | null {
  const raw = localStorage.getItem(LAST_CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameConfig>;
    if (!parsed.gameVariant) return null;
    return {
      playerNames: parsed.playerNames ?? ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      aiDifficulty: parsed.aiDifficulty ?? 'medium',
      dealingMethod: parsed.dealingMethod ?? 'A',
      multiplayerEnabled: parsed.multiplayerEnabled ?? false,
      multiplayerJoinMode: parsed.multiplayerJoinMode ?? false,
      multiplayerSessionId: parsed.multiplayerSessionId,
      gameVariant: parsed.gameVariant,
      rulesPresetId: resolvePresetId(parsed.gameVariant, parsed.rulesPresetId)
    };
  } catch {
    return null;
  }
}

export function buildQuickConfigForVariant(variant: GameVariant): GameConfig {
  const last = loadLastConfig();
  if (last && last.gameVariant === variant) return last;
  return {
    playerNames: last?.playerNames ?? ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    aiDifficulty: last?.aiDifficulty ?? 'medium',
    dealingMethod: last?.dealingMethod ?? 'A',
    multiplayerEnabled: false,
    gameVariant: variant,
    rulesPresetId: getDefaultPresetId(variant)
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
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) return emptyStats();
  try {
    const parsed = JSON.parse(raw) as LocalStats;
    return { ...emptyStats(), ...parsed, byVariant: { ...emptyStats().byVariant, ...parsed.byVariant } };
  } catch {
    return emptyStats();
  }
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
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
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
