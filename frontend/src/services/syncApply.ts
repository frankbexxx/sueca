/**
 * SYNC-01C — apply remote snapshot pieces safely (no outbox side-effects).
 */
import { STORAGE_KEYS } from '../constants/gameConstants';
import {
  saveHandPreferences,
  type HandPreferences,
  type SuitOrderPresetId
} from '../constants/handPreferences';
import { setActiveTheme, type ThemeId } from './billingService';
import {
  MAX_MATCH_HISTORY,
  MATCH_HISTORY_KEY,
  loadMatchHistory,
  type MatchHistoryRecord,
  isMatchHistoryRecord
} from './matchHistoryStorage';
import { mergeMatchHistoryDedupe } from './matchHistorySync';
import {
  DURABLE_SCHEMA_VERSION,
  writeDurableEnvelope
} from './durableLocalStorage';
import { SETUP_PREFS_KEY, type SetupPrefsV1 } from './setupPreferences';
import { runWithoutSyncEnqueue } from './syncablePrefsRevision';
import type { SyncHistoryRecordWire } from './syncApiClient';

function asRecord(payload: unknown): MatchHistoryRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  // Prefer nested full record if present.
  const candidate = (p.record && typeof p.record === 'object' ? p.record : p) as MatchHistoryRecord;
  if (isMatchHistoryRecord(candidate)) return candidate;
  return null;
}

/** Merge remote history wires into local store (append+dedupe). Returns false on write failure. */
export function applyRemoteHistoryWires(wires: SyncHistoryRecordWire[]): boolean {
  const remote: MatchHistoryRecord[] = [];
  for (const w of wires) {
    const fromPayload = asRecord(w.payload);
    if (fromPayload) {
      remote.push({
        ...fromPayload,
        id: w.id,
        schemaVersion: w.schemaVersion as 1,
        ...(w.idempotencyKey ? { idempotencyKey: w.idempotencyKey } : {})
      });
      continue;
    }
    // Minimal reconstruct when payload is partial Class A fields.
    if (
      typeof w.payload.completedAt === 'string' &&
      typeof w.payload.gameVariant === 'string' &&
      typeof w.payload.summary === 'string'
    ) {
      const rec = {
        id: w.id,
        schemaVersion: 1 as const,
        completedAt: w.payload.completedAt,
        gameVariant: w.payload.gameVariant,
        rulesPresetId: (w.payload.rulesPresetId as string) || 'sueca-pt-normal',
        players: Array.isArray(w.payload.players) ? w.payload.players : [],
        playerWon: w.payload.playerWon as boolean | undefined,
        resultKind: (w.payload.resultKind as MatchHistoryRecord['resultKind']) || 'unknown',
        winner: (w.payload.winner as number | null | undefined) ?? null,
        ...(Array.isArray(w.payload.tiedSeats) ? { tiedSeats: w.payload.tiedSeats as number[] } : {}),
        finalScores:
          w.payload.finalScores && typeof w.payload.finalScores === 'object'
            ? (w.payload.finalScores as MatchHistoryRecord['finalScores'])
            : {},
        summary: w.payload.summary as string,
        ...(w.idempotencyKey ? { idempotencyKey: w.idempotencyKey } : {})
      };
      if (isMatchHistoryRecord(rec)) remote.push(rec);
    }
  }

  const merged = mergeMatchHistoryDedupe(loadMatchHistory(), remote).slice(0, MAX_MATCH_HISTORY);
  return writeDurableEnvelope(
    MATCH_HISTORY_KEY,
    { records: merged, legacyFinishedMigrated: true },
    DURABLE_SCHEMA_VERSION
  );
}

function isSetupPrefs(v: unknown): v is SetupPrefsV1 {
  return !!v && typeof v === 'object' && (v as SetupPrefsV1).version === 1;
}

/** Apply Class A prefs from server without enqueueing local sync mutations. */
export function applyRemoteSyncablePrefs(payload: Record<string, unknown>): void {
  runWithoutSyncEnqueue(() => {
    const data =
      payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>)
        : payload;

    if (isSetupPrefs(data.setup)) {
      localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify(data.setup));
    }
    if (data.hand && typeof data.hand === 'object') {
      const hand = data.hand as Partial<HandPreferences>;
      saveHandPreferences({
        sortEnabled: hand.sortEnabled,
        suitOrderPreset: hand.suitOrderPreset as SuitOrderPresetId | undefined,
        trumpPosition: hand.trumpPosition
      });
    }
    // Ignore obsolete dealingMethod from older sync payloads (ARCH-SUECA-09).
    if (typeof data.autoPauseTrick === 'boolean') {
      localStorage.setItem(STORAGE_KEYS.AUTO_PAUSE_TRICK, String(data.autoPauseTrick));
    }
    if (typeof data.activeTheme === 'string') {
      setActiveTheme(data.activeTheme as ThemeId);
    }
  });
}

export function matchRecordToHistoryWire(record: MatchHistoryRecord): {
  id: string;
  idempotencyKey?: string;
  schemaVersion: number;
  payload: Record<string, unknown>;
} {
  return {
    id: record.id,
    ...(record.idempotencyKey ? { idempotencyKey: record.idempotencyKey } : {}),
    schemaVersion: record.schemaVersion,
    payload: { record }
  };
}
