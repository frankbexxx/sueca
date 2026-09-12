/**
 * ARCHIVED Pixi Sueca POC — not a supported product renderer.
 *
 * Kept in-repo for technical comparison only. Do not treat as active option.
 *
 * Activate (dev/archive only):
 *   `?renderer=pixi-archive` (Sueca solo)
 *   or `VITE_TABLE_RENDERER=pixi-archive`
 *
 * Plain `?renderer=pixi` is intentionally ignored.
 * See `docs/plan/RENDERER_DECISION_2026.md`.
 */
import { readViteEnv } from '../../config/runtimeEnv';

export function isPixiArchiveRendererRequested(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const param = new URLSearchParams(window.location.search).get('renderer');
      if (param && param.toLowerCase() === 'pixi-archive') return true;
    } catch {
      /* ignore */
    }
  }
  return readViteEnv('VITE_TABLE_RENDERER') === 'pixi-archive';
}

/** @deprecated Use isPixiArchiveRendererRequested — plain pixi flag is retired. */
export function isPixiTableRendererRequested(): boolean {
  return isPixiArchiveRendererRequested();
}

/** Archived POC is Sueca-only; never enable for other variants. */
export function shouldUseSuecaPixiTable(variant: string): boolean {
  return variant === 'sueca' && isPixiArchiveRendererRequested();
}
