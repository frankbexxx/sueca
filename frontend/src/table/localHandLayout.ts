/**
 * GLOBAL-CARDS-01 — adaptive human-hand spacing (renderer-neutral).
 *
 * Shared by Phaser (`layoutLocalHandPositions`) and DOM (`PlayerHand`).
 * Opponent hands MUST NOT use this helper.
 */

export type HumanHandAspect = 'portrait' | 'landscape' | 'desktop';

/**
 * Expose = fraction of *display* card width between card centers
 * (≈ visible left strip of each overlapped card).
 *
 * Continuous ease-out from dense (13) → open (2). No discrete tiers.
 */
export const HUMAN_HAND_LAYOUT = {
  /** 13 cards: compact but rank/suit corner readable. */
  exposeAt13: 0.38,
  /** 2 cards: near-natural spacing. */
  exposeAt2: 0.92,
  referenceCountHigh: 13,
  referenceCountLow: 2,
  /** Tiny arc — readability over theatrical fan. */
  portraitArc: 0.35,
  landscapeArc: 0.5,
  /** Near-zero fan angle (deg per step from mid). */
  portraitFanDeg: 0.15,
  landscapeFanDeg: 0.1,
  /** Selected card vertical lift (px, negative Y in Phaser). */
  selectedLift: 26
} as const;

/** @deprecated Prefer HUMAN_HAND_LAYOUT — kept for Phaser call-site aliases. */
export const HAND_LAYOUT = HUMAN_HAND_LAYOUT;

/**
 * Continuous visible-width fraction for local-hand spacing.
 * Higher count → more compressed; fewer cards → more breathing room.
 */
export function handExposedFraction(count: number): number {
  if (count <= 1) return 1;
  const hi = HUMAN_HAND_LAYOUT.referenceCountHigh;
  const lo = HUMAN_HAND_LAYOUT.referenceCountLow;
  const t = Math.max(0, Math.min(1, (hi - count) / (hi - lo)));
  // Ease-out: mid counts open a bit before linear would.
  const eased = 1 - (1 - t) * (1 - t);
  return (
    HUMAN_HAND_LAYOUT.exposeAt13 +
    eased * (HUMAN_HAND_LAYOUT.exposeAt2 - HUMAN_HAND_LAYOUT.exposeAt13)
  );
}

export interface HumanHandSpacingInput {
  cardCount: number;
  /** Displayed card width (layout width × presence scale in Phaser). */
  cardDisplayWidth: number;
  /** Max horizontal budget for the fan (centers + half cards). */
  availableWidth: number;
}

export interface HumanHandSpacingResult {
  spacing: number;
  expose: number;
  /** Leftmost center → rightmost center + cardDisplayWidth. */
  totalSpan: number;
}

/**
 * Adaptive center-to-center spacing that always fits `availableWidth`.
 */
export function computeHumanHandSpacing(
  input: HumanHandSpacingInput
): HumanHandSpacingResult {
  const { cardCount, cardDisplayWidth, availableWidth } = input;
  if (cardCount <= 0) {
    return { spacing: 0, expose: 1, totalSpan: 0 };
  }
  if (cardCount === 1) {
    return {
      spacing: 0,
      expose: 1,
      totalSpan: cardDisplayWidth
    };
  }

  const idealExpose = handExposedFraction(cardCount);
  const idealSpacing = cardDisplayWidth * idealExpose;
  // Fit: outermost card edges stay inside availableWidth.
  const maxCenters = Math.max(0, availableWidth - cardDisplayWidth);
  const maxSpacing = maxCenters / (cardCount - 1);
  const spacing = Math.min(idealSpacing, maxSpacing);
  const totalSpan = spacing * (cardCount - 1) + cardDisplayWidth;

  return {
    spacing,
    expose: cardDisplayWidth > 0 ? spacing / cardDisplayWidth : 1,
    totalSpan
  };
}

export interface HumanHandSlot {
  x: number;
  y: number;
  rotationDeg: number;
  zIndex: number;
}

export interface ComputeHumanHandLayoutInput {
  cardCount: number;
  cardDisplayWidth: number;
  availableWidth: number;
  centerX: number;
  baselineY: number;
  selectedIndex?: number | null;
  selectedLift?: number;
  aspect?: HumanHandAspect;
}

/**
 * Preferred shared entry: positions for the human hand fan.
 * Rotation/arc are intentionally tiny (GLOBAL-CARDS-01).
 */
export function computeHumanHandLayout(
  input: ComputeHumanHandLayoutInput
): { slots: HumanHandSlot[]; spacing: number; expose: number } {
  const {
    cardCount,
    cardDisplayWidth,
    availableWidth,
    centerX,
    baselineY,
    selectedIndex = null,
    selectedLift = HUMAN_HAND_LAYOUT.selectedLift,
    aspect = 'portrait'
  } = input;

  const { spacing, expose } = computeHumanHandSpacing({
    cardCount,
    cardDisplayWidth,
    availableWidth
  });

  if (cardCount <= 0) return { slots: [], spacing, expose };

  const total = spacing * Math.max(0, cardCount - 1);
  const startX = centerX - total / 2;
  const mid = (cardCount - 1) / 2;
  const isLandscape = aspect === 'landscape';
  const arcK = isLandscape
    ? HUMAN_HAND_LAYOUT.landscapeArc
    : HUMAN_HAND_LAYOUT.portraitArc;
  const fanDeg = isLandscape
    ? HUMAN_HAND_LAYOUT.landscapeFanDeg
    : HUMAN_HAND_LAYOUT.portraitFanDeg;

  const slots: HumanHandSlot[] = Array.from({ length: cardCount }, (_, i) => {
    const t = i - mid;
    const selected = selectedIndex === i;
    return {
      x: startX + i * spacing,
      y: baselineY + Math.abs(t) * arcK - (selected ? selectedLift : 0),
      rotationDeg: t * fanDeg,
      // Rightmost on top — preserves left-edge rank visibility under overlap.
      // Selection must NOT promote z-index (GLOBAL-CARDS-01 depth fix).
      zIndex: i + 1
    };
  });

  return { slots, spacing, expose };
}
