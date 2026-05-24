import { KingBid, KingBidType } from './kingContracts';

export const POSITIVE_TRICK_VALUE = 25;
export const NULL_TRICK_VALUE = 75;
export const POSITIVE_TO_NULL_RATIO = 3;
export const WEAK_BID_POSITIVE_THRESHOLD = 4;
export const MAX_POSITIVE_BID = 8;
export const MAX_NULL_BID = 4;

/** Absolute point value of a bid (3 positive = 1 null). */
export function bidAbsoluteValue(bid: Pick<KingBid, 'bidType' | 'amount'>): number {
  return bid.bidType === 'positive'
    ? bid.amount * POSITIVE_TRICK_VALUE
    : bid.amount * NULL_TRICK_VALUE;
}

/** Equivalent positive tricks for comparison (fractional for nulls). */
export function bidEquivalentPositive(bid: Pick<KingBid, 'bidType' | 'amount'>): number {
  return bid.bidType === 'positive'
    ? bid.amount
    : bid.amount * POSITIVE_TO_NULL_RATIO;
}

export function auctionBidderOrder(beneficiaryIndex: number): number[] {
  return [
    (beneficiaryIndex + 1) % 4,
    (beneficiaryIndex + 2) % 4,
    (beneficiaryIndex + 3) % 4
  ];
}

/** Earlier bidders in order have preference on equal value. */
export function bidderPreferenceRank(bidderIndex: number, order: number[]): number {
  return order.indexOf(bidderIndex);
}

export function canBeatBid(
  current: KingBid | null,
  challenger: KingBid,
  order: number[]
): boolean {
  if (!current) return true;
  const curVal = bidAbsoluteValue(current);
  const newVal = bidAbsoluteValue(challenger);
  if (newVal > curVal) return true;
  if (newVal < curVal) return false;
  return bidderPreferenceRank(challenger.bidderIndex, order) <
    bidderPreferenceRank(current.bidderIndex, order);
}

export function isWeakBid(best: KingBid | null): boolean {
  if (!best) return true;
  return bidEquivalentPositive(best) < WEAK_BID_POSITIVE_THRESHOLD;
}

export function canUseFourThreeThree(best: KingBid | null): boolean {
  return isWeakBid(best);
}

export function formatBid(bid: KingBid, locale: 'pt' | 'en' = 'pt'): string {
  if (bid.bidType === 'positive') {
    return locale === 'pt' ? `${bid.amount} positivas` : `${bid.amount} positive`;
  }
  return locale === 'pt' ? `${bid.amount} nulos` : `${bid.amount} nulls`;
}

export function clampBid(bidType: KingBidType, amount: number): number {
  if (bidType === 'positive') {
    return Math.max(1, Math.min(MAX_POSITIVE_BID, Math.round(amount)));
  }
  return Math.max(1, Math.min(MAX_NULL_BID, Math.round(amount)));
}

/** Minimum bid to beat current best (for AI / UI hints). */
export function minBidToBeat(current: KingBid | null, order: number[], bidderIndex: number): KingBid | null {
  if (!current) {
    return { bidderIndex, bidType: 'positive', amount: 1 };
  }
  const pref = bidderPreferenceRank(bidderIndex, order);
  const curPref = bidderPreferenceRank(current.bidderIndex, order);
  if (pref < curPref) {
    return { bidderIndex, bidType: current.bidType, amount: current.amount };
  }
  if (current.bidType === 'positive') {
    return { bidderIndex, bidType: 'positive', amount: clampBid('positive', current.amount + 1) };
  }
  const eqPos = current.amount * POSITIVE_TO_NULL_RATIO;
  return { bidderIndex, bidType: 'positive', amount: clampBid('positive', eqPos + 1) };
}
