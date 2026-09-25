import {
  auctionBidderOrder,
  amountAfterBidTypeChange,
  bidAbsoluteValue,
  bidEquivalentPositive,
  canBeatBid,
  canUseFourThreeThree,
  clampBidAmountForType,
  compareKingOffers,
  defaultBidAmountForType,
  formatAuctionActionShort,
  isWeakBid,
  maxBidAmountForType
} from './kingAuction';
import { KingBid } from './kingContracts';

describe('kingAuction', () => {
  const order = auctionBidderOrder(0);

  it('orders bidders after beneficiary', () => {
    expect(order).toEqual([1, 2, 3]);
  });

  it('UX-FESTA-02: bid amount defaults and type-switch', () => {
    expect(defaultBidAmountForType('positive')).toBe(3);
    expect(defaultBidAmountForType('null')).toBe(1);
    expect(maxBidAmountForType('positive')).toBe(8);
    expect(maxBidAmountForType('null')).toBe(4);
    expect(amountAfterBidTypeChange('null')).toBe(1);
    expect(amountAfterBidTypeChange('positive')).toBe(3);
    expect(amountAfterBidTypeChange('positive', 5)).toBe(5);
    expect(amountAfterBidTypeChange('null', 2)).toBe(2);
    expect(clampBidAmountForType('positive', 0)).toBe(1);
    expect(clampBidAmountForType('positive', 99)).toBe(8);
    expect(clampBidAmountForType('null', 99)).toBe(4);
    expect(clampBidAmountForType('positive', 3, 5)).toBe(5);
  });

  it('equates 3 positive to 1 null', () => {
    expect(bidAbsoluteValue({ bidType: 'positive', amount: 3, bidderIndex: 1 })).toBe(75);
    expect(bidAbsoluteValue({ bidType: 'null', amount: 1, bidderIndex: 1 })).toBe(75);
    expect(bidEquivalentPositive({ bidType: 'null', amount: 2, bidderIndex: 1 })).toBe(6);
    expect(bidEquivalentPositive({ bidType: 'null', amount: 3, bidderIndex: 1 })).toBe(9);
    expect(bidEquivalentPositive({ bidType: 'null', amount: 4, bidderIndex: 1 })).toBe(12);
  });

  it('earlier bidder keeps preference on equal value', () => {
    const first: KingBid = { bidderIndex: 1, bidType: 'positive', amount: 3 };
    const second: KingBid = { bidderIndex: 2, bidType: 'null', amount: 1 };
    expect(canBeatBid(first, second, order)).toBe(false);
    expect(canBeatBid(null, first, order)).toBe(true);
    expect(canBeatBid(first, { bidderIndex: 2, bidType: 'positive', amount: 4 }, order)).toBe(true);
    expect(compareKingOffers(second, first, order)).toBe('equal_no_preference');
    expect(compareKingOffers(first, second, order)).toBe('beats');
  });

  it('detects weak bids below 4 positive equivalent', () => {
    expect(isWeakBid({ bidderIndex: 1, bidType: 'positive', amount: 3 })).toBe(true);
    expect(isWeakBid({ bidderIndex: 1, bidType: 'positive', amount: 4 })).toBe(false);
    expect(isWeakBid({ bidderIndex: 1, bidType: 'null', amount: 1 })).toBe(true);
    expect(isWeakBid(null)).toBe(true);
  });

  it('gates 4x3x3 on watermark when provided', () => {
    expect(canUseFourThreeThree(null)).toBe(true);
    expect(canUseFourThreeThree({ bidderIndex: 1, bidType: 'positive', amount: 3 })).toBe(true);
    expect(canUseFourThreeThree({ bidderIndex: 1, bidType: 'positive', amount: 4 })).toBe(false);
    expect(canUseFourThreeThree(null, 3)).toBe(true);
    expect(canUseFourThreeThree(null, 4)).toBe(false);
    expect(
      canUseFourThreeThree({ bidderIndex: 1, bidType: 'positive', amount: 2 }, 5)
    ).toBe(false);
    expect(bidEquivalentPositive({ bidType: 'null', amount: 1, bidderIndex: 1 })).toBe(3);
  });

  it('formats short auction actions', () => {
    expect(formatAuctionActionShort('pass', 'pt')).toBe('Passou');
    expect(formatAuctionActionShort({ bidderIndex: 1, bidType: 'positive', amount: 3 }, 'pt')).toBe(
      '3 pos.'
    );
    expect(formatAuctionActionShort({ bidderIndex: 2, bidType: 'null', amount: 2 }, 'pt')).toBe(
      '2 nul.'
    );
  });
});
