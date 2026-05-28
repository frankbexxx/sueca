import { GameConfig } from '../types/gameConfig';
import { GameState, GameVariant } from '../types/game';
import { SavedGameSession } from './gameSessionStorage';

const PINNED_KEY = 'sueca-pinned-sessions-v1';
const FINISHED_KEY = 'sueca-finished-games-v1';
const MAX_FINISHED = 3;

export interface PinnedGameSession extends SavedGameSession {
  pinnedAt: number;
  label?: string;
}

export interface FinishedGameEntry {
  variant: GameVariant;
  finishedAt: number;
  playerWon: boolean;
  summary: string;
}

function readPinned(): Partial<Record<GameVariant, PinnedGameSession>> {
  const raw = localStorage.getItem(PINNED_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<Record<GameVariant, PinnedGameSession>>;
  } catch {
    return {};
  }
}

function writePinned(map: Partial<Record<GameVariant, PinnedGameSession>>): void {
  if (Object.keys(map).length === 0) {
    localStorage.removeItem(PINNED_KEY);
    return;
  }
  localStorage.setItem(PINNED_KEY, JSON.stringify(map));
}

export function loadPinnedSessions(): Partial<Record<GameVariant, PinnedGameSession>> {
  return readPinned();
}

export function loadPinnedSession(variant: GameVariant): PinnedGameSession | null {
  const session = readPinned()[variant];
  if (!session || session.state?.isGameOver) return null;
  return session;
}

export function pinGameSession(config: GameConfig, state: GameState, label?: string): void {
  if (state.isGameOver) return;
  const map = readPinned();
  map[config.gameVariant] = {
    config,
    state,
    savedAt: Date.now(),
    pinnedAt: Date.now(),
    label
  };
  writePinned(map);
}

export function unpinGameSession(variant: GameVariant): void {
  const map = readPinned();
  delete map[variant];
  writePinned(map);
}

export function loadFinishedGames(): FinishedGameEntry[] {
  const raw = localStorage.getItem(FINISHED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FinishedGameEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_FINISHED) : [];
  } catch {
    return [];
  }
}

export function recordFinishedGame(entry: FinishedGameEntry): void {
  const list = loadFinishedGames().filter((e) => e.finishedAt !== entry.finishedAt);
  list.unshift(entry);
  localStorage.setItem(FINISHED_KEY, JSON.stringify(list.slice(0, MAX_FINISHED)));
}
