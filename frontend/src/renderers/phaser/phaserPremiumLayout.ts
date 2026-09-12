/**
 * UX-P3.1 — Premium Classic Table zones + layout helpers (pure, no Phaser).
 * Hand fan/spacing stays in `phaserTableLayout` / UX-P1; this module owns
 * shared zone composition, felt tokens, and trick/seat anchors.
 *
 * Note: aspect helpers live here to avoid a circular import with `phaserTableLayout`.
 */

export type PremiumAspectMode = 'portrait' | 'landscape' | 'desktop';

export interface PhaserPoint {
  x: number;
  y: number;
}

export function resolvePremiumAspectMode(
  width: number,
  height: number,
  /**
   * Prefer window / host orientation size when the Phaser canvas height is
   * temporarily reduced by React bottom sheets (pass / bid / festa).
   */
  reference?: { width?: number; height?: number } | null
): PremiumAspectMode {
  const rw = Math.max(1, reference?.width ?? width);
  const rh = Math.max(1, reference?.height ?? height);
  const ratio = rh / rw;
  if (ratio >= 1.15) return 'portrait';
  if (rw / rh >= 1.45 && rh < 520) return 'landscape';
  return 'desktop';
}

/** Browser helper: classify using the device/viewport, not a shrunk canvas. */
export function resolveOrientationReference(
  canvasWidth: number,
  canvasHeight: number
): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: canvasWidth, height: canvasHeight };
  }
  const vv = window.visualViewport;
  const vw = Math.round(vv?.width || window.innerWidth || canvasWidth);
  const vh = Math.round(vv?.height || window.innerHeight || canvasHeight);

  const windowPortrait = vh / Math.max(1, vw) >= 1.15;
  const canvasPortrait = canvasHeight / Math.max(1, canvasWidth) >= 1.15;
  const windowLandscape = vw / Math.max(1, vh) >= 1.45 && vh < 520;

  // Phone portrait with React bottom sheet: canvas becomes short/square → keep window.
  if (windowPortrait && !canvasPortrait && vw <= 520) {
    return { width: vw, height: vh };
  }
  // Real landscape phone: prefer window orientation.
  if (windowLandscape) {
    return { width: vw, height: vh };
  }
  return { width: canvasWidth, height: canvasHeight };
}

/** Premium Classic Table surface tokens (UX-P3.1). */
export const PREMIUM_TABLE = {
  exterior: 0x10191b,
  exteriorTop: 0x141f22,
  felt: 0x173c3b,
  feltCenter: 0x1c4846,
  feltEdge: 0x102c2d,
  seatPanel: 0x182426,
  brass: 0xc5a45b,
  ivory: 0xe8e0d0,
  /** Trick card display vs hand card size. */
  trickScale: 1.11,
  /** Local hand presence bump (UX-P3.3) — display only; hit area follows displaySize. */
  handPresenceScale: 1.06,
  /** Soft contact shadow under cards / panels. */
  shadow: 0x050808,
  /** Table chrome typeface (loaded for game board). */
  fontFamily: 'Plus Jakarta Sans, Segoe UI, system-ui, sans-serif',
  tableMarginPortrait: 14,
  tableMarginLandscape: 12,
  tableRadiusPortrait: 32,
  tableRadiusLandscape: 28,
  /** Depth bands (Phaser setDepth). */
  depthTable: 0,
  depthSeats: 22,
  depthOpponentCards: 18,
  depthHand: 20,
  depthTrick: 32,
  depthSelected: 80,
  depthHud: 50
} as const;

export interface TableZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Center of the zone. */
  cx: number;
  cy: number;
}

export interface TableZones {
  viewport: TableZoneRect;
  topHud: TableZoneRect;
  topSeat: TableZoneRect;
  leftSeat: TableZoneRect;
  rightSeat: TableZoneRect;
  trick: TableZoneRect;
  localSeat: TableZoneRect;
  hand: TableZoneRect;
  bottomSafe: TableZoneRect;
  /** Inner rounded felt (inside exterior margin). */
  felt: TableZoneRect;
}

/** Minimal layout fields used by trick offsets (avoids importing PhaserTableLayout). */
export interface PremiumTrickLayoutMetrics {
  cardWidth: number;
  cardHeight: number;
}

export interface PremiumTableLayoutInput {
  width: number;
  height: number;
  /** Reserved bottom chrome (pass / bid / festa sheets). */
  bottomChromePx?: number;
  /** Optional safe-area insets ( Cap / notch ); defaults 0. */
  safeArea?: { top?: number; right?: number; bottom?: number; left?: number };
  handCount?: number;
  /**
   * Orientation reference (window/host). When omitted, canvas size is used.
   * Pass window size so React bottom sheets cannot flip portrait → desktop.
   */
  orientationReference?: { width?: number; height?: number } | null;
}

export interface PremiumTableLayout {
  width: number;
  height: number;
  aspect: PremiumAspectMode;
  zones: TableZones;
  center: PhaserPoint;
  seatAnchor: Record<'south' | 'west' | 'north' | 'east', PhaserPoint>;
  handY: number;
  cardWidth: number;
  cardHeight: number;
  opponentCardWidth: number;
  opponentCardHeight: number;
  trickCardWidth: number;
  trickCardHeight: number;
  dropRadius: number;
  handSpreadMax: number;
  bottomChromePx: number;
  tableMargin: number;
  tableRadius: number;
  /** Portrait phone ≤380px: side seat chrome should use compact labels. */
  compactSideSeats: boolean;
}

function zone(x: number, y: number, width: number, height: number): TableZoneRect {
  return {
    x,
    y,
    width,
    height,
    cx: x + width / 2,
    cy: y + height / 2
  };
}

/**
 * Shared zone composition for Sueca / Spades / Hearts / King.
 * Portrait phone (360–414) is the primary design; landscape is sanity-only.
 */
export function computeTableZones(input: {
  width: number;
  height: number;
  aspect: PremiumAspectMode;
  bottomChromePx: number;
  safeTop: number;
  safeBottom: number;
  safeLeft: number;
  safeRight: number;
  handReserve: number;
  cardHeight: number;
}): TableZones {
  const {
    width: w,
    height: h,
    aspect,
    bottomChromePx,
    safeTop,
    safeBottom,
    safeLeft,
    safeRight,
    handReserve,
    cardHeight
  } = input;

  const margin =
    aspect === 'landscape'
      ? PREMIUM_TABLE.tableMarginLandscape
      : PREMIUM_TABLE.tableMarginPortrait;

  const feltX = safeLeft + margin;
  const feltY = safeTop + margin;
  const feltW = Math.max(120, w - safeLeft - safeRight - margin * 2);
  const feltH = Math.max(160, h - safeTop - safeBottom - margin * 2 - bottomChromePx);
  const felt = zone(feltX, feltY, feltW, feltH);

  const bottomSafeH = Math.max(safeBottom, bottomChromePx > 0 ? 8 : Math.min(18, h * 0.02));
  const bottomSafe = zone(0, h - bottomSafeH - bottomChromePx, w, bottomSafeH + bottomChromePx);

  const handH = handReserve;
  const handY0 = h - handReserve - bottomChromePx;
  const hand = zone(feltX, handY0 - cardHeight * 0.15, feltW, handH + cardHeight * 0.15);

  const localSeatH = Math.max(28, cardHeight * 0.38);
  const localSeat = zone(
    felt.cx - feltW * 0.28,
    handY0 - localSeatH - 4,
    feltW * 0.56,
    localSeatH
  );

  const topHudH =
    aspect === 'landscape' ? Math.max(22, h * 0.08) : Math.max(28, Math.min(44, h * 0.055));
  const topHud = zone(feltX, feltY, feltW, topHudH);

  const topSeatH = Math.max(44, Math.min(64, h * 0.085));
  // Extra band so identity sits clearly above the opponent fan.
  const topSeat = zone(felt.cx - feltW * 0.22, topHud.y + topHudH + 4, feltW * 0.44, topSeatH);

  // Narrow portrait phones: keep side seats slim so labels don't eat the trick.
  const narrowPortrait = aspect === 'portrait' && w <= 380;
  const sideW = narrowPortrait
    ? Math.max(28, Math.min(44, Math.floor(w * 0.1)))
    : Math.max(40, Math.min(72, w * 0.14));
  const sideY = feltY + topHudH + topSeatH + 8;
  const sideH = Math.max(80, localSeat.y - sideY - 12);
  const leftSeat = zone(feltX + (narrowPortrait ? 0 : 2), sideY, sideW, sideH);
  const rightSeat = zone(
    feltX + feltW - sideW - (narrowPortrait ? 0 : 2),
    sideY,
    sideW,
    sideH
  );

  const trickTop = topSeat.y + topSeatH + (aspect === 'landscape' ? 6 : 14);
  const trickBottom = localSeat.y - 8;
  const trickH = Math.max(cardHeight * 1.6, trickBottom - trickTop);
  const trickW = Math.min(
    feltW * (narrowPortrait ? 0.62 : 0.72),
    Math.max(narrowPortrait ? 140 : 160, w * (narrowPortrait ? 0.48 : 0.55))
  );
  const trick = zone(felt.cx - trickW / 2, trickTop, trickW, trickH);

  return {
    viewport: zone(0, 0, w, h),
    topHud,
    topSeat,
    leftSeat,
    rightSeat,
    trick,
    localSeat,
    hand,
    bottomSafe,
    felt
  };
}

/**
 * Premium table layout: zones + anchors. Hand card size / fan knobs remain UX-P1.
 */
export function computePremiumTableLayout(
  input: PremiumTableLayoutInput
): PremiumTableLayout {
  const w = Math.max(280, input.width);
  const h = Math.max(300, input.height);
  const aspect = resolvePremiumAspectMode(w, h, input.orientationReference);
  const bottomChromePx = Math.max(0, Math.round(input.bottomChromePx ?? 0));
  const safeTop = Math.max(0, input.safeArea?.top ?? 0);
  const safeBottom = Math.max(0, input.safeArea?.bottom ?? 0);
  const safeLeft = Math.max(0, input.safeArea?.left ?? 0);
  const safeRight = Math.max(0, input.safeArea?.right ?? 0);
  const compactSideSeats = aspect === 'portrait' && w <= 380;

  let cardWidth: number;
  if (aspect === 'portrait') {
    cardWidth = Math.min(68, Math.max(46, Math.floor(w * 0.125)));
  } else if (aspect === 'landscape') {
    cardWidth = Math.min(60, Math.max(42, Math.floor(h * 0.145)));
  } else {
    cardWidth = Math.min(78, Math.max(52, Math.floor(w * 0.088)));
  }
  const cardHeight = Math.round(cardWidth * 1.4);
  // UX-P3.2: opponent backs read as a reduced hand, not icon chips.
  const opponentCardWidth = Math.round(cardWidth * (aspect === 'landscape' ? 0.68 : 0.78));
  const opponentCardHeight = Math.round(cardHeight * (aspect === 'landscape' ? 0.68 : 0.78));
  const trickCardWidth = Math.round(cardWidth * PREMIUM_TABLE.trickScale);
  const trickCardHeight = Math.round(cardHeight * PREMIUM_TABLE.trickScale);

  const handReserve =
    aspect === 'portrait'
      ? Math.max(cardHeight * 0.78, 76)
      : aspect === 'landscape'
        ? Math.max(cardHeight * 0.58, 54)
        : Math.max(cardHeight * 0.64, 64);
  const handY = h - handReserve - bottomChromePx;

  const zones = computeTableZones({
    width: w,
    height: h,
    aspect,
    bottomChromePx,
    safeTop,
    safeBottom,
    safeLeft,
    safeRight,
    handReserve,
    cardHeight
  });

  const chromeNudge = bottomChromePx > 0 ? bottomChromePx * 0.35 : 0;
  // Trick center from zone — keep above hand; slight nudge when sheets open.
  const center: PhaserPoint = {
    x: zones.trick.cx,
    y: Math.min(zones.trick.cy, handY - cardHeight * 1.15) - chromeNudge * 0.25
  };

  const seatAnchor = {
    south: { x: zones.localSeat.cx, y: handY - cardHeight * 0.42 },
    west: { x: zones.leftSeat.cx, y: zones.leftSeat.cy },
    // Push north backs slightly down so seat chrome has clear air above.
    north: {
      x: zones.topSeat.cx,
      y: zones.topSeat.cy + Math.round(opponentCardHeight * 0.28)
    },
    east: { x: zones.rightSeat.cx, y: zones.rightSeat.cy }
  };

  const handSpreadMax =
    aspect === 'portrait' ? w * 0.92 : aspect === 'landscape' ? w * 0.7 : w * 0.78;

  const tableMargin =
    aspect === 'landscape'
      ? PREMIUM_TABLE.tableMarginLandscape
      : PREMIUM_TABLE.tableMarginPortrait;
  const tableRadius =
    aspect === 'landscape'
      ? PREMIUM_TABLE.tableRadiusLandscape
      : PREMIUM_TABLE.tableRadiusPortrait;

  return {
    width: w,
    height: h,
    aspect,
    zones,
    center,
    seatAnchor,
    handY,
    cardWidth,
    cardHeight,
    opponentCardWidth,
    opponentCardHeight,
    trickCardWidth,
    trickCardHeight,
    dropRadius: Math.max(cardWidth * 1.6, 72),
    handSpreadMax,
    bottomChromePx,
    tableMargin,
    tableRadius,
    compactSideSeats
  };
}

/** Flatten premium layout into the Phaser table layout shape. */
export function premiumToPhaserTableLayout(premium: PremiumTableLayout) {
  return {
    width: premium.width,
    height: premium.height,
    aspect: premium.aspect,
    center: premium.center,
    seatAnchor: premium.seatAnchor,
    handY: premium.handY,
    cardWidth: premium.cardWidth,
    cardHeight: premium.cardHeight,
    opponentCardWidth: premium.opponentCardWidth,
    opponentCardHeight: premium.opponentCardHeight,
    dropRadius: premium.dropRadius,
    handSpreadMax: premium.handSpreadMax,
    bottomChromePx: premium.bottomChromePx,
    trickCardWidth: premium.trickCardWidth,
    trickCardHeight: premium.trickCardHeight,
    tableMargin: premium.tableMargin,
    tableRadius: premium.tableRadius,
    zones: premium.zones,
    compactSideSeats: premium.compactSideSeats
  };
}

/**
 * Deterministic trick slot offsets (concept: N 0,-40 / E +42,0 / S 0,+38 / W -42,0),
 * scaled to card size so phone viewports stay coherent.
 */
export function premiumTrickOffset(
  compass: 'south' | 'west' | 'north' | 'east',
  layout: PremiumTrickLayoutMetrics
): PhaserPoint {
  const dx = Math.round(layout.cardWidth * 0.72); // ~42 @ 58px
  const dyN = Math.round(layout.cardHeight * 0.48); // ~40 @ 84
  const dyS = Math.round(layout.cardHeight * 0.45); // ~38
  switch (compass) {
    case 'north':
      return { x: 0, y: -dyN };
    case 'east':
      return { x: dx, y: 0 };
    case 'south':
      return { x: 0, y: dyS };
    case 'west':
      return { x: -dx, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

/** True when two axis-aligned rects overlap (inclusive edge counts as overlap). */
export function zonesOverlap(
  a: Pick<TableZoneRect, 'x' | 'y' | 'width' | 'height'>,
  b: Pick<TableZoneRect, 'x' | 'y' | 'width' | 'height'>,
  pad = 0
): boolean {
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  );
}
