/**
 * REL-DECK-SIZE-02 — Canonical card display contract.
 *
 * OUTER physical silhouette is always 5:7 (width : height = 1 : 1.4).
 * INNER artwork preserves native texture aspect (contain, centered, no crop).
 * Assets are not re-exported; render boxes absorb deck ratio differences.
 */

/** Height / width of the outer card frame (poker-like). */
export const CARD_FRAME_ASPECT = 1.4;

/** CSS aspect-ratio for DOM frames. */
export const CARD_FRAME_ASPECT_CSS = '5 / 7';

/** Neutral face plate behind contained art (ivory card stock). */
export const CARD_FACE_PLATE_COLOR = 0xf4efe6;

/** CSS fill for DOM / Personalizar frames. */
export const CARD_FACE_PLATE_CSS = '#f4efe6';

export type Size2 = { width: number; height: number };

/** Derive frame height from width under the canonical 5:7 contract. */
export function cardFrameHeight(width: number): number {
  return Math.round(width * CARD_FRAME_ASPECT);
}

/**
 * Largest size that fits inside `frame` while preserving texture aspect.
 * Never stretches; never crops.
 */
export function containDisplaySize(
  frameWidth: number,
  frameHeight: number,
  textureWidth: number,
  textureHeight: number
): Size2 {
  if (frameWidth <= 0 || frameHeight <= 0) {
    return { width: 0, height: 0 };
  }
  if (textureWidth <= 0 || textureHeight <= 0) {
    return { width: frameWidth, height: frameHeight };
  }
  const scale = Math.min(frameWidth / textureWidth, frameHeight / textureHeight);
  return {
    width: textureWidth * scale,
    height: textureHeight * scale
  };
}

/**
 * Frame-local hit rectangle (texture pixel space) that maps to the full
 * outer display frame after the art is sized with {@link containDisplaySize}.
 * Keeps pointer targets on the 5:7 silhouette even when art letterboxes.
 */
export function containedFrameHitArea(
  frameWidth: number,
  frameHeight: number,
  textureWidth: number,
  textureHeight: number,
  artWidth: number,
  artHeight: number
): { x: number; y: number; width: number; height: number } {
  if (artWidth <= 0 || artHeight <= 0 || textureWidth <= 0 || textureHeight <= 0) {
    return { x: 0, y: 0, width: textureWidth, height: textureHeight };
  }
  const hitW = frameWidth * (textureWidth / artWidth);
  const hitH = frameHeight * (textureHeight / artHeight);
  return {
    x: (textureWidth - hitW) / 2,
    y: (textureHeight - hitH) / 2,
    width: hitW,
    height: hitH
  };
}

/** True when outer size matches 5:7 within a small tolerance. */
export function isCanonicalFrameRatio(width: number, height: number, eps = 0.02): boolean {
  if (width <= 0 || height <= 0) return false;
  return Math.abs(height / width - CARD_FRAME_ASPECT) <= eps;
}
