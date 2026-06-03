import {
  computeMustPlayKingHeartsNow,
  kingHeartsPlayedInHistory,
} from './kingObligations';

const kh = { suit: 'hearts' as const, rank: 'K' as const, id: 'Kh' };
const c2 = { suit: 'clubs' as const, rank: '2' as const, id: '2c' };

describe('kingObligations', () => {
  it('detects king hearts in history', () => {
    expect(
      kingHeartsPlayedInHistory([
        {
          roundIndex: 0,
          trickIndex: 0,
          turnIndex: 0,
          playerIndex: 1,
          card: kh,
        },
      ])
    ).toBe(true);
  });

  it('mustPlayKingHeartsNow true on first legal opportunity', () => {
    expect(
      computeMustPlayKingHeartsNow({
        hand: [kh, c2],
        legalMoves: [kh, c2],
        ledSuit: null,
        trickBefore: [],
        contractId: 'no_king_hearts',
        roundPlayHistory: [],
      })
    ).toBe(true);
  });

  it('mustPlayKingHeartsNow false when K hearts already played', () => {
    expect(
      computeMustPlayKingHeartsNow({
        hand: [kh],
        legalMoves: [kh],
        ledSuit: null,
        trickBefore: [],
        contractId: 'no_king_hearts',
        roundPlayHistory: [
          {
            roundIndex: 0,
            trickIndex: 0,
            turnIndex: 0,
            playerIndex: 2,
            card: kh,
          },
        ],
      })
    ).toBe(false);
  });

  it('mustPlayKingHeartsNow false when must follow led suit', () => {
    const h3 = { suit: 'hearts' as const, rank: '3' as const, id: '3h' };
    expect(
      computeMustPlayKingHeartsNow({
        hand: [kh, h3],
        legalMoves: [h3],
        ledSuit: 'hearts',
        trickBefore: [c2],
        contractId: 'no_king_hearts',
        roundPlayHistory: [],
      })
    ).toBe(false);
  });
});
