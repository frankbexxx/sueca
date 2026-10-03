/**
 * Deterministic geometry keying / equality for viewport-driven snapshots.
 * Not tied to React render lifecycle.
 */

import type { SceneGeometry, ViewportGeometryInput } from './sceneGeometry';

/**
 * Lossless deterministic token for a finite number.
 * Distinct IEEE values that produce distinct geometry inputs must not collide.
 */
function numberKey(value: number): string {
  if (Object.is(value, -0)) return '0';
  return String(value);
}

/**
 * Stable key from normalized viewport input (geometry-relevant only).
 * Identical inputs → identical key. No decimal rounding that merges values.
 */
export function viewportGeometryKey(input: ViewportGeometryInput): string {
  const i = input.safeInsets;
  return [
    numberKey(input.width),
    numberKey(input.height),
    numberKey(i.top),
    numberKey(i.right),
    numberKey(i.bottom),
    numberKey(i.left),
    input.orientation
  ].join('|');
}

export function sceneGeometryKey(geometry: SceneGeometry): string {
  return geometry.geometryKey;
}

export function areSceneGeometriesEqual(a: SceneGeometry, b: SceneGeometry): boolean {
  return a.geometryKey === b.geometryKey && deepEqual(a, b);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return false;
  }
  const aKeys = Object.keys(a as object).sort();
  const bKeys = Object.keys(b as object).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    if (!deepEqual((a as Record<string, unknown>)[aKeys[i]], (b as Record<string, unknown>)[bKeys[i]])) {
      return false;
    }
  }
  return true;
}
