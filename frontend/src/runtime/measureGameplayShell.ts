/**
 * Measure the gameplay shell (HUD chrome + table zone) for scene geometry.
 * Event sources (window / visualViewport) may trigger remeasure; dimensions
 * come from the shell element, not from window alone.
 */

import type { RawViewportGeometry } from '../scene/normalizeViewport';
import { readSafeAreaInsets } from './readSafeAreaInsets';

export interface GameplayShellMeasurement extends RawViewportGeometry {
  readonly source: 'gameplay-shell';
}

/**
 * Authoritative shell size + current safe-area insets.
 * Prefer clientWidth/Height (layout box) over bounding rect (avoids transform skew).
 */
export function measureGameplayShell(shell: HTMLElement): GameplayShellMeasurement {
  const doc = shell.ownerDocument ?? document;
  const width = shell.clientWidth;
  const height = shell.clientHeight;
  return {
    source: 'gameplay-shell',
    width,
    height,
    safeInsets: readSafeAreaInsets(doc)
  };
}
