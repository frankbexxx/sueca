import { Card, GameState, Suit } from '../../../types/game';
import { KingPtVariantState, isMen, mustPlayKingOfHearts } from '../../../models/games/KingPtGame';
import { KingNegativeContract } from '../../../models/games/king/kingContracts';

const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function isKingHearts(card: Card): boolean {
  return card.rank === 'K' && card.suit === 'hearts';
}

/** Mirror contract penalties — do not import cardIntelligence. */
export function isPenaltyCardForContract(
  card: Card,
  contract: KingNegativeContract | null
): boolean {
  if (!contract) return false;
  if (contract === 'no_hearts' && card.suit === 'hearts') return true;
  if (contract === 'no_queens' && card.rank === 'Q') return true;
  if (contract === 'no_men' && isMen(card)) return true;
  if (contract === 'no_king_hearts' && isKingHearts(card)) return true;
  return false;
}

export function pickLowestRankIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) =>
      RANK_ORDER.indexOf(hand[i].rank) < RANK_ORDER.indexOf(hand[best].rank) ? i : best,
    indices[0]
  );
}

/** K02 — play K♥ when motor obligation applies. */
export function tryPlayK02(
  valid: number[],
  hand: Card[],
  player: GameState['players'][number],
  ledSuit: Suit | null,
  king: KingPtVariantState
): number | null {
  const khIdx = valid.findIndex((i) => isKingHearts(hand[i]));
  if (khIdx >= 0 && mustPlayKingOfHearts(player, ledSuit, king)) {
    return khIdx;
  }
  return null;
}

/** K03 + K04 — negative lead: avoid ♥ when alternative exists. */
export function playKingPtNegativeLead(
  valid: number[],
  hand: Card[],
  contract: KingNegativeContract | null
): number {
  const nonHeart =
    contract === 'no_hearts' || contract === 'no_king_hearts'
      ? valid.filter((i) => hand[i].suit !== 'hearts')
      : [];
  const pool = nonHeart.length ? nonHeart : valid;
  return pickLowestRankIndex(pool, hand);
}

/** K01/K00 — prefer non-penalty cards; lowest rank among pool. */
export function pickSafeSlough(
  valid: number[],
  hand: Card[],
  contract: KingNegativeContract | null
): number {
  const safe = valid.filter((i) => !isPenaltyCardForContract(hand[i], contract));
  const pool = safe.length ? safe : valid;
  return pickLowestRankIndex(pool, hand);
}

/** Void off-suit — dump penalty cards when possible. */
export function pickPenaltyDumpVoid(
  valid: number[],
  hand: Card[],
  contract: KingNegativeContract | null
): number {
  const penalty = valid.find((i) => isPenaltyCardForContract(hand[i], contract));
  if (penalty !== undefined) return penalty;
  return pickSafeSlough(valid, hand, contract);
}

/** Generic negative follow after contract-specific blocks. */
export function playKingPtNegativeFollow(
  valid: number[],
  hand: Card[],
  contract: KingNegativeContract | null,
  ledSuit: Suit
): number {
  const inSuit = valid.filter((i) => hand[i].suit === ledSuit);
  if (inSuit.length) {
    return pickSafeSlough(inSuit, hand, contract);
  }
  return pickPenaltyDumpVoid(valid, hand, contract);
}
