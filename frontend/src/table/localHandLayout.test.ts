/**
 * GLOBAL-CARDS-01 — adaptive human-hand spacing helper.
 */

import { describe, expect, it } from 'vitest';
import {
  HUMAN_HAND_LAYOUT,
  computeHumanHandLayout,
  computeHumanHandSpacing,
  handExposedFraction
} from './localHandLayout';

describe('localHandLayout (GLOBAL-CARDS-01)', () => {
  const phone = {
    cardDisplayWidth: 58,
    availableWidth: 390 * 0.92,
    centerX: 195,
    baselineY: 700
  };

  it('uses tighter spacing at 13 than at 8 and 4', () => {
    const s13 = computeHumanHandSpacing({ cardCount: 13, ...phone });
    const s8 = computeHumanHandSpacing({ cardCount: 8, ...phone });
    const s4 = computeHumanHandSpacing({ cardCount: 4, ...phone });
    expect(s13.spacing).toBeLessThan(s8.spacing);
    expect(s8.spacing).toBeLessThan(s4.spacing);
    expect(s13.expose).toBeCloseTo(HUMAN_HAND_LAYOUT.exposeAt13, 2);
  });

  it('gives a single card no artificial overlap', () => {
    const s1 = computeHumanHandSpacing({ cardCount: 1, ...phone });
    expect(s1.spacing).toBe(0);
    expect(s1.expose).toBe(1);
    expect(s1.totalSpan).toBe(phone.cardDisplayWidth);
  });

  it('never exceeds available hand width', () => {
    for (const n of [13, 10, 8, 4, 2]) {
      const { totalSpan } = computeHumanHandSpacing({
        cardCount: n,
        cardDisplayWidth: phone.cardDisplayWidth,
        availableWidth: phone.availableWidth
      });
      expect(totalSpan).toBeLessThanOrEqual(phone.availableWidth + 1e-6);
    }
  });

  it('lifts only the selected card without promoting z-index', () => {
    const { slots } = computeHumanHandLayout({
      cardCount: 8,
      ...phone,
      selectedIndex: 3,
      selectedLift: HUMAN_HAND_LAYOUT.selectedLift
    });
    expect(slots).toHaveLength(8);
    const baseY = slots.filter((_, i) => i !== 3).map((s) => s.y);
    const selectedY = slots[3].y;
    expect(selectedY).toBeLessThan(Math.min(...baseY));
    expect(Math.max(...baseY) - Math.min(...baseY)).toBeLessThan(8);
    // Fan stacking by index only — selection does not jump to front.
    expect(slots[3].zIndex).toBe(4);
    expect(slots[7].zIndex).toBe(8);
    expect(slots.map((s) => s.zIndex)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('keeps rotation near-zero (no theatrical fan)', () => {
    const { slots } = computeHumanHandLayout({
      cardCount: 13,
      ...phone
    });
    const maxAbs = Math.max(...slots.map((s) => Math.abs(s.rotationDeg)));
    expect(maxAbs).toBeLessThanOrEqual(3);
  });

  it('is deterministic', () => {
    const a = computeHumanHandLayout({ cardCount: 10, ...phone });
    const b = computeHumanHandLayout({ cardCount: 10, ...phone });
    expect(a).toEqual(b);
  });

  it('expose curve is continuous and monotonic with fewer cards', () => {
    const counts = [13, 12, 10, 8, 6, 4, 2];
    for (let i = 1; i < counts.length; i++) {
      expect(handExposedFraction(counts[i])).toBeGreaterThanOrEqual(
        handExposedFraction(counts[i - 1]) - 1e-9
      );
    }
  });
});
