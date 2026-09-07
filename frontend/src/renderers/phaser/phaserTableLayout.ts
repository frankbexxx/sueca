/**
 * Pure layout math for the Sueca Phaser table (no Phaser imports).
 * Aspect-aware: portrait / landscape / desktop.
 *
 * Local hand geometry is variant-agnostic: same viewport + card count +
 * card size ⇒ same fan/overlap/baseline (Sueca 10 vs Spades/Hearts/King 13
 * only differ by count-driven spacing).
 */

export type PhaserCompass = 'south' | 'west' | 'north' | 'east';

export type PhaserAspectMode = 'portrait' | 'landscape' | 'desktop';

export interface PhaserPoint {
  x: number;
  y: number;
}

export interface PhaserHandSlot extends PhaserPoint {
  rotationDeg: number;
  depth: number;
}

export interface PhaserTableLayout {
  width: number;
  height: number;
  aspect: PhaserAspectMode;
  center: PhaserPoint;
  seatAnchor: Record<PhaserCompass, PhaserPoint>;
  handY: number;
  cardWidth: number;
  cardHeight: number;
  opponentCardWidth: number;
  opponentCardHeight: number;
  /** Drop zone radius for optional drag-to-play. */
  dropRadius: number;
  handSpreadMax: number;
  /** Reserved px above canvas bottom for React bottom sheets (pass/bid/festa). */
  bottomChromePx: number;
}

/** Shared hand fan knobs — not variant-specific. */
export const HAND_LAYOUT = {
  overlapDense: 0.52,
  overlapMid: 0.62,
  overlapLoose: 0.7,
  denseFromCount: 8,
  midFromCount: 5,
  portraitArc: 1.2,
  landscapeArc: 1.6,
  portraitFanDeg: 2.2,
  landscapeFanDeg: 1.4
} as const;

export interface PhaserLayoutOptions {
  /** Lift hand / south seat above React bottom-sheet chrome. */
  bottomChromePx?: number;
}

const COMPASS_FROM_OFFSET: PhaserCompass[] = ['south', 'west', 'north', 'east'];

export function playerIndexToCompass(
  playerIndex: number,
  localPlayerIndex: number
): PhaserCompass {
  const offset = (playerIndex - localPlayerIndex + 4) % 4;
  return COMPASS_FROM_OFFSET[offset] ?? 'south';
}

export function resolveAspectMode(width: number, height: number): PhaserAspectMode {
  const ratio = height / Math.max(1, width);
  if (ratio >= 1.15) return 'portrait';
  if (width / Math.max(1, height) >= 1.45 && height < 520) return 'landscape';
  return 'desktop';
}

/** Bottom-sheet reserve for pass / bid / festa — geometry only, not variant styling. */
export function resolveBottomChromePx(
  height: number,
  aspect: PhaserAspectMode,
  flags: { sheetActive?: boolean }
): number {
  if (!flags.sheetActive) return 0;
  if (aspect === 'portrait') return Math.round(Math.min(height * 0.2, 148));
  // Short landscape phone: keep hand above compact bottom sheets.
  if (aspect === 'landscape') return Math.round(Math.min(height * 0.42, 140));
  return Math.round(Math.min(height * 0.14, 100));
}

export function buildPhaserTableLayout(
  width: number,
  height: number,
  options?: PhaserLayoutOptions
): PhaserTableLayout {
  const w = Math.max(280, width);
  const h = Math.max(300, height);
  const aspect = resolveAspectMode(w, h);
  const bottomChromePx = Math.max(0, Math.round(options?.bottomChromePx ?? 0));

  let cardWidth: number;
  if (aspect === 'portrait') {
    cardWidth = Math.min(64, Math.max(44, Math.floor(w * 0.12)));
  } else if (aspect === 'landscape') {
    cardWidth = Math.min(58, Math.max(40, Math.floor(h * 0.14)));
  } else {
    cardWidth = Math.min(76, Math.max(50, Math.floor(w * 0.085)));
  }
  const cardHeight = Math.round(cardWidth * 1.4);
  const opponentCardWidth = Math.round(cardWidth * (aspect === 'landscape' ? 0.48 : 0.55));
  const opponentCardHeight = Math.round(cardHeight * (aspect === 'landscape' ? 0.48 : 0.55));

  const marginX =
    aspect === 'landscape'
      ? Math.max(36, Math.floor(w * 0.05))
      : Math.max(44, Math.floor(w * 0.07));
  const marginY =
    aspect === 'portrait'
      ? Math.max(28, Math.floor(h * 0.05))
      : Math.max(32, Math.floor(h * 0.06));

  const handReserve =
    aspect === 'portrait'
      ? Math.max(cardHeight * 0.72, 70)
      : aspect === 'landscape'
        ? Math.max(cardHeight * 0.55, 52)
        : Math.max(cardHeight * 0.6, 60);
  const handY = h - handReserve - bottomChromePx;

  const chromeNudge = bottomChromePx > 0 ? bottomChromePx * 0.35 : 0;
  const centerY =
    (aspect === 'portrait'
      ? h * 0.38
      : aspect === 'landscape'
        ? h * 0.4
        : h * 0.42) - chromeNudge;

  const handSpreadMax =
    aspect === 'portrait' ? w * 0.92 : aspect === 'landscape' ? w * 0.7 : w * 0.78;

  return {
    width: w,
    height: h,
    aspect,
    center: { x: w / 2, y: centerY },
    seatAnchor: {
      south: { x: w / 2, y: handY - cardHeight * 0.42 },
      west: { x: marginX, y: centerY },
      north: { x: w / 2, y: marginY + (aspect === 'landscape' ? 12 : 20) },
      east: { x: w - marginX, y: centerY }
    },
    handY,
    cardWidth,
    cardHeight,
    opponentCardWidth,
    opponentCardHeight,
    dropRadius: Math.max(cardWidth * 1.6, 72),
    handSpreadMax,
    bottomChromePx
  };
}

/**
 * Fan positions for the local hand.
 * Depends only on card count + layout metrics (viewport-derived), not variant.
 */
export function layoutLocalHandPositions(
  count: number,
  layout: PhaserTableLayout
): PhaserHandSlot[] {
  if (count <= 0) return [];
  const { handY, cardWidth, handSpreadMax } = layout;
  const overlap =
    count >= HAND_LAYOUT.denseFromCount
      ? HAND_LAYOUT.overlapDense
      : count >= HAND_LAYOUT.midFromCount
        ? HAND_LAYOUT.overlapMid
        : HAND_LAYOUT.overlapLoose;
  const spacing = Math.min(cardWidth * overlap, handSpreadMax / Math.max(count, 1));
  const total = spacing * (count - 1);
  const startX = layout.width / 2 - total / 2;
  const mid = (count - 1) / 2;
  const isLandscape = layout.aspect === 'landscape';
  const arcK = isLandscape ? HAND_LAYOUT.landscapeArc : HAND_LAYOUT.portraitArc;
  const fanDeg = isLandscape ? HAND_LAYOUT.landscapeFanDeg : HAND_LAYOUT.portraitFanDeg;
  return Array.from({ length: count }, (_, i) => {
    const t = i - mid;
    const arc = Math.abs(t) * arcK;
    return {
      x: startX + i * spacing,
      y: handY + arc,
      rotationDeg: t * fanDeg,
      depth: 20 + i
    };
  });
}

/**
 * Single entry for local-hand geometry used by all variants.
 * Same card count + viewport (+ optional bottom chrome) ⇒ same slots.
 */
export function computeLocalHandLayout(input: {
  width: number;
  height: number;
  cardCount: number;
  bottomChromePx?: number;
}): { layout: PhaserTableLayout; slots: PhaserHandSlot[] } {
  const layout = buildPhaserTableLayout(input.width, input.height, {
    bottomChromePx: input.bottomChromePx
  });
  return { layout, slots: layoutLocalHandPositions(input.cardCount, layout) };
}

export function layoutOpponentBackPositions(
  count: number,
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint[] {
  const anchor = layout.seatAnchor[compass];
  const n = Math.min(count, 10);
  const gap = compass === 'north' || compass === 'south' ? 9 : 7;
  return Array.from({ length: n }, (_, i) => {
    const mid = (n - 1) / 2;
    if (compass === 'west' || compass === 'east') {
      return { x: anchor.x, y: anchor.y + (i - mid) * gap };
    }
    return { x: anchor.x + (i - mid) * gap, y: anchor.y };
  });
}

export function layoutTrickSlot(
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint {
  const { center, cardWidth, cardHeight } = layout;
  const dx = cardWidth * 0.58;
  const dy = cardHeight * 0.42;
  switch (compass) {
    case 'south':
      return { x: center.x, y: center.y + dy };
    case 'north':
      return { x: center.x, y: center.y - dy };
    case 'west':
      return { x: center.x - dx, y: center.y };
    case 'east':
      return { x: center.x + dx, y: center.y };
    default:
      return center;
  }
}

export function pointInDropZone(
  x: number,
  y: number,
  layout: PhaserTableLayout
): boolean {
  const dx = x - layout.center.x;
  const dy = y - layout.center.y;
  return dx * dx + dy * dy <= layout.dropRadius * layout.dropRadius;
}
