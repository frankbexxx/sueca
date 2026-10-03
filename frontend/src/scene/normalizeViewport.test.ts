import { describe, expect, it } from 'vitest';
import { deriveOrientation, normalizeViewport } from './normalizeViewport';

describe('normalizeViewport', () => {
  it('normalizes finite positive dimensions and default insets', () => {
    const result = normalizeViewport({ width: 390, height: 844 });
    expect(result).toEqual({
      ok: true,
      input: {
        width: 390,
        height: 844,
        safeInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        orientation: 'portrait'
      }
    });
  });

  it('derives landscape when usable width >= usable height', () => {
    expect(deriveOrientation(844, 390)).toBe('landscape');
    const result = normalizeViewport({ width: 844, height: 390 });
    expect(result.ok && result.input.orientation).toBe('landscape');
  });

  it('derives orientation from safe-area-adjusted usable dimensions', () => {
    // Outer size is landscape, but insets leave a tall usable portrait region.
    const result = normalizeViewport({
      width: 800,
      height: 600,
      safeInsets: { top: 0, right: 500, bottom: 0, left: 0 }
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.width - result.input.safeInsets.left - result.input.safeInsets.right).toBe(
        300
      );
      expect(
        result.input.height - result.input.safeInsets.top - result.input.safeInsets.bottom
      ).toBe(600);
      expect(result.input.orientation).toBe('portrait');
    }

    // Outer portrait, insets leave a wide usable landscape region.
    const landscapeUsable = normalizeViewport({
      width: 500,
      height: 800,
      safeInsets: { top: 0, right: 0, bottom: 400, left: 0 }
    });
    expect(landscapeUsable.ok).toBe(true);
    if (landscapeUsable.ok) {
      expect(landscapeUsable.input.orientation).toBe('landscape');
    }
  });

  it('rejects non-finite and non-positive dimensions', () => {
    expect(normalizeViewport({ width: 0, height: 844 }).ok).toBe(false);
    expect(normalizeViewport({ width: -10, height: 844 }).reason).toBe('invalid_dimensions');
    expect(normalizeViewport({ width: Number.NaN, height: 844 }).reason).toBe(
      'non_finite_dimensions'
    );
    expect(normalizeViewport({ width: 390, height: Number.POSITIVE_INFINITY }).reason).toBe(
      'non_finite_dimensions'
    );
  });

  it('rejects non-finite insets with non_finite_insets', () => {
    expect(
      normalizeViewport({
        width: 390,
        height: 844,
        safeInsets: { top: Number.NaN, right: 0, bottom: 0, left: 0 }
      }).reason
    ).toBe('non_finite_insets');
    expect(
      normalizeViewport({
        width: 390,
        height: 844,
        safeInsets: { top: 0, right: Number.POSITIVE_INFINITY, bottom: 0, left: 0 }
      }).reason
    ).toBe('non_finite_insets');
  });

  it('rejects negative or non-number insets with invalid_insets', () => {
    expect(
      normalizeViewport({
        width: 390,
        height: 844,
        safeInsets: { top: -1, right: 0, bottom: 0, left: 0 }
      }).reason
    ).toBe('invalid_insets');
    expect(
      normalizeViewport({
        width: 390,
        height: 844,
        safeInsets: { top: '8' as unknown as number, right: 0, bottom: 0, left: 0 }
      }).reason
    ).toBe('invalid_insets');
  });

  it('rejects insets that consume the viewport', () => {
    expect(
      normalizeViewport({
        width: 390,
        height: 844,
        safeInsets: { top: 400, right: 0, bottom: 500, left: 0 }
      }).reason
    ).toBe('insets_exceed_viewport');
  });

  it('keeps valid mixed safe insets', () => {
    const result = normalizeViewport({
      width: 390,
      height: 844,
      safeInsets: { top: 47, right: 0, bottom: 34, left: 0 }
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.safeInsets).toEqual({ top: 47, right: 0, bottom: 34, left: 0 });
    }
  });
});
