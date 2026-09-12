import {
  buildPhaserTableLayout,
  computeLocalHandLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass,
  pointInDropZone,
  resolveAspectMode,
  resolveBottomChromePx
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
import {
  getHandCardVisualPresentation,
  HAND_VISUAL
} from './phaserHandVisual';
import {
  isDisplayPixelHitAreaMistake,
  resolveHandHitAreaMode
} from './phaserHandInput';
import { computeSeatPresentation } from './phaserSeatPresentation';
import { computeTableBannerPresentation } from './phaserTableBanner';
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
    lastTrickWinner: null,
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

  it('uses the same hand layout rules for 10 and 13 cards across variants', () => {
    const phone = { width: 390, height: 720 };
    const sueca = computeLocalHandLayout({ ...phone, cardCount: 10 });
    const spades = computeLocalHandLayout({ ...phone, cardCount: 13 });
    const hearts = computeLocalHandLayout({ ...phone, cardCount: 13 });
    const king = computeLocalHandLayout({ ...phone, cardCount: 13 });

    expect(sueca.layout.cardWidth).toBe(spades.layout.cardWidth);
    expect(sueca.layout.handY).toBe(spades.layout.handY);
    expect(sueca.layout.bottomChromePx).toBe(0);
    expect(sueca.slots).toHaveLength(10);
    expect(spades.slots).toHaveLength(13);
    expect(hearts.slots.map((s) => [s.x, s.y, s.rotationDeg])).toEqual(
      king.slots.map((s) => [s.x, s.y, s.rotationDeg])
    );
    expect(spades.slots[0].x).toBeLessThan(spades.slots[12].x);
    // denser count ⇒ tighter spacing, same baseline system
    const spacing10 = sueca.slots[1].x - sueca.slots[0].x;
    const spacing13 = spades.slots[1].x - spades.slots[0].x;
    expect(spacing13).toBeLessThanOrEqual(spacing10 + 1e-9);
  });

  it('keeps portrait and landscape on the same visual system', () => {
    const portrait = computeLocalHandLayout({ width: 390, height: 720, cardCount: 13 });
    const landscape = computeLocalHandLayout({ width: 740, height: 360, cardCount: 13 });
    expect(portrait.layout.aspect).toBe('portrait');
    expect(landscape.layout.aspect).toBe('landscape');
    expect(portrait.slots).toHaveLength(13);
    expect(landscape.slots).toHaveLength(13);
    expect(portrait.layout.cardWidth).toBeGreaterThanOrEqual(44);
    expect(landscape.layout.cardWidth).toBeLessThanOrEqual(58);
    expect(landscape.layout.handY).toBeLessThan(landscape.layout.height);
  });

  it('lifts hand when bottom chrome (pass/bid/festa) is active', () => {
    const aspect = resolveAspectMode(390, 720);
    const chrome = resolveBottomChromePx(720, aspect, { sheetActive: true });
    expect(chrome).toBeGreaterThan(80);
    const bidChrome = resolveBottomChromePx(720, aspect, {
      sheetActive: true,
      compactSheet: true
    });
    expect(bidChrome).toBeGreaterThan(0);
    expect(bidChrome).toBeLessThan(chrome);
    const plain = computeLocalHandLayout({ width: 390, height: 720, cardCount: 13 });
    const withSheet = computeLocalHandLayout({
      width: 390,
      height: 720,
      cardCount: 13,
      bottomChromePx: chrome
    });
    expect(withSheet.layout.handY).toBeLessThan(plain.layout.handY);
    expect(withSheet.layout.bottomChromePx).toBe(chrome);
    // fan shape preserved (relative spacing)
    const plainSpan = plain.slots[12].x - plain.slots[0].x;
    const sheetSpan = withSheet.slots[12].x - withSheet.slots[0].x;
    expect(sheetSpan).toBeCloseTo(plainSpan, 5);
  });
});

describe('phaserSeatPresentation UX-P2', () => {
  it('formats a common seat line with optional badge and dealer (no card count)', () => {
    const seat = computeSeatPresentation({
      name: 'Player One Long',
      handCount: 13,
      isLocal: false,
      isDealer: true,
      teamLabel: 'NÓS',
      secondaryBadge: 'Nil',
      showActiveHighlight: true,
      aspect: 'portrait'
    });
    expect(seat.shortName).toBe('Player ...');
    expect(seat.labelText).toBe('Player ... · Nil · D');
    expect(seat.monogram).toBe('');
    expect(seat.showMonogram).toBe(false);
    expect(seat.labelText).not.toMatch(/\b13\b/);
    expect(seat.showActiveRing).toBe(true);
    // Team never stacks on seats.
    expect(seat.labelText).not.toContain('Nós');
  });

  it('keeps local seats without hand count or team tokens', () => {
    const local = computeSeatPresentation({
      name: 'Alex',
      handCount: 10,
      isLocal: true,
      isDealer: false,
      teamLabel: 'ELES',
      secondaryBadge: null,
      showActiveHighlight: false,
      aspect: 'landscape'
    });
    expect(local.labelText).toBe('Alex');
    expect(local.labelText).not.toMatch(/Eles/i);
    expect(local.labelText).not.toMatch(/\s10\b/);
  });
});

describe('phaserTableBanner UX-P2', () => {
  it('clears Spades/Hearts banners (React strip owns broken state)', () => {
    expect(
      computeTableBannerPresentation({
        variant: 'spades',
        trumpSuit: 'spades',
        heartsPassPhase: false,
        kingFestaPhase: false,
        kingUi: undefined,
        auctionLocale: 'pt'
      }).label
    ).toBe('');
    expect(
      computeTableBannerPresentation({
        variant: 'hearts',
        trumpSuit: null,
        heartsPassPhase: true,
        kingFestaPhase: false,
        kingUi: undefined,
        auctionLocale: 'pt'
      })
    ).toEqual({ label: '', showSymbol: false, accent: false });
  });

  it('keeps Sueca without felt glyph; King clears trump chrome during play', () => {
    const sueca = computeTableBannerPresentation({
      variant: 'sueca',
      trumpSuit: 'hearts',
      heartsPassPhase: false,
      kingFestaPhase: false,
      kingUi: undefined,
      auctionLocale: 'pt'
    });
    expect(sueca.label).toBe('');
    expect(sueca.showSymbol).toBe(false);

    const king = computeTableBannerPresentation({
      variant: 'king',
      trumpSuit: null,
      heartsPassPhase: false,
      kingFestaPhase: false,
      kingUi: {
        gameIndex: 0,
        contract: 'no_queens',
        festaMode: null,
        festaPhase: null,
        phase: 'negatives',
        noTrump: false,
        waitingForChoice: false
      } as never,
      auctionLocale: 'pt'
    });
    expect(king.label).toBe('');
    expect(king.showSymbol).toBe(false);
  });
});

describe('phaserHandInput P0 hit area', () => {
  it('uses default frame hit area for interactive cards (not display-pixel rects)', () => {
    expect(resolveHandHitAreaMode(true)).toBe('default-frame');
    expect(resolveHandHitAreaMode(false)).toBe('disabled');
  });

  it('flags the UX-P1 display-vs-frame hit-area mistake', () => {
    const frame = { width: 533, height: 764 };
    // layout.cardWidth-sized rect — the broken path
    expect(isDisplayPixelHitAreaMistake(60.32, 90.52, frame.width, frame.height)).toBe(
      true
    );
    // frame-local rect is OK if a custom area is ever required
    expect(isDisplayPixelHitAreaMistake(533, 764, frame.width, frame.height)).toBe(false);
  });

  it('keeps legal play and Hearts pass interactive while illegal/inactive are not', () => {
    const legal = getHandCardVisualPresentation({
      visualState: 'legal',
      selected: false,
      canDrag: true,
      passSelectionEnabled: false,
      interactionEnabled: true
    });
    const pass = getHandCardVisualPresentation({
      visualState: 'legal',
      selected: false,
      canDrag: false,
      passSelectionEnabled: true,
      interactionEnabled: false
    });
    const illegal = getHandCardVisualPresentation({
      visualState: 'illegal',
      selected: false,
      canDrag: false,
      passSelectionEnabled: false,
      interactionEnabled: true
    });
    const inactive = getHandCardVisualPresentation({
      visualState: 'inactive',
      selected: false,
      canDrag: false,
      passSelectionEnabled: false,
      interactionEnabled: false
    });
    expect(resolveHandHitAreaMode(legal.interactive)).toBe('default-frame');
    expect(resolveHandHitAreaMode(pass.interactive)).toBe('default-frame');
    expect(resolveHandHitAreaMode(illegal.interactive)).toBe('disabled');
    expect(resolveHandHitAreaMode(inactive.interactive)).toBe('disabled');
  });
});

describe('phaserHandVisual UX-P1', () => {
  it('keeps legal cards fully readable and interactive when playable', () => {
    const v = getHandCardVisualPresentation({
      visualState: 'legal',
      selected: false,
      canDrag: true,
      passSelectionEnabled: false,
      interactionEnabled: true
    });
    expect(v.alpha).toBe(1);
    expect(v.tint).toBe(HAND_VISUAL.legalTint);
    expect(v.interactive).toBe(true);
    expect(v.yOffset).toBe(0);
  });

  it('dims illegal cards moderately without a heavy veil', () => {
    const v = getHandCardVisualPresentation({
      visualState: 'illegal',
      selected: false,
      canDrag: false,
      passSelectionEnabled: false,
      interactionEnabled: true
    });
    expect(v.alpha).toBeGreaterThanOrEqual(0.85);
    expect(v.alpha).toBeLessThan(1);
    expect(v.tint).not.toBe(HAND_VISUAL.legalTint);
    expect(v.interactive).toBe(false);
  });

  it('applies subtle inactive attenuation', () => {
    const v = getHandCardVisualPresentation({
      visualState: 'inactive',
      selected: false,
      canDrag: false,
      passSelectionEnabled: false,
      interactionEnabled: false
    });
    expect(v.alpha).toBeGreaterThanOrEqual(0.9);
    expect(v.alpha).toBeLessThan(1);
    expect(v.interactive).toBe(false);
  });

  it('lifts selected cards without darkening others', () => {
    const selected = getHandCardVisualPresentation({
      visualState: 'legal',
      selected: true,
      canDrag: true,
      passSelectionEnabled: false,
      interactionEnabled: true
    });
    const other = getHandCardVisualPresentation({
      visualState: 'legal',
      selected: false,
      canDrag: true,
      passSelectionEnabled: false,
      interactionEnabled: true
    });
    expect(selected.yOffset).toBeLessThan(0);
    expect(selected.scale).toBeGreaterThan(other.scale);
    expect(other.alpha).toBe(1);
  });

  it('enables Hearts pass selection taps with the same legal chrome', () => {
    const v = getHandCardVisualPresentation({
      visualState: 'legal',
      selected: true,
      canDrag: false,
      passSelectionEnabled: true,
      interactionEnabled: false
    });
    expect(v.interactive).toBe(true);
    expect(v.yOffset).toBe(-HAND_VISUAL.selectedLift);
    expect(v.alpha).toBe(1);
  });

  it('expands touch-friendly hit intent: illegal/inactive stay non-interactive', () => {
    expect(
      getHandCardVisualPresentation({
        visualState: 'illegal',
        selected: false,
        canDrag: false,
        passSelectionEnabled: false,
        interactionEnabled: true
      }).interactive
    ).toBe(false);
    expect(
      getHandCardVisualPresentation({
        visualState: 'inactive',
        selected: false,
        canDrag: false,
        passSelectionEnabled: false,
        interactionEnabled: false
      }).interactive
    ).toBe(false);
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
    // Sueca: React owns trump face; Phaser has no felt glyph / TRUNFO.
    expect(view.trumpLabel).toBe('');
    expect(view.showTrumpSymbol).toBe(false);
    expect(view.seats.find((s) => s.isDealer)?.seatIndex).toBe(1);
    expect(view.seats[0].showActiveHighlight).toBe(true);
    // Team lives in HUD score strip — seat chrome keeps name + D only.
    expect(view.opponents[0].teamLabel).toBeTruthy();
    expect(view.opponents[0].labelText).not.toMatch(/Nós|Eles/i);
    expect(view.opponents[0].labelText).toContain('D');
    expect(view.opponents[0].labelText).not.toMatch(/\b\d+\b/);
    expect(view.opponents[0].handCount).toBeGreaterThan(0);
    expect(view.layout.opponentCardWidth / view.layout.cardWidth).toBeGreaterThanOrEqual(0.7);
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

  it('keeps pass-phase hand geometry stable and enables pass selection', () => {
    const cards = Array.from({ length: 13 }, (_, i) => ({
      suit: 'hearts' as const,
      rank: '2' as const,
      id: `h${i}`
    }));
    const play = mapTableModelToPhaserView({
      model: minimalModel({
        variant: 'hearts',
        localHand: cards,
        status: { ...minimalModel().status, heartsPassActive: false }
      }),
      width: 390,
      height: 720,
      isLocalCardPlayable: () => true
    });
    const pass = mapTableModelToPhaserView({
      model: minimalModel({
        variant: 'hearts',
        localHand: cards,
        status: { ...minimalModel().status, heartsPassActive: true },
        variantUi: { heartsPassIndices: [0, 2, 4] }
      }),
      width: 390,
      height: 720,
      isLocalCardPlayable: () => false
    });
    expect(pass.passSelectionEnabled).toBe(true);
    expect(pass.layout.bottomChromePx).toBeGreaterThan(0);
    expect(pass.layout.handY).toBeLessThan(play.layout.handY);
    expect(pass.localHand.filter((c) => c.selected)).toHaveLength(3);
    expect(pass.localHand.every((c) => c.visualState === 'legal')).toBe(true);
    expect(pass.localHand.every((c) => !c.canDrag)).toBe(true);
    // same fan spacing as play-phase 13-card hand would have without chrome (relative)
    const passSpan = pass.localHand[12].position.x - pass.localHand[0].position.x;
    const play13 = computeLocalHandLayout({ width: 390, height: 720, cardCount: 13 });
    expect(passSpan).toBeCloseTo(play13.slots[12].x - play13.slots[0].x, 5);
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
