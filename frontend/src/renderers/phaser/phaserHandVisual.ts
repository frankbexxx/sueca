/**
 * Shared Phaser local-hand visual presentation (variant-agnostic).
 * Does not decide legality — only maps visualState → display tokens.
 */

import type { PhaserCardVisualState } from './mapTableModelToPhaserView';

/** Canonical hand chrome tokens used by Sueca / Spades / Hearts / King. */
export const HAND_VISUAL = {
  /** Fully readable face. */
  legalAlpha: 1 as number,
  /** Soft dim — face and suit stay clear (was 0.42 “black veil”). */
  illegalAlpha: 0.84 as number,
  /** Subtle resting dim for waiting hands. */
  inactiveAlpha: 0.94 as number,
  /** Mild cool darken for illegal (multiply tint). */
  illegalTint: 0xc8ced8 as number,
  legalTint: 0xffffff as number,
  inactiveTint: 0xffffff as number,
  /** S6 / GLOBAL-CARDS-01 — Y-axis lift only (no scale / no Z promotion). */
  selectedLift: 26,
  hoverLift: 10,
  selectedHoverLift: 30,
  /** Selected uses normal scale — elevation is the cue. */
  selectedScale: 1 as number,
  normalScale: 1 as number
};

export interface HandCardVisualInput {
  visualState: PhaserCardVisualState;
  selected: boolean;
  /** Trick-play drag allowed. */
  canDrag: boolean;
  /** Hearts pass: taps toggle selection without canDrag. */
  passSelectionEnabled: boolean;
  /** True when the table accepts trick play input. */
  interactionEnabled: boolean;
  hovered?: boolean;
}

export interface HandCardVisualPresentation {
  alpha: number;
  tint: number;
  scale: number;
  yOffset: number;
  interactive: boolean;
}

/**
 * Single source of truth for local-hand card chrome.
 * Geometry (x/y/fan) stays in `layoutLocalHandPositions`.
 */
export function getHandCardVisualPresentation(
  input: HandCardVisualInput
): HandCardVisualPresentation {
  const { visualState, selected, canDrag, passSelectionEnabled, interactionEnabled, hovered } =
    input;

  let alpha: number = HAND_VISUAL.legalAlpha;
  let tint: number = HAND_VISUAL.legalTint;
  if (visualState === 'illegal') {
    alpha = HAND_VISUAL.illegalAlpha;
    tint = HAND_VISUAL.illegalTint;
  } else if (visualState === 'inactive') {
    alpha = HAND_VISUAL.inactiveAlpha;
    tint = HAND_VISUAL.inactiveTint;
  }

  let yOffset = 0;
  if (selected && hovered) yOffset = -HAND_VISUAL.selectedHoverLift;
  else if (selected) yOffset = -HAND_VISUAL.selectedLift;
  else if (hovered && visualState === 'legal') yOffset = -HAND_VISUAL.hoverLift;

  const scale = HAND_VISUAL.normalScale;

  const interactive =
    visualState === 'legal' &&
    (passSelectionEnabled || (interactionEnabled && canDrag));

  return { alpha, tint, scale, yOffset, interactive };
}
