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

/** Compact current-hand line: tricks / team bid (e.g. `4/6`). */
export function formatSpadesTricksBidLine(tricks: number, bid: number): string {
  const t = Number.isFinite(tricks) ? Math.max(0, Math.floor(tricks)) : 0;
  const b = Number.isFinite(bid) ? Math.max(0, Math.floor(bid)) : 0;
  return `${t}/${b}`;
}

export function getTeamTricks(spades: SpadesVariantState, team: 1 | 2): number {
  return team === 1 ? spades.team1Tricks : spades.team2Tricks;
}

export function getTeamBid(spades: SpadesVariantState, team: 1 | 2): number {
  return team === 1 ? spades.team1Bid : spades.team2Bid;
}

export type SpadesBrokenVisual = SuitBrokenVisual;

/** @deprecated Prefer resolveSuitBrokenVisual — kept for Spades call sites. */
export function resolveSpadesBrokenVisual(spadesBroken: boolean): SpadesBrokenVisual {
  return resolveSuitBrokenVisual(spadesBroken);
}
