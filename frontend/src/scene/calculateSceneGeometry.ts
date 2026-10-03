/**
 * Pure deterministic scene geometry calculator.
 * Input: ViewportGeometryInput only. No game/phase/variant/DOM/Phaser.
 */

import {
  PROVISIONAL_DESIGN_FRAMES,
  PROVISIONAL_FELT_LAYOUT,
  PROVISIONAL_GEOMETRY_MINIMUMS,
  PROVISIONAL_LANDSCAPE_BANDS,
  PROVISIONAL_LOCAL_LAYOUT,
  PROVISIONAL_PORTRAIT_BANDS,
  PROVISIONAL_PROFILE_THRESHOLDS,
  PROVISIONAL_UNSUPPORTED_LIMITS
} from './provisionalSceneGeometryConstants';
import type {
  Point,
  Rect,
  SceneGeometry,
  SceneGeometryResult,
  SceneProfile,
  ViewportGeometryInput
} from './sceneGeometry';
import { viewportGeometryKey } from './sceneGeometryEquality';

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

function centerOf(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x - 1e-6 &&
    inner.y >= outer.y - 1e-6 &&
    inner.x + inner.width <= outer.x + outer.width + 1e-6 &&
    inner.y + inner.height <= outer.y + outer.height + 1e-6
  );
}

function numberKey(value: number): string {
  if (Object.is(value, -0)) return '0';
  return String(value);
}

/**
 * Profile from usable safe size + orientation (same usable basis as orientation).
 */
function selectProfile(
  orientation: ViewportGeometryInput['orientation'],
  safeWidth: number,
  safeHeight: number
): SceneProfile {
  const t = PROVISIONAL_PROFILE_THRESHOLDS;
  if (orientation === 'portrait') {
    if (safeWidth <= t.portraitCompactMaxWidth || safeHeight <= t.portraitCompactMaxHeight) {
      return 'portraitCompact';
    }
    return 'portraitStandard';
  }
  if (safeWidth <= t.landscapeCompactMaxWidth || safeHeight <= t.landscapeCompactMaxHeight) {
    return 'landscapeCompact';
  }
  return 'landscapeStandard';
}

function labelRectForSeat(seat: Rect): Rect {
  const w = seat.width * PROVISIONAL_LOCAL_LAYOUT.labelWidthOfSeat;
  const h = seat.height * PROVISIONAL_LOCAL_LAYOUT.labelHeightOfSeat;
  return rect(seat.x + (seat.width - w) / 2, seat.y + (seat.height - h) / 2, w, h);
}

function buildInternalZones(sceneW: number, sceneH: number, portrait: boolean) {
  const bands = portrait ? PROVISIONAL_PORTRAIT_BANDS : PROVISIONAL_LANDSCAPE_BANDS;
  const hudH = sceneH * bands.hud;
  const feltH = sceneH * bands.felt;
  const southH = sceneH * bands.southSeat;
  const handH = sceneH * bands.hand;
  const actionH = sceneH * bands.actionStatus;

  const hudRect = rect(0, 0, sceneW, hudH);
  const feltRect = rect(0, hudH, sceneW, feltH);
  const southBandY = hudH + feltH;
  const handY = southBandY + southH;
  const actionY = handY + handH;

  const southW = sceneW * PROVISIONAL_LOCAL_LAYOUT.southSeatWidth;
  const southSeat = rect((sceneW - southW) / 2, southBandY, southW, southH);
  const handRect = rect(0, handY, sceneW, handH);
  const actionStatusRect = rect(0, actionY, sceneW, actionH);

  const felt = PROVISIONAL_FELT_LAYOUT;
  const northH = feltRect.height * felt.northSeatHeight;
  const northW = sceneW * felt.northSeatWidth;
  const northSeat = rect((sceneW - northW) / 2, feltRect.y, northW, northH);

  const sideW = feltRect.width * felt.sideSeatWidth;
  const sideH = feltRect.height * felt.sideSeatHeight;
  const sideY = feltRect.y + feltRect.height * felt.sideSeatCenterY - sideH / 2;
  const insetX = feltRect.width * felt.sideSeatInsetX;
  const westSeat = rect(feltRect.x + insetX, sideY, sideW, sideH);
  const eastSeat = rect(feltRect.x + feltRect.width - insetX - sideW, sideY, sideW, sideH);

  const decisionH = feltRect.height * felt.decisionHeight;
  const decisionW = feltRect.width * felt.decisionWidth;
  const decisionRect = rect(
    feltRect.x + (feltRect.width - decisionW) / 2,
    feltRect.y + feltRect.height - decisionH,
    decisionW,
    decisionH
  );

  const trickSize = Math.min(feltRect.width, feltRect.height) * felt.trickSize;
  const trickTop = northSeat.y + northSeat.height;
  const trickBottom = decisionRect.y;
  const trickBandH = Math.max(0, trickBottom - trickTop);
  const trickY = trickTop + (trickBandH - trickSize) / 2;
  const trickRect = rect((sceneW - trickSize) / 2, trickY, trickSize, trickSize);

  const padX = handRect.width * PROVISIONAL_LOCAL_LAYOUT.handInteractionPadX;
  const padY = handRect.height * PROVISIONAL_LOCAL_LAYOUT.handInteractionPadY;
  const handInteractionRect = rect(
    handRect.x + padX,
    Math.max(0, handRect.y - padY),
    handRect.width - padX * 2,
    Math.min(sceneH - Math.max(0, handRect.y - padY), handRect.height + padY * 2)
  );

  const seatZones = {
    north: northSeat,
    west: westSeat,
    east: eastSeat,
    south: southSeat
  };
  const seatLabelRects = {
    north: labelRectForSeat(northSeat),
    west: labelRectForSeat(westSeat),
    east: labelRectForSeat(eastSeat),
    south: labelRectForSeat(southSeat)
  };
  const seatExclusionRects = { ...seatLabelRects };
  const seatAnchors = {
    north: centerOf(northSeat),
    west: centerOf(westSeat),
    east: centerOf(eastSeat),
    south: centerOf(southSeat)
  };

  return {
    hudRect,
    feltRect,
    seatZones,
    seatAnchors,
    seatLabelRects,
    seatExclusionRects,
    trickRect,
    trickCenter: centerOf(trickRect),
    handRect,
    handBaseline: handRect.y + handRect.height,
    handInteractionRect,
    actionStatusRect,
    decisionRect,
    fullSceneModalRect: rect(0, 0, sceneW, sceneH),
    overlaySafeRect: feltRect,
    overlayExclusions: {
      northSeatLabel: seatLabelRects.north,
      westSeatLabel: seatLabelRects.west,
      eastSeatLabel: seatLabelRects.east,
      hand: handRect
    }
  };
}

/**
 * Enforce every GeometryMinimums field against the zone it names.
 * Also apply PROVISIONAL_UNSUPPORTED_LIMITS scene-size floors.
 *
 * Check order (first failure wins inside this helper):
 * scene width → scene height → decision zone → hand zone →
 * N/W/E exclusion labels → decision-to-hand gap.
 */
function minimumsSatisfied(sceneW: number, sceneH: number, zones: ReturnType<typeof buildInternalZones>): boolean {
  const m = PROVISIONAL_GEOMETRY_MINIMUMS;
  const limits = PROVISIONAL_UNSUPPORTED_LIMITS;

  if (sceneW < limits.minSceneWidthPx) return false;
  if (sceneH < limits.minSceneHeightPx) return false;

  if (zones.decisionRect.width < m.minDecisionZonePx) return false;
  if (zones.decisionRect.height < m.minDecisionZonePx) return false;

  if (zones.handRect.height < m.minHandZoneHeightPx) return false;

  // N/W/E only — south label height is not claimed under landscape provisional bands.
  for (const label of [
    zones.seatLabelRects.north,
    zones.seatLabelRects.west,
    zones.seatLabelRects.east
  ]) {
    if (label.width < m.minExclusionLabelWidthPx) return false;
    if (label.height < m.minExclusionLabelHeightPx) return false;
  }

  const decisionBottom = zones.decisionRect.y + zones.decisionRect.height;
  const gap = zones.handRect.y - decisionBottom;
  if (gap < m.minDecisionToHandGapPx) return false;

  return true;
}

function invariantsHold(zones: ReturnType<typeof buildInternalZones>): boolean {
  const scene = zones.fullSceneModalRect;
  if (!contains(scene, zones.hudRect)) return false;
  if (!contains(scene, zones.feltRect)) return false;
  if (!contains(scene, zones.handRect)) return false;
  if (!contains(scene, zones.actionStatusRect)) return false;
  if (!contains(zones.feltRect, zones.trickRect)) return false;
  if (!contains(zones.feltRect, zones.decisionRect)) return false;
  if (!contains(zones.feltRect, zones.seatZones.north)) return false;
  if (!contains(zones.feltRect, zones.seatZones.west)) return false;
  if (!contains(zones.feltRect, zones.seatZones.east)) return false;
  if (!contains(scene, zones.seatZones.south)) return false;
  if (intersects(zones.decisionRect, zones.handRect)) return false;
  if (intersects(zones.decisionRect, zones.seatExclusionRects.north)) return false;
  if (intersects(zones.decisionRect, zones.seatExclusionRects.west)) return false;
  if (intersects(zones.decisionRect, zones.seatExclusionRects.east)) return false;
  return true;
}

/**
 * Calculate immutable scene geometry from a normalized viewport input.
 * Game phase / variant / content must never be passed here.
 */
export function calculateSceneGeometry(input: ViewportGeometryInput): SceneGeometryResult {
  const safeRect = rect(
    input.safeInsets.left,
    input.safeInsets.top,
    input.width - input.safeInsets.left - input.safeInsets.right,
    input.height - input.safeInsets.top - input.safeInsets.bottom
  );

  // Unsupported reason precedence:
  // 1) non-positive safe rect → viewport_too_small
  // 2) sceneScale below floor → viewport_too_small
  // 3) topology invariants fail → minimums_unsatisfied
  // 4) zone / scene-size minimums fail → minimums_unsatisfied
  if (safeRect.width <= 0 || safeRect.height <= 0) {
    return { supported: false, reason: 'viewport_too_small', input };
  }

  // input.orientation must be derived from usable safe size (see normalizeViewport).
  const profile = selectProfile(input.orientation, safeRect.width, safeRect.height);
  const designFrame = PROVISIONAL_DESIGN_FRAMES[profile];
  const sceneScale = Math.min(
    safeRect.width / designFrame.width,
    safeRect.height / designFrame.height
  );

  if (sceneScale < PROVISIONAL_UNSUPPORTED_LIMITS.minSceneScale) {
    return { supported: false, reason: 'viewport_too_small', input };
  }

  const sceneW = designFrame.width * sceneScale;
  const sceneH = designFrame.height * sceneScale;
  const sceneFrame = rect(
    safeRect.x + (safeRect.width - sceneW) / 2,
    safeRect.y + (safeRect.height - sceneH) / 2,
    sceneW,
    sceneH
  );

  const letterbox = {
    left: sceneFrame.x - safeRect.x,
    top: sceneFrame.y - safeRect.y,
    right: safeRect.x + safeRect.width - (sceneFrame.x + sceneFrame.width),
    bottom: safeRect.y + safeRect.height - (sceneFrame.y + sceneFrame.height)
  };

  const portrait = input.orientation === 'portrait';
  const zones = buildInternalZones(sceneW, sceneH, portrait);

  if (!invariantsHold(zones)) {
    return { supported: false, reason: 'minimums_unsatisfied', input };
  }
  if (!minimumsSatisfied(sceneW, sceneH, zones)) {
    return { supported: false, reason: 'minimums_unsatisfied', input };
  }

  const geometryKey = [
    'v1',
    profile,
    viewportGeometryKey(input),
    numberKey(sceneScale)
  ].join('::');

  const geometry: SceneGeometry = {
    geometryVersion: 1,
    geometryKey,
    viewport: input,
    safeInsets: input.safeInsets,
    orientation: input.orientation,
    profile,
    designFrame,
    sceneFrame,
    sceneScale,
    letterbox,
    safeRect,
    ...zones,
    minimums: PROVISIONAL_GEOMETRY_MINIMUMS
  };

  return { supported: true, geometry };
}

/** Test/helper: whether two scene-local rects intersect. */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return intersects(a, b);
}

/** Test/helper: whether outer contains inner. */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return contains(outer, inner);
}
