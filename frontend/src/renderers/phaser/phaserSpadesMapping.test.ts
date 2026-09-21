import type { Card, GameState } from '../../types/game';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import {
  formatSpadesBidBadge,
  mapTableModelToPhaserView
} from './mapTableModelToPhaserView';
import { nextSyncGeneration, isStaleGeneration } from './phaserSyncGuards';

function card(suit: Card['suit'], rank: Card['rank'], id: string): Card {
  return { suit, rank, id };
}

function spadesState(overrides: Partial<GameState> = {}): GameState {
  const hand = Array.from({ length: 13 }, (_, i) =>
    card(
      'clubs',
      (['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const)[i],
      `c${i}`
    )
  );
  return {
    players: [
      { id: '1', name: 'P1', hand: [...hand], team: 1, type: 'human' },
      {
        id: '2',
        name: 'P2',
        hand: hand.map((c, i) => ({ ...c, id: `p2-${i}` })),
        team: 2,
        type: 'ai'
      },
      {
        id: '3',
        name: 'P3',
        hand: hand.map((c, i) => ({ ...c, id: `p3-${i}` })),
        team: 1,
        type: 'ai'
      },
      {
        id: '4',
        name: 'P4',
        hand: hand.map((c, i) => ({ ...c, id: `p4-${i}` })),
        team: 2,
        type: 'ai'
      }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 3,
    trumpSuit: 'spades',
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 40, team2: 20 },
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
    variantState: {
      spades: {
        playerBids: [3, 4, 2, 4],
        playerBidTypes: ['normal', 'normal', 'nil', 'normal'],
        bidLeaderIndex: 0,
        currentBidderIndex: 0,
        team1Bid: 5,
        team2Bid: 8,
        team1Tricks: 0,
        team2Tricks: 0,
        playerTricks: [0, 0, 0, 0],
        team1Bags: 2,
        team2Bags: 1,
        waitingForBids: false,
        spadesBroken: false,
        nilEnabled: true,
        blindNilEnabled: false
      }
    },
    ...overrides
  };
}

describe('formatSpadesBidBadge', () => {
  it('formats nil / blind / number; pending stays quiet', () => {
    expect(formatSpadesBidBadge(0, 'nil', false)).toBe('Nil');
    expect(formatSpadesBidBadge(0, 'blindNil', false)).toBe('Blind');
    expect(formatSpadesBidBadge(4, 'normal', false)).toBe('4');
    expect(formatSpadesBidBadge(null, 'normal', true)).toBeNull();
    expect(formatSpadesBidBadge(null, 'normal', false)).toBeNull();
  });
});

describe('mapTableModelToPhaserView — Spades', () => {
  it('maps play state: inactive hand when not local turn, closed banner', () => {
    const gameState = spadesState({ currentPlayerIndex: 1 });
    const boardFlow = resolveGameBoardFlow({
      variant: 'spades',
      gameState
    });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 740,
      isLocalCardPlayable: () => true
    });
    expect(view.spadesBidPhase).toBe(false);
    expect(view.spadesBroken).toBe(false);
    // React SuitBrokenBadge owns broken/closed status — Phaser banner stays clear.
    expect(view.trumpLabel).toBe('');
    expect(view.showTrumpSymbol).toBe(false);
    expect(view.bannerAccent).toBe(false);
    expect(view.localIsActive).toBe(false);
    expect(view.localHand.every((c) => c.visualState === 'inactive')).toBe(true);
    expect(view.localHand.every((c) => c.canDrag === false)).toBe(true);
    // Seat bids only during auction (strip shows team bids in play).
    expect(view.seats[2].bidLabel).toBeNull();
    expect(view.seats[0].bidLabel).toBeNull();
    expect(view.seats.find((s) => s.isDealer)?.labelText).toContain('D');
    expect(view.layout.aspect).toBe('portrait');
  });

  it('maps bidding: no card interaction, bidder highlight, pending badges', () => {
    const gameState = spadesState({
      waitingForRoundStart: true,
      currentPlayerIndex: 0,
      variantState: {
        spades: {
          playerBids: [3, null, null, null],
          playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
          bidLeaderIndex: 0,
          currentBidderIndex: 1,
          team1Bid: 0,
          team2Bid: 0,
          team1Tricks: 0,
          team2Tricks: 0,
          playerTricks: [0, 0, 0, 0],
          team1Bags: 0,
          team2Bags: 0,
          waitingForBids: true,
          spadesBroken: false,
          nilEnabled: true,
          blindNilEnabled: false
        }
      }
    });
    const boardFlow = resolveGameBoardFlow({
      variant: 'spades',
      gameState
    });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    expect(model.status.spadesBidActive).toBe(true);
    expect(model.activeSeat).toBe(1);

    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 740,
      isLocalCardPlayable: () => true,
      activeTurnLabel: 'A JOGAR'
    });
    expect(view.spadesBidPhase).toBe(true);
    expect(view.interactionEnabled).toBe(false);
    expect(view.localIsActive).toBe(false);
    expect(view.localHand.every((c) => c.canDrag === false)).toBe(true);
    expect(view.seats[1].showActiveHighlight).toBe(true);
    expect(view.seats[1].turnCueLabel).toBe('A JOGAR');
    expect(view.seats.filter((s) => s.turnCueLabel)).toHaveLength(1);
    expect(view.seats[0].bidLabel).toBe('3');
    expect(view.seats[1].bidLabel).toBeNull();
    expect(view.seats[0].labelText).toContain('3');
    expect(view.seats[1].labelText).not.toContain('…');
    expect(view.seats[1].labelText).toBe('P2');
    expect(view.seats.every((s) => !s.monogram)).toBe(true);
  });

  it('maps broken spades banner accent', () => {
    const base = spadesState();
    const spades = {
      ...(base.variantState!.spades as Record<string, unknown>),
      spadesBroken: true
    };
    const gameState = spadesState({
      variantState: { spades: spades as never }
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'spades', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    expect(model.variantUi.spades?.spadesBroken).toBe(true);
    const view = mapTableModelToPhaserView({ model, width: 800, height: 400 });
    expect(view.spadesBroken).toBe(true);
    expect(view.trumpLabel).toBe('');
    expect(view.showTrumpSymbol).toBe(false);
    expect(view.bannerAccent).toBe(false);
    expect(view.layout.aspect).toBe('landscape');
  });

  it('maps legal/illegal when local is active', () => {
    const gameState = spadesState({ currentPlayerIndex: 0 });
    const boardFlow = resolveGameBoardFlow({ variant: 'spades', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 740,
      isLocalCardPlayable: (i) => i % 2 === 0
    });
    expect(view.localIsActive).toBe(true);
    expect(view.localHand[0].visualState).toBe('legal');
    expect(view.localHand[0].canDrag).toBe(true);
    expect(view.localHand[1].visualState).toBe('illegal');
    expect(view.localHand[1].canDrag).toBe(false);
  });

  it('maps trick 0→4 and hand shrinks; dealer/leader seats', () => {
    const base = spadesState({ dealerIndex: 2, trickLeader: 1, currentPlayerIndex: 1 });
    const boardFlow = resolveGameBoardFlow({ variant: 'spades', gameState: base });
    const empty = buildTableRenderModel({
      gameState: base,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: base.variantState?.spades as never
    });
    expect(mapTableModelToPhaserView({ model: empty, width: 390, height: 740 }).trick).toHaveLength(
      0
    );

    const withTrick = spadesState({
      dealerIndex: 2,
      trickLeader: 1,
      currentTrick: [
        card('hearts', '5', 'h5'),
        card('hearts', '9', 'h9'),
        card('hearts', 'K', 'hk'),
        card('spades', '2', 's2')
      ],
      players: spadesState().players.map((p, i) =>
        i === 0 ? { ...p, hand: p.hand.slice(0, 12) } : p
      ),
      variantState: {
        spades: {
          ...(spadesState().variantState!.spades as Record<string, unknown>),
          spadesBroken: true
        } as never
      }
    });
    const flow2 = resolveGameBoardFlow({ variant: 'spades', gameState: withTrick });
    const model2 = buildTableRenderModel({
      gameState: withTrick,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow: flow2,
      spadesState: withTrick.variantState?.spades as never
    });
    const view = mapTableModelToPhaserView({ model: model2, width: 390, height: 740 });
    expect(view.trick).toHaveLength(4);
    expect(view.localHand).toHaveLength(12);
    expect(view.dealerSeat).toBe(2);
    expect(model2.leaderSeat).toBe(1);
    expect(view.spadesBroken).toBe(true);
  });

  it('maps empty hand after 13 plays and cleared trick', () => {
    const gameState = spadesState({
      currentTrick: [],
      players: spadesState().players.map((p) => ({ ...p, hand: [] }))
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'spades', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    const view = mapTableModelToPhaserView({ model, width: 390, height: 740 });
    expect(view.localHand).toHaveLength(0);
    expect(view.trick).toHaveLength(0);
    expect(view.seats.every((s) => s.handCount === 0)).toBe(true);
  });

  it('maps round end: interaction off, continue CTA in model status', () => {
    const gameState = spadesState({
      waitingForRoundEnd: true,
      currentPlayerIndex: 0,
      players: spadesState().players.map((p) => ({ ...p, hand: [] }))
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'spades', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    expect(model.status.waitingForRoundEnd).toBe(true);
    expect(model.activeSeat).toBeNull();
    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 740,
      isLocalCardPlayable: () => true
    });
    expect(view.interactionEnabled).toBe(false);
    expect(view.localIsActive).toBe(false);
  });

  it('maps race-to-500 game over without phaser-owned score UI', () => {
    const gameState = spadesState({
      isGameOver: true,
      winner: 1,
      gameScore: { team1: 520, team2: 380 },
      waitingForRoundEnd: false
    });
    const boardFlow = resolveGameBoardFlow({ variant: 'spades', gameState });
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      spadesState: gameState.variantState?.spades as never
    });
    expect(model.status.isGameOver).toBe(true);
    expect(model.activeSeat).toBeNull();
    const view = mapTableModelToPhaserView({ model, width: 390, height: 740 });
    expect(view.interactionEnabled).toBe(false);
    // Bags / race modal stay React — model still carries score for HUD consumers.
    expect(model.scores.gamePoints.team1).toBe(520);
  });

  it('generation guard helper remains valid across updates', () => {
    let g = 0;
    g = nextSyncGeneration(g);
    g = nextSyncGeneration(g);
    expect(isStaleGeneration(1, g)).toBe(true);
    expect(isStaleGeneration(g, g)).toBe(false);
  });
});