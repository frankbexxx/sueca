/**
 * UX-SUECA-01/03/04 — Sueca hand ritual + post-deal presentation (presentation only).
 * Does not deal cards, mutate playDirection, or persist timing.
 */

import type { DealAlignment, PlayDirection } from '../../types/game';
import {
  asSeat,
  cutterForDealer,
  dealAlignmentFromPhysicalDeal,
  dealDirectionFor,
  shufflerForDealer,
  type Seat
} from './suecaRules';

export type SuecaRitualPhase =
  | 'shuffle'
  | 'cut'
  | 'dealer-decision'
  | 'dealer-decision-result';

/** UX-SUECA-04/08 — post-Distribuir presentation phases (not engine SoT). */
export type SuecaPostDealPhase =
  | 'deal-confirmed'
  | 'distributing'
  | 'hands-reveal'
  | 'trump-reveal'
  | 'first-player';

/** Transient presentation role — not engine SoT. */
export type SuecaRitualRole = 'shuffler' | 'cutter' | 'dealer' | 'first-player';

export interface SuecaRitualFocus {
  seat: Seat;
  role: SuecaRitualRole;
}

/** Physical deal toward: right = ACW / pela direita; left = CW / pela esquerda. */
export type SuecaPhysicalDealDirection = PlayDirection;

export interface SuecaRitualTimingRanges {
  shuffleMs: { min: number; max: number };
  cutMs: { min: number; max: number };
  aiDecisionMs: { min: number; max: number };
  decisionResultMs: { min: number; max: number };
}

export interface SuecaPostDealTimingRanges {
  dealConfirmedMs: { min: number; max: number };
  distributingMs: { min: number; max: number };
  trumpRevealMs: { min: number; max: number };
  firstPlayerMs: { min: number; max: number };
}

/** Fixed timings for tests / deterministic UI / reduced-motion. */
export interface SuecaRitualFixedTimings {
  shuffleMs: number;
  cutMs: number;
  aiDecisionMs: number;
  decisionResultMs: number;
}

export interface SuecaPostDealFixedTimings {
  dealConfirmedMs: number;
  distributingMs: number;
  trumpRevealMs: number;
  firstPlayerMs: number;
}

/**
 * UX-SUECA-06 — explicit smoke timings (min === max; no wide random ranges).
 * Suitable for human perception and manual screenshot verification.
 */
export const SUECA_RITUAL_TIMING: SuecaRitualTimingRanges = {
  shuffleMs: { min: 1400, max: 1400 },
  cutMs: { min: 1200, max: 1200 },
  aiDecisionMs: { min: 1400, max: 1400 },
  decisionResultMs: { min: 800, max: 800 }
};

/** UX-SUECA-06 — post-deal presentation cadence (fixed). */
export const SUECA_POST_DEAL_TIMING: SuecaPostDealTimingRanges = {
  dealConfirmedMs: { min: 500, max: 500 },
  distributingMs: { min: 900, max: 900 },
  trumpRevealMs: { min: 1000, max: 1000 },
  firstPlayerMs: { min: 1000, max: 1000 }
};

/** prefers-reduced-motion: shorter but every semantic phase remains. */
export const SUECA_RITUAL_REDUCED_TIMING: SuecaRitualFixedTimings = {
  shuffleMs: 700,
  cutMs: 600,
  aiDecisionMs: 700,
  decisionResultMs: 400
};

export const SUECA_POST_DEAL_REDUCED_TIMING: SuecaPostDealFixedTimings = {
  dealConfirmedMs: 250,
  distributingMs: 450,
  trumpRevealMs: 500,
  firstPlayerMs: 500
};

export const SUECA_RITUAL_TEST_TIMINGS: SuecaRitualFixedTimings = {
  shuffleMs: 100,
  cutMs: 100,
  aiDecisionMs: 150,
  decisionResultMs: 80
};

export const SUECA_POST_DEAL_TEST_TIMINGS: SuecaPostDealFixedTimings = {
  dealConfirmedMs: 50,
  distributingMs: 60,
  trumpRevealMs: 70,
  firstPlayerMs: 40
};

export function ritualDelayMs(
  range: { min: number; max: number },
  random: () => number = Math.random
): number {
  const t = random();
  const u = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  return Math.round(range.min + u * (range.max - range.min));
}

export function prefersRitualReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function resolveRitualTimings(
  overrides?: Partial<SuecaRitualFixedTimings>,
  random: () => number = Math.random,
  reducedMotion: boolean = prefersRitualReducedMotion()
): SuecaRitualFixedTimings {
  const pick = (key: keyof SuecaRitualFixedTimings, range: { min: number; max: number }) => {
    if (overrides?.[key] != null) return overrides[key]!;
    if (reducedMotion) return SUECA_RITUAL_REDUCED_TIMING[key];
    return ritualDelayMs(range, random);
  };
  return {
    shuffleMs: pick('shuffleMs', SUECA_RITUAL_TIMING.shuffleMs),
    cutMs: pick('cutMs', SUECA_RITUAL_TIMING.cutMs),
    aiDecisionMs: pick('aiDecisionMs', SUECA_RITUAL_TIMING.aiDecisionMs),
    decisionResultMs: pick('decisionResultMs', SUECA_RITUAL_TIMING.decisionResultMs)
  };
}

export function resolvePostDealTimings(
  overrides?: Partial<SuecaPostDealFixedTimings>,
  random: () => number = Math.random,
  reducedMotion: boolean = prefersRitualReducedMotion()
): SuecaPostDealFixedTimings {
  const pick = (
    key: keyof SuecaPostDealFixedTimings,
    range: { min: number; max: number }
  ) => {
    if (overrides?.[key] != null) return overrides[key]!;
    if (reducedMotion) return SUECA_POST_DEAL_REDUCED_TIMING[key];
    return ritualDelayMs(range, random);
  };
  return {
    dealConfirmedMs: pick('dealConfirmedMs', SUECA_POST_DEAL_TIMING.dealConfirmedMs),
    distributingMs: pick('distributingMs', SUECA_POST_DEAL_TIMING.distributingMs),
    trumpRevealMs: pick('trumpRevealMs', SUECA_POST_DEAL_TIMING.trumpRevealMs),
    firstPlayerMs: pick('firstPlayerMs', SUECA_POST_DEAL_TIMING.firstPlayerMs)
  };
}

/** UX-SUECA-06 — phase machine: duration for the currently painted post-deal beat. */
export function postDealDurationMs(
  phase: SuecaPostDealPhase,
  timings: SuecaPostDealFixedTimings
): number {
  if (phase === 'deal-confirmed') return timings.dealConfirmedMs;
  if (phase === 'distributing') return timings.distributingMs;
  if (phase === 'hands-reveal') return 0;
  if (phase === 'trump-reveal') return timings.trumpRevealMs;
  return timings.firstPlayerMs;
}

/**
 * UX-SUECA-06/08 — next phase after the current beat completes.
 * `null` = play-ready (clear ritual).
 * `includeHandsReveal` is for ritualDebug inspection only — normal mode skips it
 * so automatic cadence stays identical to pre-UX-SUECA-08.
 */
export function nextSuecaPostDealPhase(
  phase: SuecaPostDealPhase,
  opts?: { includeHandsReveal?: boolean }
): SuecaPostDealPhase | null {
  if (phase === 'deal-confirmed') return 'distributing';
  if (phase === 'distributing') {
    return opts?.includeHandsReveal ? 'hands-reveal' : 'trump-reveal';
  }
  if (phase === 'hands-reveal') return 'trump-reveal';
  if (phase === 'trump-reveal') return 'first-player';
  return null;
}

/** Dealer is AI when player.type === 'ai' (human/remote → interactive). */
export function isSuecaDealerAi(playerType: string | undefined): boolean {
  return playerType === 'ai';
}

/** 50/50 physical deal — not strategic; inject `random` in tests. */
export function pickAiPhysicalDealDirection(
  random: () => number = Math.random
): SuecaPhysicalDealDirection {
  return random() < 0.5 ? 'right' : 'left';
}

export function ritualSeatsForDealer(dealerIndex: number): {
  dealer: Seat;
  shuffler: Seat;
  cutter: Seat;
} {
  const dealer = asSeat(dealerIndex);
  return {
    dealer,
    shuffler: shufflerForDealer(dealer),
    cutter: cutterForDealer(dealer)
  };
}

/** Map ritual phase → seat focus (independent of playDirection / dealAlignment). */
export function ritualFocusForPhase(
  phase: SuecaRitualPhase,
  dealerIndex: number
): SuecaRitualFocus {
  const seats = ritualSeatsForDealer(dealerIndex);
  if (phase === 'shuffle') return { seat: seats.shuffler, role: 'shuffler' };
  if (phase === 'cut') return { seat: seats.cutter, role: 'cutter' };
  return { seat: seats.dealer, role: 'dealer' };
}

/** Post-deal focus: dealer through distribute; first player on announce. */
export function postDealFocusForPhase(
  phase: SuecaPostDealPhase,
  dealerIndex: number,
  firstPlayerIndex: number
): SuecaRitualFocus | null {
  if (phase === 'deal-confirmed' || phase === 'distributing') {
    return { seat: asSeat(dealerIndex), role: 'dealer' };
  }
  if (phase === 'first-player') {
    return { seat: asSeat(firstPlayerIndex), role: 'first-player' };
  }
  // trump-reveal: no seat focus (trump owns attention)
  return null;
}

export function alignmentFromPhysicalDealChoice(
  playDirection: PlayDirection,
  physical: SuecaPhysicalDealDirection
): DealAlignment {
  return dealAlignmentFromPhysicalDeal(playDirection, physical);
}

/** Absolute physical deal sense from session play + alignment. */
export function physicalDealFromAlignment(
  playDirection: PlayDirection,
  alignment: DealAlignment
): SuecaPhysicalDealDirection {
  return dealDirectionFor(playDirection, alignment);
}

/** Hands hidden until after distributing. */
export function postDealHandsHidden(phase: SuecaPostDealPhase | null): boolean {
  return phase === 'deal-confirmed' || phase === 'distributing';
}

/** Trump HUD hidden until trump-reveal completes (ceremony owns trump beat). */
export function postDealTrumpHudHidden(phase: SuecaPostDealPhase | null): boolean {
  return (
    phase === 'deal-confirmed' ||
    phase === 'distributing' ||
    phase === 'hands-reveal' ||
    phase === 'trump-reveal'
  );
}

/** Interaction / AI locked for any active post-deal phase. */
export function postDealPlayLocked(phase: SuecaPostDealPhase | null): boolean {
  return phase != null;
}

/**
 * UX-SUECA-04/08 — when AI/human trick play may begin (presentation gate only).
 * Engine may already have dealt; this does not change rules.
 */
export function suecaPresentationPlayReady(opts: {
  waitingForRoundStart: boolean;
  postDealPhase: SuecaPostDealPhase | null;
  tableReadyForRitual: boolean;
  /** UX-SUECA-08 — debug freeze after first-player before releasing play. */
  ritualDebugPlayReadyHold?: boolean;
}): boolean {
  return (
    !opts.waitingForRoundStart &&
    !postDealPlayLocked(opts.postDealPhase) &&
    opts.tableReadyForRitual &&
    !opts.ritualDebugPlayReadyHold
  );
}

/** Mount Sueca deal ritual only after table-ready latch (avoids empty-table deadlock). */
export function shouldMountSuecaDealRitual(opts: {
  waitingForRoundStart: boolean;
  tableReadyForRitual: boolean;
  isGameOver: boolean;
  isJoiner: boolean;
  /**
   * UX-SUECA-08 — when ritualDebug holds on table-ready, keep ritual unmounted
   * until Continuar releases (`ritualDebugPreDealReleased`).
   * Omit / true outside debug.
   */
  ritualDebugPreDealReleased?: boolean;
}): boolean {
  return (
    opts.waitingForRoundStart &&
    opts.tableReadyForRitual &&
    !opts.isGameOver &&
    !opts.isJoiner &&
    opts.ritualDebugPreDealReleased !== false
  );
}
