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

/** Equivalent positive tricks for comparison (1 nulo = 3V, 2 nulos = 6V, …). */
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

/** Earlier bidders in order have preference on equal value (lower rank = better). */
export function bidderPreferenceRank(bidderIndex: number, order: number[]): number {
  return order.indexOf(bidderIndex);
}

export type KingOfferCompareResult = 'beats' | 'loses' | 'equal_no_preference';

/**
 * Compare candidate vs standing offer: equivalent value first, then preference.
 * `beats` ⇒ candidate may become the new standing leader.
 */
export function compareKingOffers(
  candidate: KingBid,
  standing: KingBid | null,
  preferenceOrder: number[]
): KingOfferCompareResult {
  if (!standing) return 'beats';
  const candVal = bidEquivalentPositive(candidate);
  const standVal = bidEquivalentPositive(standing);
  if (candVal > standVal) return 'beats';
  if (candVal < standVal) return 'loses';
  const candPref = bidderPreferenceRank(candidate.bidderIndex, preferenceOrder);
  const standPref = bidderPreferenceRank(standing.bidderIndex, preferenceOrder);
  if (candPref >= 0 && standPref >= 0 && candPref < standPref) return 'beats';
  return 'equal_no_preference';
}

/** @deprecated Prefer compareKingOffers — kept for call-site compatibility. */
export function canBeatBid(
  current: KingBid | null,
  challenger: KingBid,
  order: number[]
): boolean {
  return compareKingOffers(challenger, current, order) === 'beats';
}

export function isWeakBid(best: KingBid | null): boolean {
  if (!best) return true;
  return bidEquivalentPositive(best) < WEAK_BID_POSITIVE_THRESHOLD;
}

/**
 * 4×3×3 allowed only if historical watermark &lt; 4 equivalent positives.
 * Pass `highestEquivalentValue` when available; otherwise fall back to standing bid.
 */
export function canUseFourThreeThree(
  best: KingBid | null,
  highestEquivalentValue?: number
): boolean {
  if (typeof highestEquivalentValue === 'number') {
    return highestEquivalentValue < WEAK_BID_POSITIVE_THRESHOLD;
  }
  return isWeakBid(best);
}

export function formatBid(bid: KingBid, locale: 'pt' | 'en' = 'pt'): string {
  if (bid.bidType === 'positive') {
    return locale === 'pt' ? `${bid.amount} positivas` : `${bid.amount} positive`;
  }
  return locale === 'pt' ? `${bid.amount} nulos` : `${bid.amount} nulls`;
}

export function formatAuctionActionShort(
  action: KingBid | 'pass',
  locale: 'pt' | 'en' = 'pt'
): string {
  if (action === 'pass') {
    return locale === 'pt' ? 'Passou' : 'Pass';
  }
  if (action.bidType === 'positive') {
    return locale === 'pt' ? `${action.amount} pos.` : `${action.amount} pos.`;
  }
  return locale === 'pt' ? `${action.amount} nul.` : `${action.amount} null`;
}

export function clampBid(bidType: KingBidType, amount: number): number {
  if (bidType === 'positive') {
    return Math.max(1, Math.min(MAX_POSITIVE_BID, Math.round(amount)));
  }
  return Math.max(1, Math.min(MAX_NULL_BID, Math.round(amount)));
}

/** Next active seat after `fromSeat` in preference/table order (wraps). */
export function nextActiveBidder(
  order: number[],
  activeBidders: number[],
  fromSeat: number,
  options?: { skipSeat?: number | null }
): number | null {
  if (activeBidders.length === 0) return null;
  const active = new Set(activeBidders);
  const skip = options?.skipSeat;
  const start = order.indexOf(fromSeat);
  if (start < 0) {
    return activeBidders.find((s) => s !== skip) ?? activeBidders[0] ?? null;
  }
  for (let step = 1; step <= order.length; step++) {
    const seat = order[(start + step) % order.length];
    if (!active.has(seat)) continue;
    if (skip != null && seat === skip && activeBidders.length > 1) continue;
    return seat;
  }
  return activeBidders.find((s) => s !== skip) ?? activeBidders[0] ?? null;
}

/** Sync auctionTurnIndex with currentBidder for legacy UI. */
export function auctionTurnIndexForSeat(order: number[], seat: number | null): number {
  if (seat === null) return Math.max(0, order.length);
  const idx = order.indexOf(seat);
  return idx >= 0 ? idx : 0;
}

/** Minimum bid to beat current standing (for AI / UI hints). */
export function minBidToBeat(
  current: KingBid | null,
  order: number[],
  bidderIndex: number
): KingBid | null {
  if (!current) {
    return { bidderIndex, bidType: 'positive', amount: 1 };
  }
  const pref = bidderPreferenceRank(bidderIndex, order);
  const curPref = bidderPreferenceRank(current.bidderIndex, order);
  // Better preference may equalize on equivalent value (prefer positive form of eq).
  if (pref < curPref) {
    const eq = bidEquivalentPositive(current);
    if (eq <= MAX_POSITIVE_BID && eq === Math.floor(eq)) {
      return { bidderIndex, bidType: 'positive', amount: eq };
    }
    return { bidderIndex, bidType: current.bidType, amount: current.amount };
  }
  if (current.bidType === 'positive') {
    const next = current.amount + 1;
    if (next > MAX_POSITIVE_BID) return null;
    return { bidderIndex, bidType: 'positive', amount: next };
  }
  const eqPos = current.amount * POSITIVE_TO_NULL_RATIO;
  const nextPos = eqPos + 1;
  if (nextPos > MAX_POSITIVE_BID) return null;
  return { bidderIndex, bidType: 'positive', amount: nextPos };
}
