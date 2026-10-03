import { describe, expect, it } from 'vitest';
import { calculateSceneGeometry } from '../../scene/calculateSceneGeometry';
import { normalizeViewport } from '../../scene/normalizeViewport';
import type { SceneGeometry } from '../../scene/sceneGeometry';
import { buildCanonicalPhaserLayout } from './buildCanonicalPhaserLayout';
import { layoutLocalHandPositions, layoutTrickSlot } from './phaserTableLayout';

function geometryAt(width: number, height: number): SceneGeometry {
  const normalized = normalizeViewport({
    width,
    height,
    safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  if (!normalized.ok) throw new Error(normalized.reason);
  const result = calculateSceneGeometry(normalized.input);
  expect(result.supported).toBe(true);
  if (!result.supported) throw new Error(result.reason);
  return result.geometry;
}

describe('buildCanonicalPhaserLayout (Step 3B)', () => {
  const shells = [
    [390, 844],
    [1024, 600],
    [1280, 800],
    [1366, 768]
  ] as const;

  it('maps felt/seats/trick/hand from SceneGeometry (no bottomChrome)', () => {
    for (const [w, h] of shells) {
      const geometry = geometryAt(w, h);
      const layout = buildCanonicalPhaserLayout(geometry);
      expect(layout.bottomChromePx).toBe(0);
      expect(layout.width).toBeCloseTo(geometry.sceneFrame.width, 5);
      expect(layout.height).toBeCloseTo(geometry.sceneFrame.height, 5);
      expect(layout.zones.felt).toMatchObject({
        x: geometry.feltRect.x,
        y: geometry.feltRect.y,
        width: geometry.feltRect.width,
        height: geometry.feltRect.height
      });
      expect(layout.zones.trick).toMatchObject({
        x: geometry.trickRect.x,
        y: geometry.trickRect.y,
        width: geometry.trickRect.width,
        height: geometry.trickRect.height
      });
      expect(layout.zones.hand).toMatchObject({
        x: geometry.handRect.x,
        y: geometry.handRect.y,
        width: geometry.handRect.width,
        height: geometry.handRect.height
      });
      expect(layout.center.x).toBeCloseTo(geometry.trickCenter.x, 5);
      expect(layout.center.y).toBeCloseTo(geometry.trickCenter.y, 5);
      expect(layout.seatAnchor.north.x).toBeCloseTo(geometry.seatAnchors.north.x, 5);
      expect(layout.seatAnchor.south.y).toBeCloseTo(geometry.seatAnchors.south.y, 5);
      expect(layout.handY).toBeGreaterThan(geometry.handRect.y);
      expect(layout.handY).toBeLessThan(
        geometry.handRect.y + geometry.handRect.height + geometry.handRect.height * 0.2
      );
    }
  });

  it('keeps local hand slots inside handInteractionRect vertically (with lift pad)', () => {
    for (const [w, h] of shells) {
      const geometry = geometryAt(w, h);
      const layout = buildCanonicalPhaserLayout(geometry);
      const slots = layoutLocalHandPositions(10, layout);
      const half = layout.cardHeight * 1.22 * 0.5;
      const lift = 26;
      // Arc lowers edge cards slightly; allow 1px + small arc slack.
      const arcSlack = 8;
      for (const slot of slots) {
        expect(slot.y - half - lift).toBeGreaterThanOrEqual(
          geometry.handInteractionRect.y - 1
        );
        expect(slot.y + half).toBeLessThanOrEqual(
          geometry.handInteractionRect.y +
            geometry.handInteractionRect.height +
            arcSlack
        );
      }
    }
  });

  it('keeps trick slot card centers’ cross inside trickRect', () => {
    for (const [w, h] of shells) {
      const geometry = geometryAt(w, h);
      const layout = buildCanonicalPhaserLayout(geometry);
      const halfW = layout.trickCardWidth / 2;
      const halfH = layout.trickCardHeight / 2;
      for (const compass of ['north', 'east', 'south', 'west'] as const) {
        const p = layoutTrickSlot(compass, layout);
        expect(p.x - halfW).toBeGreaterThanOrEqual(geometry.trickRect.x - 1e-6);
        expect(p.x + halfW).toBeLessThanOrEqual(
          geometry.trickRect.x + geometry.trickRect.width + 1e-6
        );
        expect(p.y - halfH).toBeGreaterThanOrEqual(geometry.trickRect.y - 1e-6);
        expect(p.y + halfH).toBeLessThanOrEqual(
          geometry.trickRect.y + geometry.trickRect.height + 1e-6
        );
      }
    }
  });
});
