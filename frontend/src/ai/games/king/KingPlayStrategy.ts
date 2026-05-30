import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, GameState, CARD_HIERARCHY } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';
import { isMen, mustPlayKingOfHearts } from '../../../models/games/KingPtGame';
import { KING_NEGATIVE_GAMES } from '../../../models/games/king/kingContracts';
import { getLegalIndices } from '../../core/LegalMoveFilter';

const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// ---------------------------------------------------------------------------
// King PT
// ---------------------------------------------------------------------------

function ptNegativeDump(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  king: KingPtVariantState
): number {
  const led = state.currentTrick.length > 0 ? state.currentTrick[0].suit : null;
  if (led) {
    const inSuit = valid.filter((i) => player.hand[i].suit === led);
    if (inSuit.length) return inSuit[0];
    const kingIdx = valid.findIndex(
      (i) => player.hand[i].rank === 'K' && player.hand[i].suit === 'hearts'
    );
    if (kingIdx >= 0 && mustPlayKingOfHearts(player, led, king)) return kingIdx;
    const dump = valid.find((i) => {
      const c = player.hand[i];
      if (king.contract === 'no_hearts' && c.suit === 'hearts') return true;
      if (king.contract === 'no_queens' && c.rank === 'Q') return true;
      if (king.contract === 'no_men' && isMen(c)) return true;
      if (king.contract === 'no_king_hearts' && c.rank === 'K' && c.suit === 'hearts') return true;
      return false;
    });
    return dump ?? valid[0];
  }
  const nonHeart = valid.filter((i) => player.hand[i].suit !== 'hearts');
  const pool = nonHeart.length ? nonHeart : valid;
  return pool.reduce(
    (best, i) =>
      RANK_ORDER.indexOf(player.hand[i].rank) < RANK_ORDER.indexOf(player.hand[best].rank) ? i : best,
    pool[0]
  );
}

/**
 * Hard King PT: in negative mode, scores and ranks penalty cards before dumping.
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
    return ptNegativeDump(valid, player, state, king);
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

  if (difficulty === 'easy') {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  if (difficulty === 'hard') {
    return chooseKingPtHard(valid, player, state, king);
  }

  // Medium (original)
  const avoid =
    king.gameIndex < KING_NEGATIVE_GAMES || king.festaMode === 'negative_festa';

  if (state.currentTrick.length === 0) {
    if (avoid) {
      const nonHeart = valid.filter((i) => player.hand[i].suit !== 'hearts');
      const pool = nonHeart.length ? nonHeart : valid;
      return pool.reduce(
        (best, i) =>
          RANK_ORDER.indexOf(player.hand[i].rank) < RANK_ORDER.indexOf(player.hand[best].rank) ? i : best,
        pool[0]
      );
    }
    return valid[valid.length - 1];
  }

  if (avoid) {
    return ptNegativeDump(valid, player, state, king);
  }
  return valid[0];
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

  if (difficulty === 'easy') {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  if (isNegative) {
    if (state.currentTrick.length === 0) {
      return valid.reduce(
        (best, i) =>
          RANK_ORDER.indexOf(player.hand[i].rank) < RANK_ORDER.indexOf(player.hand[best].rank) ? i : best,
        valid[0]
      );
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
