/**
 * SYNC-01A/01D — match history sync readiness + merge helpers.
 */

import {
  loadMatchHistory,
  type MatchHistoryRecord
} from './matchHistoryStorage';
import { mergeMatchHistoryForFirstLink } from './syncHistoryMerge';

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
 * Accepts UUID and legacy migrated-finished-* ids. Pure — does not write storage.
 */
export function mergeMatchHistoryDedupe(
  local: MatchHistoryRecord[],
  remote: MatchHistoryRecord[]
): MatchHistoryRecord[] {
  return mergeMatchHistoryForFirstLink(local, remote).merged;
}

export { mergeMatchHistoryForFirstLink } from './syncHistoryMerge';
