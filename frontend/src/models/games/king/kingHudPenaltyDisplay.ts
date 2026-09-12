import { KingNegativeContract } from './kingContracts';

/** Contracts where face-up penalty mosaics carry strategic info. */
export const KING_PENALTY_CARD_CONTRACTS: KingNegativeContract[] = [
  'no_hearts',
  'no_queens',
  'no_men',
  'no_king_hearts'
];

export function shouldShowKingPenaltyCards(
  contract: KingNegativeContract | null | undefined
): boolean {
  if (!contract) return false;
  return KING_PENALTY_CARD_CONTRACTS.includes(contract);
}
