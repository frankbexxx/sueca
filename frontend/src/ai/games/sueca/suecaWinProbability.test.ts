/**
 * Hard-only win probability: Sueca rank order, and each seen card once.
 * Engine playCard stores the current trick inside playedCards as well.
 */

import { describe, expect, it } from 'vitest';
import { Card, GameState, Suit } from '../../../types/game';
import {
  calculateWinProbability,
  chooseSuecaCard,
  SuecaStrategyContext
} from './SuecaStrategy';

function makeCard(rank: Card['rank'], suit: Suit, id?: string): Card {
  return { rank, suit, id: id ?? `${suit}_${rank}` };
}

function makeState(params: {
  hand: Card[];
  trick?: Card[];
  trickLeader?: number;
  trumpSuit?: Suit;
  playedCards?: Card[];
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}): GameState {
  return {
    players: [
      { id: 'p0', hand: params.hand, name: 'P0', team: 1 },
      { id: 'p1', hand: [], name: 'P1', team: 2 },
      { id: 'p2', hand: [], name: 'P2', team: 1 },
      { id: 'p3', hand: [], name: 'P3', team: 2 }
    ],
    currentTrick: params.trick ?? [],
    trickLeader: params.trickLeader ?? 1,
    trumpSuit: params.trumpSuit ?? 'clubs',
    playedCards: params.playedCards ?? [],
    aiDifficulty: params.aiDifficulty ?? 'hard',
    partnerSignals: [],
    round: 1,
    playDirection: 'right'
  } as GameState;
}

function prob(card: Card, state: GameState, suit: Suit = card.suit): number {
  return calculateWinProbability(state, card, suit, state.trumpSuit ?? 'clubs');
}

/** Engine legal-move list: follow hearts. The spade in hand is not offered. */
function ctx(hand: Card[]): SuecaStrategyContext {
  return {
    getValidCards: () =>
      hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => card.suit === 'hearts')
  };
}

describe('calculateWinProbability — Sueca rank scale', () => {
  const fresh = makeState({ hand: [] });

  it('ranks higher cards from the 40-card deck, not the raw hierarchy number', () => {
    const hearts = (rank: Card['rank']) => makeCard(rank, 'hearts');
    expect(prob(hearts('A'), fresh)).toBe(1);
    expect(prob(hearts('7'), fresh)).toBeCloseTo(1 - 1 / 10);
    expect(prob(hearts('K'), fresh)).toBeCloseTo(1 - 2 / 10);
    expect(prob(hearts('J'), fresh)).toBeCloseTo(1 - 3 / 10);
    expect(prob(hearts('Q'), fresh)).toBeCloseTo(1 - 4 / 10);
    expect(prob(hearts('2'), fresh)).toBeCloseTo(1 - 9 / 10);
  });

  it('raises the chance when a higher card of the suit has been played', () => {
    const king = makeCard('K', 'hearts');
    const unseen = prob(king, fresh);
    const aceOut = prob(
      king,
      makeState({ hand: [king], playedCards: [makeCard('A', 'hearts')] })
    );
    expect(aceOut).toBeGreaterThan(unseen);
    expect(aceOut).toBeCloseTo(1 - 1 / 9);
  });

  it('treats a card as unbeatable in-suit once every higher rank is out', () => {
    const seven = makeCard('7', 'hearts');
    const state = makeState({
      hand: [seven],
      playedCards: [makeCard('A', 'hearts')]
    });
    expect(prob(seven, state)).toBe(1);

    const queen = makeCard('Q', 'diamonds');
    const allAbove = makeState({
      hand: [queen],
      playedCards: ['J', 'K', '7', 'A'].map((rank) => makeCard(rank as Card['rank'], 'diamonds')),
      trumpSuit: 'clubs'
    });
    expect(prob(queen, allAbove, 'diamonds')).toBe(1);
  });
});

describe('calculateWinProbability — current trick counted once', () => {
  it('does not treat a trick card as a second copy when it is already in playedCards', () => {
    const six = makeCard('6', 'hearts');
    const queen = makeCard('Q', 'hearts');
    const playedOnly = makeState({
      hand: [six],
      playedCards: [queen],
      trick: []
    });
    const alsoInTrick = makeState({
      hand: [six],
      playedCards: [queen],
      trick: [queen]
    });
    const once = prob(six, playedOnly);
    expect(prob(six, alsoInTrick)).toBe(once);
    expect(once).toBeCloseTo(1 - 4 / 9);
  });
});

describe('calculateWinProbability — trump', () => {
  it('uses the same higher-rank count for a trump', () => {
    const seven = makeCard('7', 'clubs');
    const state = makeState({ hand: [seven], trumpSuit: 'clubs' });
    expect(prob(seven, state, 'clubs')).toBeCloseTo(1 - 1 / 10);
    expect(
      prob(
        makeCard('A', 'clubs'),
        makeState({ hand: [makeCard('A', 'clubs')], trumpSuit: 'clubs' }),
        'clubs'
      )
    ).toBe(1);
  });

  it('scores a non-trump as beaten only when trump is already in this trick', () => {
    const king = makeCard('K', 'hearts');
    const trumpInTrick = makeState({
      hand: [king],
      trumpSuit: 'clubs',
      trick: [makeCard('3', 'hearts'), makeCard('2', 'clubs')],
      playedCards: [makeCard('3', 'hearts'), makeCard('2', 'clubs')]
    });
    expect(prob(king, trumpInTrick, 'hearts')).toBe(0);

    const trumpAlreadyGone = makeState({
      hand: [king],
      trumpSuit: 'clubs',
      trick: [makeCard('3', 'hearts')],
      playedCards: [makeCard('A', 'clubs'), makeCard('3', 'hearts')]
    });
    expect(prob(king, trumpAlreadyGone, 'hearts')).toBeGreaterThan(0);
  });
});

describe('Hard choice follows the corrected probability', () => {
  /**
   * Hearts led with the 3. 2, 4, 5 and 6 are already out.
   * Queen still has J, K, 7 and A above it (4 of the 5 cards left) → 0.2.
   * Ace has nothing above it → 1.
   * The old `10 - hierarchy` count treated the queen as one higher card
   * short of the top (probability 0.75) and Hard then played the queen
   * as the cheapest "likely" winner. Corrected Hard keeps the ace.
   * Medium still uses the "< 2 higher cards played" rule and plays the queen.
   */
  const queen = makeCard('Q', 'hearts');
  const ace = makeCard('A', 'hearts');
  const lead = makeCard('3', 'hearts');
  const alreadyOut = ['2', '4', '5', '6'].map((rank) => makeCard(rank as Card['rank'], 'hearts'));

  function position(difficulty: 'easy' | 'medium' | 'hard'): GameState {
    return makeState({
      hand: [queen, ace, makeCard('K', 'spades')],
      trick: [lead],
      trickLeader: 1,
      trumpSuit: 'clubs',
      playedCards: [...alreadyOut, lead],
      aiDifficulty: difficulty
    });
  }

  it('Hard plays the ace; Medium still plays the queen', () => {
    const hard = position('hard');
    const medium = position('medium');
    expect(calculateWinProbability(hard, queen, 'hearts', 'clubs')).toBeCloseTo(0.2);
    expect(calculateWinProbability(hard, ace, 'hearts', 'clubs')).toBe(1);

    expect(hard.players[0].hand[chooseSuecaCard(hard, 0, ctx(hard.players[0].hand))].rank).toBe('A');
    expect(medium.players[0].hand[chooseSuecaCard(medium, 0, ctx(medium.players[0].hand))].rank).toBe('Q');
  });

  it('Easy and Hard both stay on a legal heart', () => {
    const easy = position('easy');
    const hard = position('hard');
    const easyIndex = chooseSuecaCard(easy, 0, ctx(easy.players[0].hand));
    const hardIndex = chooseSuecaCard(hard, 0, ctx(hard.players[0].hand));
    expect(easy.players[0].hand[easyIndex].suit).toBe('hearts');
    expect(hard.players[0].hand[hardIndex].suit).toBe('hearts');
    expect(hard.players[0].hand[hardIndex].rank).not.toBe('K');
  });
});
