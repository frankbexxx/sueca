import { GameConfig } from '../types/gameConfig';
import { GameState, GameVariant } from '../types/game';
import { resolvePresetId, getDefaultPresetId } from '../constants/rulesPresets';

const SESSION_KEY = 'sueca-saved-session';
const LAST_CONFIG_KEY = 'sueca-last-config';
const STATS_KEY = 'sueca-local-stats';

export interface SavedGameSession {
  config: GameConfig;
  state: GameState;
  savedAt: number;
}

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
  if (state.isGameOver) {
    clearGameSession();
    return;
  }
  const session: SavedGameSession = { config, state, savedAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadGameSession(): SavedGameSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SavedGameSession;
    if (session.state?.isGameOver) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearGameSession(): void {
  localStorage.removeItem(SESSION_KEY);
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
