import { describe, expect, it } from 'vitest';
import { computeAuthoritativeSceneGeometry } from './computeAuthoritativeSceneGeometry';
import {
  decisionSheetRectShellStyle,
  hudRectShellStyle,
  resolveSuecaRitualCanonicalZone,
  sceneFrameHostStyle,
  SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX
} from './canonicalScenePlacement';

describe('canonicalScenePlacement', () => {
  it('maps supported sceneFrame to absolute host box', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok || !computed.result.supported) return;
    const g = computed.result.geometry;
    const style = sceneFrameHostStyle(g);
    expect(style.position).toBe('absolute');
    expect(style.left).toBe(g.sceneFrame.x);
    expect(style.top).toBe(g.sceneFrame.y);
    expect(style.width).toBe(g.sceneFrame.width);
    expect(style.height).toBe(g.sceneFrame.height);
  });

  it('maps hudRect into shell coordinates on top of sceneFrame', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 47, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok || !computed.result.supported) return;
    const g = computed.result.geometry;
    const style = hudRectShellStyle(g);
    expect(style.left).toBe(g.sceneFrame.x + g.hudRect.x);
    expect(style.top).toBe(g.sceneFrame.y + g.hudRect.y);
    expect(style.width).toBe(g.hudRect.width);
    expect(style.height).toBe(g.hudRect.height);
    expect(style.height).toBeCloseTo(g.sceneFrame.height * 0.14, 5);
    // Floating HUD menus must not be clipped by the fixed band box.
    expect(style.overflow).toBe('visible');
  });

  it('keeps host frame identical when only presentation fields would change', () => {
    const raw = {
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    const a = computeAuthoritativeSceneGeometry(raw);
    const b = computeAuthoritativeSceneGeometry({
      ...raw,
      // noise ignored by pipeline
      phase: 'festa'
    } as typeof raw);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok || !a.result.supported || !b.result.supported) return;
    expect(sceneFrameHostStyle(a.result.geometry)).toEqual(
      sceneFrameHostStyle(b.result.geometry)
    );
    expect(hudRectShellStyle(a.result.geometry)).toEqual(
      hudRectShellStyle(b.result.geometry)
    );
    expect(decisionSheetRectShellStyle(a.result.geometry)).toEqual(
      decisionSheetRectShellStyle(b.result.geometry)
    );
  });

  it('maps decisionSheetRect into shell coordinates from SceneGeometry only', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok || !computed.result.supported) return;
    const g = computed.result.geometry;
    const style = decisionSheetRectShellStyle(g);
    expect(style.left).toBe(g.sceneFrame.x + g.decisionSheetRect.x);
    expect(style.top).toBe(g.sceneFrame.y + g.decisionSheetRect.y);
    expect(style.width).toBe(g.decisionSheetRect.width);
    expect(style.height).toBe(g.decisionSheetRect.height);
  });

  it('routes Sueca status to decisionSheetRect when decisionRect is too short', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok || !computed.result.supported) return;
    const g = computed.result.geometry;
    expect(g.decisionRect.height).toBeLessThan(SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX);
    expect(resolveSuecaRitualCanonicalZone(g, 'status')).toBe('decisionSheetRect');
    expect(resolveSuecaRitualCanonicalZone(g, 'decision')).toBe('decisionSheetRect');
    expect(resolveSuecaRitualCanonicalZone(g, 'human')).toBe('decisionSheetRect');
  });
});
