/**
 * POC activation: Sueca Phaser table only when explicitly requested.
 * Default: DOM renderer unchanged.
 *
 * Activate: `?renderer=phaser` (Sueca solo). Also accepts REACT_APP_TABLE_RENDERER=phaser.
 */
export function isPhaserTableRendererRequested(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const param = new URLSearchParams(window.location.search).get('renderer');
      if (param && param.toLowerCase() === 'phaser') return true;
    } catch {
      /* ignore */
    }
  }
  return process.env.REACT_APP_TABLE_RENDERER === 'phaser';
}

/** POC is Sueca-only; never enable for other variants even with the flag. */
export function shouldUseSuecaPhaserTable(variant: string): boolean {
  return variant === 'sueca' && isPhaserTableRendererRequested();
}
