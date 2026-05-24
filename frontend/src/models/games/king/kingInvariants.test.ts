import {
  KING_NEGATIVE_CONTRACTS,
  KING_TOTAL_NEGATIVE,
  KING_TOTAL_POSITIVE
} from './kingContracts';
import {
  settleFourByThree,
  settleNegativeFesta,
  settleNullAuctionFesta,
  settlePositiveAuctionRound,
  sumScores
} from './kingScoring';
import { bidAbsoluteValue, canBeatBid } from './kingAuction';
import { festaOwner, gameLeader } from '../KingPtGame';

describe('kingInvariants', () => {
  it('negative contract totals sum to -1300', () => {
    const total = KING_NEGATIVE_CONTRACTS.reduce((s, c) => s + c.totalPoints, 0);
    expect(total).toBe(KING_TOTAL_NEGATIVE);
  });

  it('positive festa settlements sum to +325', () => {
    expect(sumScores(settleNegativeFesta([3, 4, 3, 3]))).toBe(325);
    const split = settleFourByThree();
    expect(split.owner + split.others * 3).toBe(325);
    const pos = settlePositiveAuctionRound(6, [0, 4, 4, 5], 0, 1);
    expect(sumScores(pos)).toBe(325);
    const nul = settleNullAuctionFesta([2, 4, 3, 4], 0, 1, 2);
    expect(sumScores(nul)).toBe(325);
  });

  it('global positive budget is 1300 for 4 festas', () => {
    expect(KING_TOTAL_POSITIVE).toBe(4 * 325);
  });

  it('KOH rotation aligns first festa owner', () => {
    for (let koh = 0; koh < 4; koh++) {
      expect(festaOwner(koh, 6)).toBe(koh);
      expect(gameLeader(koh, 0)).toBe((koh + 2) % 4);
    }
  });

  it('bid preference: equal value keeps earlier bidder', () => {
    const order = [1, 2, 3];
    const first = { bidderIndex: 1, bidType: 'positive' as const, amount: 3 };
    const second = { bidderIndex: 2, bidType: 'null' as const, amount: 1 };
    expect(bidAbsoluteValue(first)).toBe(bidAbsoluteValue(second));
    expect(canBeatBid(first, second, order)).toBe(false);
    expect(canBeatBid(first, { bidderIndex: 2, bidType: 'positive', amount: 4 }, order)).toBe(true);
  });
});
