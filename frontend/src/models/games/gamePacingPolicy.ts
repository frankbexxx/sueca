/**
 * Variant pacing policies. Numbers stay at today's values.
 * A missing beat is null. It is never treated as 0.
 * Sueca ritual timings stay in suecaHandRitual.
 */

import type { GameVariant } from '../../types/game';
import {
  AI_PLAY_DELAY_MS,
  FESTA_AI_STEP_DELAY_MS,
  GAME_OVER_DELAY_MS,
  HEARTS_PASS_EXCHANGE_MS,
  SPADES_AI_BID_DELAY_MS,
  SYNTHETIC_ROUND_COMPLETE_HOLD_MS,
  TRICK_AUTO_CONTINUE_SECONDS
} from '../../constants/gameConstants';

/** A beat this variant does not have. */
export type AbsentBeat = null;

export type CardPlayPacing = {
  aiLeadMs: number;
  aiFollowMs: number;
};

type SharedBeats = {
  cardPlay: CardPlayPacing;
  /** Shared trick auto-continue. Same action in every variant. */
  trickHoldMs: number;
  /**
   * Timed return home after the match. null means the sheet stays
   * until an explicit action (King).
   */
  finalResultHoldMs: number | AbsentBeat;
};

export type SuecaPacingPolicy = SharedBeats & {
  variant: 'sueca';
  /** Shuffle, cut, deal, and trump reveal stay in suecaHandRitual. */
  ritual: 'sueca-local';
};

export type SpadesPacingPolicy = SharedBeats & {
  variant: 'spades';
  /** AI bid pause. Not the card-play delay. */
  aiBidMs: number;
};

export type HeartsPacingPolicy = SharedBeats & {
  variant: 'hearts';
  /** Receipt beat after cards change hands. Not a card-play or bid timer. */
  passExchangeMs: number;
};

export type KingPacingPolicy = SharedBeats & {
  variant: 'king';
  /** Non-auction festa AI step. */
  festaAiStepMs: number;
  /** Auction voices advance only when the player presses Continuar. */
  auctionAdvance: 'manual';
  /** Hold after synthetic negatives before the score sheet. */
  syntheticScoreHoldMs: number;
};

export type GamePacingPolicy =
  | SuecaPacingPolicy
  | SpadesPacingPolicy
  | HeartsPacingPolicy
  | KingPacingPolicy;

const TRICK_HOLD_MS = TRICK_AUTO_CONTINUE_SECONDS * 1000;

const SUECA_POLICY: SuecaPacingPolicy = {
  variant: 'sueca',
  cardPlay: { aiLeadMs: 1000, aiFollowMs: 800 },
  trickHoldMs: TRICK_HOLD_MS,
  finalResultHoldMs: GAME_OVER_DELAY_MS,
  ritual: 'sueca-local'
};

const SPADES_POLICY: SpadesPacingPolicy = {
  variant: 'spades',
  cardPlay: { aiLeadMs: AI_PLAY_DELAY_MS, aiFollowMs: AI_PLAY_DELAY_MS },
  trickHoldMs: TRICK_HOLD_MS,
  finalResultHoldMs: GAME_OVER_DELAY_MS,
  aiBidMs: SPADES_AI_BID_DELAY_MS
};

const HEARTS_POLICY: HeartsPacingPolicy = {
  variant: 'hearts',
  cardPlay: { aiLeadMs: AI_PLAY_DELAY_MS, aiFollowMs: AI_PLAY_DELAY_MS },
  trickHoldMs: TRICK_HOLD_MS,
  finalResultHoldMs: GAME_OVER_DELAY_MS,
  passExchangeMs: HEARTS_PASS_EXCHANGE_MS
};

const KING_POLICY: KingPacingPolicy = {
  variant: 'king',
  cardPlay: { aiLeadMs: AI_PLAY_DELAY_MS, aiFollowMs: AI_PLAY_DELAY_MS },
  trickHoldMs: TRICK_HOLD_MS,
  finalResultHoldMs: null,
  festaAiStepMs: FESTA_AI_STEP_DELAY_MS,
  auctionAdvance: 'manual',
  syntheticScoreHoldMs: SYNTHETIC_ROUND_COMPLETE_HOLD_MS
};

const POLICIES: Record<GameVariant, GamePacingPolicy> = {
  sueca: SUECA_POLICY,
  spades: SPADES_POLICY,
  hearts: HEARTS_POLICY,
  king: KING_POLICY
};

export function getGamePacingPolicy(variant: 'sueca'): SuecaPacingPolicy;
export function getGamePacingPolicy(variant: 'spades'): SpadesPacingPolicy;
export function getGamePacingPolicy(variant: 'hearts'): HeartsPacingPolicy;
export function getGamePacingPolicy(variant: 'king'): KingPacingPolicy;
export function getGamePacingPolicy(variant: GameVariant): GamePacingPolicy;
export function getGamePacingPolicy(variant: GameVariant): GamePacingPolicy {
  const policy = POLICIES[variant];
  if (!policy) {
    throw new Error(`No pacing policy for variant: ${String(variant)}`);
  }
  return policy;
}

function trickLengthOrLead(trickLength: number): number {
  return Number.isFinite(trickLength) ? Math.max(0, Math.floor(trickLength)) : 0;
}

/** Lead on an empty trick; follow once any card is in the trick. */
export function cardPlayDelayMs(variant: GameVariant, trickLength: number): number {
  const play = getGamePacingPolicy(variant).cardPlay;
  return trickLengthOrLead(trickLength) === 0 ? play.aiLeadMs : play.aiFollowMs;
}

export function spadesAiBidDelayMs(): number {
  return getGamePacingPolicy('spades').aiBidMs;
}

export function heartsPassExchangeMs(): number {
  return getGamePacingPolicy('hearts').passExchangeMs;
}

/**
 * Auction uses no pacing timer: Continuar is the beat, so the tick delay is 0.
 * Every other festa phase uses festaAiStepMs.
 */
export function kingFestaTickDelayMs(festaPhase: string | null): number {
  const policy = getGamePacingPolicy('king');
  if (festaPhase === 'auction') {
    if (policy.auctionAdvance !== 'manual') {
      throw new Error('King auction advance is manual');
    }
    return 0;
  }
  return policy.festaAiStepMs;
}

export function kingSyntheticScoreHoldMs(): number {
  return getGamePacingPolicy('king').syntheticScoreHoldMs;
}
