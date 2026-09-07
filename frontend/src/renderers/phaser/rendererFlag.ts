/**
 * POC activation helpers — re-export central policy.
 * Sueca defaults to Phaser; use `?renderer=dom` to force DOM.
 */
export {
  isPhaserTableRendererRequested,
  shouldUseSuecaPhaserTable,
  resolveTableRenderer,
  resolveTableRendererForBrowser,
  resolveRendererOverride,
  parseRendererOverrideFromQuery,
  parseRendererOverrideFromEnv
} from '../resolveTableRenderer';
export type {
  TableRendererId,
  RendererOverride,
  ResolveTableRendererOptions
} from '../resolveTableRenderer';
