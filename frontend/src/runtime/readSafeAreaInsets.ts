/**
 * Runtime safe-area adapter.
 * Reads CSS env(safe-area-inset-*) into numeric px for geometry input.
 * Must stay outside frontend/src/scene (pure geometry has no DOM).
 */

import type { Insets } from '../scene/sceneGeometry';

function parseCssPx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Probe document for the four CSS safe-area insets in CSS pixels.
 * Single shared reader — do not duplicate per consumer.
 */
export function readSafeAreaInsets(doc: Document = document): Insets {
  const probe = doc.createElement('div');
  probe.setAttribute('data-sueca-safe-area-probe', '1');
  probe.style.cssText = [
    'position:fixed',
    'visibility:hidden',
    'pointer-events:none',
    'top:0',
    'left:0',
    'width:0',
    'height:0',
    'padding-top:env(safe-area-inset-top, 0px)',
    'padding-right:env(safe-area-inset-right, 0px)',
    'padding-bottom:env(safe-area-inset-bottom, 0px)',
    'padding-left:env(safe-area-inset-left, 0px)'
  ].join(';');

  doc.documentElement.appendChild(probe);
  try {
    const style = doc.defaultView?.getComputedStyle(probe) ?? getComputedStyle(probe);
    return {
      top: parseCssPx(style.paddingTop),
      right: parseCssPx(style.paddingRight),
      bottom: parseCssPx(style.paddingBottom),
      left: parseCssPx(style.paddingLeft)
    };
  } finally {
    probe.remove();
  }
}
