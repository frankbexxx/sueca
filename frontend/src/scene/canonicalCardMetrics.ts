/**
 * Step 3B / C2 — deterministic card metrics from SceneGeometry zones.
 * Nominal size from sceneScale; capped by canonical hand/trick envelopes.
 * No game/phase/orientation breakpoints.
 */

import { PROVISIONAL_CARD_METRICS } from './provisionalSceneGeometryConstants';
import type { Rect, SceneGeometry } from './sceneGeometry';

export const SELECTED_LIFT_PAD = PROVISIONAL_CARD_METRICS.selectedLiftPad;

export interface CanonicalCardMetrics {
  readonly sceneScale: number;
  /** Layout card size (before hand presence scale). */
  readonly cardWidth: number;
  readonly cardHeight: number;
  /** Local hand display size (what the player sees). */
  readonly handDisplayWidth: number;
  readonly handDisplayHeight: number;
  readonly trickCardWidth: number;
  readonly trickCardHeight: number;
  readonly opponentCardWidth: number;
  readonly opponentCardHeight: number;
  readonly selectedLiftPad: number;
}

function maxTrickWidthForCross(trickRect: Rect): number {
  const aspect = PROVISIONAL_CARD_METRICS.aspectHeightOverWidth;
  const fx = PROVISIONAL_CARD_METRICS.trickOffsetXFactor;
  const fy = PROVISIONAL_CARD_METRICS.trickOffsetYFactor;
  let lo = 0;
  let hi = Math.min(trickRect.width, trickRect.height / aspect);
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const th = mid * aspect;
    const dx = Math.round(mid * fx);
    const dy = Math.round(th * fy);
    const fits =
      mid + 2 * dx <= trickRect.width + 1e-9 && th + 2 * dy <= trickRect.height + 1e-9;
    if (fits) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Resting card-center Y inside the hand interaction envelope.
 * Prefers handRect vertical center; clamps so selected lift stays in
 * handInteractionRect (C2 size policy made positional).
 */
export function resolveCanonicalHandY(
  geometry: SceneGeometry,
  handDisplayHeight: number,
  selectedLiftPad: number = SELECTED_LIFT_PAD
): number {
  const half = handDisplayHeight / 2;
  const interact = geometry.handInteractionRect;
  const minY = interact.y + selectedLiftPad + half;
  const maxY = interact.y + interact.height - half;
  const preferred = geometry.handRect.y + geometry.handRect.height / 2;
  if (maxY < minY) {
    // Degenerate envelope — fall back to handBaseline-aligned center.
    return geometry.handBaseline - half;
  }
  return Math.min(maxY, Math.max(minY, preferred));
}

/**
 * C2 card metrics for a supported SceneGeometry snapshot.
 */
export function computeCanonicalCardMetrics(geometry: SceneGeometry): CanonicalCardMetrics {
  const m = PROVISIONAL_CARD_METRICS;
  const sceneScale = geometry.sceneScale;
  const baseCardW = m.baseCardWidthAtScale1 * sceneScale;
  const baseCardH =
    Math.round(m.baseCardWidthAtScale1 * m.aspectHeightOverWidth) * sceneScale;

  const selectedLiftPad = SELECTED_LIFT_PAD;
  const nominalHandDisplayH = baseCardH * m.handPresenceScale;
  const maxHandDisplayH = Math.max(
    0,
    geometry.handInteractionRect.height - selectedLiftPad
  );
  const handDisplayHeight = Math.min(nominalHandDisplayH, maxHandDisplayH);
  const handDisplayWidth = handDisplayHeight / m.aspectHeightOverWidth;

  // Phaser layout.card* is pre-presence; display = card * handPresenceScale.
  const cardWidth = handDisplayWidth / m.handPresenceScale;
  const cardHeight = handDisplayHeight / m.handPresenceScale;

  const nominalTrickW = baseCardW * m.trickScale;
  const trickCardWidth = Math.min(nominalTrickW, maxTrickWidthForCross(geometry.trickRect));
  const trickCardHeight = trickCardWidth * m.aspectHeightOverWidth;

  // Single opponent scale (no landscape/portrait branch).
  const opponentScale = 0.78;
  const opponentCardWidth = cardWidth * opponentScale;
  const opponentCardHeight = cardHeight * opponentScale;

  return {
    sceneScale,
    cardWidth,
    cardHeight,
    handDisplayWidth,
    handDisplayHeight,
    trickCardWidth,
    trickCardHeight,
    opponentCardWidth,
    opponentCardHeight,
    selectedLiftPad
  };
}
