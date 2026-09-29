/**
 * ARCH-SUECA-07 — consumer migration (AI / CI / table) under PlayDirection.
 */
import { describe, expect, it } from 'vitest';
import {
  cardWouldWinTrickSueca,
  playDirectionOf,
  suecaTrickWinnerIndex
} from '../../ai/games/sueca/suecaTrickHelpers';
import { getPartnerIndex } from '../../ai/games/sueca/SuecaStrategy';
import {
  inferSuecaTrickLeader,
  suecaTrickWinnerIndex as ciWinner,
  cardWouldWinTrickSueca as ciWouldWin
} from '../../cardIntelligence/encoder/trickHelpers';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { asSeat, partnerOf, seatAtOffset } from './suecaRules';
import type { Card, GameState, Suit } from '../../types/game';

function makeCard(rank: Card['rank'], suit: Suit, id?: string): Card {
  return { rank, suit, id: id ?? `${suit}_${rank}` };
}

const fourCards = [
  makeCard('2', 'clubs', 'c2'),
  makeCard('3', 'clubs', 'c3'),
  makeCard('4', 'clubs', 'c4'),
  makeCard('5', 'clubs', 'c5')
];

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [
      { id: 'p0', name: 'P0', hand: [], team: 1, type: 'human' },
      { id: 'p1', name: 'P1', hand: [], team: 2, type: 'ai' },
      { id: 'p2', name: 'P2', hand: [], team: 1, type: 'ai' },
      { id: 'p3', name: 'P3', hand: [], team: 2, type: 'ai' }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trumpSuit: 'spades',
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    completedPentes: [],
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: true,
    dealingMethod: 'A',
    dealingDirection: 'right',
    playDirection: 'right',
    dealAlignment: 'same',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P0',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variant: 'sueca',
    ...overrides
  } as GameState;
}

describe('ARCH-SUECA-07 AI playDirection', () => {
  it('RIGHT leader 0: wi=1 → seat 3 (East)', () => {
    const trick = [
      makeCard('2', 'clubs'),
      makeCard('A', 'clubs'),
      makeCard('3', 'clubs'),
      makeCard('4', 'clubs')
    ];
    expect(suecaTrickWinnerIndex(trick, 0, 'spades', 'right')).toBe(3);
  });

  it('LEFT leader 0: wi=1 → seat 1 (West)', () => {
    const trick = [
      makeCard('2', 'clubs'),
      makeCard('A', 'clubs'),
      makeCard('3', 'clubs'),
      makeCard('4', 'clubs')
    ];
    expect(suecaTrickWinnerIndex(trick, 0, 'spades', 'left')).toBe(1);
    expect(cardWouldWinTrickSueca(makeCard('A', 'clubs'), [makeCard('2', 'clubs')], 0, 'spades', 'left')).toBe(
      true
    );
    expect(suecaTrickWinnerIndex([makeCard('2', 'clubs'), makeCard('A', 'clubs')], 0, 'spades', 'left')).toBe(
      1
    );
  });

  it('partners remain 0↔2 / 1↔3 under both directions', () => {
    for (const play of ['right', 'left'] as const) {
      const state = baseState({ playDirection: play });
      expect(getPartnerIndex(state, 0)).toBe(2);
      expect(getPartnerIndex(state, 1)).toBe(3);
      expect(partnerOf(asSeat(0))).toBe(2);
      expect(partnerOf(asSeat(1))).toBe(3);
      expect(playDirectionOf(state)).toBe(play);
    }
  });
});

describe('ARCH-SUECA-07 CI playDirection', () => {
  it('inferSuecaTrickLeader LEFT: player 1 turn 1 → leader 0', () => {
    expect(inferSuecaTrickLeader(1, 1, 'left')).toBe(0);
    expect(inferSuecaTrickLeader(3, 1, 'right')).toBe(0);
  });

  it('CI winner mapping LEFT vs RIGHT', () => {
    const trick = [
      makeCard('2', 'clubs'),
      makeCard('A', 'clubs'),
      makeCard('3', 'clubs'),
      makeCard('4', 'clubs')
    ];
    expect(ciWinner(trick, 0, 'spades', 'right')).toBe(3);
    expect(ciWinner(trick, 0, 'spades', 'left')).toBe(1);
    expect(ciWouldWin(makeCard('A', 'clubs'), [makeCard('2', 'clubs')], 0, 'spades', 'left')).toBe(true);
  });
});

describe('ARCH-SUECA-07 table model seat order', () => {
  it('leader 0 RIGHT: 0→3→2→1', () => {
    const gameState = baseState({
      playDirection: 'right',
      trickLeader: 0,
      currentTrick: fourCards
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'sueca',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow
    });
    expect(model.currentTrick.map((t) => t.playerIndex)).toEqual([0, 3, 2, 1]);
  });

  it('leader 0 LEFT: 0→1→2→3', () => {
    const gameState = baseState({
      playDirection: 'left',
      trickLeader: 0,
      currentTrick: fourCards
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'sueca',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow
    });
    expect(model.currentTrick.map((t) => t.playerIndex)).toEqual([0, 1, 2, 3]);
  });

  it('non-zero leader respects playDirection', () => {
    expect([0, 1, 2, 3].map((i) => seatAtOffset(asSeat(2), i, 'right'))).toEqual([2, 1, 0, 3]);
    expect([0, 1, 2, 3].map((i) => seatAtOffset(asSeat(2), i, 'left'))).toEqual([2, 3, 0, 1]);
  });
});
