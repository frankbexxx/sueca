import { GameVariant } from '../../types/game';
import { EncodedDecisionState } from '../encoder/types';
import { RulesContext } from './types';

export function buildRulesContext(
  variant: GameVariant,
  encodedState: EncodedDecisionState
): RulesContext {
  switch (variant) {
    case 'sueca':
      return {
        variant,
        objectiveShort: 'Win tricks; protect trumps; partner awareness',
        mandatoryRules: [],
      };
    case 'spades':
      return {
        variant,
        objectiveShort: 'Meet bid; avoid bags; partner support',
        contractSummary: encodedState.contractId ?? undefined,
      };
    case 'hearts':
      return {
        variant,
        objectiveShort:
          'Avoid points; Q♠ danger; do not take unnecessary tricks',
        mandatoryRules: ['Do not win tricks cheaply like Sueca — minimize points taken'],
      };
    case 'king': {
      const contractSummary =
        encodedState.contractId ??
        (encodedState.variantEncoding &&
        'contractId' in encodedState.variantEncoding
          ? String(
              (encodedState.variantEncoding as { contractId?: string | null })
                .contractId ?? ''
            )
          : undefined);
      return {
        variant,
        objectiveShort:
          'Contract-first — fulfill active contract before generic trick play',
        contractSummary: contractSummary || undefined,
        mandatoryRules: [
          'Active contract (K00) takes priority over generic trick-winning',
        ],
      };
    }
    default:
      return {
        variant,
        objectiveShort: 'Play legally within variant rules',
      };
  }
}
