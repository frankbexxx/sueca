/**
 * Isolated next-track picker for Random / Family music modes.
 * Deterministic when `random` is injected (tests).
 */

export type RandomSource = () => number;

/** Default: Math.random in [0, 1). */
export const defaultRandom: RandomSource = () => Math.random();

/**
 * Pick next track id from pool.
 * - empty → null (caller falls back to core)
 * - size 1 → that id
 * - size > 1 → avoid immediate repeat of `previousId` when possible
 */
export function pickNextTrackId(
  pool: readonly string[],
  previousId: string | null | undefined,
  random: RandomSource = defaultRandom
): string | null {
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];

  const prev = previousId && pool.includes(previousId) ? previousId : null;
  const candidates = prev ? pool.filter((id) => id !== prev) : [...pool];
  const list = candidates.length > 0 ? candidates : [...pool];
  const r = random();
  const idx = Math.min(list.length - 1, Math.max(0, Math.floor(r * list.length)));
  return list[idx] ?? null;
}
