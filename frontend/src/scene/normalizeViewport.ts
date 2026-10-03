/**
 * Normalize already-measured viewport numbers into ViewportGeometryInput.
 * Step 1: pure data only — no window, document, or observers.
 */

import type {
  Insets,
  NormalizeViewportReason,
  NormalizeViewportResult,
  Orientation,
  ViewportGeometryInput
} from './sceneGeometry';

export interface RawViewportGeometry {
  readonly width: number;
  readonly height: number;
  readonly safeInsets?: Partial<Insets> | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

type InsetNormalizeResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly reason: Extract<NormalizeViewportReason, 'invalid_insets' | 'non_finite_insets'> };

function normalizeInset(value: unknown): InsetNormalizeResult {
  if (value == null) return { ok: true, value: 0 };
  if (typeof value !== 'number') return { ok: false, reason: 'invalid_insets' };
  if (!Number.isFinite(value)) return { ok: false, reason: 'non_finite_insets' };
  if (value < 0) return { ok: false, reason: 'invalid_insets' };
  return { ok: true, value };
}

/** Orientation from usable (post safe-inset) width/height. */
export function deriveOrientation(width: number, height: number): Orientation {
  return width >= height ? 'landscape' : 'portrait';
}

/**
 * Validate and normalize raw measured dimensions + safe insets.
 * Orientation is derived from the usable safe rectangle, not the raw outer size.
 * Does not observe the browser viewport.
 */
export function normalizeViewport(raw: RawViewportGeometry): NormalizeViewportResult {
  if (!isFiniteNumber(raw.width) || !isFiniteNumber(raw.height)) {
    return { ok: false, reason: 'non_finite_dimensions' };
  }
  if (raw.width <= 0 || raw.height <= 0) {
    return { ok: false, reason: 'invalid_dimensions' };
  }

  const source = raw.safeInsets ?? {};
  const topR = normalizeInset(source.top);
  const rightR = normalizeInset(source.right);
  const bottomR = normalizeInset(source.bottom);
  const leftR = normalizeInset(source.left);

  for (const side of [topR, rightR, bottomR, leftR]) {
    if (!side.ok) return { ok: false, reason: side.reason };
  }

  const top = (topR as { ok: true; value: number }).value;
  const right = (rightR as { ok: true; value: number }).value;
  const bottom = (bottomR as { ok: true; value: number }).value;
  const left = (leftR as { ok: true; value: number }).value;

  if (left + right >= raw.width || top + bottom >= raw.height) {
    return { ok: false, reason: 'insets_exceed_viewport' };
  }

  const usableWidth = raw.width - left - right;
  const usableHeight = raw.height - top - bottom;

  const input: ViewportGeometryInput = {
    width: raw.width,
    height: raw.height,
    safeInsets: { top, right, bottom, left },
    orientation: deriveOrientation(usableWidth, usableHeight)
  };
  return { ok: true, input };
}
