/**
 * DEV ONLY — King Sintético playable fixtures (S2).
 * Seeds real KingPtGame mid-round state; legality stays in canPlayCard/playCard.
 */

import type { Card, GameState, Suit, Rank } from '../types/game';
import { KingGame } from '../models/games/KingGame';
import { KingPtGame } from '../models/games/KingPtGame';
import { type KingNegativeContract } from '../models/games/king/kingContracts';
import { isKingDevSyntheticEnabled } from './kingSyntheticJump';

export type KingSyntheticBeatId =
  | 'default'
  | 'koh_follow_precedence'
  | 'koh_obligation_void';

export interface KingSyntheticSeed {
  contract: KingNegativeContract;
  beat: KingSyntheticBeatId;
  trickNumber: number;
  /** Local human is always seat 0 in these fixtures. */
  currentPlayerIndex: number;
  trickLeader: number;
  currentTrick: Card[];
  hands: [Card[], Card[], Card[], Card[]];
  description: string;
}

function C(id: string, rank: Rank, suit: Suit): Card {
  return { id, rank, suit };
}

/** Ensure equal hand lengths and unique card ids across table. */
export function validateKingSyntheticSeed(seed: KingSyntheticSeed): string[] {
  const errors: string[] = [];
  const lens = seed.hands.map((h) => h.length);
  if (lens.some((n) => n !== lens[0])) {
    errors.push(`unequal hand lengths: ${lens.join(',')}`);
  }
  const ids = new Set<string>();
  const add = (c: Card, where: string) => {
    if (ids.has(c.id)) errors.push(`duplicate card id ${c.id} in ${where}`);
    ids.add(c.id);
  };
  seed.hands.forEach((hand, i) => hand.forEach((c) => add(c, `hand[${i}]`)));
  seed.currentTrick.forEach((c) => add(c, 'trick'));
  if (seed.currentPlayerIndex < 0 || seed.currentPlayerIndex > 3) {
    errors.push('bad currentPlayerIndex');
  }
  if (seed.trickLeader < 0 || seed.trickLeader > 3) {
    errors.push('bad trickLeader');
  }
  const expectedSeat =
    (seed.trickLeader + seed.currentTrick.length) % 4;
  if (seed.currentTrick.length > 0 && seed.currentPlayerIndex !== expectedSeat) {
    errors.push(
      `currentPlayer ${seed.currentPlayerIndex} != leader+trickLen seat ${expectedSeat}`
    );
  }
  return errors;
}

function seedNoTricks(): KingSyntheticSeed {
  // Empty trick; P0 leads. Clear winner path if P0 plays A♣ and others follow low.
  return {
    contract: 'no_tricks',
    beat: 'default',
    trickNumber: 0,
    currentPlayerIndex: 0,
    trickLeader: 0,
    currentTrick: [],
    hands: [
      [C('nt-p0-ac', 'A', 'clubs'), C('nt-p0-3d', '3', 'diamonds'), C('nt-p0-2h', '2', 'hearts')],
      [C('nt-p1-2c', '2', 'clubs'), C('nt-p1-4d', '4', 'diamonds'), C('nt-p1-5h', '5', 'hearts')],
      [C('nt-p2-3c', '3', 'clubs'), C('nt-p2-5d', '5', 'diamonds'), C('nt-p2-6h', '6', 'hearts')],
      [C('nt-p3-4c', '4', 'clubs'), C('nt-p3-6d', '6', 'diamonds'), C('nt-p3-7h', '7', 'hearts')]
    ],
    description: 'Lead any; clubs A wins a complete clubs trick for −20 smoke.'
  };
}

function seedNoHearts(): KingSyntheticSeed {
  // Empty trick; P0 has ♥ + non-♥ → cannot lead hearts.
  return {
    contract: 'no_hearts',
    beat: 'default',
    trickNumber: 1,
    currentPlayerIndex: 0,
    trickLeader: 0,
    currentTrick: [],
    hands: [
      [C('nh-p0-2c', '2', 'clubs'), C('nh-p0-kh', 'K', 'hearts'), C('nh-p0-3d', '3', 'diamonds')],
      [C('nh-p1-3c', '3', 'clubs'), C('nh-p1-2h', '2', 'hearts'), C('nh-p1-4d', '4', 'diamonds')],
      [C('nh-p2-4c', '4', 'clubs'), C('nh-p2-5h', '5', 'hearts'), C('nh-p2-5d', '5', 'diamonds')],
      [C('nh-p3-5c', '5', 'clubs'), C('nh-p3-6h', '6', 'hearts'), C('nh-p3-6d', '6', 'diamonds')]
    ],
    description: 'P0 cannot lead ♥; later ♥ can be played when following/void.'
  };
}

function seedNoQueens(): KingSyntheticSeed {
  // Clubs led by P3; P0 to play and holds Q♣ only clubs → must play Q.
  return {
    contract: 'no_queens',
    beat: 'default',
    trickNumber: 2,
    currentPlayerIndex: 0,
    trickLeader: 3,
    currentTrick: [C('nq-lead', 'A', 'clubs')],
    hands: [
      [C('nq-p0-qc', 'Q', 'clubs'), C('nq-p0-2h', '2', 'hearts'), C('nq-p0-3d', '3', 'diamonds')],
      [C('nq-p1-2c', '2', 'clubs'), C('nq-p1-3h', '3', 'hearts'), C('nq-p1-4d', '4', 'diamonds')],
      [C('nq-p2-3c', '3', 'clubs'), C('nq-p2-4h', '4', 'hearts'), C('nq-p2-5d', '5', 'diamonds')],
      [C('nq-p3-4c', '4', 'clubs'), C('nq-p3-5h', '5', 'hearts'), C('nq-p3-6d', '6', 'diamonds')]
    ],
    description: 'P0 must follow clubs with Q♣ into the trick.'
  };
}

function seedNoMen(): KingSyntheticSeed {
  // Spades led; P0 holds only K♠ in spades → must play King (man).
  return {
    contract: 'no_men',
    beat: 'default',
    trickNumber: 2,
    currentPlayerIndex: 0,
    trickLeader: 3,
    currentTrick: [C('nm-lead', 'A', 'spades')],
    hands: [
      [C('nm-p0-ks', 'K', 'spades'), C('nm-p0-2h', '2', 'hearts'), C('nm-p0-3d', '3', 'diamonds')],
      [C('nm-p1-2s', '2', 'spades'), C('nm-p1-3h', '3', 'hearts'), C('nm-p1-4d', '4', 'diamonds')],
      [C('nm-p2-3s', '3', 'spades'), C('nm-p2-4h', '4', 'hearts'), C('nm-p2-5d', '5', 'diamonds')],
      [C('nm-p3-4s', '4', 'spades'), C('nm-p3-5h', '5', 'hearts'), C('nm-p3-6d', '6', 'diamonds')]
    ],
    description: 'P0 must follow spades with K♠ (man).'
  };
}

function seedKohFollowPrecedence(): KingSyntheticSeed {
  // Clubs led; P0 has clubs + K♥ → must follow clubs, K♥ illegal.
  return {
    contract: 'no_king_hearts',
    beat: 'koh_follow_precedence',
    trickNumber: 3,
    currentPlayerIndex: 0,
    trickLeader: 3,
    currentTrick: [C('kh-f-lead', 'A', 'clubs')],
    hands: [
      [
        C('kh-f-p0-kh', 'K', 'hearts'),
        C('kh-f-p0-2c', '2', 'clubs'),
        C('kh-f-p0-3d', '3', 'diamonds')
      ],
      [C('kh-f-p1-3c', '3', 'clubs'), C('kh-f-p1-2h', '2', 'hearts'), C('kh-f-p1-4d', '4', 'diamonds')],
      [C('kh-f-p2-4c', '4', 'clubs'), C('kh-f-p2-5h', '5', 'hearts'), C('kh-f-p2-5d', '5', 'diamonds')],
      [C('kh-f-p3-5c', '5', 'clubs'), C('kh-f-p3-6h', '6', 'hearts'), C('kh-f-p3-6d', '6', 'diamonds')]
    ],
    description: 'K♥ held but clubs can be followed — K♥ not legal.'
  };
}

function seedKohObligationVoid(): KingSyntheticSeed {
  // Clubs led; P0 void in clubs, holds K♥ + other → must dump K♥.
  return {
    contract: 'no_king_hearts',
    beat: 'koh_obligation_void',
    trickNumber: 3,
    currentPlayerIndex: 0,
    trickLeader: 3,
    currentTrick: [C('kh-o-lead', 'A', 'clubs')],
    hands: [
      [
        C('kh-o-p0-kh', 'K', 'hearts'),
        C('kh-o-p0-2h', '2', 'hearts'),
        C('kh-o-p0-3s', '3', 'spades')
      ],
      [C('kh-o-p1-2c', '2', 'clubs'), C('kh-o-p1-3h', '3', 'hearts'), C('kh-o-p1-4d', '4', 'diamonds')],
      [C('kh-o-p2-3c', '3', 'clubs'), C('kh-o-p2-4h', '4', 'hearts'), C('kh-o-p2-5d', '5', 'diamonds')],
      [C('kh-o-p3-4c', '4', 'clubs'), C('kh-o-p3-5h', '5', 'hearts'), C('kh-o-p3-6d', '6', 'diamonds')]
    ],
    description: 'Void in led suit with K♥ — obligation forces K♥.'
  };
}

function seedNoLastTwo(): KingSyntheticSeed {
  // trickNumber 11 → next completed trick is #12 (first penalised late trick).
  return {
    contract: 'no_last_two',
    beat: 'default',
    trickNumber: 11,
    currentPlayerIndex: 0,
    trickLeader: 0,
    currentTrick: [],
    hands: [
      [C('nl-p0-as', 'A', 'spades'), C('nl-p0-2d', '2', 'diamonds'), C('nl-p0-3h', '3', 'hearts')],
      [C('nl-p1-2s', '2', 'spades'), C('nl-p1-3d', '3', 'diamonds'), C('nl-p1-4h', '4', 'hearts')],
      [C('nl-p2-3s', '3', 'spades'), C('nl-p2-4d', '4', 'diamonds'), C('nl-p2-5h', '5', 'hearts')],
      [C('nl-p3-4s', '4', 'spades'), C('nl-p3-5d', '5', 'diamonds'), C('nl-p3-6h', '6', 'hearts')]
    ],
    description: 'trickNumber=11 so the next finished trick is late (−90).'
  };
}

export function buildKingSyntheticSeed(
  contract: KingNegativeContract,
  beat: KingSyntheticBeatId = 'default'
): KingSyntheticSeed {
  if (contract === 'no_king_hearts') {
    if (beat === 'koh_obligation_void') return seedKohObligationVoid();
    return seedKohFollowPrecedence();
  }
  switch (contract) {
    case 'no_tricks':
      return seedNoTricks();
    case 'no_hearts':
      return seedNoHearts();
    case 'no_queens':
      return seedNoQueens();
    case 'no_men':
      return seedNoMen();
    case 'no_last_two':
      return seedNoLastTwo();
    default:
      return seedNoTricks();
  }
}

export function listKingSyntheticSeeds(): KingSyntheticSeed[] {
  return [
    buildKingSyntheticSeed('no_tricks'),
    buildKingSyntheticSeed('no_hearts'),
    buildKingSyntheticSeed('no_queens'),
    buildKingSyntheticSeed('no_men'),
    buildKingSyntheticSeed('no_king_hearts', 'koh_follow_precedence'),
    buildKingSyntheticSeed('no_king_hearts', 'koh_obligation_void'),
    buildKingSyntheticSeed('no_last_two')
  ];
}

/**
 * Apply a synthetic seed onto a King PT adapter (DEV only).
 * Outside development → normal initialize.
 */
export function applyKingSyntheticFixture(
  adapter: KingGame | KingPtGame,
  playerNames: string[],
  contract: KingNegativeContract,
  options?: Record<string, unknown> & { beat?: KingSyntheticBeatId }
): GameState {
  if (!isKingDevSyntheticEnabled()) {
    if (adapter instanceof KingGame) {
      return adapter.initialize(playerNames, options);
    }
    return adapter.initialize(playerNames, options);
  }

  const beat = options?.beat ?? 'default';
  const seed = buildKingSyntheticSeed(contract, beat);
  const errors = validateKingSyntheticSeed(seed);
  if (errors.length) {
    throw new Error(`King synthetic seed invalid (${contract}/${beat}): ${errors.join('; ')}`);
  }

  if (adapter instanceof KingGame) {
    return adapter.applyDevSyntheticNegativeFixture(playerNames, seed, options);
  }
  return adapter.applyDevSyntheticNegativeFixture(playerNames, seed, options);
}
