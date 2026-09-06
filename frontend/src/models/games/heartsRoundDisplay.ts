/**
 * Converts raw captured penalty points into the deltas actually applied to totals.
 * Active moon rule: shooter 0, each other player +26.
 */
export function settleHeartsRoundDeltas(roundPoints: number[]): number[] {
  const pts =
    roundPoints.length >= 4 ? roundPoints.slice(0, 4) : [...roundPoints, 0, 0, 0, 0].slice(0, 4);
  const roundTotal = pts.reduce((a, b) => a + b, 0);
  const shooter = pts.findIndex((p) => p === 26);
  if (shooter >= 0 && roundTotal === 26) {
    return pts.map((_, i) => (i === shooter ? 0 : 26));
  }
  return [...pts];
}

export function isHeartsShootTheMoon(roundPoints: number[]): boolean {
  const pts = roundPoints.slice(0, 4);
  return pts.reduce((a, b) => a + b, 0) === 26 && pts.some((p) => p === 26);
}

/**
 * Round-end modal display: prefer engine-stored lastRoundDeltas; if missing (legacy),
 * derive from raw roundPoints with the same settlement helper the engine uses.
 */
export function getHeartsRoundEndDisplayDeltas(hearts: {
  roundPoints: number[];
  lastRoundDeltas: number[];
}): number[] {
  const rawSum = hearts.roundPoints.reduce((a, b) => a + b, 0);
  const storedSum = hearts.lastRoundDeltas.reduce((a, b) => a + b, 0);
  if (storedSum !== 0 || rawSum === 0) {
    return [...hearts.lastRoundDeltas];
  }
  return settleHeartsRoundDeltas(hearts.roundPoints);
}
