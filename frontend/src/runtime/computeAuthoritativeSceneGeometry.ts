/**
 * Pure pipeline from measured shell data → SceneGeometryResult.
 * No React, no listeners — callable from the authority hook and tests.
 */

import { calculateSceneGeometry } from '../scene/calculateSceneGeometry';
import { normalizeViewport, type RawViewportGeometry } from '../scene/normalizeViewport';
import type { SceneGeometryResult } from '../scene/sceneGeometry';
import { sceneGeometryResultKey } from '../scene/sceneGeometryEquality';

export type AuthoritativeGeometryCompute =
  | { readonly ok: true; readonly result: SceneGeometryResult; readonly key: string }
  | { readonly ok: false; readonly reason: string };

/**
 * normalizeViewport → calculateSceneGeometry → result identity key.
 * Returns ok:false only when raw measurement cannot be normalized
 * (invalid numbers). supported:false from the calculator is still ok:true.
 */
export function computeAuthoritativeSceneGeometry(
  raw: RawViewportGeometry
): AuthoritativeGeometryCompute {
  const normalized = normalizeViewport(raw);
  if (!normalized.ok) {
    return { ok: false, reason: normalized.reason };
  }
  const result = calculateSceneGeometry(normalized.input);
  return {
    ok: true,
    result,
    key: sceneGeometryResultKey(result)
  };
}
