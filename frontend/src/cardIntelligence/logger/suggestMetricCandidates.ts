import { GameVariant } from '../../types/game';

const BASE_BY_VARIANT: Record<GameVariant, string[]> = {
  sueca: ['S08', 'S12', 'S16', 'T01'],
  spades: ['SP09', 'SP06', 'SP01', 'T01'],
  hearts: ['H11', 'H13', 'H01', 'T01'],
  king: ['K00', 'K02', 'K03', 'T01'],
};

export function suggestMetricCandidates(
  variant: GameVariant,
  variantState: Record<string, unknown> | undefined
): string[] {
  const ids = [...BASE_BY_VARIANT[variant]];
  if (variant === 'spades' && variantState?.bidMet === true && !ids.includes('T06')) {
    ids.push('T06');
  }
  return ids;
}
