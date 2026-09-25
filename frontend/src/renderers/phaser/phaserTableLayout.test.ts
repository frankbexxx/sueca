import {
  HAND_LAYOUT,
  buildPhaserTableLayout,
  clampSeatChromePanelX,
  computeLocalHandLayout,
  handExposedFraction,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutOpponentCountBadgePosition,
  layoutTrickSlot,
  localHandDisplayWidth,
  playerIndexToCompass,
  pointInDropZone,
  resolveAspectMode,
  resolveBottomChromePx
} from './phaserTableLayout';
import { PREMIUM_TABLE } from './phaserPremiumLayout';
import { seatsAroundLocal } from '../../utils/tableLayout';
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
      festaSheetChrome: null,
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
  it('maps seats relative to local south (canonical S→W→N→E)', () => {
    expect(playerIndexToCompass(0, 0)).toBe('south');
    expect(playerIndexToCompass(1, 0)).toBe('west');
    expect(playerIndexToCompass(2, 0)).toBe('north');
    expect(playerIndexToCompass(3, 0)).toBe('east');
  });

  it.each([0, 1, 2, 3] as const)(
    'playerIndexToCompass matches seatsAroundLocal for local=%i',
    (local) => {
      const seats = seatsAroundLocal(local);
      expect(playerIndexToCompass(seats.south, local)).toBe('south');
      expect(playerIndexToCompass(seats.west, local)).toBe('west');
      expect(playerIndexToCompass(seats.north, local)).toBe('north');
      expect(playerIndexToCompass(seats.east, local)).toBe('east');
    }
  );

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

  it('UX-CARDS-01C: renders all opponent backs with natural overlap (no visual cap)', () => {
    const layout = buildPhaserTableLayout(390, 844);
    const w = layout.opponentCardWidth;
    const expectedGap = Math.max(
      PREMIUM_TABLE.opponentGapMin,
      Math.round(w * PREMIUM_TABLE.opponentOverlapExpose)
    );

    for (const compass of ['north', 'west', 'east'] as const) {
      const pts = layoutOpponentBackPositions(13, compass, layout);
      expect(pts).toHaveLength(13);
      const gap =
        compass === 'north'
          ? pts[1].x - pts[0].x
          : pts[1].y - pts[0].y;
      // Natural peek band; sides may compress slightly to clear name chrome.
      expect(gap).toBeGreaterThanOrEqual(PREMIUM_TABLE.opponentGapMin);
      expect(gap).toBeLessThanOrEqual(expectedGap + 1);
      const expose = gap / w;
      expect(expose).toBeGreaterThanOrEqual(0.12);
      expect(expose).toBeLessThanOrEqual(0.30);
    }

    expect(PREMIUM_TABLE.opponentOverlapExpose).toBeGreaterThanOrEqual(0.14);
    expect(PREMIUM_TABLE.opponentOverlapExpose).toBeLessThanOrEqual(0.28);
    expect(PREMIUM_TABLE.opponentBorderPx).toBeGreaterThan(0);
    expect(PREMIUM_TABLE.opponentCornerRadiusFraction).toBeGreaterThan(0);
  });

  it('UX-CARDS-01C: under-card expose equals fan step (depth-occlusion model)', () => {
    const layout = buildPhaserTableLayout(390, 844);
    for (const compass of ['north', 'west', 'east'] as const) {
      const pts = layoutOpponentBackPositions(13, compass, layout);
      const fanStep =
        compass === 'north'
          ? Math.abs(pts[1].x - pts[0].x)
          : Math.abs(pts[1].y - pts[0].y);
      // Peek width left after the next opaque card covers the rest.
      expect(fanStep).toBeGreaterThanOrEqual(PREMIUM_TABLE.opponentGapMin);
      expect(fanStep).toBeLessThan(layout.opponentCardWidth);
    }
  });

  it('UX-CARDS-01C: side stacks stay below name chrome and inside portrait at 13', () => {
    for (const width of [360, 390, 430] as const) {
      const layout = buildPhaserTableLayout(width, 844);
      for (const compass of ['west', 'east'] as const) {
        const pts = layoutOpponentBackPositions(13, compass, layout);
        expect(pts).toHaveLength(13);
        const half = layout.opponentCardWidth / 2;
        const top = Math.min(...pts.map((p) => p.y)) - half;
        const bot = Math.max(...pts.map((p) => p.y)) + half;
        const labelY =
          layout.seatAnchor[compass].y - layout.opponentCardHeight * 0.95;
        expect(top).toBeGreaterThan(labelY + 4);
        expect(top).toBeGreaterThanOrEqual(-4);
        expect(bot).toBeLessThanOrEqual(layout.height + 4);
      }
    }
  });

  it('UX-CARDS-01: count badge from handCount; hidden at 0; updates with size', () => {
    const model = minimalModel({
      seats: [
        {
          index: 0,
          name: 'P1',
          team: 1,
          isLocal: true,
          isActive: true,
          isDealer: false,
          isTrickLeader: true,
          handCount: 10
        },
        {
          index: 1,
          name: 'P2',
          team: 2,
          isLocal: false,
          isActive: false,
          isDealer: false,
          isTrickLeader: false,
          handCount: 13
        },
        {
          index: 2,
          name: 'P3',
          team: 1,
          isLocal: false,
          isActive: false,
          isDealer: false,
          isTrickLeader: false,
          handCount: 8
        },
        {
          index: 3,
          name: 'P4',
          team: 2,
          isLocal: false,
          isActive: false,
          isDealer: false,
          isTrickLeader: false,
          handCount: 0
        }
      ]
    });

    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 844
    });
    expect(view.opponents).toHaveLength(3);
    // Shared renderer path: all non-local seats share back + badge mapping.
    const west = view.opponents.find((o) => o.compass === 'west')!;
    const north = view.opponents.find((o) => o.compass === 'north')!;
    const east = view.opponents.find((o) => o.compass === 'east')!;
    expect(west.handCount).toBe(13);
    expect(west.countBadgePosition).not.toBeNull();
    expect(north.handCount).toBe(8);
    expect(north.countBadgePosition).not.toBeNull();
    expect(east.handCount).toBe(0);
    expect(east.countBadgePosition).toBeNull();
    expect(east.backPositions).toHaveLength(0);

    const local = view.seats.find((s) => s.isLocal)!;
    expect(local.countBadgePosition).toBeNull();

    // Badge sits near the fan (helper), not on the name chrome above.
    const badge = layoutOpponentCountBadgePosition(
      'north',
      view.layout,
      north.backPositions
    )!;
    expect(badge.y).toBeGreaterThan(north.backPositions[0].y);
    expect(badge.y).toBeGreaterThan(north.labelPosition.y);

    const fewer = mapTableModelToPhaserView({
      model: {
        ...model,
        seats: model.seats.map((s) =>
          s.index === 2 ? { ...s, handCount: 4 } : s
        )
      },
      width: 390,
      height: 844
    });
    const north4 = fewer.opponents.find((o) => o.compass === 'north')!;
    expect(north4.handCount).toBe(4);
    expect(north4.countBadgePosition).not.toBeNull();
  });

  it('UX-SEAT-LABELS-02: clamps nameplate panels and keeps side labels inward', () => {
    expect(clampSeatChromePanelX(-40, 140, 360)).toBe(4);
    expect(clampSeatChromePanelX(300, 140, 360)).toBe(360 - 140 - 4);
    expect(clampSeatChromePanelX(100, 80, 390)).toBe(100);

    for (const width of [360, 390, 430] as const) {
      const view = mapTableModelToPhaserView({
        model: minimalModel(),
        width,
        height: 844
      });
      expect(view.layout.aspect).toBe('portrait');
      const west = view.seats.find((s) => s.compass === 'west')!;
      const east = view.seats.find((s) => s.compass === 'east')!;
      // Inward of the raw seat anchor on portrait sides.
      expect(west.labelPosition.x).toBeGreaterThan(view.layout.seatAnchor.west.x + 8);
      expect(east.labelPosition.x).toBeLessThan(view.layout.seatAnchor.east.x - 8);
      // Long auction + dealer chrome must fit after clamp.
      const longPw = 168;
      const westPx = clampSeatChromePanelX(
        west.labelPosition.x - longPw / 2,
        longPw,
        width
      );
      const eastPx = clampSeatChromePanelX(
        east.labelPosition.x - longPw / 2,
        longPw,
        width
      );
      expect(westPx).toBeGreaterThanOrEqual(4);
      expect(westPx + longPw).toBeLessThanOrEqual(width - 4);
      expect(eastPx).toBeGreaterThanOrEqual(4);
      expect(eastPx + longPw).toBeLessThanOrEqual(width - 4);
    }
  });

  it('uses continuous hand spacing (no tier jumps) across counts', () => {
    const phone = { width: 360, height: 495 };
    const counts = [13, 10, 8, 7, 5, 4, 3, 1] as const;
    const spacings: number[] = [];
    for (const n of counts) {
      const { layout, slots } = computeLocalHandLayout({ ...phone, cardCount: n });
      expect(slots).toHaveLength(n);
      if (n === 1) {
        expect(slots[0].x).toBeCloseTo(layout.width / 2, 5);
        continue;
      }
      const spacing = slots[1].x - slots[0].x;
      spacings.push(spacing);
      const displayW = localHandDisplayWidth(layout);
      const expose = spacing / displayW;
      // Dense 13 stays in the readable expose band; looser counts open up.
      if (n === 13) {
        expect(expose).toBeGreaterThanOrEqual(0.32);
        expect(expose).toBeLessThanOrEqual(0.42);
      }
      // Hand stays centered and inside canvas
      const left = slots[0].x - displayW / 2;
      const right = slots[n - 1].x + displayW / 2;
      expect(left).toBeGreaterThanOrEqual(-2);
      expect(right).toBeLessThanOrEqual(layout.width + 2);
      expect((slots[0].x + slots[n - 1].x) / 2).toBeCloseTo(layout.width / 2, 4);
      // Right card on top
      expect(slots[n - 1].depth).toBeGreaterThan(slots[0].depth);
    }
    // Monotonic: fewer cards ⇒ spacing never shrinks (8→7, 5→4 included)
    for (let i = 1; i < spacings.length; i++) {
      expect(spacings[i]).toBeGreaterThanOrEqual(spacings[i - 1] - 1e-6);
    }
    // No abrupt tier cliff around 8→7 / 5→4 (GLOBAL-CARDS-01 opens mid counts smoothly)
    const s8 = computeLocalHandLayout({ ...phone, cardCount: 8 }).slots;
    const s7 = computeLocalHandLayout({ ...phone, cardCount: 7 }).slots;
    const s5 = computeLocalHandLayout({ ...phone, cardCount: 5 }).slots;
    const s4 = computeLocalHandLayout({ ...phone, cardCount: 4 }).slots;
    const d87 = (s7[1].x - s7[0].x) - (s8[1].x - s8[0].x);
    const d54 = (s4[1].x - s4[0].x) - (s5[1].x - s5[0].x);
    expect(d87).toBeGreaterThanOrEqual(0);
    expect(d54).toBeGreaterThanOrEqual(0);
    expect(d87).toBeLessThan(8);
    expect(d54).toBeLessThan(8);
  });

  it('exposes ~35–40% at 13 and opens by mid counts without discrete tiers', () => {
    expect(HAND_LAYOUT.exposeAt13).toBeGreaterThanOrEqual(0.35);
    expect(HAND_LAYOUT.exposeAt13).toBeLessThanOrEqual(0.42);
    expect(handExposedFraction(13)).toBeCloseTo(HAND_LAYOUT.exposeAt13, 5);
    expect(handExposedFraction(10)).toBeGreaterThan(handExposedFraction(13));
    expect(handExposedFraction(7)).toBeGreaterThan(handExposedFraction(8));
    expect(handExposedFraction(4)).toBeGreaterThan(handExposedFraction(5));
    expect(handExposedFraction(2)).toBeCloseTo(HAND_LAYOUT.exposeAt2, 5);
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
    const heartsDocked = resolveBottomChromePx(720, aspect, {
      sheetActive: true,
      dockedBelowHost: true
    });
    expect(heartsDocked).toBe(0);
    const festaCompact = resolveBottomChromePx(720, aspect, {
      sheetActive: true,
      festaChrome: 'compact'
    });
    const festaTall = resolveBottomChromePx(720, aspect, {
      sheetActive: true,
      festaChrome: 'tall'
    });
    expect(festaCompact).toBeGreaterThan(bidChrome);
    expect(festaTall).toBeGreaterThan(festaCompact);
    expect(festaTall).toBeGreaterThanOrEqual(250);
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

  it('UX-FESTA-01B: festa chrome bands scale compact < standard < tall', () => {
    const aspect = resolveAspectMode(430, 780);
    const compact = resolveBottomChromePx(780, aspect, {
      sheetActive: true,
      festaChrome: 'compact'
    });
    const standard = resolveBottomChromePx(780, aspect, {
      sheetActive: true,
      festaChrome: 'standard'
    });
    const tall = resolveBottomChromePx(780, aspect, {
      sheetActive: true,
      festaChrome: 'tall'
    });
    expect(compact).toBeLessThan(standard);
    expect(standard).toBeLessThan(tall);
    expect(tall).toBeGreaterThanOrEqual(270);
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
    expect(v.alpha).toBeGreaterThanOrEqual(0.8);
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
    expect(selected.scale).toBe(other.scale);
    expect(selected.scale).toBe(HAND_VISUAL.normalScale);
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
    expect(view.seats[0].turnCueLabel).toBeNull();
    // Team lives in HUD score strip — seat chrome keeps name + D only.
    expect(view.opponents[0].teamLabel).toBeTruthy();
    expect(view.opponents[0].labelText).not.toMatch(/Nós|Eles/i);
    expect(view.opponents[0].labelText).toContain('D');
    expect(view.opponents[0].labelText).not.toMatch(/\b\d+\b/);
    expect(view.opponents[0].handCount).toBeGreaterThan(0);
    expect(view.layout.opponentCardWidth / view.layout.cardWidth).toBeGreaterThanOrEqual(0.7);
  });

  it('attaches A JOGAR cue to exactly one active seat (GLOBAL-UI-03)', () => {
    const model = minimalModel();
    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 844,
      activeTurnLabel: 'A JOGAR',
      getTeamName: (t) => (t === 1 ? 'NÓS' : 'ELES')
    });
    const withCue = view.seats.filter((s) => s.turnCueLabel);
    expect(withCue).toHaveLength(1);
    expect(withCue[0].showActiveHighlight).toBe(true);
    expect(withCue[0].turnCueLabel).toBe('A JOGAR');
    expect(view.seats.filter((s) => s.showActiveHighlight)).toHaveLength(1);
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
    // Hearts pass docks below the host — no interior bottomChrome dead band.
    expect(pass.layout.bottomChromePx).toBe(0);
    expect(
      resolveBottomChromePx(720, resolveAspectMode(390, 720), {
        sheetActive: true,
        dockedBelowHost: true
      })
    ).toBe(0);
    expect(pass.layout.handY).toBe(play.layout.handY);
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