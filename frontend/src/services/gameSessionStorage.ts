import { GameConfig } from '../types/gameConfig';
import { GameState, GameVariant } from '../types/game';

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

export function saveLastConfig(config: GameConfig): void {
  localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
}

export function loadLastConfig(): GameConfig | null {
  const raw = localStorage.getItem(LAST_CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameConfig;
  } catch {
    return null;
  }
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
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
