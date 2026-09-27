/**
 * SYNC-01A — match history sync readiness helpers (no mutation of stored history).
 */

import {
  loadMatchHistory,
  type MatchHistoryRecord
} from './matchHistoryStorage';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isStableMatchHistoryId(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id);
}

export type MatchHistorySyncReadiness = {
  total: number;
  withStableUuid: number;
  missingStableUuid: number;
  withIdempotencyKey: number;
  /** True when every record has a syncable UUID primary key. */
  readyForSync: boolean;
};

export function assessMatchHistorySyncReadiness(
  records: MatchHistoryRecord[] = loadMatchHistory()
): MatchHistorySyncReadiness {
  let withStableUuid = 0;
  let withIdempotencyKey = 0;
  for (const r of records) {
    if (isStableMatchHistoryId(r.id)) withStableUuid += 1;
    if (typeof r.idempotencyKey === 'string' && r.idempotencyKey.length > 0) {
      withIdempotencyKey += 1;
    }
  }
  const total = records.length;
  const missingStableUuid = total - withStableUuid;
  return {
    total,
    withStableUuid,
    missingStableUuid,
    withIdempotencyKey,
    readyForSync: missingStableUuid === 0
  };
}

/**
 * Merge two history lists by append + dedupe (primary id, secondary idempotencyKey).
 * Pure helper for future sync — does not write storage.
 */
export function mergeMatchHistoryDedupe(
  local: MatchHistoryRecord[],
  remote: MatchHistoryRecord[]
): MatchHistoryRecord[] {
  const byId = new Map<string, MatchHistoryRecord>();
  const byIdem = new Map<string, string>();

  const consider = (r: MatchHistoryRecord) => {
    if (!isStableMatchHistoryId(r.id)) {
      // Blocker records are skipped from merge output rather than rewritten.
      return;
    }
    if (r.idempotencyKey) {
      const existingId = byIdem.get(r.idempotencyKey);
      if (existingId && existingId !== r.id) {
        // Prefer first-seen; skip duplicate completion event under different id.
        return;
      }
      byIdem.set(r.idempotencyKey, r.id);
    }
    if (!byId.has(r.id)) byId.set(r.id, r);
  };

  for (const r of local) consider(r);
  for (const r of remote) consider(r);

  return Array.from(byId.values()).sort((a, b) =>
    String(b.completedAt).localeCompare(String(a.completedAt))
  );
}
