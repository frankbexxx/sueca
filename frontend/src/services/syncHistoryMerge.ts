/**
 * SYNC-01D — deterministic history merge for first-link (append + dedupe).
 * Accepts UUID and legacy migrated-finished-* string ids.
 */

import {
  MAX_MATCH_HISTORY,
  type MatchHistoryRecord
} from './matchHistoryStorage';
import { stableEqualJson } from './syncJsonEqual';

export function isSyncableHistoryId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length > 0 && id.trim().length <= 128;
}

export type HistoryMergeConflict = {
  id: string;
  code: 'history_record_conflict';
  message: string;
};

export type HistoryMergeResult = {
  merged: MatchHistoryRecord[];
  conflicts: HistoryMergeConflict[];
  keptLocal: number;
  keptRemote: number;
};

/**
 * Primary: id. Secondary: idempotencyKey when present on both.
 * Same id + differing payload → conflict (first-seen kept).
 * Retention: newest MAX_MATCH_HISTORY after merge.
 */
export function mergeMatchHistoryForFirstLink(
  local: MatchHistoryRecord[],
  remote: MatchHistoryRecord[]
): HistoryMergeResult {
  const byId = new Map<string, MatchHistoryRecord>();
  const byIdem = new Map<string, string>();
  const conflicts: HistoryMergeConflict[] = [];
  let keptLocal = 0;
  let keptRemote = 0;

  const consider = (r: MatchHistoryRecord, source: 'local' | 'remote') => {
    if (!isSyncableHistoryId(r.id)) return;
    const id = r.id.trim();

    if (r.idempotencyKey) {
      const existingId = byIdem.get(r.idempotencyKey);
      if (existingId && existingId !== id) {
        // Same completion under different ids — keep first-seen.
        return;
      }
    }

    const existing = byId.get(id);
    if (existing) {
      if (!stableEqualJson(existing, r)) {
        // Compare payload-relevant fields loosely via JSON of records
        const a = { ...existing };
        const b = { ...r };
        if (!stableEqualJson(a, b)) {
          conflicts.push({
            id,
            code: 'history_record_conflict',
            message: 'Same match id with different payload'
          });
        }
      }
      return;
    }

    byId.set(id, r);
    if (r.idempotencyKey) byIdem.set(r.idempotencyKey, id);
    if (source === 'local') keptLocal += 1;
    else keptRemote += 1;
  };

  for (const r of local) consider(r, 'local');
  for (const r of remote) consider(r, 'remote');

  const merged = Array.from(byId.values())
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))
    .slice(0, MAX_MATCH_HISTORY);

  return { merged, conflicts, keptLocal, keptRemote };
}
