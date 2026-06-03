import { createTestLogEvent } from './encodeDecisionState';
import { encodeDecisionState } from './encodeDecisionState';
import { SuecaEncoding } from './types';

const card = (suit: 'clubs' | 'spades', rank: string, id: string) =>
  ({ suit, rank, id }) as import('../../types/game').Card;

describe('suecaEncoder', () => {
  it('includes trump partner and seen cards', () => {
    const event = createTestLogEvent({
      variant: 'sueca',
      playerIndex: 0,
      trumpSuit: 'spades',
      handBefore: [card('clubs', '7', '7c')],
      legalMoves: [card('clubs', '7', '7c')],
      chosenCard: card('clubs', '7', '7c'),
      roundPlayHistory: [
        {
          roundIndex: 0,
          trickIndex: 0,
          turnIndex: 0,
          playerIndex: 1,
          card: card('clubs', 'A', 'Ac'),
        },
      ],
      variantFields: { partnerIndex: 2, teamIndex: 1 },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as SuecaEncoding;
    expect(enc.partnerIndex).toBe(2);
    expect(enc.acesSeenBySuit.clubs).toBe(true);
    expect(enc.trumpSeenCount).toBe(0);
    expect(enc.cutRisk).toBeDefined();
  });
});
