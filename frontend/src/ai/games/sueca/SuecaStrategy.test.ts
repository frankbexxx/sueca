import { chooseSuecaCard, SuecaStrategyContext } from './SuecaStrategy';
import { isSevenLeadBlocked } from './suecaTrickHelpers';
import { AIDifficulty, Card, GameState, Suit } from '../../../types/game';

function makeCard(rank: Card['rank'], suit: Suit, id?: string): Card {
  return { rank, suit, id: id ?? `${suit}_${rank}_test` };
}

function makeCtx(hand: Card[], legalIndices?: number[]): SuecaStrategyContext {
  return {
    getValidCards: () =>
      hand
        .map((card, index) => ({ card, index }))
        .filter(({ index }) => legalIndices === undefined || legalIndices.includes(index)),
  };
}

function makeState(params: {
  hand: Card[];
  trick?: Card[];
  trickLeader?: number;
  trumpSuit?: Suit;
  playedCards?: Card[];
  aiDifficulty?: AIDifficulty;
}): GameState {
  return {
    players: [
      { id: 'p0', hand: params.hand, name: 'P0', score: 0, team: 1 },
      { id: 'p1', hand: [], name: 'P1', score: 0, team: 2 },
      { id: 'p2', hand: [], name: 'P2', score: 0, team: 1 },
      { id: 'p3', hand: [], name: 'P3', score: 0, team: 2 },
    ],
    currentTrick: params.trick ?? [],
    trickLeader: params.trickLeader ?? 0,
    trumpSuit: params.trumpSuit ?? 'clubs',
    playedCards: params.playedCards ?? [],
    aiDifficulty: params.aiDifficulty ?? 'medium',
    partnerSignals: [],
    round: 1,
  } as GameState;
}

function cardAt(hand: Card[], index: number): Card {
  expect(hand[index]).toBeDefined();
  return hand[index];
}

describe('SuecaStrategy', () => {
  describe('S16 — do not lead seven before ace seen', () => {
    it('T1: avoids leading 7♦ when ace of diamonds not seen', () => {
      const hand = [makeCard('7', 'diamonds'), makeCard('4', 'diamonds')];
      const state = makeState({ hand, trumpSuit: 'spades' });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(cardAt(hand, idx).rank).toBe('4');
    });

    it('T2: allows leading 7♦ when ace of diamonds already played', () => {
      const seven = makeCard('7', 'diamonds');
      const hand = [seven, makeCard('4', 'diamonds')];
      const state = makeState({
        hand,
        trumpSuit: 'spades',
        playedCards: [makeCard('A', 'diamonds')],
      });
      expect(isSevenLeadBlocked(state, seven)).toBe(false);
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(hand[idx]).toBeDefined();
    });
  });

  describe('S08 — win with minimum card', () => {
    it('T3: picks lowest card that wins the trick', () => {
      const nine = makeCard('9', 'diamonds');
      const king = makeCard('K', 'diamonds');
      const hand = [nine, king];
      const trick = [makeCard('5', 'diamonds')];
      const state = makeState({
        hand,
        trick,
        trickLeader: 1,
        trumpSuit: 'clubs',
      });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(cardAt(hand, idx).rank).toBe('9');
    });
  });

  describe('S19/T05 — do not steal partner trick', () => {
    it('T4 medium: plays low when partner is winning', () => {
      const low = makeCard('2', 'hearts');
      const high = makeCard('K', 'hearts');
      const hand = [high, low];
      const trick = [makeCard('A', 'hearts')];
      const state = makeState({
        hand,
        trick,
        trickLeader: 2,
        trumpSuit: 'clubs',
        aiDifficulty: 'medium',
      });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(cardAt(hand, idx).rank).toBe('2');
    });

    it('T8 hard: plays low when partner is winning', () => {
      const low = makeCard('2', 'hearts');
      const high = makeCard('K', 'hearts');
      const hand = [high, low];
      const trick = [makeCard('A', 'hearts')];
      const state = makeState({
        hand,
        trick,
        trickLeader: 2,
        trumpSuit: 'clubs',
        aiDifficulty: 'hard',
      });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(cardAt(hand, idx).rank).toBe('2');
    });
  });

  describe('S12 smoke — minimum trump cut', () => {
    it('T5: prefers low trump when cutting', () => {
      const six = makeCard('6', 'clubs');
      const ace = makeCard('A', 'clubs');
      const hand = [six, ace];
      const trick = [makeCard('5', 'hearts')];
      const state = makeState({
        hand,
        trick,
        trickLeader: 1,
        trumpSuit: 'clubs',
      });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(cardAt(hand, idx).rank).toBe('6');
    });
  });

  describe('regression', () => {
    it('T6 easy: returns a legal index', () => {
      const hand = [makeCard('2', 'clubs'), makeCard('A', 'spades')];
      const state = makeState({ hand, aiDifficulty: 'easy' });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(hand[idx]).toBeDefined();
    });

    it('T7 medium: leading returns legal index', () => {
      const hand = [makeCard('3', 'diamonds'), makeCard('J', 'hearts')];
      const state = makeState({ hand, aiDifficulty: 'medium' });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect(idx).toBeGreaterThanOrEqual(0);
    });

    it('T9: returns -1 when no legal moves', () => {
      const hand = [makeCard('2', 'clubs')];
      const state = makeState({ hand });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand, []));
      expect(idx).toBe(-1);
    });

    it('T10: medium lead picks from legal pool', () => {
      const hand = [makeCard('4', 'spades'), makeCard('Q', 'hearts')];
      const state = makeState({ hand, trumpSuit: 'hearts' });
      const idx = chooseSuecaCard(state, 0, makeCtx(hand));
      expect([0, 1]).toContain(idx);
    });
  });
});
