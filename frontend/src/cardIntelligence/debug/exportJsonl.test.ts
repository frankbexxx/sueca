import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { buildJsonlLines } from './exportJsonl';
import { EXPORT_SCHEMA_VERSION } from './types';

describe('exportJsonl', () => {
  it('empty export returns single export_meta line', () => {
    const { lines } = buildJsonlLines([], [], {});
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.exportRecordType).toBe('export_meta');
    expect(parsed.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(parsed.payload.lineCount).toBe(0);
  });

  it('envelope lines are valid JSON with payload intact', () => {
    const play = createTestLogEvent({
      variant: 'spades',
      eventId: 'evt-export-1',
      gameId: 'game-export',
    });
    const { lines } = buildJsonlLines([play], [], { format: 'envelope' });
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const first = JSON.parse(lines[0]);
    expect(first.exportRecordType).toBe('card_decision_log');
    expect(first.payload.schemaVersion).toBe('3.0.0');
    expect(first.payload.eventId).toBe('evt-export-1');
  });

  it('raw format emits bare log events', () => {
    const play = createTestLogEvent({ variant: 'hearts', eventId: 'raw-1' });
    const { lines, warnings } = buildJsonlLines([play], [], {
      format: 'raw',
      includeEvaluations: true,
    });
    expect(warnings.some((w) => w.includes('raw format ignores'))).toBe(true);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.eventId).toBe('raw-1');
    expect(parsed.schemaVersion).toBe('3.0.0');
    expect(parsed.exportRecordType).toBeUndefined();
  });

  it('includeEvaluations adds evaluation envelope without mutating play', () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      eventId: 'evt-eval',
      legalMoves: [{ suit: 'clubs', rank: '2', id: '2c' }],
      chosenCard: { suit: 'clubs', rank: '2', id: '2c' },
    });
    const before = JSON.stringify(play);
    const { lines } = buildJsonlLines([play], [], {
      includeEvaluations: true,
    });
    expect(JSON.stringify(play)).toBe(before);
    const types = lines.map((l) => JSON.parse(l).exportRecordType);
    expect(types).toContain('card_decision_log');
    expect(types).toContain('evaluation');
  });
});
