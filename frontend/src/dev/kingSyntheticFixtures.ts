/**
 * DEV ONLY — enable combined-all-negatives mode on a live King PT state.
 * Does not seed short hands; uses the normal 13-card deal already on the table.
 */

import type { GameState } from '../types/game';
import { KingGame } from '../models/games/KingGame';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import { isKingDevSyntheticEnabled, kingSyntheticRoundLabel } from './kingSyntheticJump';
import { initBreakdownForRound } from '../models/games/king/kingBreakdownHelpers';

/**
 * Mark the current negative round as synthetic combined-all-negatives.
 * Call after KOH confirm when hands are already dealt.
 */
export function enableKingSyntheticCombinedRound(
  adapter: KingGame | KingPtGame
): GameState {
  if (!isKingDevSyntheticEnabled()) {
    return adapter.getCurrentState();
  }

  if (adapter instanceof KingGame) {
    return adapter.enableDevSyntheticCombinedRound();
  }
  return adapter.enableDevSyntheticCombinedRound();
}

/** @deprecated — kept for test migration path; prefer enableKingSyntheticCombinedRound */
export function applyKingSyntheticCombinedMode(adapter: KingGame | KingPtGame): GameState {
  return enableKingSyntheticCombinedRound(adapter);
}

export function readSyntheticHudLabel(state: GameState, locale: 'pt' | 'en'): string | null {
  const king = getKingPtState(state);
  if (!king.devSyntheticAllNegatives) return null;
  return kingSyntheticRoundLabel(locale);
}

export function ensureSyntheticBreakdownLabel(state: GameState): void {
  const king = getKingPtState(state);
  if (!king.devSyntheticAllNegatives) return;
  if (!king.roundBreakdown.contractLabel) {
    king.roundBreakdown = initBreakdownForRound(
      king.gameIndex,
      king.contract,
      king.festaMode,
      king.activeContract,
      'pt'
    );
    king.roundBreakdown.contractLabel = kingSyntheticRoundLabel('pt');
  }
}
