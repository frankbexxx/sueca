import {
  settleFourByThree,
  settleNegativeFesta,
  settleNullAuctionFesta,
  settlePositiveAuctionRound,
  sumScores
} from './kingScoring';

describe('kingScoring', () => {
  it('negative festa sums to +325', () => {
    const tricks = [3, 4, 3, 3];
    expect(sumScores(settleNegativeFesta(tricks))).toBe(325);
  });

  it('4x3x3 sums to +325', () => {
    const split = settleFourByThree();
    expect(split.owner + split.others * 3).toBe(325);
  });

  it('positive auction round sums to +325', () => {
    const tricks = [0, 4, 4, 5];
    const deltas = settlePositiveAuctionRound(6, tricks, 0, 1);
    expect(sumScores(deltas)).toBe(325);
    expect(deltas[0]).toBe(150);
    expect(deltas[1]).toBe(-50);
  });

  it('null auction festa sums to +325', () => {
    const tricks = [2, 4, 3, 4];
    const deltas = settleNullAuctionFesta(tricks, 0, 1, 2);
    expect(sumScores(deltas)).toBe(325);
  });
});
