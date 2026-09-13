/**
 * Pure layout math for the Sueca Phaser table (no Phaser imports).
 * Aspect-aware: portrait / landscape / desktop.
 *
 * Local hand geometry is variant-agnostic: same viewport + card count +
 * card size ⇒ same fan/overlap/baseline (Sueca 10 vs Spades/Hearts/King 13
 * only differ by count-driven spacing).
 *
 * UX-P3.1: seats / trick / felt zones come from `computePremiumTableLayout`;
 * hand fan knobs (`HAND_LAYOUT`) stay UX-P1.
 */

import {
  PREMIUM_TABLE,
  computePremiumTableLayout,
  premiumToPhaserTableLayout,
  premiumTrickOffset,
  resolvePremiumAspectMode,
  type TableZones
} from './phaserPremiumLayout';

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
  /** Trick cards may be slightly larger than hand (UX-P3.1). */
  trickCardWidth: number;
  trickCardHeight: number;
  /** Drop zone radius for optional drag-to-play. */
  dropRadius: number;
  handSpreadMax: number;
  /** Reserved px above canvas bottom for React bottom sheets (pass/bid/festa). */
  bottomChromePx: number;
  tableMargin: number;
  tableRadius: number;
  zones: TableZones;
  /** Narrow portrait: compact west/east seat chrome. */
  compactSideSeats: boolean;
}

/**
 * Shared hand fan knobs — not variant-specific.
 * Spacing uses a continuous expose curve (no discrete tiers).
 * `expose*` = fraction of *display* card width between card centers
 * (≈ left strip of each covered card that stays visible).
 */
export const HAND_LAYOUT = {
  /** ~13 cards: dense but rank/suit readable (~30–35% expose). */
  exposeAt13: 0.33,
  /** ~2 cards: open fan. */
  exposeAt2: 0.72,
  referenceCountHigh: 13,
  referenceCountLow: 2,
  portraitArc: 1.15,
  landscapeArc: 1.5,
  portraitFanDeg: 2.0,
  landscapeFanDeg: 1.3
} as const;

/**
 * Continuous visible-width fraction for local-hand spacing.
 * Higher count → more compressed; no step at 8→7 or 5→4.
 */
export function handExposedFraction(count: number): number {
  if (count <= 1) return 1;
  const hi = HAND_LAYOUT.referenceCountHigh;
  const lo = HAND_LAYOUT.referenceCountLow;
  const t = Math.max(0, Math.min(1, (hi - count) / (hi - lo)));
  // Ease-out: mid counts open a bit before linear would.
  const eased = 1 - (1 - t) * (1 - t);
  return (
    HAND_LAYOUT.exposeAt13 +
    eased * (HAND_LAYOUT.exposeAt2 - HAND_LAYOUT.exposeAt13)
  );
}

/** Display width of a local hand card (layout width × presence). */
export function localHandDisplayWidth(layout: Pick<PhaserTableLayout, 'cardWidth'>): number {
  return layout.cardWidth * PREMIUM_TABLE.handPresenceScale;
}

export interface PhaserLayoutOptions {
  /** Lift hand / south seat above React bottom-sheet chrome. */
  bottomChromePx?: number;
  safeArea?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Window/host size for aspect — ignores temporary canvas shrink from sheets. */
  orientationReference?: { width?: number; height?: number } | null;
}

const COMPASS_FROM_OFFSET: PhaserCompass[] = ['south', 'west', 'north', 'east'];

export function playerIndexToCompass(
  playerIndex: number,
  localPlayerIndex: number
): PhaserCompass {
  const offset = (playerIndex - localPlayerIndex + 4) % 4;
  return COMPASS_FROM_OFFSET[offset] ?? 'south';
}

export function resolveAspectMode(
  width: number,
  height: number,
  reference?: { width?: number; height?: number } | null
): PhaserAspectMode {
  return resolvePremiumAspectMode(width, height, reference);
}

/** Bottom-sheet reserve for pass / bid / festa — geometry only, not variant styling. */
export function resolveBottomChromePx(
  height: number,
  aspect: PhaserAspectMode,
  flags: { sheetActive?: boolean; compactSheet?: boolean }
): number {
  if (!flags.sheetActive) return 0;
  // Spades bidding dock is short — reserve less so the hand sits closer to the dock.
  if (flags.compactSheet) {
    if (aspect === 'portrait') return Math.round(Math.min(height * 0.045, 40));
    if (aspect === 'landscape') return Math.round(Math.min(height * 0.22, 72));
    return Math.round(Math.min(height * 0.06, 48));
  }
  if (aspect === 'portrait') return Math.round(Math.min(height * 0.13, 108));
  if (aspect === 'landscape') return Math.round(Math.min(height * 0.36, 120));
  return Math.round(Math.min(height * 0.12, 88));
}

export function buildPhaserTableLayout(
  width: number,
  height: number,
  options?: PhaserLayoutOptions
): PhaserTableLayout {
  const premium = computePremiumTableLayout({
    width,
    height,
    bottomChromePx: options?.bottomChromePx,
    safeArea: options?.safeArea,
    orientationReference: options?.orientationReference
  });
  return premiumToPhaserTableLayout(premium);
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
  const { handY, handSpreadMax } = layout;
  const displayW = localHandDisplayWidth(layout);
  const expose = handExposedFraction(count);
  const spacing = Math.min(
    displayW * expose,
    handSpreadMax / Math.max(count, 1)
  );
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
      // Rightmost on top — preserves left-edge rank visibility under overlap.
      depth: PREMIUM_TABLE.depthHand + i
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
  // Slightly wider gaps so larger backs still read as a fan/stack.
  const gap =
    compass === 'north' || compass === 'south'
      ? Math.max(11, Math.round(layout.opponentCardWidth * 0.22))
      : Math.max(9, Math.round(layout.opponentCardHeight * 0.18));
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
  const offset = premiumTrickOffset(compass, layout);
  return {
    x: layout.center.x + offset.x,
    y: layout.center.y + offset.y
  };
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
