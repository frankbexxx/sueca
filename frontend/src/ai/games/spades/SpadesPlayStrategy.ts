import { GameAdapter } from '../../../models/games/GameAdapter';
import { AIDifficulty, CARD_HIERARCHY, GameState } from '../../../types/game';
import { SpadesVariantState } from '../../../models/games/SpadesGame';
import { getLegalIndices } from '../../core/LegalMoveFilter';
import { shouldPlayRandom } from '../../core/DifficultyProfile';
import {
  highestCardIndex,
  lowestCardIndex,
  partnerIsWinning,
  pickLowestWinningSpadeIndex,
  playAvoidWinning,
  playWhenPartnerWinning,
  spadesTrickLeader,
} from './spadesTrickHelpers';

/**
 * Easy: play a random legal card.
 */
function playEasy(valid: number[]): number {
  return valid[Math.floor(Math.random() * valid.length)];
}

function teamNeedTricks(
  player: GameState['players'][number],
  spades: SpadesVariantState
): boolean {
  const team = player.team ?? 1;
  const teamTricks = team === 1 ? spades.team1Tricks : spades.team2Tricks;
  const teamBid = team === 1 ? spades.team1Bid : spades.team2Bid;
  return teamTricks < teamBid;
}

/**
 * Medium: avoid leading spades unless necessary; follow with bag/partner awareness.
 */
function playMedium(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  spades: SpadesVariantState,
  playerIndex: number
): number {
  const hand = player.hand;
  const needTricks = teamNeedTricks(player, spades);
  const avoidBags = !needTricks;
  const leader = spadesTrickLeader(state);

  if (state.currentTrick.length === 0) {
    const nonSpades = valid.filter((i) => hand[i].suit !== 'spades');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    if (avoidBags) return lowestCardIndex(pool, hand);
    return pool[pool.length - 1];
  }

  if (partnerIsWinning(playerIndex, state)) {
    return playWhenPartnerWinning(valid, hand, state);
  }

  if (avoidBags) {
    return playAvoidWinning(valid, hand, state);
  }

  const ledSuit = state.currentTrick[0].suit;
  const trumpPlayed = state.currentTrick.some((c) => c.suit === 'spades');

  if (trumpPlayed) {
    const winSpade = pickLowestWinningSpadeIndex(valid, hand, state.currentTrick, leader);
    if (winSpade !== null) return winSpade;
    const inSuit = valid.filter((i) => hand[i].suit === ledSuit);
    if (inSuit.length > 0) return lowestCardIndex(inSuit, hand);
    return lowestCardIndex(valid, hand);
  }

  const inSuit = valid.filter((i) => hand[i].suit === ledSuit);
  if (inSuit.length > 0) {
    const currentHigh = Math.max(
      ...state.currentTrick
        .filter((c) => c.suit === ledSuit)
        .map((c) => CARD_HIERARCHY[c.rank])
    );
    const winners = inSuit.filter((i) => CARD_HIERARCHY[hand[i].rank] > currentHigh);
    if (winners.length > 0) return winners[0];
    return lowestCardIndex(inSuit, hand);
  }

  const winSpade = pickLowestWinningSpadeIndex(valid, hand, state.currentTrick, leader);
  if (winSpade !== null) return winSpade;
  return lowestCardIndex(valid, hand);
}

/**
 * Hard: economy of high cards; SP06/SP08/SP09 aligned with medium gates.
 */
function playHard(
  valid: number[],
  player: GameState['players'][number],
  state: GameState,
  spades: SpadesVariantState,
  playerIndex: number
): number {
  const hand = player.hand;
  const needTricks = teamNeedTricks(player, spades);
  const avoidBags = !needTricks;
  const leader = spadesTrickLeader(state);

  if (state.currentTrick.length === 0) {
    const nonSpades = valid.filter((i) => hand[i].suit !== 'spades');
    const pool = nonSpades.length > 0 ? nonSpades : valid;
    if (avoidBags) return lowestCardIndex(pool, hand);
    return highestCardIndex(pool, hand);
  }

  if (partnerIsWinning(playerIndex, state)) {
    return playWhenPartnerWinning(valid, hand, state);
  }

  if (avoidBags) {
    return playAvoidWinning(valid, hand, state);
  }

  const ledSuit = state.currentTrick[0].suit;
  const inSuit = valid.filter((i) => hand[i].suit === ledSuit);

  if (inSuit.length > 0) {
    const currentHigh = Math.max(
      ...state.currentTrick
        .filter((c) => c.suit === ledSuit)
        .map((c) => CARD_HIERARCHY[c.rank])
    );
    const winners = inSuit.filter((i) => CARD_HIERARCHY[hand[i].rank] > currentHigh);
    if (winners.length > 0) {
      return lowestCardIndex(winners, hand);
    }
    return lowestCardIndex(inSuit, hand);
  }

  const winSpade = pickLowestWinningSpadeIndex(valid, hand, state.currentTrick, leader);
  if (winSpade !== null) return winSpade;
  return lowestCardIndex(valid, hand);
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
