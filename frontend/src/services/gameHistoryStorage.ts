import { GameConfig } from '../types/gameConfig';
import { GameState, GameVariant } from '../types/game';
import { SavedGameSession } from './gameSessionStorage';
import {
  DURABLE_SCHEMA_VERSION,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';

export const PINNED_KEY = 'sueca-pinned-sessions-v1';
export const FINISHED_KEY = 'sueca-finished-games-v1';
/** Retention for finished summaries — unchanged in REL-DATA-01. */
export const MAX_FINISHED = 3;

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

type PinnedMap = Partial<Record<GameVariant, PinnedGameSession>>;

const VARIANTS: GameVariant[] = ['sueca', 'hearts', 'spades', 'king'];

function isPinnedSession(value: unknown): value is PinnedGameSession {
  if (!value || typeof value !== 'object') return false;
  const s = value as PinnedGameSession;
  return Boolean(
    s.config?.gameVariant &&
      s.state &&
      typeof s.savedAt === 'number' &&
      typeof s.pinnedAt === 'number'
  );
}

function cleanPinnedMap(parsed: unknown): PinnedMap {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const map: PinnedMap = {};
  for (const variant of VARIANTS) {
    const session = (parsed as PinnedMap)[variant];
    if (isPinnedSession(session) && !session.state?.isGameOver) {
      map[variant] = session;
    }
  }
  return map;
}

function migrateLegacyPinned(parsed: unknown): PinnedMap | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const p = parsed as Record<string, unknown>;
  if ('schemaVersion' in p && 'data' in p) return null;
  const keys = Object.keys(p);
  if (keys.length > 0 && !keys.some((k) => (VARIANTS as string[]).includes(k))) {
    return null;
  }
  return cleanPinnedMap(parsed);
}

function isPinnedMap(data: unknown): data is PinnedMap {
  return !!data && typeof data === 'object' && !Array.isArray(data);
}

function readPinned(): PinnedMap {
  const result = loadDurableJson<PinnedMap>({
    key: PINNED_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: {},
    migrateLegacy: migrateLegacyPinned,
    validateData: isPinnedMap
  });
  return cleanPinnedMap(result.data);
}

function writePinned(map: PinnedMap): void {
  const cleaned = cleanPinnedMap(map);
  if (Object.keys(cleaned).length === 0) {
    try {
      localStorage.removeItem(PINNED_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  writeDurableEnvelope(PINNED_KEY, cleaned, DURABLE_SCHEMA_VERSION);
}

export function loadPinnedSessions(): PinnedMap {
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

function isFinishedEntry(value: unknown): value is FinishedGameEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as FinishedGameEntry;
  return (
    typeof e.variant === 'string' &&
    typeof e.finishedAt === 'number' &&
    typeof e.playerWon === 'boolean' &&
    typeof e.summary === 'string'
  );
}

function migrateLegacyFinished(parsed: unknown): FinishedGameEntry[] | null {
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(isFinishedEntry).slice(0, MAX_FINISHED);
}

function isFinishedList(data: unknown): data is FinishedGameEntry[] {
  return Array.isArray(data);
}

export function loadFinishedGames(): FinishedGameEntry[] {
  const result = loadDurableJson<FinishedGameEntry[]>({
    key: FINISHED_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: [],
    migrateLegacy: migrateLegacyFinished,
    validateData: isFinishedList
  });
  return (Array.isArray(result.data) ? result.data : [])
    .filter(isFinishedEntry)
    .slice(0, MAX_FINISHED);
}

export function recordFinishedGame(entry: FinishedGameEntry): void {
  const list = loadFinishedGames().filter((e) => e.finishedAt !== entry.finishedAt);
  list.unshift(entry);
  writeDurableEnvelope(
    FINISHED_KEY,
    list.slice(0, MAX_FINISHED),
    DURABLE_SCHEMA_VERSION
  );
}
