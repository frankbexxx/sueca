import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { evaluateStoredPlay } from './evaluateStoredEvents';
import { filterLogEvents, splitLogEvents, summarizeLogEvents } from './readLogs';

describe('readLogs', () => {
  it('filterLogEvents by gameId', () => {
    const a = createTestLogEvent({ variant: 'sueca', gameId: 'g1', eventId: 'e1' });
    const b = createTestLogEvent({ variant: 'sueca', gameId: 'g2', eventId: 'e2' });
    const filtered = filterLogEvents([a, b], { gameId: 'g1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].eventId).toBe('e1');
  });

  it('summarize counts variants', () => {
    const play = createTestLogEvent({ variant: 'king' });
    const summary = summarizeLogEvents([play]);
    expect(summary.plays).toBe(1);
    expect(summary.byVariantPlays).toEqual({ king: 1 });
  });
});

describe('evaluateStoredPlay immutability', () => {
  it('does not mutate play object', () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      eventId: 'immutable-1',
      legalMoves: [{ suit: 'clubs', rank: '2', id: '2c' }],
      chosenCard: { suit: 'clubs', rank: '2', id: '2c' },
    });
    const snapshot = JSON.stringify(play);
    evaluateStoredPlay(play, []);
    expect(JSON.stringify(play)).toBe(snapshot);
  });

  it('returns evaluation with player view by default', () => {
    const play = createTestLogEvent({
      variant: 'sueca',
      legalMoves: [{ suit: 'clubs', rank: '2', id: '2c' }],
      chosenCard: { suit: 'clubs', rank: '2', id: '2c' },
    });
    const result = evaluateStoredPlay(play, []);
    expect(result.evaluation?.viewTypeUsed).toBe('player');
  });
});

describe('splitLogEvents', () => {
  it('separates plays from trick ends', () => {
    const play = createTestLogEvent({ variant: 'sueca' });
    const { plays, trickEnds } = splitLogEvents([play]);
    expect(plays).toHaveLength(1);
    expect(trickEnds).toHaveLength(0);
  });
});
