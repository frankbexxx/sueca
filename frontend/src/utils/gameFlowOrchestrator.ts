import { GameState, GameVariant } from '../types/game';
import { resolvePresetId } from '../constants/rulesPresets';
import { getHeartsState } from '../models/games/HeartsGame';
import { getSpadesState } from '../models/games/SpadesGame';
import { getKingPtState, KingPtVariantState } from '../models/games/KingPtGame';
import {
  shouldShowTrickContinueChrome,
  shouldShowTrickContinueCta
} from './continueFlowUi';

/**
 * Board-level flow kinds (presentation / orchestration only).
 * Priority is resolved highest → lowest; does not encode game rules.
 */
export type GameBoardFlowKind =
  | 'game_over'
  | 'early_round_end'
  | 'round_end'
  | 'king_koh_reveal'
  | 'king_festa'
  | 'hearts_pass'
  | 'spades_bid'
  | 'round_setup_wait'
  | 'trick_end_wait'
  | 'paused'
  | 'normal_play';

export interface GameBoardFlowInput {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
}

export interface GameBoardFlowView {
  kind: GameBoardFlowKind;
  heartsPassActive: boolean;
  spadesBidActive: boolean;
  festaSheetActive: boolean;
  waitingForEarlyEnd: boolean;
  /** True when a higher-priority overlay owns the primary CTA. */
  flowOverlayActive: boolean;
  showTrickContinueCta: boolean;
  showTrickContinueChrome: boolean;
}

export function isKingPtNormalPreset(
  variant: GameVariant,
  rulesPresetId?: string
): boolean {
  return variant === 'king' && resolvePresetId('king', rulesPresetId) === 'king-pt-normal';
}

/** King festa / auction / fallback / setup sheet (CSS + Continue suppress). */
export function isKingFestaSheetActive(
  king: KingPtVariantState | null | undefined,
  waitingForRoundStart: boolean
): boolean {
  if (!king || !waitingForRoundStart) return false;
  if (king.phase === 'koh_reveal') return false;
  return (
    king.festaPhase === 'auction' ||
    king.festaPhase === 'negotiation' ||
    king.festaPhase === 'negotiation_counter' ||
    king.waitingForFallback ||
    king.waitingForFestaSetup ||
    king.eightOrNullsPending
  );
}

export function isHeartsPassActive(variant: GameVariant, gameState: GameState): boolean {
  return variant === 'hearts' && Boolean(getHeartsState(gameState).waitingForPass);
}

export function isSpadesBidActive(variant: GameVariant, gameState: GameState): boolean {
  return variant === 'spades' && Boolean(getSpadesState(gameState).waitingForBids);
}

export function isWaitingForEarlyEnd(
  variant: GameVariant,
  gameState: GameState,
  kingPt: KingPtVariantState | null
): boolean {
  if (kingPt?.waitingForEarlyEnd) return true;
  if (variant === 'hearts' && getHeartsState(gameState).waitingForEarlyEnd) return true;
  return false;
}

/**
 * Derive cohesive board flow flags from an engine snapshot.
 * Pure — no React, no mutations, no scoring/legality.
 */
export function resolveGameBoardFlow(input: GameBoardFlowInput): GameBoardFlowView {
  const { gameState, variant, rulesPresetId } = input;
  const kingPt = isKingPtNormalPreset(variant, rulesPresetId)
    ? getKingPtState(gameState)
    : null;

  const heartsPassActive = isHeartsPassActive(variant, gameState);
  const spadesBidActive = isSpadesBidActive(variant, gameState);
  const festaSheetActive = isKingFestaSheetActive(
    kingPt,
    gameState.waitingForRoundStart
  );
  const waitingForEarlyEnd = isWaitingForEarlyEnd(variant, gameState, kingPt);

  const flowOverlayActive =
    heartsPassActive || spadesBidActive || festaSheetActive || waitingForEarlyEnd;

  const overlays = { flowOverlayActive };
  const showTrickContinueCta = shouldShowTrickContinueCta(gameState, overlays);
  const showTrickContinueChrome = shouldShowTrickContinueChrome(gameState, overlays);

  const kind = resolveGameBoardFlowKind({
    gameState,
    variant,
    kingPt,
    heartsPassActive,
    spadesBidActive,
    festaSheetActive,
    waitingForEarlyEnd
  });

  return {
    kind,
    heartsPassActive,
    spadesBidActive,
    festaSheetActive,
    waitingForEarlyEnd,
    flowOverlayActive,
    showTrickContinueCta,
    showTrickContinueChrome
  };
}

function resolveGameBoardFlowKind(args: {
  gameState: GameState;
  variant: GameVariant;
  kingPt: KingPtVariantState | null;
  heartsPassActive: boolean;
  spadesBidActive: boolean;
  festaSheetActive: boolean;
  waitingForEarlyEnd: boolean;
}): GameBoardFlowKind {
  const {
    gameState,
    kingPt,
    heartsPassActive,
    spadesBidActive,
    festaSheetActive,
    waitingForEarlyEnd
  } = args;

  if (gameState.isGameOver) return 'game_over';
  if (waitingForEarlyEnd) return 'early_round_end';
  if (gameState.waitingForRoundEnd) return 'round_end';

  if (
    kingPt?.phase === 'koh_reveal' &&
    gameState.waitingForRoundStart
  ) {
    return 'king_koh_reveal';
  }

  if (festaSheetActive) return 'king_festa';
  if (heartsPassActive) return 'hearts_pass';
  if (spadesBidActive) return 'spades_bid';

  if (gameState.waitingForRoundStart || gameState.waitingForGameStart) {
    return 'round_setup_wait';
  }

  if (gameState.waitingForTrickEnd) return 'trick_end_wait';
  if (gameState.isPaused) return 'paused';
  return 'normal_play';
}
