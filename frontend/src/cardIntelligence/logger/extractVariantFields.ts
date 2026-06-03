import { GameState, GameVariant } from '../../types/game';
import {
  HeartsLogFields,
  KingLogFields,
  SpadesLogFields,
  SuecaLogFields,
  VariantLogFields,
} from '../shared/types/variantLogFields';

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function extractVariantFields(
  variant: GameVariant,
  state: GameState,
  playerIndex: number
): VariantLogFields {
  const variantState = (state.variantState ?? {}) as Record<string, unknown>;
  const player = state.players[playerIndex];
  const teamIndex = (player?.team ?? 1) as 1 | 2;

  switch (variant) {
    case 'sueca':
      return {
        partnerIndex: (playerIndex + 2) % 4,
        teamIndex,
      } satisfies SuecaLogFields;
    case 'spades': {
      const bids = variantState.bids;
      const bidFromArray =
        Array.isArray(bids) && typeof bids[playerIndex] === 'number'
          ? (bids[playerIndex] as number)
          : null;
      return {
        playerBid: readNumber(variantState.playerBid ?? bidFromArray),
        teamBid: readNumber(variantState.teamBid),
        spadesBroken: readBoolean(variantState.spadesBroken),
      } satisfies SpadesLogFields;
    }
    case 'hearts':
      return {
        heartsBroken: readBoolean(variantState.heartsBroken),
        passDirection: readString(variantState.passDirection),
      } satisfies HeartsLogFields;
    case 'king':
      return {
        contractId: readString(variantState.contractId),
        contractType: readString(variantState.contractType),
        festaPhase: readString(variantState.festaPhase),
        noTrump: readBoolean(variantState.noTrump),
        syntheticMode: readBoolean(variantState.syntheticMode),
      } satisfies KingLogFields;
    default:
      return { partnerIndex: (playerIndex + 2) % 4, teamIndex } satisfies SuecaLogFields;
  }
}
