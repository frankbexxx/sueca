import type { Card, GameState } from '../../types/game';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { HeartsGame } from '../../models/games/HeartsGame';
import { mapTableModelToPhaserView } from './mapTableModelToPhaserView';
import { nextSyncGeneration, isStaleGeneration } from './phaserSyncGuards';
import { resolveTableRenderer } from '../resolveTableRenderer';

function card(suit: Card['suit'], rank: Card['rank'], id: string): Card {
  return { suit, rank, id };
}

function heartsBase(overrides: Partial<GameState> = {}): GameState {
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
    trumpSuit: null,
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
      hearts: {
        heartsBroken: false,
        playerScores: [0, 0, 0, 0],
        roundPoints: [0, 0, 0, 0],
        lastRoundDeltas: [0, 0, 0, 0],
        waitingForPass: false,
        passDirection: 'left',
        humanPassIndices: [],
        heartsTakenCount: 0,
        queenSpadesTaken: false,
        penaltyCardsTaken: [[], [], [], []],
        waitingForEarlyEnd: false,
        scoringFrozen: false,
        earlyEndOffered: false
      }
    },
    ...overrides
  };
}

function mapHearts(
  gameState: GameState,
  opts: {
    width?: number;
    height?: number;
    isLocalCardPlayable?: (i: number) => boolean;
    passIndices?: number[];
  } = {}
) {
  const hearts = gameState.variantState?.hearts as never;
  const boardFlow = resolveGameBoardFlow({ variant: 'hearts', gameState });
  const model = buildTableRenderModel({
    gameState,
    variant: 'hearts',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow,
    heartsState: hearts,
    heartsPassIndices: opts.passIndices
  });
  const view = mapTableModelToPhaserView({
    model,
    width: opts.width ?? 390,
    height: opts.height ?? 740,
    isLocalCardPlayable: opts.isLocalCardPlayable
  });
  return { model, view };
}

describe('Hearts Phaser selector', () => {
  it('defaults Phaser; forces DOM with ?renderer=dom', () => {
    expect(resolveTableRenderer('hearts', { override: null })).toBe('phaser');
    expect(
      resolveTableRenderer('hearts', { search: '?renderer=dom' })
    ).toBe('dom');
    expect(
      resolveTableRenderer('hearts', { search: '?renderer=phaser' })
    ).toBe('phaser');
  });
});

describe('mapTableModelToPhaserView — Hearts', () => {
  it('maps pass phase: selection on, no trick interaction, closed banner', () => {
    const gameState = heartsBase({
      waitingForRoundStart: true,
      variantState: {
        hearts: {
          ...(heartsBase().variantState!.hearts as object),
          waitingForPass: true,
          humanPassIndices: [1, 4]
        } as never
      }
    });
    const { model, view } = mapHearts(gameState, { passIndices: [1, 4] });
    expect(model.status.heartsPassActive).toBe(true);
    expect(view.heartsPassPhase).toBe(true);
    expect(view.passSelectionEnabled).toBe(true);
    expect(view.interactionEnabled).toBe(false);
    expect(view.localIsActive).toBe(false);
    expect(view.localHand.every((c) => c.canDrag === false)).toBe(true);
    expect(view.localHand[1].selected).toBe(true);
    expect(view.localHand[4].selected).toBe(true);
    expect(view.localHand[0].selected).toBe(false);
    // Pass sheet owns status; Phaser banner cleared to avoid overlap.
    expect(view.trumpLabel).toBe('');
    expect(view.showTrumpSymbol).toBe(false);
    expect(view.heartsBroken).toBe(false);
    expect(view.layout.aspect).toBe('portrait');
  });

  it('maps play: inactive hand when not local turn', () => {
    const { view } = mapHearts(heartsBase({ currentPlayerIndex: 2 }), {
      isLocalCardPlayable: () => true
    });
    expect(view.heartsPassPhase).toBe(false);
    expect(view.passSelectionEnabled).toBe(false);
    expect(view.localIsActive).toBe(false);
    expect(view.localHand.every((c) => c.visualState === 'inactive')).toBe(true);
    expect(view.localHand.every((c) => c.canDrag === false)).toBe(true);
  });

  it('maps legal/illegal from shell playability (first-trick / Q♠ via engine callback)', () => {
    const gameState = heartsBase({ currentPlayerIndex: 0 });
    const { view } = mapHearts(gameState, {
      isLocalCardPlayable: (i) => i === 0 || i === 2
    });
    expect(view.localIsActive).toBe(true);
    expect(view.localHand[0].visualState).toBe('legal');
    expect(view.localHand[0].canDrag).toBe(true);
    expect(view.localHand[1].visualState).toBe('illegal');
    expect(view.localHand[1].canDrag).toBe(false);
  });

  it('maps hearts broken banner accent', () => {
    const gameState = heartsBase({
      variantState: {
        hearts: {
          ...(heartsBase().variantState!.hearts as object),
          heartsBroken: true
        } as never
      }
    });
    const { model, view } = mapHearts(gameState, { width: 800, height: 400 });
    expect(model.variantUi.hearts?.heartsBroken).toBe(true);
    expect(view.heartsBroken).toBe(true);
    expect(view.trumpLabel).toBe('');
    expect(view.showTrumpSymbol).toBe(false);
    expect(view.bannerAccent).toBe(false);
    expect(view.layout.aspect).toBe('landscape');
  });

  it('maps dealer/leader and trick 0→4 with hand shrink', () => {
    const empty = mapHearts(
      heartsBase({ dealerIndex: 1, trickLeader: 2, currentPlayerIndex: 2 })
    );
    expect(empty.view.trick).toHaveLength(0);
    expect(empty.model.dealerSeat).toBe(1);
    expect(empty.model.leaderSeat).toBe(2);

    const withTrick = heartsBase({
      dealerIndex: 1,
      trickLeader: 2,
      currentTrick: [
        card('clubs', '2', 'c2'),
        card('clubs', '5', 'c5'),
        card('clubs', '9', 'c9'),
        card('spades', 'Q', 'sq')
      ],
      players: heartsBase().players.map((p, i) =>
        i === 0 ? { ...p, hand: p.hand.slice(0, 12) } : p
      )
    });
    const mapped = mapHearts(withTrick);
    expect(mapped.view.trick).toHaveLength(4);
    expect(mapped.view.localHand).toHaveLength(12);
  });

  it('maps empty hand after 13 plays', () => {
    const gameState = heartsBase({
      players: heartsBase().players.map((p) => ({ ...p, hand: [] }))
    });
    const { view } = mapHearts(gameState);
    expect(view.localHand).toHaveLength(0);
    expect(view.seats.every((s) => s.handCount === 0)).toBe(true);
  });

  it('maps round end and early-end: interaction off', () => {
    const roundEnd = mapHearts(
      heartsBase({
        waitingForRoundEnd: true,
        players: heartsBase().players.map((p) => ({ ...p, hand: [] }))
      })
    );
    expect(roundEnd.model.status.waitingForRoundEnd).toBe(true);
    expect(roundEnd.view.interactionEnabled).toBe(false);

    const early = heartsBase({
      variantState: {
        hearts: {
          ...(heartsBase().variantState!.hearts as object),
          waitingForEarlyEnd: true,
          earlyEndOffered: true,
          heartsTakenCount: 13,
          queenSpadesTaken: true
        } as never
      }
    });
    const earlyMapped = mapHearts(early);
    expect(earlyMapped.model.status.waitingForEarlyEnd).toBe(true);
    expect(earlyMapped.view.interactionEnabled).toBe(false);
    expect(earlyMapped.view.passSelectionEnabled).toBe(false);
  });

  it('maps shoot-the-moon / round deltas boundary without Phaser score UI', () => {
    const gameState = heartsBase({
      waitingForRoundEnd: true,
      variantState: {
        hearts: {
          ...(heartsBase().variantState!.hearts as object),
          lastRoundDeltas: [-26, 0, 0, 0],
          playerScores: [0, 26, 26, 26],
          roundPoints: [26, 0, 0, 0]
        } as never
      }
    });
    const { model, view } = mapHearts(gameState);
    expect(model.status.waitingForRoundEnd).toBe(true);
    expect(view.interactionEnabled).toBe(false);
    expect(model.variantUi.hearts).toBeTruthy();
  });

  it('generation guard remains valid across updates', () => {
    let g = 0;
    g = nextSyncGeneration(g);
    g = nextSyncGeneration(g);
    expect(isStaleGeneration(1, g)).toBe(true);
    expect(isStaleGeneration(g, g)).toBe(false);
  });
});

describe('Hearts first-trick restrictions via engine + Phaser mapping', () => {
  it('penalty blocked when non-penalty follow exists; Q♠ legal when only penalties remain', () => {
    const game = new HeartsGame();
    game.initialize(['P1', 'P2', 'P3', 'P4']);
    // Hold rounds skip pass; force playable first-trick follow like HeartsGame.test
    const internal = game as unknown as { state: GameState };
    const state = internal.state;
    const hearts = state.variantState!.hearts as {
      waitingForPass: boolean;
      waitingForEarlyEnd: boolean;
    };
    hearts.waitingForPass = false;
    hearts.waitingForEarlyEnd = false;
    state.waitingForRoundStart = false;
    state.isFirstTrick = true;
    state.currentTrick = [card('clubs', '2', 'lead')];
    state.trickLeader = 0;
    state.currentPlayerIndex = 1;
    state.variantState = { ...state.variantState, hearts };

    // Void clubs: diamond + heart + Q♠ → only diamond legal
    state.players[1].hand = [
      card('diamonds', '5', 'd5'),
      card('hearts', '3', 'h3'),
      card('spades', 'Q', 'sq')
    ];
    expect(game.canPlayCard(state, 1, 0)).toBe(true);
    expect(game.canPlayCard(state, 1, 1)).toBe(false);
    expect(game.canPlayCard(state, 1, 2)).toBe(false);

    // Map as if local is seat 1 for visual reflection
    const boardFlow = resolveGameBoardFlow({ variant: 'hearts', gameState: state });
    const model = buildTableRenderModel({
      gameState: state,
      variant: 'hearts',
      localPlayerIndex: 1,
      usTeam: 1,
      themTeam: 2,
      boardFlow,
      heartsState: state.variantState?.hearts as never
    });
    const viewBlocked = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 740,
      isLocalCardPlayable: (i) => game.canPlayCard(state, 1, i)
    });
    expect(viewBlocked.localHand.map((c) => c.visualState)).toEqual([
      'legal',
      'illegal',
      'illegal'
    ]);

    // Only penalties remain → both legal
    state.players[1].hand = [
      card('hearts', '3', 'h3b'),
      card('spades', 'Q', 'sqb')
    ];
    expect(game.canPlayCard(state, 1, 0)).toBe(true);
    expect(game.canPlayCard(state, 1, 1)).toBe(true);
    const modelOnly = buildTableRenderModel({
      gameState: state,
      variant: 'hearts',
      localPlayerIndex: 1,
      usTeam: 1,
      themTeam: 2,
      boardFlow: resolveGameBoardFlow({ variant: 'hearts', gameState: state }),
      heartsState: state.variantState?.hearts as never
    });
    const viewOnly = mapTableModelToPhaserView({
      model: modelOnly,
      width: 390,
      height: 740,
      isLocalCardPlayable: (i) => game.canPlayCard(state, 1, i)
    });
    expect(viewOnly.localHand.every((c) => c.visualState === 'legal')).toBe(true);
  });
});
