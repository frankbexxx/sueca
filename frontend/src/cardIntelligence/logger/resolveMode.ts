import { GameState } from '../../types/game';

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function resolveMode(
  state: GameState,
  gameConfigMode?: string | null
): string | null {
  const variantState = state.variantState as Record<string, unknown> | undefined;

  if (variantState) {
    const contractId = readString(variantState.contractId);
    if (contractId) return contractId;

    const preset = readString(variantState.rulesPresetId);
    if (preset) return preset;

    const handType = readString(variantState.handType);
    if (handType) return handType;
  }

  if (gameConfigMode) return gameConfigMode;

  return null;
}

export function resolveContract(state: GameState): string | null {
  const variantState = state.variantState as Record<string, unknown> | undefined;
  if (!variantState) return null;
  return readString(variantState.contractId);
}
