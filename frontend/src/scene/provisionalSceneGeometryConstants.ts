/**
 * PROVISIONAL scene-geometry constants for Phase 1 / Step 1.
 *
 * These values exist only to materialize and test a deterministic topology.
 * They are NOT product-approved final dimensions or visual design.
 *
 * All entries must appear in the Step 1 report under
 * "Decisions requiring visual/product approval".
 */

import type { DesignFrame, GeometryMinimums, SceneProfile } from './sceneGeometry';

/**
 * PROVISIONAL — design frames.
 *
 * Compact and standard share the same frame within each orientation so that
 * crossing a compact threshold cannot jump aspect ratio / sceneFrame size.
 * Profile remains a distinct label; geometry fill is continuous.
 */
export const PROVISIONAL_DESIGN_FRAMES: Readonly<Record<SceneProfile, DesignFrame>> = {
  portraitStandard: { width: 390, height: 844 },
  portraitCompact: { width: 390, height: 844 },
  landscapeStandard: { width: 844, height: 390 },
  landscapeCompact: { width: 844, height: 390 }
};

/**
 * PROVISIONAL — profile selection against the safe usable viewport.
 * Compact when either side falls below these thresholds for the orientation.
 */
export const PROVISIONAL_PROFILE_THRESHOLDS = {
  portraitCompactMaxWidth: 370,
  portraitCompactMaxHeight: 700,
  landscapeCompactMaxWidth: 760,
  landscapeCompactMaxHeight: 360
} as const;

/**
 * PROVISIONAL — maximum allowed sceneFrame edge change for a 1 CSS-px safe-viewport
 * change used by continuity tests (bounded transition contract).
 */
export const PROVISIONAL_PROFILE_CONTINUITY = {
  /**
   * When width-limited, ΔsceneH ≈ (designH/designW)*Δwidth ≈ 2.16 for portrait.
   * Bound is the max design aspect ratio among provisional frames (ceil).
   */
  maxSceneEdgeDeltaPxPerViewportPx: 3,
  maxSceneScaleRelativeDelta: 0.05
} as const;

/**
 * PROVISIONAL — zone-level floors exposed on SceneGeometry.minimums.
 * Only values the calculator actually enforces belong here.
 * Field names match the zones checked (not cards/controls).
 */
export const PROVISIONAL_GEOMETRY_MINIMUMS: GeometryMinimums = {
  minDecisionZonePx: 36,
  minHandZoneHeightPx: 50,
  minExclusionLabelWidthPx: 40,
  minExclusionLabelHeightPx: 14,
  minDecisionToHandGapPx: 8
};

/**
 * PROVISIONAL — portrait vertical bands as fractions of scene height.
 * Sum must equal 1. HUD enlarged for Step 3A React hudRect fit (felt reduced).
 */
export const PROVISIONAL_PORTRAIT_BANDS = {
  hud: 0.14,
  felt: 0.46,
  southSeat: 0.1,
  hand: 0.2,
  actionStatus: 0.1
} as const;

/**
 * PROVISIONAL — landscape vertical bands as fractions of scene height.
 * Sum must equal 1. HUD enlarged for Step 3A React hudRect fit
 * (felt/south/action redistributed; hand unchanged).
 */
export const PROVISIONAL_LANDSCAPE_BANDS = {
  hud: 0.2,
  felt: 0.555,
  southSeat: 0.03,
  hand: 0.16,
  actionStatus: 0.055
} as const;

/** PROVISIONAL — seat / trick / decision fractions inside feltRect. */
export const PROVISIONAL_FELT_LAYOUT = {
  /** North seat zone height as a fraction of felt height. */
  northSeatHeight: 0.22,
  /** North seat zone width as a fraction of scene width. */
  northSeatWidth: 0.4,
  /** South-facing decision band height as a fraction of felt height. */
  decisionHeight: 0.22,
  /** Side seat width as a fraction of felt width. */
  sideSeatWidth: 0.22,
  /** Side seat height as a fraction of felt height. */
  sideSeatHeight: 0.36,
  /** Trick size as a fraction of the smaller felt side. */
  trickSize: 0.5,
  /** Decision width as a fraction of felt width. */
  decisionWidth: 0.56,
  /** Horizontal inset for side seats from felt edges. */
  sideSeatInsetX: 0.02,
  /** Vertical centering bias for side seats within felt (0 = top). */
  sideSeatCenterY: 0.48
} as const;

/** PROVISIONAL — south seat / label / hand interaction padding. */
export const PROVISIONAL_LOCAL_LAYOUT = {
  /** South seat width as a fraction of scene width. */
  southSeatWidth: 0.42,
  /** Label block size as fractions of its seat zone. */
  labelWidthOfSeat: 0.72,
  labelHeightOfSeat: 0.36,
  /** Extra padding around handRect → handInteractionRect as fractions of hand size. */
  handInteractionPadY: 0.12,
  handInteractionPadX: 0.04
} as const;

/** PROVISIONAL — minimum sceneFrame CSS size after scale before unsupported. */
export const PROVISIONAL_UNSUPPORTED_LIMITS = {
  minSceneWidthPx: 280,
  minSceneHeightPx: 320,
  minSceneScale: 0.45
} as const;

/**
 * PROVISIONAL — landscape shell gate (tablet / large-screen).
 * Phone-landscape is intentionally unsupported; portrait is unchanged.
 * Checked against measured shell width/height (ViewportGeometryInput).
 */
export const PROVISIONAL_LANDSCAPE_MIN_SHELL = {
  width: 1024,
  height: 600
} as const;

/**
 * PROVISIONAL — nominal layout card width at sceneScale = 1 (portrait design frame).
 * Height = round(width * CARD_ASPECT). Used by C2 card metrics.
 */
export const PROVISIONAL_CARD_METRICS = {
  aspectHeightOverWidth: 1.4,
  baseCardWidthAtScale1: 48,
  handPresenceScale: 1.22,
  trickScale: 1.11,
  /**
   * Selected-card vertical lift pad (px). Must match HUMAN_HAND_LAYOUT.selectedLift.
   * Kept here so scene runtime does not import table/localHandLayout.
   */
  selectedLiftPad: 26,
  /** premiumTrickOffset factors — cross span for 4 trick cards. */
  trickOffsetXFactor: 0.8,
  trickOffsetYFactor: 0.55
} as const;

/**
 * Approved Sueca portrait V3 reference rects at design frame 390×844 (sceneScale = 1).
 * Scaled uniformly by sceneScale in the shared calculator.
 */
export const SUECA_PORTRAIT_V3_REF = {
  designWidth: 390,
  designHeight: 844,
  hud: { x: 0, y: 0, w: 390, h: 76 },
  felt: { x: 12, y: 80, w: 366, h: 616 },
  north: { x: 66, y: 94, w: 258, h: 72 },
  west: { x: 20, y: 269, w: 68, h: 230 },
  east: { x: 302, y: 269, w: 68, h: 230 },
  south: { x: 115, y: 602, w: 160, h: 48 },
  trick: { x: 108, y: 284, w: 174, h: 200 },
  hand: { x: 8, y: 656, w: 374, h: 136 },
  action: { x: 0, y: 792, w: 390, h: 52 },
  statusPlaque: { x: 45, y: 328, w: 300, h: 112 },
  decision: { x: 25, y: 274, w: 340, h: 220 },
  sheet: { x: 25, y: 234, w: 340, h: 300 }
} as const;

/**
 * Card metrics for Sueca portrait V3 (hand ≈ 62×87, trick ≈ 58×81, lift 18).
 * handPresenceScale matches PREMIUM_TABLE / default so Phaser display multiply stays coherent.
 */
export const SUECA_PORTRAIT_V3_CARD_METRICS = {
  aspectHeightOverWidth: 1.4,
  /** → hand display ≈ 61.9×86.6 after presence 1.22 (target 62×87). */
  baseCardWidthAtScale1: 50.81967213114754,
  handPresenceScale: 1.22,
  /** → trick ≈ 58 wide before envelope cap. */
  trickScale: 1.141304347826087,
  selectedLiftPad: 18,
  trickOffsetXFactor: 0.8,
  trickOffsetYFactor: 0.55
} as const;
