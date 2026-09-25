import { KingNegativeContract } from './kingContracts';

/** Contracts where face-up penalty mosaics carry strategic info. */
export const KING_PENALTY_CARD_CONTRACTS: KingNegativeContract[] = [
  'no_hearts',
  'no_queens',
  'no_men',
  'no_king_hearts'
];

/**
 * Whether the status strip should show captured special-card miniatures.
 * Synthetic combined negatives reuse the same mosaics even though `contract`
 * is the engine placeholder `no_tricks`.
 */
export function shouldShowKingPenaltyCards(
  contract: KingNegativeContract | null | undefined,
  options?: { syntheticAllNegatives?: boolean }
): boolean {
  if (options?.syntheticAllNegatives) return true;
  if (!contract) return false;
  return KING_PENALTY_CARD_CONTRACTS.includes(contract);
}
