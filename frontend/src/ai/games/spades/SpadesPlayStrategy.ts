import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, GameState, CARD_HIERARCHY } from '../../../types/game';
import { SpadesVariantState } from '../../../models/games/SpadesGame';
import { getLegalIndices } from '../../core/LegalMoveFilter';

/**
 * Easy: play a random legal card.
 */
function playEasy(valid: number[]): number {
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Medium (original behaviour):
 * Leading: avoid leading spades unless necessary; lead high if we need tricks.
 * Following: prefer to follow suit; play a spade if trumps already in trick.
 */
function playMedium(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  spades: SpadesVariantState
): number {
  const team = player.team ?? 1;
  const teamTricks = team === 1 ? spades.team1Tricks : spades.team2Tricks;
  const teamBid = team === 1 ? spades.team1Bid : spades.team2Bid;
  const needTricks = teamTricks < teamBid;

  if (state.currentTrick.length === 0) {
    const nonSpades = valid.filter((i) => player.hand[i].suit !== 'spades');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    return pool[needTricks ? pool.length - 1 : 0];
  }

  const ledSuit = state.currentTrick[0].suit;
  const trumpPlayed = state.currentTrick.some((c) => c.suit === 'spades');
  const winning = valid.find((i) => {
    const c = player.hand[i];
    if (trumpPlayed && c.suit === 'spades') return true;
    return c.suit === ledSuit;
  });
  return winning ?? valid[0];
}

/**
 * Hard: same as medium but when following and winning is possible,
 * prefers the lowest winning card (economy of high cards).
 * When leading and we need tricks, leads highest non-spade.
 */
function playHard(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  spades: SpadesVariantState
): number {
  const team = player.team ?? 1;
  const teamTricks = team === 1 ? spades.team1Tricks : spades.team2Tricks;
  const teamBid = team === 1 ? spades.team1Bid : spades.team2Bid;
  const needTricks = teamTricks < teamBid;

  if (state.currentTrick.length === 0) {
    const nonSpades = valid.filter((i) => player.hand[i].suit !== 'spades');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    if (needTricks) {
      return pool.reduce((best, i) =>
        CARD_HIERARCHY[player.hand[i].rank] > CARD_HIERARCHY[player.hand[best].rank] ? i : best,
        pool[0]
      );
    }
    return pool.reduce((best, i) =>
      CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
      pool[0]
    );
  }

  const ledSuit = state.currentTrick[0].suit;
  const inSuit = valid.filter((i) => player.hand[i].suit === ledSuit);

  if (inSuit.length > 0) {
    const currentHigh = Math.max(
      ...state.currentTrick
        .filter((c) => c.suit === ledSuit)
        .map((c) => CARD_HIERARCHY[c.rank])
    );
    const winners = inSuit.filter((i) => CARD_HIERARCHY[player.hand[i].rank] > currentHigh);
    if (winners.length > 0 && needTricks) {
      return winners.reduce((best, i) =>
        CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
        winners[0]
      );
    }
    return inSuit.reduce((best, i) =>
      CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
      inSuit[0]
    );
  }

  if (needTricks) {
    const spadesInHand = valid.filter((i) => player.hand[i].suit === 'spades');
    if (spadesInHand.length > 0) {
      return spadesInHand.reduce((best, i) =>
        CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
        spadesInHand[0]
      );
    }
  }

  return valid.reduce((best, i) =>
    CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
    valid[0]
  );
}

/**
 * Spades card-play strategy, adapting to difficulty level.
 */
export function chooseSpadesCard(
  adapter: GameAdapter,
  state: GameState,
  playerIndex: number,
  spades: SpadesVariantState,
  difficulty: AIDifficulty = 'medium'
): number {
  const player = state.players[playerIndex];
  if (!player) return -1;

  const valid = getLegalIndices(adapter, state, playerIndex);
  if (valid.length === 0) return -1;

  if (difficulty === 'easy') return playEasy(valid);
  if (difficulty === 'hard') return playHard(valid, player, state, spades);
  return playMedium(valid, player, state, spades);
}
