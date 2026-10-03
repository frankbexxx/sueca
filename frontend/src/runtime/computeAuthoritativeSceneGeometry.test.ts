import { describe, expect, it } from 'vitest';
import { computeAuthoritativeSceneGeometry } from './computeAuthoritativeSceneGeometry';
import { sceneGeometryResultKey } from '../scene/sceneGeometryEquality';

describe('computeAuthoritativeSceneGeometry', () => {
  it('creates an initial supported snapshot from shell measurement', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;
    expect(computed.result.supported).toBe(true);
    expect(computed.key).toBe(sceneGeometryResultKey(computed.result));
  });

  it('updates geometry when shell size changes', () => {
    const a = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    const b = computeAuthoritativeSceneGeometry({
      width: 420,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.key).not.toBe(b.key);
    if (a.result.supported && b.result.supported) {
      // Height-limited fill keeps scene width at design width; safeRect still changes.
      expect(a.result.geometry.safeRect.width).not.toBe(b.result.geometry.safeRect.width);
    }
  });

  it('keeps the same key for identical effective viewport input', () => {
    const raw = {
      width: 390,
      height: 844,
      safeInsets: { top: 12, right: 0, bottom: 8, left: 0 }
    };
    const a = computeAuthoritativeSceneGeometry(raw);
    const b = computeAuthoritativeSceneGeometry({ ...raw, safeInsets: { ...raw.safeInsets } });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.key).toBe(b.key);
  });

  it('updates geometry when orientation of usable shell changes', () => {
    const portrait = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 700,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    const landscape = computeAuthoritativeSceneGeometry({
      width: 1024,
      height: 600,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(portrait.ok && landscape.ok).toBe(true);
    if (!portrait.ok || !landscape.ok) return;
    expect(portrait.key).not.toBe(landscape.key);
    expect(portrait.result.supported).toBe(true);
    expect(landscape.result.supported).toBe(true);
    if (portrait.result.supported && landscape.result.supported) {
      expect(portrait.result.geometry.orientation).toBe('portrait');
      expect(landscape.result.geometry.orientation).toBe('landscape');
    }
  });

  it('updates geometry when safe-area insets change', () => {
    const a = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    const b = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 48, right: 0, bottom: 34, left: 0 }
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.key).not.toBe(b.key);
  });

  it('stores unsupported results without inventing fallback geometry', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 200,
      height: 280,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;
    expect(computed.result.supported).toBe(false);
    if (!computed.result.supported) {
      expect(['viewport_too_small', 'minimums_unsatisfied']).toContain(computed.result.reason);
      expect(computed.key.startsWith('unsupported::')).toBe(true);
    }
  });

  it('rejects non-normalizable raw input without throwing', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: Number.NaN,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(false);
  });

  it('is independent of gameplay/presentation fields (API has no such inputs)', () => {
    const base = {
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    const a = computeAuthoritativeSceneGeometry(base);
    // Synthetic presentation bag must be ignored — only RawViewportGeometry is accepted.
    const withNoise = {
      ...base,
      phase: 'waitingForBids',
      variant: 'king',
      handVisible: false,
      trumpVisible: true,
      score: 99
    } as typeof base & Record<string, unknown>;
    const b = computeAuthoritativeSceneGeometry(withNoise);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.key).toBe(b.key);
    expect(a.result).toEqual(b.result);
  });
});
