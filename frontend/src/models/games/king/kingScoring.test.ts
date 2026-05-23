import {
  negativeTrickPenalty,
  settleNegativeFesta,
  settlePositiveAuction,
  sumScores
} from './kingScoring';

describe('kingScoring', () => {
  it('no_tricks penalty is 20 per trick', () => {
    expect(negativeTrickPenalty('no_tricks', [], 1)).toBe(20);
  });

  it('no_hearts sums hearts in trick', () => {
    const trick = [
      { id: '1', rank: '3' as const, suit: 'hearts' as const },
      { id: '2', rank: '5' as const, suit: 'hearts' as const }
    ];
    expect(negativeTrickPenalty('no_hearts', trick, 1)).toBe(40);
  });

  it('negative festa settlements sum to 325', () => {
    const tricks = [13, 0, 0, 0];
    const settlements = settleNegativeFesta(tricks);
    expect(sumScores(settlements)).toBe(325);
  });

  it('positive auction penalizes bidder shortfall', () => {
    const { ownerGain, bidderPenalty } = settlePositiveAuction(5, 3);
    expect(ownerGain).toBe(125);
    expect(bidderPenalty).toBe(50);
  });
});
