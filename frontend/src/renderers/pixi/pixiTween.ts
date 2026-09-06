/**
 * Minimal multi-prop tween helper for the Pixi POC (no GSAP).
 * ~40 LOC — replaces Phaser's built-in tween manager for hand→center + trick clear.
 */

export type Tweenable = { x: number; y: number; alpha: number };

export interface PixiTweenSpec {
  target: Tweenable;
  to: Partial<Pick<Tweenable, 'x' | 'y' | 'alpha'>>;
  durationMs: number;
  ease?: (t: number) => number;
  onComplete?: () => void;
}

interface ActiveTween extends PixiTweenSpec {
  from: Partial<Tweenable>;
  elapsed: number;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export class PixiTweenRunner {
  private tweens: ActiveTween[] = [];

  add(spec: PixiTweenSpec): void {
    const from: Partial<Tweenable> = {};
    (Object.keys(spec.to) as Array<keyof Tweenable>).forEach((key) => {
      from[key] = spec.target[key];
    });
    this.tweens.push({ ...spec, from, elapsed: 0 });
  }

  /** Advance all tweens by deltaMs. */
  update(deltaMs: number): void {
    if (this.tweens.length === 0) return;
    const still: ActiveTween[] = [];
    for (const tw of this.tweens) {
      tw.elapsed += deltaMs;
      const t = Math.min(1, tw.elapsed / Math.max(1, tw.durationMs));
      const e = (tw.ease ?? easeOutCubic)(t);
      (Object.keys(tw.to) as Array<keyof Tweenable>).forEach((key) => {
        const a = tw.from[key];
        const b = tw.to[key];
        if (a === undefined || b === undefined) return;
        tw.target[key] = a + (b - a) * e;
      });
      if (t >= 1) {
        tw.onComplete?.();
      } else {
        still.push(tw);
      }
    }
    this.tweens = still;
  }

  clear(): void {
    this.tweens = [];
  }

  get size(): number {
    return this.tweens.length;
  }
}
