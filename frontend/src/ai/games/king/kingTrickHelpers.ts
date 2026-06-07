import { Card, GameState, Suit } from '../../../types/game';
import { KingPtVariantState, isMen, mustPlayKingOfHearts } from '../../../models/games/KingPtGame';
import { KingNegativeContract } from '../../../models/games/king/kingContracts';
import { trickWinnerIndex } from '../../../models/games/trickUtils';

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

export function kingTrickLeader(state: GameState): number {
  return state.trickLeader ?? 0;
}

export function pickLowestRankIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) =>
      RANK_ORDER.indexOf(hand[i].rank) < RANK_ORDER.indexOf(hand[best].rank) ? i : best,
    indices[0]
  );
}

export function pickHighestRankIndex(indices: number[], hand: Card[]): number {
  return indices.reduce(
    (best, i) =>
      RANK_ORDER.indexOf(hand[i].rank) > RANK_ORDER.indexOf(hand[best].rank) ? i : best,
    indices[0]
  );
}

/** King PT negative — no trump. */
export function cardWouldWinTrickKing(
  card: Card,
  trickBefore: Card[],
  trickLeader: number,
  playerIndex: number
): boolean {
  const trick = [...trickBefore, card];
  const winner = trickWinnerIndex(trick, trickLeader, null);
  return winner === playerIndex;
}

export function partitionByWouldWin(
  valid: number[],
  hand: Card[],
  trick: Card[],
  trickLeader: number,
  playerIndex: number
): { winners: number[]; losers: number[] } {
  const winners: number[] = [];
  const losers: number[] = [];
  for (const i of valid) {
    if (cardWouldWinTrickKing(hand[i], trick, trickLeader, playerIndex)) {
      winners.push(i);
    } else {
      losers.push(i);
    }
  }
  return { winners, losers };
}

/** Lose if possible with highest safe unload; forced win → lowest winner. */
export function playToUnloadWhileLosing(
  valid: number[],
  hand: Card[],
  trick: Card[],
  trickLeader: number,
  playerIndex: number
): number {
  const { winners, losers } = partitionByWouldWin(valid, hand, trick, trickLeader, playerIndex);
  if (losers.length > 0) {
    return pickHighestRankIndex(losers, hand);
  }
  return pickLowestRankIndex(winners, hand);
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

/** K12 / T06 — no_tricks: unload highs while losing; avoid winning when possible. */
export function playNoTricksNegative(
  valid: number[],
  hand: Card[],
  state: GameState,
  playerIndex: number,
  king: KingPtVariantState
): number {
  const trick = state.currentTrick;
  if (trick.length === 0) {
    return playKingPtNegativeLead(valid, hand, king.contract);
  }
  return playToUnloadWhileLosing(valid, hand, trick, kingTrickLeader(state), playerIndex);
}

/** K00 follow — no_hearts / no_king_hearts: dump ♥ on losing void; unload in-suit. */
export function playNoHeartsNegative(
  valid: number[],
  hand: Card[],
  state: GameState,
  playerIndex: number,
  king: KingPtVariantState
): number {
  const trick = state.currentTrick;
  const leader = kingTrickLeader(state);

  if (trick.length === 0) {
    return playKingPtNegativeLead(valid, hand, king.contract);
  }

  const ledSuit = trick[0].suit;
  const inSuit = valid.filter((i) => hand[i].suit === ledSuit);

  if (inSuit.length > 0) {
    return playToUnloadWhileLosing(inSuit, hand, trick, leader, playerIndex);
  }

  const trickHasHearts = trick.some((c) => c.suit === 'hearts');
  const { winners, losers } = partitionByWouldWin(valid, hand, trick, leader, playerIndex);

  if (losers.length > 0) {
    if (!trickHasHearts) {
      const heartLosers = losers.filter((i) => hand[i].suit === 'hearts');
      if (heartLosers.length > 0) {
        return pickHighestRankIndex(heartLosers, hand);
      }
    }
    return pickHighestRankIndex(losers, hand);
  }

  return pickLowestRankIndex(winners, hand);
}

/** K01/K00 — prefer non-penalty cards; lowest rank among pool (other contracts). */
export function pickSafeSlough(
  valid: number[],
  hand: Card[],
  contract: KingNegativeContract | null
): number {
  const safe = valid.filter((i) => !isPenaltyCardForContract(hand[i], contract));
  const pool = safe.length ? safe : valid;
  return pickLowestRankIndex(pool, hand);
}

/** Void off-suit — dump penalty cards when possible (other contracts). */
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
