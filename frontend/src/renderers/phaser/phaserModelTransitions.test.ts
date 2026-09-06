import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { mapTableModelToPhaserView } from './mapTableModelToPhaserView';
import type { Card, GameState } from '../../types/game';

function card(suit: Card['suit'], rank: Card['rank'], id: string): Card {
  return { suit, rank, id };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  const hand = Array.from({ length: 10 }, (_, i) =>
    card('clubs', (['2', '3', '4', '5', '6', '7', 'Q', 'J', 'K', 'A'] as const)[i], `c${i}`)
  );
  return {
    players: [
      { id: '1', name: 'P1', hand: [...hand], team: 1, type: 'human' },
      { id: '2', name: 'P2', hand: hand.map((c, i) => ({ ...c, id: `p2-${i}` })), team: 2, type: 'ai' },
      { id: '3', name: 'P3', hand: hand.map((c, i) => ({ ...c, id: `p3-${i}` })), team: 1, type: 'ai' },
      { id: '4', name: 'P4', hand: hand.map((c, i) => ({ ...c, id: `p4-${i}` })), team: 2, type: 'ai' }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 1,
    trumpSuit: 'hearts',
    trumpCard: card('hearts', 'A', 'trump'),
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
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...overrides
  };
}

function viewFor(state: GameState) {
  const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState: state });
  const model = buildTableRenderModel({
    gameState: state,
    variant: 'sueca',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow
  });
  return mapTableModelToPhaserView({ model, width: 640, height: 480 });
}

describe('phaser model transitions (E1 validation)', () => {
  it('tracks local hand 10 → 9 → … → 0 without leftover entities', () => {
    let state = baseState();
    for (let remaining = 10; remaining >= 0; remaining--) {
      const hand = state.players[0].hand.slice(0, remaining);
      state = {
        ...state,
        players: state.players.map((p, i) =>
          i === 0 ? { ...p, hand } : { ...p, hand: p.hand.slice(0, remaining) }
        )
      };
      const view = viewFor(state);
      expect(view.localHand).toHaveLength(remaining);
      expect(view.localHand.every((c, idx) => c.cardIndex === idx)).toBe(true);
    }
  });

  it('tracks trick 0 → 4 → 0', () => {
    let state = baseState({ currentTrick: [], trickLeader: 0 });
    expect(viewFor(state).trick).toHaveLength(0);

    const played = [
      card('clubs', '2', 't0'),
      card('clubs', '3', 't1'),
      card('clubs', '4', 't2'),
      card('clubs', '5', 't3')
    ];
    for (let n = 1; n <= 4; n++) {
      state = { ...state, currentTrick: played.slice(0, n) };
      const view = viewFor(state);
      expect(view.trick).toHaveLength(n);
      expect(view.trick.map((t) => t.card.id)).toEqual(played.slice(0, n).map((c) => c.id));
    }

    state = { ...state, currentTrick: [], waitingForTrickEnd: false };
    expect(viewFor(state).trick).toHaveLength(0);
  });

  it('new round restores 10 local cards and clears trick', () => {
    const mid = baseState({
      currentTrick: [card('spades', 'A', 'x')],
      waitingForTrickEnd: true,
      players: baseState().players.map((p, i) =>
        i === 0 ? { ...p, hand: p.hand.slice(0, 3) } : p
      )
    });
    expect(viewFor(mid).localHand).toHaveLength(3);
    expect(viewFor(mid).trick).toHaveLength(1);
    expect(viewFor(mid).interactionEnabled).toBe(false);

    const next = baseState({ round: 2, gameScore: { team1: 0, team2: 1 } });
    const view = viewFor(next);
    expect(view.localHand).toHaveLength(10);
    expect(view.trick).toHaveLength(0);
    expect(view.interactionEnabled).toBe(true);
    expect(view.opponents.every((o) => o.backPositions.length === 10)).toBe(true);
  });
});
