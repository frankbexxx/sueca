import { SpadesVariantState } from '../models/games/SpadesGame';
import { resolveSuitBrokenVisual, SuitBrokenVisual } from './suitBrokenStatus';

/** Soft highlight when bags approach the −100 penalty (every 10). */
export const SPADES_BAG_WARN_FROM = 8;

export function getTeamBags(spades: SpadesVariantState, team: 1 | 2): number {
  return team === 1 ? spades.team1Bags : spades.team2Bags;
}

export function isBagsNearPenalty(bags: number): boolean {
  return bags >= SPADES_BAG_WARN_FROM;
}

export function formatSpadesBagsLine(bags: number, bagsWord: string): string {
  return `${bags} ${bagsWord}`;
}

export type SpadesBrokenVisual = SuitBrokenVisual;

/** @deprecated Prefer resolveSuitBrokenVisual — kept for Spades call sites. */
export function resolveSpadesBrokenVisual(spadesBroken: boolean): SpadesBrokenVisual {
  return resolveSuitBrokenVisual(spadesBroken);
}
