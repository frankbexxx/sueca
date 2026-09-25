import type { Card, Rank, Suit } from '../../../types/game';
import { auctionBidderOrder } from '../../../models/games/king/kingAuction';
import {
  decideAiAuctionBid,
  estimateNullBidCeiling,
  estimatePositiveBidCeiling
} from './kingAuctionHandEval';

const c = (rank: Rank, suit: Suit, id: string): Card => ({ rank, suit, id });

/** Weak scattered lows — should not open / escalate. */
function weakPositiveHand(): Card[] {
  return [
    c('2', 'clubs', '1'),
    c('3', 'clubs', '2'),
    c('4', 'diamonds', '3'),
    c('5', 'diamonds', '4'),
    c('6', 'hearts', '5'),
    c('8', 'hearts', '6'),
    c('9', 'spades', '7'),
    c('10', 'spades', '8'),
    c('Q', 'clubs', '9'),
    c('Q', 'diamonds', '10'),
    c('2', 'hearts', '11'),
    c('3', 'spades', '12'),
    c('4', 'spades', '13')
  ];
}

/** Long suit with controls — mid ceiling. */
function mediumPositiveHand(): Card[] {
  return [
    c('A', 'spades', '1'),
    c('7', 'spades', '2'),
    c('K', 'spades', '3'),
    c('J', 'spades', '4'),
    c('6', 'spades', '5'),
    c('5', 'spades', '6'),
    c('A', 'hearts', '7'),
    c('3', 'hearts', '8'),
    c('2', 'clubs', '9'),
    c('4', 'clubs', '10'),
    c('Q', 'diamonds', '11'),
    c('8', 'diamonds', '12'),
    c('9', 'diamonds', '13')
  ];
}

/** Exceptional long trump + side entries — can reach 8. */
function exceptionalPositiveHand(): Card[] {
  return [
    c('A', 'hearts', '1'),
    c('7', 'hearts', '2'),
    c('K', 'hearts', '3'),
    c('J', 'hearts', '4'),
    c('Q', 'hearts', '5'),
    c('6', 'hearts', '6'),
    c('5', 'hearts', '7'),
    c('A', 'spades', '8'),
    c('7', 'spades', '9'),
    c('K', 'clubs', '10'),
    c('A', 'diamonds', '11'),
    c('7', 'diamonds', '12'),
    c('J', 'clubs', '13')
  ];
}

/** Void + lows — nulos-friendly shape. */
function strongNullHand(): Card[] {
  return [
    c('2', 'clubs', '1'),
    c('3', 'clubs', '2'),
    c('4', 'clubs', '3'),
    c('5', 'clubs', '4'),
    c('6', 'clubs', '5'),
    c('8', 'clubs', '6'),
    c('9', 'clubs', '7'),
    c('2', 'diamonds', '8'),
    c('3', 'diamonds', '9'),
    c('4', 'diamonds', '10'),
    c('2', 'hearts', '11'),
    c('3', 'hearts', '12'),
    c('4', 'hearts', '13')
    // void spades
  ];
}

describe('kingAuctionHandEval (AI-KING-AUCTION-01)', () => {
  const order = auctionBidderOrder(0);

  it('weak hand: low ceiling and passes when opening', () => {
    const hand = weakPositiveHand();
    expect(estimatePositiveBidCeiling(hand, 'medium')).toBeLessThan(4);
    expect(decideAiAuctionBid({ hand, standing: null, auctionOrder: order, seat: 1 })).toEqual({
      action: 'pass'
    });
  });

  it('medium hand: mid ceiling; opens modest positive; stops below 8', () => {
    const hand = mediumPositiveHand();
    const ceil = estimatePositiveBidCeiling(hand, 'medium');
    expect(ceil).toBeGreaterThanOrEqual(3);
    expect(ceil).toBeLessThanOrEqual(7);
    const open = decideAiAuctionBid({
      hand,
      standing: null,
      auctionOrder: order,
      seat: 1
    });
    expect(open.action).toBe('bid');
    if (open.action === 'bid') {
      expect(open.bidType).toBe('positive');
      expect(open.amount).toBeLessThanOrEqual(ceil);
      expect(open.amount).toBeLessThanOrEqual(3);
    }
    // Later preference must raise above standing — pass when next amount > ceiling.
    const raise = decideAiAuctionBid({
      hand,
      standing: { bidderIndex: 1, bidType: 'positive', amount: ceil },
      auctionOrder: order,
      seat: 3
    });
    expect(raise).toEqual({ action: 'pass' });
  });

  it('exceptional hand: ceiling can be 8 and can raise toward 8', () => {
    const hand = exceptionalPositiveHand();
    expect(estimatePositiveBidCeiling(hand, 'hard')).toBe(8);
    const d = decideAiAuctionBid({
      hand,
      standing: { bidderIndex: 1, bidType: 'positive', amount: 7 },
      auctionOrder: order,
      seat: 2,
      difficulty: 'hard'
    });
    expect(d).toEqual({ action: 'bid', bidType: 'positive', amount: 8 });
  });

  it('strong nulos hand: prefers null open when legal', () => {
    const hand = strongNullHand();
    expect(estimateNullBidCeiling(hand, 'medium')).toBeGreaterThanOrEqual(2);
    const open = decideAiAuctionBid({
      hand,
      standing: null,
      auctionOrder: order,
      seat: 1
    });
    expect(open).toEqual({ action: 'bid', bidType: 'null', amount: 2 });
  });

  it('respects standing legal floor: cannot underbid', () => {
    const hand = mediumPositiveHand();
    // Worse preference than standing must bid amount+1.
    const d = decideAiAuctionBid({
      hand,
      standing: { bidderIndex: 1, bidType: 'positive', amount: 5 },
      auctionOrder: order,
      seat: 2
    });
    expect(d.action).toBe('bid');
    if (d.action === 'bid') {
      expect(d.bidType).toBe('positive');
      expect(d.amount).toBe(6);
    }
  });
});
