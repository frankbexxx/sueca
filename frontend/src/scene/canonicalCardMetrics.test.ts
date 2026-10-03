import { describe, expect, it } from 'vitest';
import { calculateSceneGeometry } from './calculateSceneGeometry';
import {
  computeCanonicalCardMetrics,
  resolveCanonicalHandY,
  SELECTED_LIFT_PAD
} from './canonicalCardMetrics';
import { normalizeViewport } from './normalizeViewport';
import {
  PROVISIONAL_CARD_METRICS,
  PROVISIONAL_FELT_LAYOUT,
  PROVISIONAL_LANDSCAPE_BANDS
} from './provisionalSceneGeometryConstants';
import { HUMAN_HAND_LAYOUT } from '../table/localHandLayout';
import type { SceneGeometry, ViewportGeometryInput } from './sceneGeometry';

function geometryAt(width: number, height: number): SceneGeometry {
  const normalized = normalizeViewport({
    width,
    height,
    safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  if (!normalized.ok) throw new Error(normalized.reason);
  const result = calculateSceneGeometry(normalized.input as ViewportGeometryInput);
  expect(result.supported).toBe(true);
  if (!result.supported) throw new Error(result.reason);
  return result.geometry;
}

describe('computeCanonicalCardMetrics (Step 3B / C2)', () => {
  it('uses selectedLiftPad = HUMAN_HAND_LAYOUT.selectedLift (26)', () => {
    expect(SELECTED_LIFT_PAD).toBe(26);
    expect(PROVISIONAL_CARD_METRICS.selectedLiftPad).toBe(HUMAN_HAND_LAYOUT.selectedLift);
    expect(SELECTED_LIFT_PAD).toBe(HUMAN_HAND_LAYOUT.selectedLift);
  });

  it('preserves aspect ratio and caps hand by handInteractionRect − lift', () => {
    for (const [w, h] of [
      [390, 844],
      [1024, 600],
      [1280, 800],
      [1366, 768]
    ] as const) {
      const geometry = geometryAt(w, h);
      const m = computeCanonicalCardMetrics(geometry);
      expect(m.handDisplayHeight / m.handDisplayWidth).toBeCloseTo(
        PROVISIONAL_CARD_METRICS.aspectHeightOverWidth,
        5
      );
      expect(m.cardHeight / m.cardWidth).toBeCloseTo(
        PROVISIONAL_CARD_METRICS.aspectHeightOverWidth,
        5
      );
      expect(m.trickCardHeight / m.trickCardWidth).toBeCloseTo(
        PROVISIONAL_CARD_METRICS.aspectHeightOverWidth,
        5
      );
      expect(m.handDisplayHeight).toBeLessThanOrEqual(
        geometry.handInteractionRect.height - m.selectedLiftPad + 1e-6
      );
      expect(m.handDisplayHeight).toBeGreaterThan(0);
      expect(m.trickCardWidth).toBeGreaterThan(0);
    }
  });

  it('fits the 4-card trick cross inside trickRect (current offsets)', () => {
    const fx = PROVISIONAL_CARD_METRICS.trickOffsetXFactor;
    const fy = PROVISIONAL_CARD_METRICS.trickOffsetYFactor;
    for (const [w, h] of [
      [390, 844],
      [1024, 600],
      [1280, 800],
      [1366, 768]
    ] as const) {
      const geometry = geometryAt(w, h);
      const m = computeCanonicalCardMetrics(geometry);
      const spanW = m.trickCardWidth + 2 * Math.round(m.trickCardWidth * fx);
      const spanH = m.trickCardHeight + 2 * Math.round(m.trickCardHeight * fy);
      expect(spanW).toBeLessThanOrEqual(geometry.trickRect.width + 1e-6);
      expect(spanH).toBeLessThanOrEqual(geometry.trickRect.height + 1e-6);
    }
  });

  it('is deterministic for the same geometry', () => {
    const geometry = geometryAt(1024, 600);
    expect(computeCanonicalCardMetrics(geometry)).toEqual(
      computeCanonicalCardMetrics(geometry)
    );
  });

  it('resolveCanonicalHandY keeps selected lift inside handInteractionRect', () => {
    for (const [w, h] of [
      [390, 844],
      [1024, 600],
      [1280, 800],
      [1366, 768]
    ] as const) {
      const geometry = geometryAt(w, h);
      const m = computeCanonicalCardMetrics(geometry);
      const handY = resolveCanonicalHandY(geometry, m.handDisplayHeight, m.selectedLiftPad);
      const half = m.handDisplayHeight / 2;
      const top = handY - half - m.selectedLiftPad;
      const bot = handY + half;
      expect(top).toBeGreaterThanOrEqual(geometry.handInteractionRect.y - 1e-6);
      expect(bot).toBeLessThanOrEqual(
        geometry.handInteractionRect.y + geometry.handInteractionRect.height + 1e-6
      );
    }
  });
});

describe('Step 3B landscape bands + trickSize', () => {
  it('keeps approved landscape band fractions and trickSize 0.50', () => {
    expect(PROVISIONAL_LANDSCAPE_BANDS).toEqual({
      hud: 0.2,
      felt: 0.555,
      southSeat: 0.03,
      hand: 0.16,
      actionStatus: 0.055
    });
    expect(PROVISIONAL_FELT_LAYOUT.trickSize).toBe(0.5);

    const geometry = geometryAt(1024, 600);
    const h = geometry.sceneFrame.height;
    expect(geometry.hudRect.height / h).toBeCloseTo(0.2, 5);
    expect(geometry.feltRect.height / h).toBeCloseTo(0.555, 5);
    expect(geometry.seatZones.south.height / h).toBeCloseTo(0.03, 5);
    expect(geometry.handRect.height / h).toBeCloseTo(0.16, 5);
    expect(geometry.actionStatusRect.height / h).toBeCloseTo(0.055, 5);

    const expectedTrick =
      Math.min(geometry.feltRect.width, geometry.feltRect.height) * 0.5;
    expect(geometry.trickRect.width).toBeCloseTo(expectedTrick, 5);
    expect(geometry.trickRect.height).toBeCloseTo(expectedTrick, 5);
  });
});
