/**
 * Canonical scene geometry contract (Phase 1 / Step 1).
 *
 * Coordinate system:
 * - Viewport coordinates: placement of sceneFrame / letterbox only.
 * - Scene-local CSS pixels: (0,0) = top-left of sceneFrame; all internal rects.
 *
 * Pure data types only. No React, Phaser, GameState, or DOM.
 */

export type Orientation = 'portrait' | 'landscape';

export type SceneProfile =
  | 'portraitStandard'
  | 'portraitCompact'
  | 'landscapeStandard'
  | 'landscapeCompact';

/**
 * Zone-construction layout profile (not compact/standard SceneProfile).
 * `suecaPortraitV3` applies only when requested and orientation is portrait;
 * landscape always uses default zone construction.
 */
export type GeometryLayoutProfile = 'default' | 'suecaPortraitV3';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Design-space frame size before uniform scale into the usable viewport. */
export interface DesignFrame {
  readonly width: number;
  readonly height: number;
}

/**
 * Normalized usable viewport input for the geometry calculator.
 * Produced by {@link normalizeViewport}; never measured here.
 */
export interface ViewportGeometryInput {
  readonly width: number;
  readonly height: number;
  readonly safeInsets: Insets;
  readonly orientation: Orientation;
}

export interface SeatZones {
  readonly north: Rect;
  readonly west: Rect;
  readonly east: Rect;
  readonly south: Rect;
}

export interface SeatAnchors {
  readonly north: Point;
  readonly west: Point;
  readonly east: Point;
  readonly south: Point;
}

export interface SeatLabelRects {
  readonly north: Rect;
  readonly west: Rect;
  readonly east: Rect;
  readonly south: Rect;
}

/** Protected label exclusions used by overlay/decision invariants (N/W/E hard). */
export interface SeatExclusionRects {
  readonly north: Rect;
  readonly west: Rect;
  readonly east: Rect;
  readonly south: Rect;
}

export interface OverlayExclusions {
  readonly northSeatLabel: Rect;
  readonly westSeatLabel: Rect;
  readonly eastSeatLabel: Rect;
  readonly hand: Rect;
}

/**
 * Zone-level geometry floors that calculateSceneGeometry actually enforces.
 * Names describe scene zones — not rendered cards or individual UI controls.
 * Do not add fields here unless the calculator validates them against that zone.
 *
 * Scene-frame floors (width / height / scale) live on PROVISIONAL_UNSUPPORTED_LIMITS
 * and are also required for supported: true.
 */
export interface GeometryMinimums {
  /** Minimum decisionRect width and height (zone size, not per-control touch targets). */
  readonly minDecisionZonePx: number;
  /** Minimum handRect height (hand zone, not rendered card height). */
  readonly minHandZoneHeightPx: number;
  /** Minimum N/W/E seat-label rect width (exclusion labels only; not south). */
  readonly minExclusionLabelWidthPx: number;
  /** Minimum N/W/E seat-label rect height (exclusion labels only; not south). */
  readonly minExclusionLabelHeightPx: number;
  /** Minimum vertical gap from decisionRect bottom to handRect top. */
  readonly minDecisionToHandGapPx: number;
}

/**
 * Immutable scene geometry snapshot.
 * Internal rects are scene-local; sceneFrame is in viewport coordinates.
 */
export interface SceneGeometry {
  readonly geometryVersion: 1;
  readonly geometryKey: string;
  readonly viewport: ViewportGeometryInput;
  readonly safeInsets: Insets;
  readonly orientation: Orientation;
  readonly profile: SceneProfile;
  /** Effective zone layout used to build internal rects. */
  readonly layoutProfile: GeometryLayoutProfile;
  readonly designFrame: DesignFrame;
  /** Scene placement in viewport coordinates (letterboxed into the safe usable area). */
  readonly sceneFrame: Rect;
  /** Uniform scale from designFrame → sceneFrame size. */
  readonly sceneScale: number;
  /** Letterbox bands in viewport coordinates around sceneFrame. */
  readonly letterbox: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
  /** Usable safe rectangle in viewport coordinates (viewport minus safe insets). */
  readonly safeRect: Rect;
  /** Scene-local zones below. */
  readonly hudRect: Rect;
  readonly feltRect: Rect;
  readonly seatZones: SeatZones;
  readonly seatAnchors: SeatAnchors;
  readonly seatLabelRects: SeatLabelRects;
  readonly seatExclusionRects: SeatExclusionRects;
  readonly trickRect: Rect;
  readonly trickCenter: Point;
  readonly handRect: Rect;
  readonly handBaseline: number;
  readonly handInteractionRect: Rect;
  readonly actionStatusRect: Rect;
  readonly decisionRect: Rect;
  /**
   * Step 3C — canonical overlay envelope for large decision sheets
   * (Hearts pass, Spades bid, King Festa, Sueca large ritual).
   * Scene-local; may overlay felt/trick/seats when active; must not
   * intersect hudRect or handInteractionRect.
   */
  readonly decisionSheetRect: Rect;
  /**
   * Optional status plaque envelope (Sueca V3). Null on default layout —
   * Sueca status then falls back to decisionRect / decisionSheetRect rules.
   */
  readonly statusPlaqueRect: Rect | null;
  readonly fullSceneModalRect: Rect;
  readonly overlaySafeRect: Rect;
  readonly overlayExclusions: OverlayExclusions;
  readonly minimums: GeometryMinimums;
}

export type UnsupportedSceneGeometryReason =
  | 'viewport_too_small'
  | 'minimums_unsatisfied';

export type SceneGeometryResult =
  | {
      readonly supported: true;
      readonly geometry: SceneGeometry;
    }
  | {
      readonly supported: false;
      readonly reason: UnsupportedSceneGeometryReason;
      readonly input: ViewportGeometryInput;
    };

export type NormalizeViewportReason =
  | 'invalid_dimensions'
  | 'non_finite_dimensions'
  | 'invalid_insets'
  | 'non_finite_insets'
  | 'insets_exceed_viewport';

export type NormalizeViewportResult =
  | {
      readonly ok: true;
      readonly input: ViewportGeometryInput;
    }
  | {
      readonly ok: false;
      readonly reason: NormalizeViewportReason;
    };
