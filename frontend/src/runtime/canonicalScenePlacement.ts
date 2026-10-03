/**
 * Step 3A — map canonical SceneGeometry rects onto the gameplay shell.
 * Pure helpers for host/HUD placement (no DOM measurement).
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
    ...shellAbsoluteStyle({
      x: geometry.sceneFrame.x + geometry.hudRect.x,
      y: geometry.sceneFrame.y + geometry.hudRect.y,
      width: geometry.hudRect.width,
      height: geometry.hudRect.height
    }),
    zIndex: 1100,
    overflow: 'visible'
  };
}
