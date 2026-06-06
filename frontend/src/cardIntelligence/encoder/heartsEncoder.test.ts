import { createTestLogEvent, encodeDecisionState } from './encodeDecisionState';
import { HeartsEncoding } from './types';

const card = (suit: 'hearts' | 'spades', rank: string, id: string) =>
  ({ suit, rank, id }) as import('../../types/game').Card;

describe('heartsEncoder', () => {
  it('includes queen points and dangerous cards', () => {
    const event = createTestLogEvent({
      variant: 'hearts',
      handBefore: [card('hearts', 'K', 'Kh'), card('spades', 'Q', 'Qs')],
      legalMoves: [card('hearts', 'K', 'Kh'), card('spades', 'Q', 'Qs')],
      chosenCard: card('hearts', '2', '2h'),
      trickBefore: [{ suit: 'clubs', rank: '2', id: '2c' }],
      trickAfter: [
        { suit: 'clubs', rank: '2', id: '2c' },
        { suit: 'hearts', rank: '2', id: '2h' },
      ],
      variantFields: { heartsBroken: false, passDirection: 'left' },
      roundPlayHistory: [
        {
          roundIndex: 0,
          trickIndex: 0,
          turnIndex: 0,
          playerIndex: 1,
          card: card('spades', 'Q', 'Qs-played'),
        },
      ],
    });
    const enc = encodeDecisionState({ event }).variantEncoding as HeartsEncoding;
    expect(enc.queenSpadesPlayed).toBe(true);
    expect(enc.dangerousCardsInHand.length).toBeGreaterThan(0);
    expect(enc.pointsInTrick).toBeGreaterThan(0);
    expect(enc.moonThreatLevel).toBeNull();
  });

  it('moonThreatLevel null when hearts not broken', () => {
    const event = createTestLogEvent({
      variant: 'hearts',
      variantFields: { heartsBroken: false, passDirection: 'left' },
      roundPlayHistory: [
        {
          roundIndex: 0,
          trickIndex: 0,
          turnIndex: 0,
          playerIndex: 1,
          card: card('hearts', '3', '3h'),
        },
      ],
    });
    const enc = encodeDecisionState({ event }).variantEncoding as HeartsEncoding;
    expect(enc.moonThreatLevel).toBeNull();
  });

  it('moonThreatLevel possible when hearts broken and candidate has 4+ hearts', () => {
    const history = [0, 1, 2, 3].map((i) => ({
      roundIndex: 0,
      trickIndex: i,
      turnIndex: 0,
      playerIndex: 1,
      card: card('hearts', String(i + 2) as '2', `h${i}`),
    }));
    const event = createTestLogEvent({
      variant: 'hearts',
      variantFields: { heartsBroken: true, passDirection: 'left' },
      roundPlayHistory: history,
    });
    const enc = encodeDecisionState({ event }).variantEncoding as HeartsEncoding;
    expect(enc.moonThreatLevel).toBe('possible');
  });
});
