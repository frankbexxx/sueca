/**
 * Central table-renderer selection.
 *
 * Precedence:
 * 1. URL query `?renderer=`
 * 2. `REACT_APP_TABLE_RENDERER` env
 * 3. variant default
 *
 * Defaults:
 * - Sueca / Spades / Hearts / King → Phaser
 * - Unknown / non-capable variants → DOM
 */

export type TableRendererId = 'phaser' | 'dom';

/** Explicit override from query or env; null = use variant default. */
export type RendererOverride = 'phaser' | 'dom' | null;

const PHASER_CAPABLE_VARIANTS = new Set(['sueca', 'spades', 'hearts', 'king']);

export function parseRendererOverrideFromQuery(
  search?: string | null
): RendererOverride {
  if (search == null || search === '') return null;
  try {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    const param = new URLSearchParams(raw).get('renderer');
    if (!param) return null;
    const value = param.toLowerCase();
    if (value === 'phaser' || value === 'dom') return value;
    return null;
  } catch {
    return null;
  }
}

export function parseRendererOverrideFromEnv(
  envValue?: string | null
): RendererOverride {
  if (!envValue) return null;
  const value = envValue.toLowerCase();
  if (value === 'phaser' || value === 'dom') return value;
  return null;
}

/**
 * Resolve override with precedence: query → env → null.
 * Pure: pass search / envValue for tests.
 */
export function resolveRendererOverride(
  search?: string | null,
  envValue?: string | null
): RendererOverride {
  const fromQuery = parseRendererOverrideFromQuery(search);
  if (fromQuery) return fromQuery;
  return parseRendererOverrideFromEnv(envValue);
}

export interface ResolveTableRendererOptions {
  /** Pre-parsed override (wins over search/env when provided). */
  override?: RendererOverride;
  /** `window.location.search` or `?renderer=dom`. */
  search?: string | null;
  /** Typically `process.env.REACT_APP_TABLE_RENDERER`. */
  envOverride?: string | null;
}

/**
 * Pick the table renderer for a game variant.
 * Does not consider multiplayer — callers must force DOM for MP.
 */
export function resolveTableRenderer(
  variant: string,
  options: ResolveTableRendererOptions = {}
): TableRendererId {
  const override =
    options.override !== undefined
      ? options.override
      : resolveRendererOverride(options.search, options.envOverride);

  if (!PHASER_CAPABLE_VARIANTS.has(variant)) {
    return 'dom';
  }

  // Capable variants — Phaser default; explicit DOM override only
  if (override === 'dom') return 'dom';
  if (override === 'phaser') return 'phaser';
  return 'phaser';
}

/** Browser helper: current location + CRA env. */
export function resolveTableRendererForBrowser(variant: string): TableRendererId {
  const search =
    typeof window !== 'undefined' ? window.location.search : null;
  return resolveTableRenderer(variant, {
    search,
    envOverride: process.env.REACT_APP_TABLE_RENDERER
  });
}

/** @deprecated Prefer resolveTableRenderer — kept for existing call sites. */
export function shouldUseSuecaPhaserTable(variant: string): boolean {
  return resolveTableRendererForBrowser(variant) === 'phaser';
}

/** True when an explicit phaser request is present (query or env). */
export function isPhaserTableRendererRequested(): boolean {
  return (
    resolveRendererOverride(
      typeof window !== 'undefined' ? window.location.search : null,
      process.env.REACT_APP_TABLE_RENDERER
    ) === 'phaser'
  );
}

export function isPhaserCapableVariant(variant: string): boolean {
  return PHASER_CAPABLE_VARIANTS.has(variant);
}
