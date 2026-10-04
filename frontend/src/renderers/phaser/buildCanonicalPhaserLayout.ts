/**
 * Step 3B — PhaserTableLayout from authoritative SceneGeometry.
 * Canvas coords = scene-local (host = sceneFrame).
 */

import {
  computeCanonicalCardMetrics,
  resolveCanonicalHandY
} from '../../scene/canonicalCardMetrics';
import type { Rect, SceneGeometry } from '../../scene/sceneGeometry';
import { PREMIUM_TABLE, type TableZoneRect, type TableZones } from './phaserPremiumLayout';
import type { PhaserAspectMode, PhaserTableLayout } from './phaserTableLayout';

function zoneFromRect(r: Rect): TableZoneRect {
  return {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    cx: r.x + r.width / 2,
    cy: r.y + r.height / 2
  };
}

function zonesFromGeometry(geometry: SceneGeometry): TableZones {
  const w = geometry.sceneFrame.width;
  const h = geometry.sceneFrame.height;
  return {
    viewport: zoneFromRect({ x: 0, y: 0, width: w, height: h }),
    topHud: zoneFromRect(geometry.hudRect),
    topSeat: zoneFromRect(geometry.seatZones.north),
    leftSeat: zoneFromRect(geometry.seatZones.west),
    rightSeat: zoneFromRect(geometry.seatZones.east),
    trick: zoneFromRect(geometry.trickRect),
    localSeat: zoneFromRect(geometry.seatZones.south),
    hand: zoneFromRect(geometry.handRect),
    bottomSafe: zoneFromRect(geometry.actionStatusRect),
    felt: zoneFromRect(geometry.feltRect)
  };
}

/**
 * Build Phaser layout exclusively from canonical SceneGeometry + C2 metrics.
 * Does not use bottomChromePx or orientationReference.
 */
export function buildCanonicalPhaserLayout(geometry: SceneGeometry): PhaserTableLayout {
  const w = geometry.sceneFrame.width;
  const h = geometry.sceneFrame.height;
  const metrics = computeCanonicalCardMetrics(geometry);
  const aspect: PhaserAspectMode =
    geometry.orientation === 'portrait' ? 'portrait' : 'landscape';
  const zones = zonesFromGeometry(geometry);

  // Prefer handRect center; clamp so selected lift stays in handInteractionRect.
  const handY = resolveCanonicalHandY(
    geometry,
    metrics.handDisplayHeight,
    metrics.selectedLiftPad
  );
  const handSpreadMax = geometry.handRect.width * 0.92;

  return {
    width: w,
    height: h,
    aspect,
    center: { x: geometry.trickCenter.x, y: geometry.trickCenter.y },
    seatAnchor: {
      north: { x: geometry.seatAnchors.north.x, y: geometry.seatAnchors.north.y },
      west: { x: geometry.seatAnchors.west.x, y: geometry.seatAnchors.west.y },
      east: { x: geometry.seatAnchors.east.x, y: geometry.seatAnchors.east.y },
      south: { x: geometry.seatAnchors.south.x, y: geometry.seatAnchors.south.y }
    },
    handY,
    selectedLiftPad: metrics.selectedLiftPad,
    cardWidth: metrics.cardWidth,
    cardHeight: metrics.cardHeight,
    opponentCardWidth: metrics.opponentCardWidth,
    opponentCardHeight: metrics.opponentCardHeight,
    trickCardWidth: metrics.trickCardWidth,
    trickCardHeight: metrics.trickCardHeight,
    dropRadius: Math.max(metrics.cardWidth * 1.6, 72),
    handSpreadMax,
    bottomChromePx: 0,
    tableMargin:
      aspect === 'landscape'
        ? PREMIUM_TABLE.tableMarginLandscape
        : PREMIUM_TABLE.tableMarginPortrait,
    tableRadius:
      aspect === 'landscape'
        ? PREMIUM_TABLE.tableRadiusLandscape
        : PREMIUM_TABLE.tableRadiusPortrait,
    zones,
    compactSideSeats: aspect === 'portrait' && w <= 380
  };
}
