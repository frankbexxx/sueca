import {
  buildPhaserTableLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass,
  pointInDropZone,
  resolveAspectMode
} from './phaserTableLayout';
import {
  cardTextureKey,
  mapTableModelToPhaserView,
  trumpSymbolForSuit
} from './mapTableModelToPhaserView';
import { shouldUseSuecaPhaserTable } from './rendererFlag';
import {
  isStaleGeneration,
  nextSyncGeneration,
  PLAY_CLICK_LOCK_MS
} from './phaserSyncGuards';
import { DEFAULT_THEME, themesEqual } from './phaserTheme';
import type { TableRenderModel } from '../../table/tableRenderModel';
import type { Card } from '../../types/game';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import type { GameState } from '../../types/game';

function minimalModel(overrides: Partial<TableRenderModel> = {}): TableRenderModel {
  const gameState = {
    players: [
      { id: '1', name: 'P1', hand: [{ suit: 'hearts', rank: 'A', id: 'hA' } as Card], team: 1 as const, type: 'human' as const },
      { id: '2', name: 'P2', hand: Array.from({ length: 9 }, (_, i) => ({ suit: 'clubs', rank: '2', id: `p2-${i}` } as Card)), team: 2 as const, type: 'ai' as const },
      { id: '3', name: 'P3', hand: Array.from({ length: 10 }, (_, i) => ({ suit: 'diamonds', rank: '3', id: `p3-${i}` } as Card)), team: 1 as const, type: 'ai' as const },
      { id: '4', name: 'P4', hand: Array.from({ length: 10 }, (_, i) => ({ suit: 'spades', rank: '4', id: `p4-${i}` } as Card)), team: 2 as const, type: 'ai' as const }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 1,
    trumpSuit: 'spades' as const,
    trumpCard: null,
    currentTrick: [{ suit: 'clubs', rank: '7', id: 'c7' } as Card],
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
    isFirstTrick: false,
    dealingMethod: 'A' as const,
    dealingDirection: 'left' as const,
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium' as const,
    partnerSignals: []
  };

  const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
  const base: TableRenderModel = {
    variant: 'sueca',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    seats: [
      { index: 0, name: 'P1', team: 1, isLocal: true, isActive: true, isDealer: false, isTrickLeader: true, handCount: 1 },
      { index: 1, name: 'P2', team: 2, isLocal: false, isActive: false, isDealer: true, isTrickLeader: false, handCount: 9 },
      { index: 2, name: 'P3', team: 1, isLocal: false, isActive: false, isDealer: false, isTrickLeader: false, handCount: 10 },
      { index: 3, name: 'P4', team: 2, isLocal: false, isActive: false, isDealer: false, isTrickLeader: false, handCount: 10 }
    ],
    localHand: [{ suit: 'hearts', rank: 'A', id: 'hA' }],
    currentTrick: [
      { card: { suit: 'clubs', rank: '7', id: 'c7' }, playerIndex: 0, orderIndex: 0 }
    ],
    activeSeat: 0,
    dealerSeat: 1,
    leaderSeat: 0,
    trumpSuit: 'spades',
    trumpCard: null,
    scores: { roundPoints: { team1: 0, team2: 0 }, gamePoints: { team1: 0, team2: 0 }, round: 1 },
    status: {
      flowKind: boardFlow.kind,
      isPaused: false,
      isGameOver: false,
      waitingForTrickEnd: false,
      waitingForRoundStart: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      waitingForEarlyEnd: false,
      heartsPassActive: false,
      spadesBidActive: false,
      festaSheetActive: false,
      flowOverlayActive: false,
      showTrickContinueCta: false,
      showTrickContinueChrome: false
    },
    chrome: {
      showTeamLabels: true,
      isTeamTableLayout: true,
      compactSeats: false,
      spadesBidPhase: false,
      showAuctionBadges: false,
      auctionLocale: 'pt',
      handReadOnly: false,
      boardModifiers: []
    },
    variantUi: {}
  };
  return { ...base, ...overrides, status: { ...base.status, ...(overrides.status || {}) }, chrome: { ...base.chrome, ...(overrides.chrome || {}) } };
}

describe('phaserTableLayout E2', () => {
  it('maps seats relative to local south', () => {
    expect(playerIndexToCompass(0, 0)).toBe('south');
    expect(playerIndexToCompass(1, 0)).toBe('west');
  });

  it('resolves portrait / landscape / desktop aspects', () => {
    expect(resolveAspectMode(390, 720)).toBe('portrait');
    expect(resolveAspectMode(800, 400)).toBe('landscape');
    expect(resolveAspectMode(1280, 800)).toBe('desktop');
  });

  it('builds desktop layout with fan slots and drop zone', () => {
    const layout = buildPhaserTableLayout(1280, 720);
    expect(layout.aspect).toBe('desktop');
    const hand = layoutLocalHandPositions(10, layout);
    expect(hand).toHaveLength(10);
    expect(hand[0].x).toBeLessThan(hand[9].x);
    expect(hand[0].rotationDeg).toBeLessThan(0);
    expect(hand[9].rotationDeg).toBeGreaterThan(0);
    expect(pointInDropZone(layout.center.x, layout.center.y, layout)).toBe(true);
    expect(pointInDropZone(0, 0, layout)).toBe(false);
  });

  it('builds portrait layout without overflowing hand band', () => {
    const layout = buildPhaserTableLayout(390, 720);
    expect(layout.aspect).toBe('portrait');
    expect(layout.handY).toBeLessThan(layout.height);
    expect(layout.handY + layout.cardHeight * 0.5).toBeLessThanOrEqual(layout.height + 8);
  });

  it('builds landscape layout with compact cards', () => {
    const layout = buildPhaserTableLayout(740, 360);
    expect(layout.aspect).toBe('landscape');
    expect(layout.cardWidth).toBeLessThanOrEqual(58);
    expect(layoutTrickSlot('east', layout).x).toBeGreaterThan(layout.center.x);
  });

  it('stacks opponent backs', () => {
    const layout = buildPhaserTableLayout(640, 480);
    expect(layoutOpponentBackPositions(5, 'north', layout)).toHaveLength(5);
  });
});

describe('mapTableModelToPhaserView E2', () => {
  it('maps identity, trump, dealer and team labels', () => {
    const model = minimalModel();
    const view = mapTableModelToPhaserView({
      model,
      width: 960,
      height: 640,
      selectedCardIndex: 0,
      isLocalCardPlayable: () => true,
      getTeamName: (t) => (t === 1 ? 'NÓS' : 'ELES')
    });
    expect(view.localHand[0].textureKey).toBe(cardTextureKey(model.localHand[0]));
    expect(view.localHand[0].visualState).toBe('legal');
    expect(view.localHand[0].canDrag).toBe(true);
    expect(view.trumpSymbol).toBe(trumpSymbolForSuit('spades'));
    expect(view.seats.find((s) => s.isDealer)?.seatIndex).toBe(1);
    expect(view.seats[0].showActiveHighlight).toBe(true);
    expect(view.opponents[0].teamLabel).toBeTruthy();
    expect(view.opponents[0].handCount).toBeGreaterThan(0);
  });

  it('marks illegal vs inactive visual states', () => {
    const active = mapTableModelToPhaserView({
      model: minimalModel({
        localHand: [
          { suit: 'hearts', rank: 'A', id: 'a' },
          { suit: 'clubs', rank: '2', id: 'b' }
        ]
      }),
      width: 640,
      height: 480,
      isLocalCardPlayable: (i) => i === 0
    });
    expect(active.localHand[0].visualState).toBe('legal');
    expect(active.localHand[1].visualState).toBe('illegal');
    expect(active.localHand[1].canDrag).toBe(false);

    const waiting = mapTableModelToPhaserView({
      model: minimalModel({
        status: {
          ...minimalModel().status,
          waitingForTrickEnd: true,
          flowKind: 'trick_end_wait'
        },
        activeSeat: null,
        seats: minimalModel().seats.map((s) => ({ ...s, isActive: false }))
      }),
      width: 640,
      height: 480,
      isLocalCardPlayable: () => true
    });
    expect(waiting.interactionEnabled).toBe(false);
    expect(waiting.localHand.every((c) => c.visualState === 'inactive')).toBe(true);
    expect(waiting.seats.every((s) => !s.showActiveHighlight)).toBe(true);
  });
});

describe('phaserSyncGuards', () => {
  it('tracks generation staleness and click lock constant', () => {
    const g = nextSyncGeneration(3);
    expect(g).toBe(4);
    expect(isStaleGeneration(3, 4)).toBe(true);
    expect(isStaleGeneration(4, 4)).toBe(false);
    expect(PLAY_CLICK_LOCK_MS).toBeGreaterThan(0);
  });
});

describe('phaserTheme', () => {
  it('compares theme tokens', () => {
    expect(themesEqual(DEFAULT_THEME, { ...DEFAULT_THEME })).toBe(true);
    expect(themesEqual(DEFAULT_THEME, { ...DEFAULT_THEME, felt: 1 })).toBe(false);
  });
});

describe('rendererFlag', () => {
  it('enables Phaser by default for capable variants; DOM for unknown', () => {
    expect(shouldUseSuecaPhaserTable('sueca')).toBe(true);
    expect(shouldUseSuecaPhaserTable('spades')).toBe(true);
    expect(shouldUseSuecaPhaserTable('hearts')).toBe(true);
    expect(shouldUseSuecaPhaserTable('king')).toBe(true);
    expect(shouldUseSuecaPhaserTable('bridge')).toBe(false);
  });
});

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

function viewFor(state: GameState, w = 640, h = 480) {
  const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState: state });
  const model = buildTableRenderModel({
    gameState: state,
    variant: 'sueca',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow
  });
  return mapTableModelToPhaserView({ model, width: w, height: h });
}

describe('phaser model transitions E2', () => {
  it('tracks hand 10 → 0 and resize model', () => {
    let state = baseState();
    for (let remaining = 10; remaining >= 0; remaining--) {
      state = {
        ...state,
        players: state.players.map((p) => ({
          ...p,
          hand: p.hand.slice(0, remaining)
        }))
      };
      expect(viewFor(state).localHand).toHaveLength(remaining);
      expect(viewFor(state, 390, 720).layout.aspect).toBe('portrait');
    }
  });

  it('tracks trick 0 → 4 → 0 and new round', () => {
    let state = baseState();
    expect(viewFor(state).trick).toHaveLength(0);
    const played = [
      card('clubs', '2', 't0'),
      card('clubs', '3', 't1'),
      card('clubs', '4', 't2'),
      card('clubs', '5', 't3')
    ];
    for (let n = 1; n <= 4; n++) {
      state = { ...state, currentTrick: played.slice(0, n) };
      expect(viewFor(state).trick).toHaveLength(n);
      expect(viewFor(state).trick[n - 1].origin).toBeTruthy();
    }
    state = { ...state, currentTrick: [] };
    expect(viewFor(state).trick).toHaveLength(0);

    const next = baseState({ round: 2 });
    expect(viewFor(next).localHand).toHaveLength(10);
  });
});
