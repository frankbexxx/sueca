/**
 * Helpers to enable King Sintético combined mode on a live adapter.
 * Prefer starting with rulesPresetId: 'king-pt-synthetic' (KOH auto-enables).
 */

import type { GameState } from '../types/game';
import { KingGame } from '../models/games/KingGame';
import { KingPtGame, getKingPtState, isSyntheticAllNegatives } from '../models/games/KingPtGame';
import { kingSyntheticRoundLabel } from './kingSyntheticJump';
import { initBreakdownForRound } from '../models/games/king/kingBreakdownHelpers';

/**
 * Mark the current negative round as synthetic combined-all-negatives.
 * Call after KOH confirm when hands are already dealt (or mid-test).
 */
export function enableKingSyntheticCombinedRound(
  adapter: KingGame | KingPtGame
): GameState {
  if (adapter instanceof KingGame) {
    return adapter.enableSyntheticCombinedRound();
  }
  return adapter.enableSyntheticCombinedRound();
}

/** @deprecated — prefer enableKingSyntheticCombinedRound */
export function applyKingSyntheticCombinedMode(adapter: KingGame | KingPtGame): GameState {
  return enableKingSyntheticCombinedRound(adapter);
}

export function readSyntheticHudLabel(state: GameState, locale: 'pt' | 'en'): string | null {
  const king = getKingPtState(state);
  if (!isSyntheticAllNegatives(king)) return null;
  return kingSyntheticRoundLabel(locale);
}

export function ensureSyntheticBreakdownLabel(state: GameState): void {
  const king = getKingPtState(state);
  if (!isSyntheticAllNegatives(king)) return;
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
