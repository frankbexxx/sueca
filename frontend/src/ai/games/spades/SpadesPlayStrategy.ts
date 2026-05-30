import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, GameState, CARD_HIERARCHY } from '../../../types/game';
import { SpadesVariantState } from '../../../models/games/SpadesGame';
import { getLegalIndices } from '../../core/LegalMoveFilter';
import { shouldPlayRandom } from '../../core/DifficultyProfile';

/**
 * Easy: play a random legal card.
 */
function playEasy(valid: number[]): number {
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Returns true if the player's partner is currently winning the trick.
 * Partners sit at positions (playerIndex + 2) % 4 — indices 0&2 vs 1&3.
 * "Winning" means the partner played the last card before the current player
 * and that card is leading the trick.
 */
function partnerIsWinning(
  playerIndex: number,
  state: GameState
): boolean {
  const trick = state.currentTrick;
  if (trick.length === 0) return false;

  const leader = state.trickLeader ?? 0;
  // Who played each card: leader played trick[0], (leader+1)%4 played trick[1], etc.
  let currentWinnerSeat = leader;
  let currentHighRank = CARD_HIERARCHY[trick[0].rank];
  let trumpPresent = trick[0].suit === 'spades';
  const ledSuit = trick[0].suit;

  for (let i = 1; i < trick.length; i++) {
    const seat = (leader + i) % 4;
    const c = trick[i];
    if (c.suit === 'spades') {
      if (!trumpPresent || CARD_HIERARCHY[c.rank] > currentHighRank) {
        trumpPresent = true;
        currentHighRank = CARD_HIERARCHY[c.rank];
        currentWinnerSeat = seat;
      }
    } else if (!trumpPresent && c.suit === ledSuit) {
      if (CARD_HIERARCHY[c.rank] > currentHighRank) {
        currentHighRank = CARD_HIERARCHY[c.rank];
        currentWinnerSeat = seat;
      }
    }
  }

  const partnerIndex = (playerIndex + 2) % 4;
  return currentWinnerSeat === partnerIndex;
}

/**
 * Returns the lowest card index from a list.
 */
function lowestCard(
  indices: number[],
  player: GameState['players'][number]
): number {
  return indices.reduce((best, i) =>
    CARD_HIERARCHY[player.hand[i].rank] < CARD_HIERARCHY[player.hand[best].rank] ? i : best,
    indices[0]
  );
}

/**
 * Medium: avoid leading spades unless necessary; lead high if we need tricks.
 * Following: only "win" if rank actually beats current trick high.
 * If partner is winning, play low to let partner take the trick.
 */
function playMedium(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  spades: SpadesVariantState,
  playerIndex: number
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

  // Partner winning — play low to not steal the trick
  if (partnerIsWinning(playerIndex, state)) {
    return lowestCard(valid, player);
  }

  const ledSuit = state.currentTrick[0].suit;
  const trumpPlayed = state.currentTrick.some((c) => c.suit === 'spades');

  if (trumpPlayed) {
    const currentHigh = Math.max(
      ...state.currentTrick.filter((c) => c.suit === 'spades').map((c) => CARD_HIERARCHY[c.rank])
    );
    const spadesInHand = valid.filter(
      (i) => player.hand[i].suit === 'spades' && CARD_HIERARCHY[player.hand[i].rank] > currentHigh
    );
    if (spadesInHand.length > 0) return spadesInHand[0];
    const inSuit = valid.filter((i) => player.hand[i].suit === ledSuit);
    return inSuit.length > 0 ? lowestCard(inSuit, player) : lowestCard(valid, player);
  }

  const inSuit = valid.filter((i) => player.hand[i].suit === ledSuit);
  if (inSuit.length > 0) {
    const currentHigh = Math.max(
      ...state.currentTrick.filter((c) => c.suit === ledSuit).map((c) => CARD_HIERARCHY[c.rank])
    );
    const winners = inSuit.filter((i) => CARD_HIERARCHY[player.hand[i].rank] > currentHigh);
    if (winners.length > 0 && needTricks) return winners[0];
    return lowestCard(inSuit, player);
  }

  return lowestCard(valid, player);
}

/**
 * Hard: economy of high cards when following; leads highest non-spade when needing tricks.
 * Partner-winning awareness: plays low to let partner keep the trick.
 */
function playHard(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  spades: SpadesVariantState,
  playerIndex: number
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
    return lowestCard(pool, player);
  }

  // Partner winning — play low to not steal the trick
  if (partnerIsWinning(playerIndex, state)) {
    return lowestCard(valid, player);
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
    return lowestCard(inSuit, player);
  }

  if (needTricks) {
    const spadesInHand = valid.filter((i) => player.hand[i].suit === 'spades');
    if (spadesInHand.length > 0) {
      return lowestCard(spadesInHand, player);
    }
  }

  return lowestCard(valid, player);
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

  if (shouldPlayRandom(difficulty)) return playEasy(valid);
  if (difficulty === 'hard') return playHard(valid, player, state, spades, playerIndex);
  return playMedium(valid, player, state, spades, playerIndex);
}
