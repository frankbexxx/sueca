import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, Card, GameState, Suit } from '../../../types/game';
import { standard52RankValue } from '../../../models/games/trickUtils';
import { KingPtVariantState, isSyntheticAllNegatives } from '../../../models/games/KingPtGame';
import { KING_NEGATIVE_GAMES } from '../../../models/games/king/kingContracts';
import { getLegalIndices } from '../../core/LegalMoveFilter';
import { shouldPlayRandom } from '../../core/DifficultyProfile';
import {
  cardWouldWinTrickKing,
  pickLowestRankIndex,
  playKingPtNegativeFollow,
  playKingPtNegativeLead,
  playNoHeartsNegative,
  playNoTricksNegative,
  tryPlayK02,
} from './kingTrickHelpers';

/** Trump the King motor uses: positive festa with a trump suit only. */
function positiveTrumpSuit(state: GameState, king: KingPtVariantState): Suit | null {
  if (king.festaMode !== 'positive' || !state.trumpSuit) return null;
  return state.trumpSuit;
}

/**
 * Positive follow. A card wins only if the King trick motor says it wins.
 * Medium spends the lowest card when nothing wins. Hard keeps its first-card
 * fallback, except when trump is already beating a non-trump lead: then the
 * lowest of the led suit, so a high card is not spent as a false winner.
 */
function positiveFollowChoice(
  valid: number[],
  hand: Card[],
  state: GameState,
  playerIndex: number,
  trump: Suit | null,
  whenLosing: 'lowest' | 'first'
): number {
  const ledSuit = state.currentTrick[0].suit;
  const inSuit = valid.filter((i) => hand[i].suit === ledSuit);
  if (inSuit.length > 0) {
    const leader = state.trickLeader ?? 0;
    const winners = inSuit.filter((i) =>
      cardWouldWinTrickKing(hand[i], state.currentTrick, leader, playerIndex, trump)
    );
    if (winners.length > 0) return pickLowestRankIndex(winners, hand);

    const trumpOnTrick = trump != null && state.currentTrick.some((c) => c.suit === trump);
    if (whenLosing === 'lowest' || (trumpOnTrick && ledSuit !== trump)) {
      return pickLowestRankIndex(inSuit, hand);
    }
    return inSuit[0];
  }
  if (whenLosing === 'lowest') return pickLowestRankIndex(valid, hand);
  return valid[0];
}

// ---------------------------------------------------------------------------
// King PT
// ---------------------------------------------------------------------------

/**
 * Hard King PT: in negative mode, uses shared negative pipeline.
 * In positive mode, tries to win with the cheapest card possible.
 */
function chooseKingPtHard(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  king: KingPtVariantState,
  playerIndex: number
): number {
  const avoid =
    king.gameIndex < KING_NEGATIVE_GAMES || king.festaMode === 'negative_festa';

  if (avoid) {
    return mediumNegativeDump(valid, player, state, king, playerIndex);
  }

  if (state.currentTrick.length === 0) {
    return valid.reduce(
      (best, i) =>
        standard52RankValue(player.hand[i].rank) < standard52RankValue(player.hand[best].rank) ? i : best,
      valid[0]
    );
  }

  const trump = positiveTrumpSuit(state, king);
  return positiveFollowChoice(valid, player.hand, state, playerIndex, trump, 'first');
}

/**
 * Medium positive (festa) lead: lead the highest card.
 */
function mediumPositiveLead(
  valid: number[],
  player: GameState['players'][number]
): number {
  return valid.reduce(
    (best, i) =>
      standard52RankValue(player.hand[i].rank) > standard52RankValue(player.hand[best].rank) ? i : best,
    valid[0]
  );
}

/**
 * Medium positive (festa) follow: win with the cheapest winner, or play lowest.
 */
function mediumPositiveFollow(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  playerIndex: number,
  trump: Suit | null
): number {
  return positiveFollowChoice(valid, player.hand, state, playerIndex, trump, 'lowest');
}

/**
 * Medium/Hard negative play — contrato-first pipeline (K02 → contract blocks → K03/K01).
 */
function mediumNegativeDump(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  king: KingPtVariantState,
  playerIndex: number
): number {
  const trick = state.currentTrick;
  const led = trick.length ? trick[0].suit : null;

  const k02 = tryPlayK02(valid, player.hand, player, led, king);
  if (k02 !== null) return k02;

  // King Sintético combined round: generic avoid-winning (legality already via getLegalIndices).
  if (isSyntheticAllNegatives(king)) {
    return playNoTricksNegative(valid, player.hand, state, playerIndex, king);
  }

  // no_last_two: early tricks (0-7) play freely; tricks 8-9 play full defensive
  if (king.contract === 'no_last_two') {
    if (king.trickNumber < 8) {
      if (trick.length === 0) {
        const nonHeart = valid.filter((i) => player.hand[i].suit !== 'hearts');
        const pool = nonHeart.length ? nonHeart : valid;
        return pickLowestRankIndex(pool, player.hand);
      }
      const inSuit = valid.filter((i) => player.hand[i].suit === trick[0].suit);
      const pool = inSuit.length ? inSuit : valid;
      return pickLowestRankIndex(pool, player.hand);
    }
    if (trick.length > 0) {
      const inSuit = valid.filter((i) => player.hand[i].suit === trick[0].suit);
      const pool = inSuit.length ? inSuit : valid;
      return pickLowestRankIndex(pool, player.hand);
    }
    const nonHeart = valid.filter((i) => player.hand[i].suit !== 'hearts');
    const pool = nonHeart.length ? nonHeart : valid;
    return pickLowestRankIndex(pool, player.hand);
  }

  if (king.contract === 'no_tricks') {
    return playNoTricksNegative(valid, player.hand, state, playerIndex, king);
  }

  if (king.contract === 'no_hearts' || king.contract === 'no_king_hearts') {
    return playNoHeartsNegative(valid, player.hand, state, playerIndex, king);
  }

  if (trick.length === 0) {
    return playKingPtNegativeLead(valid, player.hand, king.contract);
  }

  return playKingPtNegativeFollow(valid, player.hand, king.contract, trick[0].suit);
}

/**
 * Play strategy for King PT (both negative and positive/festa phases).
 */
export function chooseKingPtCard(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number,
  king: KingPtVariantState,
  difficulty: AIDifficulty = 'medium'
): number {
  const player = state.players[playerIndex];
  if (!player) return -1;

  const valid = getLegalIndices(adapter, state, playerIndex);
  if (valid.length === 0) return -1;

  if (shouldPlayRandom(difficulty)) {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  if (difficulty === 'hard') {
    return chooseKingPtHard(valid, player, state, king, playerIndex);
  }

  // Medium
  const avoid =
    king.gameIndex < KING_NEGATIVE_GAMES || king.festaMode === 'negative_festa';

  if (!avoid) {
    // Positive / festa phase
    if (state.currentTrick.length === 0) {
      return mediumPositiveLead(valid, player);
    }
    return mediumPositiveFollow(
      valid,
      player,
      state,
      playerIndex,
      positiveTrumpSuit(state, king)
    );
  }

  return mediumNegativeDump(valid, player, state, king, playerIndex);
}
