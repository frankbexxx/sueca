/**
 * Minimal seeded RNG for future LEVEL-2 replay.
 * Production gameplay still uses Math.random — this module is scaffolding + seed generation.
 */

export type RandomSource = () => number;

/** Mulberry32 — compact, deterministic in [0, 1). */
export function createMulberry32(seed: number): RandomSource {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cryptographically-ish random hex seed for a new match (not wired into shuffle yet). */
export function createMatchSeed(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(2);
      crypto.getRandomValues(buf);
      return `${buf[0].toString(16).padStart(8, '0')}${buf[1]
        .toString(16)
        .padStart(8, '0')}`;
    }
  } catch {
    /* fall through */
  }
  return `m${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
}

export function createRngFromSeed(seed: string): RandomSource {
  return createMulberry32(seedFromString(seed));
}
