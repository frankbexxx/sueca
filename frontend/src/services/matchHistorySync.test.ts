/**
 * @vitest-environment jsdom
 * SYNC-01A — match history sync readiness + dedupe
 */
import { describe, expect, it } from 'vitest';
import type { MatchHistoryRecord } from './matchHistoryStorage';
import {
  assessMatchHistorySyncReadiness,
  isStableMatchHistoryId,
  mergeMatchHistoryDedupe
} from './matchHistorySync';

function rec(partial: Partial<MatchHistoryRecord> & { id: string }): MatchHistoryRecord {
  return {
    schemaVersion: 1,
    completedAt: '2026-03-01T00:00:00.000Z',
    gameVariant: 'sueca',
    rulesPresetId: 'sueca-pt-normal',
    players: [],
    playerWon: false,
    resultKind: 'unknown',
    winner: null,
    finalScores: { team1: 60, team2: 60 },
    summary: 'x',
    ...partial
  };
}

describe('SYNC-01A matchHistorySync', () => {
  it('recognizes stable UUIDs and rejects migrated-finished ids', () => {
    expect(isStableMatchHistoryId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isStableMatchHistoryId('migrated-finished-sueca-123')).toBe(false);
  });

  it('reports readiness blocker when non-UUID ids present', () => {
    const readiness = assessMatchHistorySyncReadiness([
      rec({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      rec({ id: 'migrated-finished-king-99' })
    ]);
    expect(readiness.total).toBe(2);
    expect(readiness.withStableUuid).toBe(1);
    expect(readiness.missingStableUuid).toBe(1);
    expect(readiness.readyForSync).toBe(false);
  });

  it('dedupes by id and secondary idempotencyKey without fabricating rows', () => {
    const a = rec({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      idempotencyKey: 'k1',
      completedAt: '2026-03-02T00:00:00.000Z'
    });
    const aDup = rec({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      summary: 'dup-id'
    });
    const bSameKey = rec({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      idempotencyKey: 'k1',
      summary: 'other-id-same-key'
    });
    const c = rec({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      completedAt: '2026-03-03T00:00:00.000Z'
    });
    const migrated = rec({ id: 'migrated-finished-sueca-1' });

    const merged = mergeMatchHistoryDedupe([a, migrated], [aDup, bSameKey, c]);
    const ids = merged.map((r) => r.id).sort();
    // SYNC-01D: legacy migrated-* ids are preserved (not dropped).
    // Secondary idempotencyKey drops bSameKey (same key as a).
    expect(ids).toEqual([
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'migrated-finished-sueca-1'
    ]);
    expect(merged.find((r) => r.id === a.id)?.summary).toBe('x');
  });

  it('preserves stable ids from inputs (no rewrite)', () => {
    const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const merged = mergeMatchHistoryDedupe([rec({ id })], []);
    expect(merged[0].id).toBe(id);
  });
});
