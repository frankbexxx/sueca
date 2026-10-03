/**
 * Read-only distribution of the authoritative SceneGeometryResult.
 * Owned by GameBoard / useSceneGeometryAuthority — consumers must not recalculate.
 */

import React, { createContext, useContext } from 'react';
import type { SceneGeometryResult } from '../scene/sceneGeometry';

const SceneGeometryContext = createContext<SceneGeometryResult | null>(null);

export function SceneGeometryProvider({
  value,
  children
}: {
  value: SceneGeometryResult | null;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <SceneGeometryContext.Provider value={value}>{children}</SceneGeometryContext.Provider>
  );
}

/** Current authoritative snapshot, or null before first successful measure. */
export function useSceneGeometrySnapshot(): SceneGeometryResult | null {
  return useContext(SceneGeometryContext);
}
