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

  describe('positive auction fixed transfer (Model 3)', () => {
    it('Caso A: offer 5, tricks [0,3,5,5] → [125,-50,125,125]', () => {
      const deltas = settlePositiveAuctionRound(5, [0, 3, 5, 5], 0, 1);
      expect(deltas).toEqual([125, -50, 125, 125]);
      expect(sumScores(deltas)).toBe(325);
    });

    it('Caso B (critical): offer 5, tricks [2,3,4,4] → [175,-50,100,100] not top-up', () => {
      const deltas = settlePositiveAuctionRound(5, [2, 3, 4, 4], 0, 1);
      expect(deltas).toEqual([175, -50, 100, 100]);
      expect(deltas).not.toEqual([125, 0, 100, 100]);
      expect(sumScores(deltas)).toBe(325);
    });

    it('Caso C: offer 5, tricks [2,5,3,3] → [175,0,75,75]', () => {
      const deltas = settlePositiveAuctionRound(5, [2, 5, 3, 3], 0, 1);
      expect(deltas).toEqual([175, 0, 75, 75]);
      expect(sumScores(deltas)).toBe(325);
    });

    it('Caso D: offer 5, tricks [0,7,3,3] → [125,50,75,75]', () => {
      const deltas = settlePositiveAuctionRound(5, [0, 7, 3, 3], 0, 1);
      expect(deltas).toEqual([125, 50, 75, 75]);
      expect(sumScores(deltas)).toBe(325);
    });

    it('Caso E: offer 5, tricks [6,2,3,2] → [275,-75,75,50]', () => {
      const deltas = settlePositiveAuctionRound(5, [6, 2, 3, 2], 0, 1);
      expect(deltas).toEqual([275, -75, 75, 50]);
      expect(sumScores(deltas)).toBe(325);
      // Beneficiary keeps real tricks above nominal contract; no clamp / no top-up rewrite
      expect(deltas[0]).toBeGreaterThan(5 * 25);
      expect(deltas[1]).toBeLessThan(0);
    });

    it('offer 8 transfers 200', () => {
      const deltas = settlePositiveAuctionRound(8, [1, 4, 4, 4], 0, 1);
      expect(deltas).toEqual([1 * 25 + 200, 4 * 25 - 200, 100, 100]);
      expect(deltas).toEqual([225, -100, 100, 100]);
      expect(sumScores(deltas)).toBe(325);
    });

    it('legacy B=0 offer-6 example still sums to 325 with fixed transfer', () => {
      const deltas = settlePositiveAuctionRound(6, [0, 4, 4, 5], 0, 1);
      expect(deltas).toEqual([150, -50, 100, 125]);
      expect(sumScores(deltas)).toBe(325);
    });
  });

  it('null auction festa sums to +325 (unchanged)', () => {
    const tricks = [2, 4, 3, 4];
    const deltas = settleNullAuctionFesta(tricks, 0, 1, 2);
    expect(sumScores(deltas)).toBe(325);
    // Base nulos + fixed null transfer 2×75
    expect(deltas[0]).toBe(325 - 75 * 2 + 150);
    expect(deltas[1]).toBe(325 - 75 * 4 - 150);
  });
});
