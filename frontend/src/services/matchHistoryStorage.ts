/**
 * REL-DATA-02 — real per-match career history (product data).
 *
 * Separate from diagnostic/replay logs (REL-REPLAY-01).
 * Aggregate career counters stay in `sueca-local-stats` and are never fabricated
 * into synthetic match rows from played totals.
 */

import { RulesPresetId, getDefaultPresetId, resolvePresetId } from '../constants/rulesPresets';
import { AIDifficulty, GameVariant, PlayerType } from '../types/game';
import {
  DURABLE_SCHEMA_VERSION,
  getDurableBuildVersion,
  loadDurableJson,
  writeDurableEnvelope
} from './durableLocalStorage';
import {
  FINISHED_KEY,
  FinishedGameEntry,
  MAX_FINISHED,
  loadFinishedGames
} from './gameHistoryStorage';

export const MATCH_HISTORY_KEY = 'sueca-match-history-v1';

/**
 * Soft career retention cap. Records are compact (~0.3–0.6 KB each);
 * 2000 ≈ under ~1.2 MB serialized — within typical localStorage budgets.
 * NOT the same as MAX_FINISHED=3 (UI recent-summary only).
 */
export const MAX_MATCH_HISTORY = 2000;

export const MATCH_HISTORY_SCHEMA_VERSION = 1;

export type MatchHistoryProvenance = 'live' | 'finished-games-v1';

export interface MatchPlayerSnapshot {
  index: number;
  name: string;
  /** Present when known at completion; omit rather than invent. */
  type?: PlayerType;
  team?: 1 | 2;
}

export type MatchResultKind =
  | 'team'
  | 'individual'
  | 'unknown';

export interface MatchFinalScores {
  /** Team games (Sueca / Spades): team1 vs team2. */
  team1?: number;
  team2?: number;
  /** Individual games (Hearts / King): per-seat scores. */
  players?: number[];
}

export interface MatchHistoryRecord {
  id: string;
  schemaVersion: typeof MATCH_HISTORY_SCHEMA_VERSION;
  completedAt: string;
  gameVariant: GameVariant;
  rulesPresetId: RulesPresetId;
  difficulty?: AIDifficulty;
  players: MatchPlayerSnapshot[];
  /** Local human seat index when known. */
  localPlayerIndex?: number;
  playerWon?: boolean;
  resultKind: MatchResultKind;
  /** Winning team (1|2) or winning player index for individual games. */
  winner?: number | null;
  finalScores: MatchFinalScores;
  /** Compact display line (legacy finished summary compatible). */
  summary: string;
  buildVersion?: string;
  migratedFrom?: MatchHistoryProvenance;
  /** Dedup key for the same physical completion event. */
  idempotencyKey?: string;
}

export interface MatchHistoryStore {
  records: MatchHistoryRecord[];
  /** True once legacy finished summaries have been adopted (idempotent). */
  legacyFinishedMigrated: boolean;
}

export interface RecordMatchHistoryInput {
  id?: string;
  idempotencyKey?: string;
  completedAt?: string | number;
  gameVariant: GameVariant;
  rulesPresetId?: string;
  difficulty?: AIDifficulty;
  players: MatchPlayerSnapshot[];
  localPlayerIndex?: number;
  playerWon?: boolean;
  resultKind?: MatchResultKind;
  winner?: number | null;
  finalScores: MatchFinalScores;
  summary: string;
}

const VARIANTS: GameVariant[] = ['sueca', 'hearts', 'spades', 'king'];

function emptyStore(): MatchHistoryStore {
  return { records: [], legacyFinishedMigrated: false };
}

export function createMatchId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `mh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Stable id for one physical completion across remounts/duplicate callbacks.
 * sessionStorage remembers the UUID for a given idempotency key within the tab.
 */
export function resolveMatchCompletionId(idempotencyKey: string): string {
  const storageKey = `sueca-mh-id:${idempotencyKey}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing && existing.length > 0) return existing;
  } catch {
    /* ignore */
  }
  const id = createMatchId();
  try {
    sessionStorage.setItem(storageKey, id);
  } catch {
    /* ignore */
  }
  return id;
}

/** Snapshot seat names/types at completion (rename-safe for later prefs changes). */
export function snapshotPlayersFromGame(players: Array<{
  name: string;
  type?: PlayerType;
  team?: 1 | 2;
}>): MatchPlayerSnapshot[] {
  return players.map((p, index) => ({
    index,
    name: typeof p.name === 'string' && p.name.length > 0 ? p.name : `Player ${index + 1}`,
    ...(p.type ? { type: p.type } : {}),
    ...(p.team === 1 || p.team === 2 ? { team: p.team } : {})
  }));
}

function isVariant(value: unknown): value is GameVariant {
  return typeof value === 'string' && (VARIANTS as string[]).includes(value);
}

function isPlayerSnapshot(value: unknown): value is MatchPlayerSnapshot {
  if (!value || typeof value !== 'object') return false;
  const p = value as MatchPlayerSnapshot;
  return typeof p.index === 'number' && typeof p.name === 'string';
}

function isFinalScores(value: unknown): value is MatchFinalScores {
  if (!value || typeof value !== 'object') return false;
  const s = value as MatchFinalScores;
  if (s.team1 !== undefined && typeof s.team1 !== 'number') return false;
  if (s.team2 !== undefined && typeof s.team2 !== 'number') return false;
  if (s.players !== undefined && !Array.isArray(s.players)) return false;
  return true;
}

export function isMatchHistoryRecord(value: unknown): value is MatchHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as MatchHistoryRecord;
  return (
    typeof r.id === 'string' &&
    r.id.length > 0 &&
    typeof r.completedAt === 'string' &&
    isVariant(r.gameVariant) &&
    typeof r.rulesPresetId === 'string' &&
    Array.isArray(r.players) &&
    r.players.every(isPlayerSnapshot) &&
    isFinalScores(r.finalScores) &&
    typeof r.summary === 'string' &&
    typeof r.schemaVersion === 'number'
  );
}

function sanitizeRecords(raw: unknown[]): MatchHistoryRecord[] {
  return raw.filter(isMatchHistoryRecord);
}

function isMatchHistoryStore(data: unknown): data is MatchHistoryStore {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const s = data as MatchHistoryStore;
  return Array.isArray(s.records) && typeof s.legacyFinishedMigrated === 'boolean';
}

/** Salvage valid records even when some entries in the array are garbage. */
function normalizeStore(data: unknown): MatchHistoryStore {
  if (isMatchHistoryStore(data)) {
    return {
      records: sanitizeRecords(data.records).slice(0, MAX_MATCH_HISTORY),
      legacyFinishedMigrated: data.legacyFinishedMigrated
    };
  }
  // Pre-store bare array (unlikely) — treat as records, not yet migrated flag.
  if (Array.isArray(data)) {
    return {
      records: sanitizeRecords(data).slice(0, MAX_MATCH_HISTORY),
      legacyFinishedMigrated: false
    };
  }
  return emptyStore();
}

function migrateLegacyHistory(parsed: unknown): MatchHistoryStore | null {
  if (parsed == null) return null;
  if (isMatchHistoryStore(parsed) || Array.isArray(parsed)) {
    return normalizeStore(parsed);
  }
  return null;
}

function validateStore(data: unknown): data is MatchHistoryStore {
  // Accept store shape OR salvageable array; reject totally foreign objects.
  if (isMatchHistoryStore(data)) return true;
  if (Array.isArray(data)) return true;
  return false;
}

function finishedMigrationId(entry: FinishedGameEntry): string {
  return `migrated-finished-${entry.variant}-${entry.finishedAt}`;
}

function finishedToMatchRecord(entry: FinishedGameEntry): MatchHistoryRecord {
  const completedAt = new Date(entry.finishedAt).toISOString();
  return {
    id: finishedMigrationId(entry),
    schemaVersion: MATCH_HISTORY_SCHEMA_VERSION,
    completedAt,
    gameVariant: entry.variant,
    rulesPresetId: getDefaultPresetId(entry.variant),
    players: [],
    playerWon: entry.playerWon,
    resultKind: 'unknown',
    winner: null,
    finalScores: {},
    summary: entry.summary,
    migratedFrom: 'finished-games-v1'
  };
}

/**
 * Adopt up to MAX_FINISHED legacy summaries into career history.
 * Does NOT invent rows from aggregate stats counters.
 */
function adoptLegacyFinished(store: MatchHistoryStore): MatchHistoryStore {
  if (store.legacyFinishedMigrated) return store;

  let finished: FinishedGameEntry[] = [];
  try {
    finished = loadFinishedGames();
  } catch {
    finished = [];
  }

  const existingIds = new Set(store.records.map((r) => r.id));
  const adopted: MatchHistoryRecord[] = [];
  for (const entry of finished.slice(0, MAX_FINISHED)) {
    if (!isVariant(entry.variant)) continue;
    const record = finishedToMatchRecord(entry);
    if (existingIds.has(record.id)) continue;
    adopted.push(record);
    existingIds.add(record.id);
  }

  // Newest first (finished list may be unsorted legacy arrays).
  adopted.sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt) || a.id.localeCompare(b.id)
  );

  return {
    records: [...adopted, ...store.records].slice(0, MAX_MATCH_HISTORY),
    legacyFinishedMigrated: true
  };
}

function readStore(): MatchHistoryStore {
  const result = loadDurableJson<MatchHistoryStore>({
    key: MATCH_HISTORY_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: emptyStore(),
    migrateLegacy: migrateLegacyHistory,
    validateData: validateStore
  });

  let store = normalizeStore(result.data);
  const before = JSON.stringify(store);
  store = adoptLegacyFinished(store);
  if (JSON.stringify(store) !== before) {
    writeDurableEnvelope(MATCH_HISTORY_KEY, store, DURABLE_SCHEMA_VERSION);
  }
  return store;
}

function writeStore(store: MatchHistoryStore): boolean {
  const normalized: MatchHistoryStore = {
    records: store.records.slice(0, MAX_MATCH_HISTORY),
    legacyFinishedMigrated: store.legacyFinishedMigrated
  };
  return writeDurableEnvelope(MATCH_HISTORY_KEY, normalized, DURABLE_SCHEMA_VERSION);
}

export function loadMatchHistory(): MatchHistoryRecord[] {
  return readStore().records;
}

export function getMatchHistoryByVariant(variant: GameVariant): MatchHistoryRecord[] {
  return loadMatchHistory().filter((r) => r.gameVariant === variant);
}

export function getMatchById(id: string): MatchHistoryRecord | null {
  return loadMatchHistory().find((r) => r.id === id) ?? null;
}

/**
 * Recent finished summaries for UI that still expects FinishedGameEntry.
 * Caps at MAX_FINISHED for display — career store retains the full list.
 */
export function loadRecentFinishedFromHistory(): FinishedGameEntry[] {
  return loadMatchHistory()
    .slice(0, MAX_FINISHED)
    .map((r) => ({
      variant: r.gameVariant,
      finishedAt: Date.parse(r.completedAt) || 0,
      playerWon: r.playerWon ?? false,
      summary: r.summary
    }));
}

export function recordMatchHistory(
  input: RecordMatchHistoryInput
): MatchHistoryRecord | null {
  try {
    const store = readStore();
    const id = input.id && input.id.length > 0 ? input.id : createMatchId();

    if (store.records.some((r) => r.id === id)) {
      return store.records.find((r) => r.id === id) ?? null;
    }
    if (
      input.idempotencyKey &&
      store.records.some((r) => r.idempotencyKey === input.idempotencyKey)
    ) {
      return (
        store.records.find((r) => r.idempotencyKey === input.idempotencyKey) ?? null
      );
    }

    const completedAt =
      typeof input.completedAt === 'number'
        ? new Date(input.completedAt).toISOString()
        : typeof input.completedAt === 'string' && input.completedAt.length > 0
          ? input.completedAt
          : new Date().toISOString();

    const record: MatchHistoryRecord = {
      id,
      schemaVersion: MATCH_HISTORY_SCHEMA_VERSION,
      completedAt,
      gameVariant: input.gameVariant,
      rulesPresetId: resolvePresetId(input.gameVariant, input.rulesPresetId),
      difficulty: input.difficulty,
      players: input.players.map((p) => ({
        index: p.index,
        name: p.name,
        ...(p.type ? { type: p.type } : {}),
        ...(p.team === 1 || p.team === 2 ? { team: p.team } : {})
      })),
      localPlayerIndex: input.localPlayerIndex,
      playerWon: input.playerWon,
      resultKind: input.resultKind ?? 'unknown',
      winner: input.winner ?? null,
      finalScores: { ...input.finalScores },
      summary: input.summary,
      buildVersion: getDurableBuildVersion(),
      migratedFrom: 'live',
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
    };

    store.records.unshift(record);
    store.records = store.records.slice(0, MAX_MATCH_HISTORY);
    const wrote = writeStore(store);
    if (!wrote) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[matchHistoryStorage] write failed; match not persisted');
      }
      return null;
    }
    return record;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[matchHistoryStorage] recordMatchHistory failed', err);
    }
    return null;
  }
}

/** Pure export payload for future backup/share (not replay). */
export interface MatchHistoryExport {
  kind: 'suecao-match-history';
  schemaVersion: typeof MATCH_HISTORY_SCHEMA_VERSION;
  exportedAt: string;
  buildVersion?: string;
  recordCount: number;
  records: MatchHistoryRecord[];
}

export function exportMatchHistory(): MatchHistoryExport {
  const records = loadMatchHistory();
  return {
    kind: 'suecao-match-history',
    schemaVersion: MATCH_HISTORY_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    buildVersion: getDurableBuildVersion(),
    recordCount: records.length,
    records
  };
}

/** Serialize export JSON (helper only — no file picker UX). */
export function serializeMatchHistoryExport(): string {
  return JSON.stringify(exportMatchHistory());
}

/** Test / diagnostics: approximate serialized size of N representative records. */
export function estimateMatchHistorySerializedSize(recordCount: number): number {
  const sample: MatchHistoryRecord = {
    id: '00000000-0000-4000-8000-000000000000',
    schemaVersion: MATCH_HISTORY_SCHEMA_VERSION,
    completedAt: '2026-09-26T12:00:00.000Z',
    gameVariant: 'king',
    rulesPresetId: 'king-pt-normal',
    difficulty: 'medium',
    players: [
      { index: 0, name: 'Player 1', type: 'human', team: 1 },
      { index: 1, name: 'Bot Norte', type: 'ai', team: 2 },
      { index: 2, name: 'Bot Este', type: 'ai', team: 1 },
      { index: 3, name: 'Bot Oeste', type: 'ai', team: 2 }
    ],
    localPlayerIndex: 0,
    playerWon: true,
    resultKind: 'individual',
    winner: 0,
    finalScores: { players: [120, 80, 95, 70] },
    summary: 'Player 1 · 120/80/95/70',
    buildVersion: 'abcdef0',
    migratedFrom: 'live'
  };
  const store: MatchHistoryStore = {
    records: Array.from({ length: recordCount }, (_, i) => ({
      ...sample,
      id: `est-${i.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`,
      completedAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString()
    })),
    legacyFinishedMigrated: true
  };
  const envelope = {
    schemaVersion: DURABLE_SCHEMA_VERSION,
    updatedAt: Date.now(),
    buildVersion: 'abcdef0',
    data: store
  };
  return JSON.stringify(envelope).length;
}

// Re-export finished key for migration diagnostics / tests.
export { FINISHED_KEY };
