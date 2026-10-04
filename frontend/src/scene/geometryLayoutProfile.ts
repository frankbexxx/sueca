/**
 * Resolve which zone-construction layout the shared geometry pipeline should use.
 * Does not measure viewport or build zones — selection only.
 */

import type { GeometryLayoutProfile } from './sceneGeometry';
import type { TableRendererId } from '../renderers/resolveTableRenderer';

/**
 * V3 portrait zones only when Sueca is on the active Phaser/canonical table path.
 * DOM Sueca (including multiplayer) and all other variants → default.
 */
export function resolveGeometryLayoutProfile(args: {
  variant: string;
  tableRenderer: TableRendererId;
}): GeometryLayoutProfile {
  if (args.variant === 'sueca' && args.tableRenderer === 'phaser') {
    return 'suecaPortraitV3';
  }
  return 'default';
}
