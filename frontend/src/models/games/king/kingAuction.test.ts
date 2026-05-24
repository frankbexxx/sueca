import {
  auctionBidderOrder,
  bidAbsoluteValue,
  bidEquivalentPositive,
  canBeatBid,
  canUseFourThreeThree,
  isWeakBid
} from './kingAuction';
import { KingBid } from './kingContracts';

describe('kingAuction', () => {
  const order = auctionBidderOrder(0);

  it('orders bidders after beneficiary', () => {
    expect(order).toEqual([1, 2, 3]);
  });

  it('equates 3 positive to 1 null', () => {
    expect(bidAbsoluteValue({ bidType: 'positive', amount: 3, bidderIndex: 1 })).toBe(75);
    expect(bidAbsoluteValue({ bidType: 'null', amount: 1, bidderIndex: 1 })).toBe(75);
  });

  it('earlier bidder keeps preference on equal value', () => {
    const first: KingBid = { bidderIndex: 1, bidType: 'positive', amount: 3 };
    const second: KingBid = { bidderIndex: 2, bidType: 'null', amount: 1 };
    expect(canBeatBid(first, second, order)).toBe(false);
    expect(canBeatBid(null, first, order)).toBe(true);
    expect(canBeatBid(first, { bidderIndex: 2, bidType: 'positive', amount: 4 }, order)).toBe(true);
  });

  it('detects weak bids below 4 positive equivalent', () => {
    expect(isWeakBid({ bidderIndex: 1, bidType: 'positive', amount: 3 })).toBe(true);
    expect(isWeakBid({ bidderIndex: 1, bidType: 'positive', amount: 4 })).toBe(false);
    expect(isWeakBid({ bidderIndex: 1, bidType: 'null', amount: 1 })).toBe(true);
    expect(isWeakBid(null)).toBe(true);
  });

  it('gates 4x3x3 on weak bids', () => {
    expect(canUseFourThreeThree(null)).toBe(true);
    expect(canUseFourThreeThree({ bidderIndex: 1, bidType: 'positive', amount: 3 })).toBe(true);
    expect(canUseFourThreeThree({ bidderIndex: 1, bidType: 'positive', amount: 4 })).toBe(false);
    expect(bidEquivalentPositive({ bidType: 'null', amount: 1, bidderIndex: 1 })).toBe(3);
  });
});
