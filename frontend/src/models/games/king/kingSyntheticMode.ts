/**
 * King Sintético product-mode helpers.
 * Distinct from KingSimplifiedGame and from cardIntelligence syntheticMode.
 */

import { resolvePresetId, type RulesPresetId } from '../../../constants/rulesPresets';
import type { GameState } from '../../../types/game';

export function isKingSyntheticPreset(rulesPresetId?: string): boolean {
  return resolvePresetId('king', rulesPresetId) === 'king-pt-synthetic';
}

/** King PT engine path: normal 10-game or synthetic 5-game. */
export function isKingPtEnginePreset(rulesPresetId?: string): boolean {
  const id = resolvePresetId('king', rulesPresetId);
  return id === 'king-pt-normal' || id === 'king-pt-synthetic';
}

export function readKingRulesPresetId(state: GameState): RulesPresetId {
  return resolvePresetId('king', state.variantState?.rulesPresetId as string | undefined);
}

/**
 * Active King Sintético match (game 1 combined or later Festas with 5-game display).
 * Prefer durable preset on state; engine flag covers mid-round game 1.
 */
export function isKingSyntheticSession(
  stateOrPreset: GameState | string | undefined,
  engineFlag?: boolean
): boolean {
  if (typeof stateOrPreset === 'string' || stateOrPreset === undefined) {
    return isKingSyntheticPreset(stateOrPreset) || Boolean(engineFlag);
  }
  const preset = readKingRulesPresetId(stateOrPreset);
  const flag = Boolean(
    (
      stateOrPreset.variantState?.kingPt as
        | { syntheticAllNegatives?: boolean; devSyntheticAllNegatives?: boolean }
        | undefined
    )?.syntheticAllNegatives ??
      (
        stateOrPreset.variantState?.kingPt as
          | { syntheticAllNegatives?: boolean; devSyntheticAllNegatives?: boolean }
          | undefined
      )?.devSyntheticAllNegatives
  );
  return isKingSyntheticPreset(preset) || flag || Boolean(engineFlag);
}
