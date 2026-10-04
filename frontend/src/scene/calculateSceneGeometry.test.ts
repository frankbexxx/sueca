import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateSceneGeometry,
  rectContains,
  rectsIntersect
} from './calculateSceneGeometry';
import {
  areSceneGeometriesEqual,
  sceneGeometryKey,
  viewportGeometryKey
} from './sceneGeometryEquality';
import { normalizeViewport } from './normalizeViewport';
import type { ViewportGeometryInput } from './sceneGeometry';
import {
  PROVISIONAL_DESIGN_FRAMES,
  PROVISIONAL_GEOMETRY_MINIMUMS,
  PROVISIONAL_PROFILE_CONTINUITY,
  PROVISIONAL_PROFILE_THRESHOLDS,
  PROVISIONAL_UNSUPPORTED_LIMITS
} from './provisionalSceneGeometryConstants';

function input(
  width: number,
  height: number,
  insets: Partial<ViewportGeometryInput['safeInsets']> = {}
): ViewportGeometryInput {
  const normalized = normalizeViewport({
    width,
    height,
    safeInsets: {
      top: insets.top ?? 0,
      right: insets.right ?? 0,
      bottom: insets.bottom ?? 0,
      left: insets.left ?? 0
    }
  });
  if (!normalized.ok) throw new Error(`expected valid viewport: ${normalized.reason}`);
  return normalized.input;
}

function supported(width: number, height: number, insets?: Partial<ViewportGeometryInput['safeInsets']>) {
  const result = calculateSceneGeometry(input(width, height, insets));
  expect(result.supported).toBe(true);
  if (!result.supported) throw new Error(result.reason);
  return result.geometry;
}

describe('calculateSceneGeometry', () => {
  describe('determinism', () => {
    it('returns deeply equal geometry for the same normalized input', () => {
      const viewport = input(390, 844);
      const a = calculateSceneGeometry(viewport);
      const b = calculateSceneGeometry(viewport);
      expect(a).toEqual(b);
      expect(a.supported && b.supported).toBe(true);
      if (a.supported && b.supported) {
        expect(areSceneGeometriesEqual(a.geometry, b.geometry)).toBe(true);
        expect(sceneGeometryKey(a.geometry)).toBe(sceneGeometryKey(b.geometry));
      }
    });

    it('is stable across repeated calls', () => {
      const viewport = input(1024, 600);
      const keys = Array.from({ length: 5 }, () => {
        const result = calculateSceneGeometry(viewport);
        expect(result.supported).toBe(true);
        return result.supported ? result.geometry.geometryKey : '';
      });
      expect(new Set(keys).size).toBe(1);
    });
  });

  describe('orientation and profiles', () => {
    it('selects portrait standard / compact with shared provisional design frame', () => {
      const standard = supported(390, 844);
      expect(standard.orientation).toBe('portrait');
      expect(standard.profile).toBe('portraitStandard');
      expect(standard.designFrame).toEqual(PROVISIONAL_DESIGN_FRAMES.portraitStandard);

      const compact = supported(360, 640);
      expect(compact.profile).toBe('portraitCompact');
      expect(compact.designFrame).toEqual(PROVISIONAL_DESIGN_FRAMES.portraitCompact);
      expect(compact.designFrame).toEqual(standard.designFrame);
    });

    it('selects landscape standard for tablet shells; phone-landscape is unsupported', () => {
      const standard = supported(1024, 600);
      expect(standard.orientation).toBe('landscape');
      expect(standard.profile).toBe('landscapeStandard');
      expect(standard.designFrame).toEqual(PROVISIONAL_DESIGN_FRAMES.landscapeStandard);

      // Tablet gate: W≥1024 ∧ H≥600 — compact phone-landscape cannot be supported.
      const phone = calculateSceneGeometry(input(720, 400));
      expect(phone.supported).toBe(false);
      if (!phone.supported) {
        expect(phone.reason).toBe('viewport_too_small');
      }
      // Design-frame identity for compact remains shared (profile label still defined).
      expect(PROVISIONAL_DESIGN_FRAMES.landscapeCompact).toEqual(
        PROVISIONAL_DESIGN_FRAMES.landscapeStandard
      );
    });

    it('uses uniform scale with no independent X/Y stretch', () => {
      const geometry = supported(390, 844);
      expect(geometry.sceneFrame.width / geometry.designFrame.width).toBeCloseTo(
        geometry.sceneScale,
        6
      );
      expect(geometry.sceneFrame.height / geometry.designFrame.height).toBeCloseTo(
        geometry.sceneScale,
        6
      );
    });

    it('uses the same usable geometry basis for orientation and profile', () => {
      // Outer landscape; usable portrait → portrait compact profile.
      const geometry = supported(900, 650, { right: 550 });
      expect(geometry.orientation).toBe('portrait');
      expect(geometry.safeRect.width).toBe(350);
      expect(geometry.safeRect.height).toBe(650);
      expect(geometry.profile).toBe('portraitCompact');
    });
  });

  describe('profile threshold continuity', () => {
    const bound = PROVISIONAL_PROFILE_CONTINUITY;

    function assertAdjacentContinuity(
      a: { width: number; height: number },
      b: { width: number; height: number }
    ) {
      const ga = supported(a.width, a.height);
      const gb = supported(b.width, b.height);
      const viewportDelta =
        Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
      expect(viewportDelta).toBe(1);

      const edgeDelta = Math.max(
        Math.abs(ga.sceneFrame.width - gb.sceneFrame.width),
        Math.abs(ga.sceneFrame.height - gb.sceneFrame.height),
        Math.abs(ga.sceneFrame.x - gb.sceneFrame.x),
        Math.abs(ga.sceneFrame.y - gb.sceneFrame.y)
      );
      expect(edgeDelta).toBeLessThanOrEqual(bound.maxSceneEdgeDeltaPxPerViewportPx * viewportDelta);

      const scaleDenom = Math.max(ga.sceneScale, gb.sceneScale, 1e-9);
      const scaleRel = Math.abs(ga.sceneScale - gb.sceneScale) / scaleDenom;
      expect(scaleRel).toBeLessThanOrEqual(bound.maxSceneScaleRelativeDelta);
    }

    it('bounds sceneFrame/scale across portrait compact max width ±1px', () => {
      const w = PROVISIONAL_PROFILE_THRESHOLDS.portraitCompactMaxWidth;
      const height = 844;
      const below = supported(w, height);
      const above = supported(w + 1, height);
      expect(below.profile).toBe('portraitCompact');
      expect(above.profile).toBe('portraitStandard');
      assertAdjacentContinuity({ width: w, height }, { width: w + 1, height });
    });

    it('bounds sceneFrame/scale across portrait compact max height ±1px', () => {
      const h = PROVISIONAL_PROFILE_THRESHOLDS.portraitCompactMaxHeight;
      const width = 390;
      const below = supported(width, h);
      const above = supported(width, h + 1);
      expect(below.profile).toBe('portraitCompact');
      expect(above.profile).toBe('portraitStandard');
      assertAdjacentContinuity({ width, height: h }, { width, height: h + 1 });
    });

    it('landscapeCompact profile is unreachable under tablet landscape gate', () => {
      // Compact thresholds sit below PROVISIONAL_LANDSCAPE_MIN_SHELL (1024×600).
      const w = PROVISIONAL_PROFILE_THRESHOLDS.landscapeCompactMaxWidth;
      const h = PROVISIONAL_PROFILE_THRESHOLDS.landscapeCompactMaxHeight;
      expect(calculateSceneGeometry(input(w, 600)).supported).toBe(false);
      expect(calculateSceneGeometry(input(1024, h)).supported).toBe(false);
      expect(supported(1024, 600).profile).toBe('landscapeStandard');
      expect(supported(1280, 800).profile).toBe('landscapeStandard');
      expect(supported(1366, 768).profile).toBe('landscapeStandard');
    });
  });

  describe('geometry key contract', () => {
    it('maps identical normalized input to the same key', () => {
      const a = input(390, 844, { top: 12.5, left: 3 });
      const b = input(390, 844, { top: 12.5, left: 3 });
      expect(viewportGeometryKey(a)).toBe(viewportGeometryKey(b));
      const ga = calculateSceneGeometry(a);
      const gb = calculateSceneGeometry(b);
      expect(ga.supported && gb.supported).toBe(true);
      if (ga.supported && gb.supported) {
        expect(ga.geometry.geometryKey).toBe(gb.geometry.geometryKey);
      }
    });

    it('maps distinct calculated geometries to distinct keys', () => {
      const cases = [
        input(390, 844),
        input(391, 844),
        input(390, 845),
        input(390, 844, { top: 1 }),
        input(390, 844, { left: 0.001 }),
        input(1024, 600)
      ];
      const keys = new Set<string>();
      const frames: string[] = [];
      for (const viewport of cases) {
        const result = calculateSceneGeometry(viewport);
        expect(result.supported).toBe(true);
        if (!result.supported) continue;
        keys.add(result.geometry.geometryKey);
        frames.push(
          [
            result.geometry.sceneFrame.x,
            result.geometry.sceneFrame.y,
            result.geometry.sceneFrame.width,
            result.geometry.sceneFrame.height,
            result.geometry.sceneScale,
            result.geometry.profile
          ].join('|')
        );
      }
      expect(keys.size).toBe(cases.length);
      expect(new Set(frames).size).toBe(cases.length);
    });

    it('does not merge nearby float inputs that remain distinct', () => {
      const a = input(390, 844, { top: 1.0001 });
      const b = input(390, 844, { top: 1.0002 });
      expect(viewportGeometryKey(a)).not.toBe(viewportGeometryKey(b));
      const ga = calculateSceneGeometry(a);
      const gb = calculateSceneGeometry(b);
      expect(ga.supported && gb.supported).toBe(true);
      if (ga.supported && gb.supported) {
        expect(ga.geometry.geometryKey).not.toBe(gb.geometry.geometryKey);
        expect(ga.geometry.safeRect.y).not.toBe(gb.geometry.safeRect.y);
      }
    });
  });

  describe('minimums enforcement', () => {
    const m = PROVISIONAL_GEOMETRY_MINIMUMS;
    const limits = PROVISIONAL_UNSUPPORTED_LIMITS;

    it('exposes only zone-level enforced minimum fields', () => {
      const geometry = supported(390, 844);
      expect(geometry.minimums).toEqual(m);
      expect(Object.keys(geometry.minimums).sort()).toEqual(
        [
          'minDecisionToHandGapPx',
          'minDecisionZonePx',
          'minExclusionLabelHeightPx',
          'minExclusionLabelWidthPx',
          'minHandZoneHeightPx'
        ].sort()
      );
    });

    it('satisfies every retained minimum on supported geometry', () => {
      for (const geometry of [supported(390, 844), supported(1024, 600), supported(360, 640)]) {
        expect(geometry.sceneFrame.width).toBeGreaterThanOrEqual(limits.minSceneWidthPx);
        expect(geometry.sceneFrame.height).toBeGreaterThanOrEqual(limits.minSceneHeightPx);
        expect(geometry.sceneScale).toBeGreaterThanOrEqual(limits.minSceneScale);
        expect(geometry.decisionRect.width).toBeGreaterThanOrEqual(m.minDecisionZonePx);
        expect(geometry.decisionRect.height).toBeGreaterThanOrEqual(m.minDecisionZonePx);
        expect(geometry.handRect.height).toBeGreaterThanOrEqual(m.minHandZoneHeightPx);
        for (const label of [
          geometry.seatLabelRects.north,
          geometry.seatLabelRects.west,
          geometry.seatLabelRects.east
        ]) {
          expect(label.width).toBeGreaterThanOrEqual(m.minExclusionLabelWidthPx);
          expect(label.height).toBeGreaterThanOrEqual(m.minExclusionLabelHeightPx);
        }
        const gap =
          geometry.handRect.y - (geometry.decisionRect.y + geometry.decisionRect.height);
        expect(gap).toBeGreaterThanOrEqual(m.minDecisionToHandGapPx);
      }
    });
  });

  describe('minimum boundary unsupported reasons', () => {
    const m = PROVISIONAL_GEOMETRY_MINIMUMS;
    const limits = PROVISIONAL_UNSUPPORTED_LIMITS;

    /**
     * Zone floors are fractional in scene size. With current provisional bands,
     * once scene width/height/scale floors pass, zone floors usually pass too.
     * Where a viewport cannot isolate one zone check, we temporarily raise only
     * that threshold (restored in finally) to prove it alone yields supported:false.
     */
    function withRaisedMinimum<K extends keyof typeof PROVISIONAL_GEOMETRY_MINIMUMS>(
      key: K,
      value: number,
      run: () => void
    ) {
      const target = PROVISIONAL_GEOMETRY_MINIMUMS as {
        -readonly [P in keyof typeof PROVISIONAL_GEOMETRY_MINIMUMS]: number;
      };
      const previous = target[key];
      target[key] = value;
      try {
        run();
      } finally {
        target[key] = previous;
      }
    }

    function withRaisedSceneLimit<K extends keyof typeof PROVISIONAL_UNSUPPORTED_LIMITS>(
      key: K,
      value: number,
      run: () => void
    ) {
      const target = PROVISIONAL_UNSUPPORTED_LIMITS as {
        -readonly [P in keyof typeof PROVISIONAL_UNSUPPORTED_LIMITS]: number;
      };
      const previous = target[key];
      target[key] = value;
      try {
        run();
      } finally {
        target[key] = previous;
      }
    }

    it('minSceneScale: below → viewport_too_small; at/above scale may still fail later floors', () => {
      const designH = PROVISIONAL_DESIGN_FRAMES.portraitStandard.height;
      // Keep width < height so orientation stays portrait (390×378 is landscape).
      const portraitW = 360;
      const belowH = Math.floor(designH * limits.minSceneScale) - 1;
      expect(portraitW).toBeLessThan(belowH);
      const below = calculateSceneGeometry(input(portraitW, belowH));
      expect(below.supported).toBe(false);
      if (!below.supported) {
        expect(below.reason).toBe('viewport_too_small');
      }

      // Scale just clears the floor, but portrait scene width is still below minSceneWidthPx.
      // Precedence: scale check passed → minimums_unsatisfied (scene width).
      const aboveH = Math.ceil(designH * limits.minSceneScale);
      expect(portraitW).toBeLessThan(aboveH);
      const aboveScale = calculateSceneGeometry(input(portraitW, aboveH));
      expect(aboveScale.supported).toBe(false);
      if (!aboveScale.supported) {
        expect(aboveScale.reason).toBe('minimums_unsatisfied');
      }

      // Valid boundary for scale among a fully supported viewport.
      const ok = calculateSceneGeometry(input(390, 844));
      expect(ok.supported).toBe(true);
      if (ok.supported) {
        expect(ok.geometry.sceneScale).toBeGreaterThanOrEqual(limits.minSceneScale);
      }
    });

    it('minSceneWidthPx: portrait mid-scale isolates width floor → minimums_unsatisfied', () => {
      // scale ∈ [minSceneScale, minSceneWidth/designW): width fails after scale passes.
      const below = calculateSceneGeometry(input(220, 500));
      expect(below.supported).toBe(false);
      if (!below.supported) {
        expect(below.reason).toBe('minimums_unsatisfied');
      }

      const ok = calculateSceneGeometry(input(390, 844));
      expect(ok.supported).toBe(true);
      if (ok.supported) {
        expect(ok.geometry.sceneFrame.width).toBeGreaterThanOrEqual(limits.minSceneWidthPx);
      }
    });

    it('minSceneHeightPx: shadowed by minSceneScale / landscape tablet gate', () => {
      // Portrait: sceneH = height when height-bound, but minSceneScale (0.45)
      // requires height ≥ 0.45*844 ≈ 380 before sceneH can approach 320.
      const belowScale = calculateSceneGeometry(input(390, limits.minSceneHeightPx));
      expect(belowScale.supported).toBe(false);
      if (!belowScale.supported) {
        expect(belowScale.reason).toBe('viewport_too_small');
      }

      // Landscape tablet gate forbids the old phone-landscape mid-scale path
      // that previously isolated minSceneHeightPx at 844×320.
      const phoneLandscapeFloor = calculateSceneGeometry(
        input(844, limits.minSceneHeightPx)
      );
      expect(phoneLandscapeFloor.supported).toBe(false);
      if (!phoneLandscapeFloor.supported) {
        expect(phoneLandscapeFloor.reason).toBe('viewport_too_small');
      }

      // Supported portrait still clears the height floor.
      const ok = supported(390, 844);
      expect(ok.sceneFrame.height).toBeGreaterThanOrEqual(limits.minSceneHeightPx);
    });

    it('landscape tablet gate: phone shells are viewport_too_small', () => {
      for (const [w, h] of [
        [844, 390],
        [915, 412],
        [700, 320],
        [1024, 500],
        [900, 600]
      ] as const) {
        const result = calculateSceneGeometry(input(w, h));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('viewport_too_small');
        }
      }
      expect(calculateSceneGeometry(input(1024, 600)).supported).toBe(true);
    });

    it('minHandZoneHeightPx: raised threshold alone → minimums_unsatisfied', () => {
      // Not independently reachable via viewport with current bands + sceneH floor.
      withRaisedMinimum('minHandZoneHeightPx', 10_000, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
      expect(calculateSceneGeometry(input(390, 844)).supported).toBe(true);
    });

    it('minDecisionZonePx: raised threshold alone → minimums_unsatisfied', () => {
      withRaisedMinimum('minDecisionZonePx', 10_000, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
      expect(calculateSceneGeometry(input(390, 844)).supported).toBe(true);
    });

    it('minExclusionLabelWidthPx: raised threshold alone → minimums_unsatisfied', () => {
      withRaisedMinimum('minExclusionLabelWidthPx', 10_000, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
      expect(calculateSceneGeometry(input(390, 844)).supported).toBe(true);
    });

    it('minExclusionLabelHeightPx: raised threshold alone → minimums_unsatisfied', () => {
      withRaisedMinimum('minExclusionLabelHeightPx', 10_000, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
      expect(calculateSceneGeometry(input(390, 844)).supported).toBe(true);
    });

    it('minDecisionToHandGapPx: raised threshold alone → minimums_unsatisfied', () => {
      withRaisedMinimum('minDecisionToHandGapPx', 10_000, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
      expect(calculateSceneGeometry(input(390, 844)).supported).toBe(true);
    });

    it('documents scene-width precedence over a simultaneously failing raised hand floor', () => {
      // Viewport fails scene width; even with a raised hand floor, reason stays minimums_unsatisfied
      // (no more-specific public reason). Scale has already passed.
      withRaisedMinimum('minHandZoneHeightPx', 10_000, () => {
        const result = calculateSceneGeometry(input(220, 500));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
    });

    it('minSceneScale takes precedence over zone minimums (viewport_too_small first)', () => {
      withRaisedMinimum('minHandZoneHeightPx', 10_000, () => {
        const designH = PROVISIONAL_DESIGN_FRAMES.portraitStandard.height;
        const belowH = Math.floor(designH * limits.minSceneScale) - 1;
        const result = calculateSceneGeometry(input(360, belowH));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('viewport_too_small');
        }
      });
    });

    // Keep a direct scene-limit raise path so width/height/scale each have an
    // independent "this field alone flips supported" proof via the public API.
    it('minSceneWidthPx raised alone on a valid viewport → minimums_unsatisfied', () => {
      withRaisedSceneLimit('minSceneWidthPx', 10_000, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
    });

    it('minSceneHeightPx raised alone on a valid viewport → minimums_unsatisfied', () => {
      withRaisedSceneLimit('minSceneHeightPx', 10_000, () => {
        const result = calculateSceneGeometry(input(1024, 600));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('minimums_unsatisfied');
        }
      });
    });

    it('minSceneScale raised alone on a valid viewport → viewport_too_small', () => {
      withRaisedSceneLimit('minSceneScale', 10, () => {
        const result = calculateSceneGeometry(input(390, 844));
        expect(result.supported).toBe(false);
        if (!result.supported) {
          expect(result.reason).toBe('viewport_too_small');
        }
      });
    });

    it('baseline valid viewport remains supported after boundary helpers restore thresholds', () => {
      expect(m.minHandZoneHeightPx).toBeLessThan(10_000);
      expect(limits.minSceneWidthPx).toBeLessThan(10_000);
      expect(calculateSceneGeometry(input(390, 844)).supported).toBe(true);
      expect(calculateSceneGeometry(input(1024, 600)).supported).toBe(true);
    });
  });

  describe('safe areas', () => {
    it.each([
      [{ top: 48 }, 'top'],
      [{ bottom: 34 }, 'bottom'],
      [{ left: 16 }, 'left'],
      [{ right: 16 }, 'right'],
      [{ top: 44, bottom: 28, left: 8, right: 8 }, 'mixed']
    ] as const)('keeps sceneFrame inside the safe rect for %s inset', (insets) => {
      const geometry = supported(390, 844, insets);
      expect(rectContains(geometry.safeRect, geometry.sceneFrame)).toBe(true);
      expect(geometry.sceneFrame.x).toBeGreaterThanOrEqual(geometry.safeRect.x - 1e-6);
      expect(geometry.sceneFrame.y).toBeGreaterThanOrEqual(geometry.safeRect.y - 1e-6);
    });
  });

  describe('bounds and invariants', () => {
    it('keeps fixed zones valid on portrait and landscape', () => {
      for (const geometry of [supported(390, 844), supported(1024, 600)]) {
        const local = {
          x: 0,
          y: 0,
          width: geometry.sceneFrame.width,
          height: geometry.sceneFrame.height
        };
        expect(geometry.sceneFrame.width).toBeGreaterThan(0);
        expect(geometry.safeRect.width).toBeGreaterThan(0);
        expect(rectContains(local, geometry.feltRect)).toBe(true);
        expect(rectContains(geometry.feltRect, geometry.trickRect)).toBe(true);
        expect(rectContains(local, geometry.handRect)).toBe(true);
        expect(rectContains(local, geometry.hudRect)).toBe(true);
        expect(rectContains(local, geometry.actionStatusRect)).toBe(true);
        expect(rectContains(geometry.feltRect, geometry.decisionRect)).toBe(true);
        expect(rectContains(local, geometry.decisionSheetRect)).toBe(true);
        expect(geometry.decisionSheetRect.x).toBe(0);
        expect(geometry.decisionSheetRect.y).toBeCloseTo(
          geometry.hudRect.y + geometry.hudRect.height,
          5
        );
        expect(geometry.decisionSheetRect.width).toBeCloseTo(geometry.sceneFrame.width, 5);
        expect(geometry.decisionSheetRect.height).toBeCloseTo(
          geometry.handInteractionRect.y -
            (geometry.hudRect.y + geometry.hudRect.height),
          5
        );
        expect(rectsIntersect(geometry.decisionSheetRect, geometry.hudRect)).toBe(false);
        expect(
          rectsIntersect(geometry.decisionSheetRect, geometry.handInteractionRect)
        ).toBe(false);
        expect(rectContains(local, geometry.seatZones.north)).toBe(true);
        expect(rectContains(local, geometry.seatZones.west)).toBe(true);
        expect(rectContains(local, geometry.seatZones.east)).toBe(true);
        expect(rectContains(local, geometry.seatZones.south)).toBe(true);
        expect(rectsIntersect(geometry.decisionRect, geometry.seatExclusionRects.north)).toBe(
          false
        );
        expect(rectsIntersect(geometry.decisionRect, geometry.seatExclusionRects.west)).toBe(
          false
        );
        expect(rectsIntersect(geometry.decisionRect, geometry.seatExclusionRects.east)).toBe(
          false
        );
        expect(rectsIntersect(geometry.decisionRect, geometry.handRect)).toBe(false);
        expect(geometry.overlaySafeRect).toEqual(geometry.feltRect);
        expect(geometry.fullSceneModalRect).toEqual(local);
        expect(geometry.overlayExclusions.hand).toEqual(geometry.handRect);
        expect(geometry.hudRect.x).toBe(0);
        expect(geometry.hudRect.y).toBe(0);
      }
    });

    it('keeps decision inside felt and below the trick band', () => {
      const geometry = supported(390, 844);
      expect(geometry.decisionRect.y).toBeGreaterThanOrEqual(
        geometry.trickRect.y + geometry.trickRect.height - 1e-6
      );
      expect(
        geometry.decisionRect.y + geometry.decisionRect.height
      ).toBeLessThanOrEqual(geometry.feltRect.y + geometry.feltRect.height + 1e-6);
    });
  });

  describe('unsupported / invalid path', () => {
    it('returns supported:false for a valid but too-small viewport', () => {
      const result = calculateSceneGeometry(input(200, 280));
      expect(result.supported).toBe(false);
      if (!result.supported) {
        expect(['viewport_too_small', 'minimums_unsatisfied']).toContain(result.reason);
        expect(result.input.width).toBe(200);
      }
    });

    it('rejects invalid inputs at normalize time, not via geometry throw', () => {
      expect(normalizeViewport({ width: 0, height: 100 }).ok).toBe(false);
      expect(normalizeViewport({ width: Number.NaN, height: 100 }).ok).toBe(false);
      expect(
        normalizeViewport({
          width: 100,
          height: 100,
          safeInsets: { top: 80, right: 0, bottom: 80, left: 0 }
        }).ok
      ).toBe(false);
    });
  });

  describe('runtime module dependency contract', () => {
    const sceneDir = dirname(fileURLToPath(import.meta.url));
    const runtimeFiles = readdirSync(sceneDir).filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.test.ts')
    );

    const forbiddenImport = /from\s+['"](react|react-dom|phaser|phaser-.*)['"]/;
    const forbiddenPath = /from\s+['"][^'"]*(GameState|festaPhase|phaserPremiumLayout|phaserTableLayout|tableLayout|localHandLayout|gameVariant)[^'"]*['"]/;
    const forbiddenDom = /\b(window|document|localStorage|ResizeObserver|getBoundingClientRect)\b/;

    it('keeps scene runtime modules free of React/Phaser/GameState/legacy layout/DOM', () => {
      expect(runtimeFiles.length).toBeGreaterThan(0);
      for (const file of runtimeFiles) {
        const source = readFileSync(join(sceneDir, file), 'utf8');
        expect(source, file).not.toMatch(forbiddenImport);
        expect(source, file).not.toMatch(forbiddenPath);
        // Allow the word only inside comments that forbid DOM — strip line comments first.
        const code = source
          .split('\n')
          .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//'))
          .join('\n');
        expect(code, file).not.toMatch(forbiddenDom);
      }
    });

    it('calculator signature accepts ViewportGeometryInput + optional layoutProfile', () => {
      const source = readFileSync(join(sceneDir, 'calculateSceneGeometry.ts'), 'utf8');
      expect(source).toMatch(
        /export function calculateSceneGeometry\(\s*input: ViewportGeometryInput,\s*layoutProfile: GeometryLayoutProfile = 'default'\s*\)/
      );
      // Still must not import gameVariant / engine modules.
      expect(source).not.toMatch(/from\s+['"][^'"]*gameVariant[^'"]*['"]/);
    });
  });
});
