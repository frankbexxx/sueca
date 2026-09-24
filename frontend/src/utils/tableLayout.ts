/**
 * Canonical table seat orientation (UX-SEAT-01).
 *
 * Relative to local player L:
 *   bottom / south = L
 *   left   / west  = (L + 1) % 4
 *   top    / north = (L + 2) % 4
 *   right  / east  = (L + 3) % 4
 *
 * Absolute (local = 0): index 0 south, 1 west, 2 north, 3 east.
 *
 * Visual only — does not change turn order, teams (0+2 / 1+3), or engine indices.
 */

export type TableCompass = 'south' | 'west' | 'north' | 'east';

/** Offset 0..3 from local → compass (S → W → N → E). */
export const COMPASS_FROM_LOCAL_OFFSET: readonly TableCompass[] = [
  'south',
  'west',
  'north',
  'east'
] as const;

export type SeatAroundLocal = Record<TableCompass, number>;

export function normalizePlayerIndex(index: number): number {
  return ((index % 4) + 4) % 4;
}

/** Offset of `playerIndex` relative to `localPlayerIndex` (0 = local/south). */
export function compassOffsetFromLocal(
  playerIndex: number,
  localPlayerIndex: number
): 0 | 1 | 2 | 3 {
  return normalizePlayerIndex(playerIndex - localPlayerIndex) as 0 | 1 | 2 | 3;
}

export function getTablePositionForPlayer(
  playerIndex: number,
  localPlayerIndex: number
): TableCompass {
  return COMPASS_FROM_LOCAL_OFFSET[
    compassOffsetFromLocal(playerIndex, localPlayerIndex)
  ];
}

/**
 * Absolute compass when local player is index 0.
 * Prefer {@link getTablePositionForPlayer} when local may rotate.
 */
export function getTablePosition(playerIndex: number): TableCompass {
  return getTablePositionForPlayer(playerIndex, 0);
}

/** Player indices at each compass for a given local seat. */
export function seatsAroundLocal(localPlayerIndex: number): SeatAroundLocal {
  const L = normalizePlayerIndex(localPlayerIndex);
  return {
    south: L,
    west: (L + 1) % 4,
    north: (L + 2) % 4,
    east: (L + 3) % 4
  };
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent =
    navigator.userAgent ||
    navigator.vendor ||
    (window as Window & { opera?: string }).opera ||
    '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
  return isMobileUA || window.innerWidth <= 768;
}

export function truncatePlayerName(name: string, maxLength = 8): string {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
}
