import { createTestLogEvent, encodeDecisionState } from './encodeDecisionState';
import { KingEncoding } from './types';

const kh = { suit: 'hearts' as const, rank: 'K' as const, id: 'Kh' };
const c2 = { suit: 'clubs' as const, rank: '2' as const, id: '2c' };

describe('kingEncoder', () => {
  it('mustPlayKingHeartsNow true for no_king_hearts lead', () => {
    const event = createTestLogEvent({
      variant: 'king',
      handBefore: [kh, c2],
      legalMoves: [kh, c2],
      chosenCard: kh,
      contract: 'no_king_hearts',
      variantFields: {
        contractId: 'no_king_hearts',
        contractType: 'no_king_hearts',
        festaPhase: null,
        noTrump: false,
        syntheticMode: false,
      },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as KingEncoding;
    expect(enc.mustPlayKingHeartsNow).toBe(true);
    expect(enc.contractId).toBe('no_king_hearts');
  });

  it('mustPlayKingHeartsNow false for other contracts', () => {
    const event = createTestLogEvent({
      variant: 'king',
      handBefore: [kh],
      legalMoves: [kh],
      chosenCard: kh,
      variantFields: {
        contractId: 'no_hearts',
        contractType: 'no_hearts',
        festaPhase: null,
        noTrump: false,
        syntheticMode: false,
      },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as KingEncoding;
    expect(enc.mustPlayKingHeartsNow).toBe(false);
  });
});
