/**
 * Step 3A/3C — map canonical SceneGeometry rects onto the gameplay shell.
 * Pure helpers for host/HUD/decision-sheet placement (no DOM measurement).
 */

import type { CSSProperties } from 'react';
import type { Rect, SceneGeometry } from '../scene/sceneGeometry';

/** Absolute box relative to the measured `.game-board` shell. */
export function shellAbsoluteStyle(rect: Rect): CSSProperties {
  return {
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    boxSizing: 'border-box',
    margin: 0
  };
}

/** Scene-local rect → shell coordinates (sceneFrame origin + local offset). */
export function sceneLocalRectShellStyle(
  geometry: SceneGeometry,
  local: Rect
): CSSProperties {
  return shellAbsoluteStyle({
    x: geometry.sceneFrame.x + local.x,
    y: geometry.sceneFrame.y + local.y,
    width: local.width,
    height: local.height
  });
}

/** Phaser host / scene layer: full canonical sceneFrame in shell coordinates. */
export function sceneFrameHostStyle(geometry: SceneGeometry): CSSProperties {
  return {
    ...shellAbsoluteStyle(geometry.sceneFrame),
    zIndex: 1,
    overflow: 'hidden'
  };
}

/**
 * React HUD chrome: hudRect mapped into shell coordinates
 * (sceneFrame origin + scene-local hudRect).
 *
 * Base chrome stays geometrically sized to hudRect. Overflow must stay
 * visible so floating HUD surfaces (… menu) are not clipped by the band.
 * Score content clipping is handled on `.in-game-hud-chrome__scores`.
 */
export function hudRectShellStyle(geometry: SceneGeometry): CSSProperties {
  return {
    ...sceneLocalRectShellStyle(geometry, geometry.hudRect),
    zIndex: 1100,
    overflow: 'visible'
  };
}

/**
 * Step 3C — large decision sheet overlay envelope (decisionSheetRect).
 * Exterior fills the canonical zone; content max-width is presentation-only.
 */
export function decisionSheetRectShellStyle(geometry: SceneGeometry): CSSProperties {
  return {
    ...sceneLocalRectShellStyle(geometry, geometry.decisionSheetRect),
    zIndex: 2100,
    overflow: 'hidden',
    pointerEvents: 'none'
  };
}

/**
 * Step 3C — small decision / ritual plaque envelope (decisionRect).
 */
export function decisionRectShellStyle(geometry: SceneGeometry): CSSProperties {
  return {
    ...sceneLocalRectShellStyle(geometry, geometry.decisionRect),
    zIndex: 2100,
    overflow: 'hidden',
    pointerEvents: 'none'
  };
}

/**
 * Sueca ritual-status CSS max-height (VariantModals). Used only to choose
 * between decisionRect and decisionSheetRect — never to resize geometry.
 */
export const SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX = 86;

export type SuecaRitualSurfaceKind = 'status' | 'decision' | 'human';

/**
 * Pick canonical zone for Sueca ritual plaques.
 * Status uses decisionRect only when it fits cleanly; otherwise decisionSheetRect.
 * Decision / human / distribution always use decisionSheetRect.
 */
export function resolveSuecaRitualCanonicalZone(
  geometry: SceneGeometry,
  kind: SuecaRitualSurfaceKind
): 'decisionRect' | 'decisionSheetRect' {
  if (kind !== 'status') return 'decisionSheetRect';
  return geometry.decisionRect.height + 1e-6 >= SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX
    ? 'decisionRect'
    : 'decisionSheetRect';
}
