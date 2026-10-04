/**
 * Product geometry lock for Sueca portrait V3 @ 390×844.
 */
import { describe, expect, it } from 'vitest';
import { calculateSceneGeometry } from './calculateSceneGeometry';
import { computeCanonicalCardMetrics } from './canonicalCardMetrics';
import { normalizeViewport } from './normalizeViewport';
import { SUECA_PORTRAIT_V3_REF } from './provisionalSceneGeometryConstants';
import { rectsIntersect } from './calculateSceneGeometry';
import type { Rect } from './sceneGeometry';

function portrait390() {
  const n = normalizeViewport({
    width: 390,
    height: 844,
    safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  if (!n.ok) throw new Error(n.reason);
  return n.input;
}

function expectRect(actual: Rect, target: { x: number; y: number; w: number; h: number }) {
  expect(actual.x).toBeCloseTo(target.x, 5);
  expect(actual.y).toBeCloseTo(target.y, 5);
  expect(actual.width).toBeCloseTo(target.w, 5);
  expect(actual.height).toBeCloseTo(target.h, 5);
}

describe('Sueca portrait V3 product geometry', () => {
  it('matches approved V3 rects at 390×844', () => {
    const result = calculateSceneGeometry(portrait390(), 'suecaPortraitV3');
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    const g = result.geometry;
    expect(g.layoutProfile).toBe('suecaPortraitV3');
    const r = SUECA_PORTRAIT_V3_REF;
    expectRect(g.hudRect, r.hud);
    expectRect(g.feltRect, r.felt);
    expectRect(g.seatZones.north, r.north);
    expectRect(g.seatZones.west, r.west);
    expectRect(g.seatZones.east, r.east);
    expectRect(g.seatZones.south, r.south);
    expectRect(g.trickRect, r.trick);
    expectRect(g.handRect, r.hand);
    expectRect(g.actionStatusRect, r.action);
    expect(g.statusPlaqueRect).not.toBeNull();
    if (g.statusPlaqueRect) expectRect(g.statusPlaqueRect, r.statusPlaque);
    expectRect(g.decisionRect, r.decision);
    expectRect(g.decisionSheetRect, r.sheet);
  });

  it('hand overlaps felt ~40px and south→hand gap ~6px', () => {
    const result = calculateSceneGeometry(portrait390(), 'suecaPortraitV3');
    if (!result.supported) throw new Error('unsupported');
    const g = result.geometry;
    const overlap = g.feltRect.y + g.feltRect.height - g.handRect.y;
    expect(overlap).toBeCloseTo(40, 5);
    const gap = g.handRect.y - (g.seatZones.south.y + g.seatZones.south.height);
    expect(gap).toBeCloseTo(6, 5);
  });

  it('W/E do not collide with trick; 4-card cross fits with margin', () => {
    const result = calculateSceneGeometry(portrait390(), 'suecaPortraitV3');
    if (!result.supported) throw new Error('unsupported');
    const g = result.geometry;
    expect(rectsIntersect(g.seatZones.west, g.trickRect)).toBe(false);
    expect(rectsIntersect(g.seatZones.east, g.trickRect)).toBe(false);
    const m = computeCanonicalCardMetrics(g);
    const dx = Math.round(m.trickCardWidth * 0.8);
    const dy = Math.round(m.trickCardHeight * 0.55);
    const needW = m.trickCardWidth + 2 * dx;
    const needH = m.trickCardHeight + 2 * dy;
    expect(needW).toBeLessThanOrEqual(g.trickRect.width + 1e-6);
    expect(needH).toBeLessThanOrEqual(g.trickRect.height + 1e-6);
    expect((g.trickRect.width - needW) / 2).toBeGreaterThanOrEqual(10);
    expect((g.trickRect.height - needH) / 2).toBeGreaterThanOrEqual(10);
  });

  it('local hand + lift fit hand interaction; lift is 18', () => {
    const result = calculateSceneGeometry(portrait390(), 'suecaPortraitV3');
    if (!result.supported) throw new Error('unsupported');
    const g = result.geometry;
    const m = computeCanonicalCardMetrics(g);
    expect(m.selectedLiftPad).toBe(18);
    expect(m.handDisplayWidth).toBeGreaterThan(60);
    expect(m.handDisplayWidth).toBeLessThan(64);
    expect(m.handDisplayHeight).toBeGreaterThan(85);
    expect(m.handDisplayHeight).toBeLessThan(88);
    const liftRoom = g.handInteractionRect.height - m.handDisplayHeight - m.selectedLiftPad;
    expect(liftRoom).toBeGreaterThanOrEqual(18);
  });

  it('requested V3 on landscape falls back to default zones', () => {
    const n = normalizeViewport({
      width: 1024,
      height: 600,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    if (!n.ok) throw new Error(n.reason);
    const v3 = calculateSceneGeometry(n.input, 'suecaPortraitV3');
    const def = calculateSceneGeometry(n.input, 'default');
    expect(v3.supported).toBe(true);
    expect(def.supported).toBe(true);
    if (!v3.supported || !def.supported) return;
    expect(v3.geometry.layoutProfile).toBe('default');
    expect(v3.geometry.hudRect).toEqual(def.geometry.hudRect);
    expect(v3.geometry.feltRect).toEqual(def.geometry.feltRect);
    expect(v3.geometry.trickRect).toEqual(def.geometry.trickRect);
    expect(v3.geometry.geometryKey).toBe(def.geometry.geometryKey);
  });
});

describe('DEFAULT geometry freeze (non-Sueca path)', () => {
  it('390×844 default zones match pre-V3 provisional bands', () => {
    const result = calculateSceneGeometry(portrait390(), 'default');
    expect(result.supported).toBe(true);
    if (!result.supported) return;
    const g = result.geometry;
    expect(g.layoutProfile).toBe('default');
    expect(g.statusPlaqueRect).toBeNull();
    expect(g.geometryKey.startsWith('v1::')).toBe(true);
    expect(g.geometryKey.includes('suecaPortraitV3')).toBe(false);
    expect(g.hudRect.height).toBeCloseTo(118.16, 5);
    expect(g.feltRect.x).toBe(0);
    expect(g.feltRect.width).toBe(390);
    expect(g.feltRect.y).toBeCloseTo(118.16, 5);
    expect(g.feltRect.height).toBeCloseTo(388.24, 5);
    expect(g.handRect.y).toBeCloseTo(590.8, 5);
    expect(g.handRect.height).toBeCloseTo(168.8, 5);
    expect(g.actionStatusRect.y).toBeCloseTo(759.6, 5);
    expect(g.actionStatusRect.height).toBeCloseTo(84.4, 5);
    expect(g.trickRect.width).toBeCloseTo(194.12, 5);
    expect(g.trickRect.height).toBeCloseTo(g.trickRect.width, 5);
  });

  it('omitted layoutProfile equals explicit default', () => {
    const a = calculateSceneGeometry(portrait390());
    const b = calculateSceneGeometry(portrait390(), 'default');
    expect(a.supported && b.supported).toBe(true);
    if (!a.supported || !b.supported) return;
    expect(a.geometry.geometryKey).toBe(b.geometry.geometryKey);
    expect(a.geometry.hudRect).toEqual(b.geometry.hudRect);
    expect(a.geometry.feltRect).toEqual(b.geometry.feltRect);
    expect(a.geometry.seatZones).toEqual(b.geometry.seatZones);
    expect(a.geometry.trickRect).toEqual(b.geometry.trickRect);
    expect(a.geometry.handRect).toEqual(b.geometry.handRect);
    expect(a.geometry.decisionSheetRect).toEqual(b.geometry.decisionSheetRect);
  });
});
