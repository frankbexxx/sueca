/**
 * Optional DEV shortcut for King Sintético.
 * Query: `?devKingSynthetic=1` (development builds only)
 *
 * Routes into the production preset `king-pt-synthetic` — not a separate rules path.
 */

import { kingSyntheticRoundLabel } from '../models/games/king/kingContracts';

export interface DevKingSyntheticJump {
  enabled: true;
}

export function isKingDevSyntheticEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Parse `?devKingSynthetic=1`.
 * Returns null outside DEV or when flag absent / not truthy.
 */
export function parseDevKingSyntheticParams(search: string): DevKingSyntheticJump | null {
  if (!isKingDevSyntheticEnabled()) return null;

  const raw = search.startsWith('?') ? search.slice(1) : search;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }

  const flag = params.get('devKingSynthetic');
  if (flag !== '1' && flag !== 'true') return null;

  return { enabled: true };
}

/** @deprecated Product mode has no DEV badge — kept for older tests. */
export function formatDevKingSyntheticBadge(): string {
  return 'DEV · KING SINTÉTICO';
}

export { kingSyntheticRoundLabel };
