/**
 * Hand pointer / hit-area policy for Phaser local cards.
 * Custom Geom rectangles must be frame-local, never layout display pixels.
 */

export type HandHitAreaMode = 'default-frame' | 'disabled';

/**
 * Interactive legal/pass cards use Phaser's default texture-frame hit area
 * so scale/displaySize maps pointer hits correctly.
 */
export function resolveHandHitAreaMode(interactive: boolean): HandHitAreaMode {
  return interactive ? 'default-frame' : 'disabled';
}

/**
 * Detects the UX-P1 regression: a hit rect sized like on-screen cards (~40–90px)
 * while the texture frame is hundreds of pixels — after scale the world hit is tiny.
 */
export function isDisplayPixelHitAreaMistake(
  hitWidth: number,
  hitHeight: number,
  frameWidth: number,
  frameHeight: number
): boolean {
  if (frameWidth <= 0 || frameHeight <= 0) return false;
  return hitWidth < frameWidth * 0.25 && hitHeight < frameHeight * 0.25;
}
