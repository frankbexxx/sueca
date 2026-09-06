/**
 * POC activation: Sueca Pixi table only when explicitly requested.
 * Default: DOM. Phaser remains on ?renderer=phaser.
 *
 * Activate: `?renderer=pixi` (Sueca solo). Also accepts REACT_APP_TABLE_RENDERER=pixi.
 */
export function isPixiTableRendererRequested(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const param = new URLSearchParams(window.location.search).get('renderer');
      if (param && param.toLowerCase() === 'pixi') return true;
    } catch {
      /* ignore */
    }
  }
  return process.env.REACT_APP_TABLE_RENDERER === 'pixi';
}

/** POC is Sueca-only; never enable for other variants even with the flag. */
export function shouldUseSuecaPixiTable(variant: string): boolean {
  return variant === 'sueca' && isPixiTableRendererRequested();
}
