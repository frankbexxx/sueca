import { Card } from '../../../types/game';
import { KingNegativeContract } from './kingContracts';

export function countHearts(trick: Card[]): number {
  return trick.filter((c) => c.suit === 'hearts').length;
}

export function countMen(trick: Card[]): number {
  return trick.filter((c) => c.rank === 'K' || c.rank === 'J').length;
}

export function countQueens(trick: Card[]): number {
  return trick.filter((c) => c.rank === 'Q').length;
}

export function hasKingHearts(trick: Card[]): boolean {
  return trick.some((c) => c.rank === 'K' && c.suit === 'hearts');
}

export function heartsInTrick(trick: Card[]): Card[] {
  return trick.filter((c) => c.suit === 'hearts');
}

export function queensInTrick(trick: Card[]): Card[] {
  return trick.filter((c) => c.rank === 'Q');
}

export function menInTrick(trick: Card[]): Card[] {
  return trick.filter((c) => c.rank === 'K' || c.rank === 'J');
}

export function kingHeartsInTrick(trick: Card[]): Card[] {
  return trick.filter((c) => c.rank === 'K' && c.suit === 'hearts');
}

/** Penalty points assigned to trick winner for negative contracts. */
export function negativeTrickPenalty(
  contract: KingNegativeContract,
  trick: Card[],
  trickNumber: number
): number {
  switch (contract) {
    case 'no_tricks':
      return 20;
    case 'no_hearts':
      return 20 * countHearts(trick);
    case 'no_men':
      return 30 * countMen(trick);
    case 'no_queens':
      return 50 * countQueens(trick);
    case 'no_king_hearts':
      return hasKingHearts(trick) ? 160 : 0;
    case 'no_last_two':
      return trickNumber >= 12 ? 90 : 0;
    default:
      return 0;
  }
}

/** Positive festa: +25 per trick to winner. */
export const FESTA_POSITIVE_TRICK = 25;

/** Negative festa settlement: each player gets 325 - 75 * tricksWon. */
export function settleNegativeFesta(tricksWon: number[]): number[] {
  return tricksWon.map((t) => 325 - 75 * t);
}

/** Null auction festa: base nulos + transfer between beneficiary and bidder. */
export function settleNullAuctionFesta(
  tricksWon: number[],
  beneficiaryIndex: number,
  bidderIndex: number,
  nullAmount: number
): number[] {
  const deltas = settleNegativeFesta(tricksWon);
  const transfer = nullAmount * 75;
  deltas[beneficiaryIndex] += transfer;
  deltas[bidderIndex] -= transfer;
  return deltas;
}

/** Positive auction: beneficiary gets contracted tricks; bidder funds the top-up. */
export function settlePositiveAuctionRound(
  offeredTricks: number,
  tricksWon: number[],
  beneficiaryIndex: number,
  bidderIndex: number
): number[] {
  const deltas = tricksWon.map((t) => t * FESTA_POSITIVE_TRICK);
  const target = offeredTricks * FESTA_POSITIVE_TRICK;
  const topUp = target - deltas[beneficiaryIndex];
  deltas[beneficiaryIndex] = target;
  deltas[bidderIndex] -= topUp;
  return deltas;
}

/** @deprecated use settlePositiveAuctionRound */
export function settlePositiveAuction(
  offeredTricks: number,
  bidderTricks: number
): { ownerGain: number; bidderPenalty: number } {
  const ownerGain = offeredTricks * FESTA_POSITIVE_TRICK;
  const shortfall = Math.max(0, offeredTricks - bidderTricks);
  return { ownerGain, bidderPenalty: shortfall * FESTA_POSITIVE_TRICK };
}

/** @deprecated use settleNullAuctionFesta */
export function settleNegativeAuction(ownerTricks: number, offeredTricks: number): number {
  const surplus = Math.max(0, offeredTricks - ownerTricks);
  return surplus * 75;
}

/** 4×3×3 assignment: owner 4 tricks, each opponent 3 (325 pts at 25 each). */
export function settleFourByThree(): { owner: number; others: number } {
  return { owner: 4 * FESTA_POSITIVE_TRICK, others: 3 * FESTA_POSITIVE_TRICK };
}

export function sumScores(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0);
}
