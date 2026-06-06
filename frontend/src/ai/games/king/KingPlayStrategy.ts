import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, GameState, CARD_HIERARCHY } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';
import { KING_NEGATIVE_GAMES } from '../../../models/games/king/kingContracts';
import { getLegalIndices } from '../../core/LegalMoveFilter';
import { shouldPlayRandom } from '../../core/DifficultyProfile';
import {
  pickLowestRankIndex,
  playKingPtNegativeFollow,
  playKingPtNegativeLead,
  tryPlayK02,
} from './kingTrickHelpers';

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
  king: KingPtVariantState
): number {
  const avoid =
    king.gameIndex < KING_NEGATIVE_GAMES || king.festaMode === 'negative_festa';

  if (avoid) {
    return mediumNegativeDump(valid, player, state, king);
  }

  if (state.currentTrick.length === 0) {
    return valid.reduce(
      (best, i) =>
        CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
      valid[0]
    );
  }

  const ledSuit = state.currentTrick[0].suit;
  const inSuit = valid.filter((i) => player.hand[i].suit === ledSuit);
  if (inSuit.length) {
    const currentHigh = Math.max(
      ...state.currentTrick.filter((c) => c.suit === ledSuit).map((c) => CARD_HIERARCHY[c.rank])
    );
    const winners = inSuit.filter((i) => CARD_HIERARCHY[player.hand[i].rank] > currentHigh);
    if (winners.length > 0) {
      return winners.reduce(
        (best, i) =>
          CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
        winners[0]
      );
    }
    return inSuit[0];
  }
  return valid[0];
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
      CARD_HIERARCHY[player.hand[i].rank] > CARD_HIERARCHY[player.hand[best].rank] ? i : best,
    valid[0]
  );
}

/**
 * Medium positive (festa) follow: win with the cheapest winner, or play lowest.
 */
function mediumPositiveFollow(
  valid: number[],
  player: GameState['players'][number],
  state: GameState
): number {
  const ledSuit = state.currentTrick[0].suit;
  const inSuit = valid.filter((i) => player.hand[i].suit === ledSuit);
  if (inSuit.length > 0) {
    const currentHigh = Math.max(
      ...state.currentTrick.filter((c) => c.suit === ledSuit).map((c) => CARD_HIERARCHY[c.rank])
    );
    const winners = inSuit.filter((i) => CARD_HIERARCHY[player.hand[i].rank] > currentHigh);
    if (winners.length > 0) {
      return winners.reduce(
        (best, i) =>
          CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
        winners[0]
      );
    }
    return inSuit.reduce(
      (best, i) =>
        CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
      inSuit[0]
    );
  }
  return valid.reduce(
    (best, i) =>
      CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
    valid[0]
  );
}

/**
 * Medium/Hard negative play — contrato-first pipeline (K02 → contract blocks → K03/K01).
 */
function mediumNegativeDump(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  king: KingPtVariantState
): number {
  const trick = state.currentTrick;
  const led = trick.length ? trick[0].suit : null;

  const k02 = tryPlayK02(valid, player.hand, player, led, king);
  if (k02 !== null) return k02;

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

  // no_tricks: when following in-suit, play lowest to avoid winning
  if (king.contract === 'no_tricks' && trick.length > 0) {
    const inSuit = valid.filter((i) => player.hand[i].suit === trick[0].suit);
    if (inSuit.length > 0) {
      return pickLowestRankIndex(inSuit, player.hand);
    }
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
    return chooseKingPtHard(valid, player, state, king);
  }

  // Medium
  const avoid =
    king.gameIndex < KING_NEGATIVE_GAMES || king.festaMode === 'negative_festa';

  if (!avoid) {
    // Positive / festa phase
    if (state.currentTrick.length === 0) {
      return mediumPositiveLead(valid, player);
    }
    return mediumPositiveFollow(valid, player, state);
  }

  return mediumNegativeDump(valid, player, state, king);
}

// ---------------------------------------------------------------------------
// King Simplified
// ---------------------------------------------------------------------------

/**
 * Play strategy for King Simplified.
 */
export function chooseKingSimplifiedCard(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number,
  isNegative: boolean,
  difficulty: AIDifficulty = 'medium'
): number {
  const player = state.players[playerIndex];
  if (!player) return -1;

  const valid = getLegalIndices(adapter, state, playerIndex);
  if (valid.length === 0) return -1;

  if (shouldPlayRandom(difficulty)) {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  if (isNegative) {
    if (state.currentTrick.length === 0) {
      return pickLowestRankIndex(valid, player.hand);
    }
    if (difficulty === 'hard') {
      const led = state.currentTrick[0].suit;
      const inSuit = valid.filter((i) => player.hand[i].suit === led);
      if (inSuit.length) return inSuit[0];
      return valid.reduce(
        (best, i) =>
          CARD_HIERARCHY[player.hand[i].rank] > CARD_HIERARCHY[player.hand[best].rank] ? i : best,
        valid[0]
      );
    }
    return valid[0];
  }

  if (difficulty === 'hard' && state.currentTrick.length > 0) {
    const led = state.currentTrick[0].suit;
    const inSuit = valid.filter((i) => player.hand[i].suit === led);
    if (inSuit.length) {
      const currentHigh = Math.max(
        ...state.currentTrick.filter((c) => c.suit === led).map((c) => CARD_HIERARCHY[c.rank])
      );
      const winners = inSuit.filter((i) => CARD_HIERARCHY[player.hand[i].rank] > currentHigh);
      if (winners.length) {
        return winners.reduce(
          (best, i) =>
            CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
          winners[0]
        );
      }
    }
  }

  return state.currentTrick.length === 0 ? valid[valid.length - 1] : valid[0];
}
