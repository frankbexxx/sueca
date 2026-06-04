import { createTestLogEvent, encodeDecisionState } from './encodeDecisionState';
import { KingEncoding } from './types';

const kh = { suit: 'hearts' as const, rank: 'K' as const, id: 'Kh' };
const c2 = { suit: 'clubs' as const, rank: '2' as const, id: '2c' };
const h5 = { suit: 'hearts' as const, rank: '5' as const, id: '5h' };

const kingPtFields = {
  contractId: null,
  contractType: null,
  festaPhase: null,
  noTrump: false,
  syntheticMode: false,
} as const;

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

  it('resolves contractId from scoreBefore.raw.variantState.kingPt.contract', () => {
    const event = createTestLogEvent({
      variant: 'king',
      contract: null,
      variantFields: { ...kingPtFields },
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_tricks' },
            rulesPresetId: 'king-pt-normal',
          },
        },
      },
    });
    const encoded = encodeDecisionState({ event });
    const enc = encoded.variantEncoding as KingEncoding;
    expect(enc.contractId).toBe('no_tricks');
    expect(encoded.contractId).toBe('no_tricks');
  });

  it('mustPlayKingHeartsNow true when roundPlayHistory includes current K♥ play', () => {
    const playEntry = {
      roundIndex: 0,
      trickIndex: 0,
      turnIndex: 0,
      playerIndex: 2,
      card: kh,
    };
    const event = createTestLogEvent({
      variant: 'king',
      playerIndex: 2,
      turnIndex: 0,
      trickIndex: 0,
      handBefore: [kh, c2],
      legalMoves: [kh, c2],
      chosenCard: kh,
      trickBefore: [],
      ledSuit: null,
      contract: null,
      variantFields: { ...kingPtFields },
      roundPlayHistory: [playEntry],
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_king_hearts' },
          },
        },
      },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as KingEncoding;
    expect(enc.contractId).toBe('no_king_hearts');
    expect(enc.kingHeartsPlayed).toBe(false);
    expect(enc.mustPlayKingHeartsNow).toBe(true);
  });

  it('kingHeartsPlayed true and mustPlayKingHeartsNow false after K♥ was played', () => {
    const event = createTestLogEvent({
      variant: 'king',
      playerIndex: 0,
      handBefore: [h5, c2],
      legalMoves: [h5, c2],
      chosenCard: h5,
      contract: null,
      variantFields: { ...kingPtFields },
      roundPlayHistory: [
        {
          roundIndex: 0,
          trickIndex: 0,
          turnIndex: 0,
          playerIndex: 2,
          card: kh,
        },
      ],
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_king_hearts' },
          },
        },
      },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as KingEncoding;
    expect(enc.kingHeartsPlayed).toBe(true);
    expect(enc.mustPlayKingHeartsNow).toBe(false);
  });

  it('mustPlayKingHeartsNow false for other contracts', () => {
    const event = createTestLogEvent({
      variant: 'king',
      handBefore: [kh],
      legalMoves: [kh],
      chosenCard: kh,
      contract: null,
      variantFields: { ...kingPtFields },
      scoreBefore: {
        raw: {
          variantState: {
            kingPt: { contract: 'no_hearts' },
          },
        },
      },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as KingEncoding;
    expect(enc.contractId).toBe('no_hearts');
    expect(enc.mustPlayKingHeartsNow).toBe(false);
  });
});
