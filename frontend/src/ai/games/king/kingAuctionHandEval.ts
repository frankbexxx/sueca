import type { AIDifficulty, Card, Suit } from '../../../types/game';
import { CARD_HIERARCHY } from '../../../types/game';
import type { KingBid, KingBidType } from '../../../models/games/king/kingContracts';
import {
  bidEquivalentPositive,
  canBeatBid,
  MAX_NULL_BID,
  MAX_POSITIVE_BID,
  minBidToBeat
} from '../../../models/games/king/kingAuction';

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];

/** High-trick ranks in Portuguese hierarchy (A, 7, K, J). */
function isStrongRank(rank: Card['rank']): boolean {
  return rank === 'A' || rank === '7' || rank === 'K' || rank === 'J';
}

function suitLength(hand: Card[], suit: Suit): number {
  return hand.filter((c) => c.suit === suit).length;
}

function strongInSuit(hand: Card[], suit: Suit): number {
  return hand.filter((c) => c.suit === suit && isStrongRank(c.rank)).length;
}

/**
 * Estimate max positive vazas this hand can reasonably bid (1–8).
 * Auction runs before trump choice — uses longest-suit proxy + high cards.
 * AI-KING-AUCTION-01: calibrated so weak hands stay low, mid hands cap ~4–7,
 * and only exceptional length+controls reach 8.
 */
export function estimatePositiveBidCeiling(
  hand: Card[],
  difficulty: AIDifficulty = 'medium'
): number {
  if (hand.length === 0) return 1;

  let bestSuit: Suit = 'clubs';
  let bestLen = -1;
  for (const suit of SUITS) {
    const len = suitLength(hand, suit);
    if (len > bestLen) {
      bestLen = len;
      bestSuit = suit;
    }
  }

  const trumpHigh = strongInSuit(hand, bestSuit);
  const sideHigh = SUITS.filter((s) => s !== bestSuit).reduce(
    (n, s) => n + strongInSuit(hand, s),
    0
  );
  const aceCount = hand.filter((c) => c.rank === 'A').length;
  const sevenCount = hand.filter((c) => c.rank === '7').length;

  // Length beyond 4 + control cards → rough trick ceiling (deterministic).
  let raw =
    Math.max(0, bestLen - 4) * 0.85 +
    trumpHigh * 0.7 +
    sideHigh * 0.35 +
    aceCount * 0.25 +
    sevenCount * 0.2;

  if (difficulty === 'easy') raw -= 1.0;
  if (difficulty === 'hard') raw += 0.7;

  const ceiling = Math.round(raw + 0.8);
  return Math.max(1, Math.min(MAX_POSITIVE_BID, ceiling));
}

/**
 * Estimate max nulos amount (1–4) this hand can bid.
 * Favours voids / singles / low cards / few strong ranks.
 */
export function estimateNullBidCeiling(
  hand: Card[],
  difficulty: AIDifficulty = 'medium'
): number {
  if (hand.length === 0) return 0;

  const lengths = SUITS.map((s) => suitLength(hand, s));
  const voids = lengths.filter((n) => n === 0).length;
  const singles = lengths.filter((n) => n === 1).length;
  const strong = hand.filter((c) => isStrongRank(c.rank)).length;
  const lowOnly = hand.filter((c) => CARD_HIERARCHY[c.rank] <= CARD_HIERARCHY['Q']).length;

  let raw = voids * 1.35 + singles * 0.65 + lowOnly * 0.06 - strong * 0.7;
  if (difficulty === 'easy') raw -= 0.6;
  if (difficulty === 'hard') raw += 0.45;

  // Require a real shape signal (void/single) before allowing nulos.
  if (voids + singles === 0 && raw < 1.6) return 0;
  if (raw < 1.0) return 0;
  return Math.max(1, Math.min(MAX_NULL_BID, Math.round(raw)));
}

export type AiAuctionDecision =
  | { action: 'pass' }
  | { action: 'bid'; bidType: KingBidType; amount: number };

/**
 * Deterministic Festa auction decision from hand strength + standing bid.
 * Some hands still reach 8; weak/medium hands pass or stop earlier.
 */
export function decideAiAuctionBid(args: {
  hand: Card[];
  standing: KingBid | null;
  auctionOrder: number[];
  seat: number;
  difficulty?: AIDifficulty;
}): AiAuctionDecision {
  const difficulty = args.difficulty ?? 'medium';
  const posCeil = estimatePositiveBidCeiling(args.hand, difficulty);
  const nullCeil = estimateNullBidCeiling(args.hand, difficulty);
  const standing = args.standing;

  if (!standing) {
    // Prefer nulos open only when shape clearly supports it (not every low hand).
    if (nullCeil >= 2 && nullCeil * 2.5 >= Math.max(posCeil, 2)) {
      return { action: 'bid', bidType: 'null', amount: Math.min(2, nullCeil) };
    }
    if (posCeil < 3) {
      return { action: 'pass' };
    }
    const open = Math.min(3, posCeil);
    return { action: 'bid', bidType: 'positive', amount: open };
  }

  const min = minBidToBeat(standing, args.auctionOrder, args.seat);
  if (!min || !canBeatBid(standing, min, args.auctionOrder)) {
    return { action: 'pass' };
  }

  const tryPositive =
    min.bidType === 'positive'
      ? min.amount <= posCeil
      : posCeil >= bidEquivalentPositive(min);

  const tryNull =
    min.bidType === 'null'
      ? min.amount <= nullCeil
      : nullCeil >= 2 && nullCeil * 2.5 >= bidEquivalentPositive(min);

  // Prefer matching the standing type when both viable; else the viable type.
  if (min.bidType === 'positive') {
    if (tryPositive) {
      return { action: 'bid', bidType: 'positive', amount: min.amount };
    }
    if (tryNull) {
      for (let a = 1; a <= nullCeil; a++) {
        const cand: KingBid = {
          bidderIndex: args.seat,
          bidType: 'null',
          amount: a
        };
        if (canBeatBid(standing, cand, args.auctionOrder)) {
          return { action: 'bid', bidType: 'null', amount: a };
        }
      }
    }
    return { action: 'pass' };
  }

  // Standing / min is null.
  if (tryNull) {
    return { action: 'bid', bidType: 'null', amount: min.amount };
  }
  if (tryPositive) {
    for (let a = 1; a <= posCeil; a++) {
      const cand: KingBid = {
        bidderIndex: args.seat,
        bidType: 'positive',
        amount: a
      };
      if (canBeatBid(standing, cand, args.auctionOrder)) {
        return { action: 'bid', bidType: 'positive', amount: a };
      }
    }
  }
  return { action: 'pass' };
}
