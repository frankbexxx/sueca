/**
 * Variant flow API (C3)
 * ---------------------
 * Typed boundary between the shared board shell and per-variant flow actions /
 * UI state reads. Does not encode scoring or legality rules — only exposes
 * what the shared shell needs instead of casting adapters.
 *
 * Note: uses type-only imports from variant games to avoid circular runtime deps.
 */

import type {
  DealingDirection,
  DealingMethod,
  GameState,
  GameVariant,
  Suit
} from '../../types/game';
import type { HeartsVariantState } from './HeartsGame';
import type { SpadesVariantState } from './SpadesGame';
import type { KingPtVariantState } from './KingPtGame';
import type { KingBidType, KingFestaChoice } from './king/kingContracts';
import type { SpadesBidType } from './spades/spadesRules';
import { resolvePresetId } from '../../constants/rulesPresets';

/** Minimal Sueca dealing / setup flow. */
export interface SuecaVariantFlow {
  kind: 'sueca';
  setDealingMethod(method: DealingMethod): void;
  setDealingDirection(direction: DealingDirection): void;
}

/** Spades bid-phase flow + state read. */
export interface SpadesVariantFlow {
  kind: 'spades';
  readState(state: GameState): SpadesVariantState;
  submitBid(playerIndex: number, bid: number, bidType: SpadesBidType): boolean;
  tickBidAi(): void;
}

/** Hearts pass / early-end flow + state read. */
export interface HeartsVariantFlow {
  kind: 'hearts';
  readState(state: GameState): HeartsVariantState;
  togglePassCard(cardIndex: number, localPlayerIndex: number): void;
  confirmPass(localPlayerIndex: number): boolean;
  acceptEarlyEnd(): void;
  declineEarlyEnd(): void;
}

/** Host methods bound into {@link KingVariantFlow}. */
export interface KingFlowHost {
  advanceKohRevealStep(): void;
  confirmKohReveal(): void;
  submitAuctionPass(playerIndex: number): void;
  submitAuctionBid(playerIndex: number, bidType: KingBidType, amount: number): void;
  acceptContract(): void;
  rejectContract(): void;
  requestHigherBid(bidType: KingBidType, amount: number): void;
  respondToHigherBid(raise: boolean, bidType?: KingBidType, amount?: number): void;
  declareEightOrNulls(): void;
  respondEightOrNulls(bidderIndex: number, offerEight: boolean): void;
  chooseFallback(choice: KingFestaChoice): void;
  setupFesta(trump: Suit | null, noTrump: boolean, firstPlayerIndex: number): void;
  dismissScorePopup(): void;
  acceptEarlyEnd(): void;
  declineEarlyEnd(): void;
  tickFestaAi(): boolean;
}

/** King PT festa / KOH / score-sheet / early-end flow. */
export interface KingVariantFlow extends KingFlowHost {
  kind: 'king';
  isPtNormal(rulesPresetId?: string): boolean;
  readPtState(state: GameState): KingPtVariantState;
  readPlayerScores(state: GameState): number[];
  readSimplifiedHandType(state: GameState): string | undefined;
}

export type VariantFlowApi =
  | SuecaVariantFlow
  | SpadesVariantFlow
  | HeartsVariantFlow
  | KingVariantFlow;

export function isSuecaFlow(api: VariantFlowApi): api is SuecaVariantFlow {
  return api.kind === 'sueca';
}

export function isSpadesFlow(api: VariantFlowApi): api is SpadesVariantFlow {
  return api.kind === 'spades';
}

export function isHeartsFlow(api: VariantFlowApi): api is HeartsVariantFlow {
  return api.kind === 'hearts';
}

export function isKingFlow(api: VariantFlowApi): api is KingVariantFlow {
  return api.kind === 'king';
}

/** Shared helper used by King adapters. */
export function readKingPlayerScores(state: GameState): number[] {
  const kingPt = state.variantState?.kingPt as { playerScores?: number[] } | undefined;
  const kingSimple = state.variantState?.kingSimplified as
    | { playerScores?: number[] }
    | undefined;
  return kingPt?.playerScores ?? kingSimple?.playerScores ?? [0, 0, 0, 0];
}

export function readKingSimplifiedHandType(state: GameState): string | undefined {
  return (state.variantState?.kingSimplified as { handType?: string } | undefined)?.handType;
}

export function isKingPtNormalPreset(rulesPresetId?: string): boolean {
  return resolvePresetId('king', rulesPresetId) === 'king-pt-normal';
}

export function createKingVariantFlow(
  host: KingFlowHost,
  readPtState: (state: GameState) => KingPtVariantState
): KingVariantFlow {
  return {
    kind: 'king',
    isPtNormal: (rulesPresetId) => isKingPtNormalPreset(rulesPresetId),
    readPtState,
    readPlayerScores: readKingPlayerScores,
    readSimplifiedHandType: readKingSimplifiedHandType,
    advanceKohRevealStep: () => host.advanceKohRevealStep(),
    confirmKohReveal: () => host.confirmKohReveal(),
    submitAuctionPass: (playerIndex) => host.submitAuctionPass(playerIndex),
    submitAuctionBid: (playerIndex, bidType, amount) =>
      host.submitAuctionBid(playerIndex, bidType, amount),
    acceptContract: () => host.acceptContract(),
    rejectContract: () => host.rejectContract(),
    requestHigherBid: (bidType, amount) => host.requestHigherBid(bidType, amount),
    respondToHigherBid: (raise, bidType, amount) =>
      host.respondToHigherBid(raise, bidType, amount),
    declareEightOrNulls: () => host.declareEightOrNulls(),
    respondEightOrNulls: (bidderIndex, offerEight) =>
      host.respondEightOrNulls(bidderIndex, offerEight),
    chooseFallback: (choice) => host.chooseFallback(choice),
    setupFesta: (trump, noTrump, firstPlayerIndex) =>
      host.setupFesta(trump, noTrump, firstPlayerIndex),
    dismissScorePopup: () => host.dismissScorePopup(),
    acceptEarlyEnd: () => host.acceptEarlyEnd(),
    declineEarlyEnd: () => host.declineEarlyEnd(),
    tickFestaAi: () => host.tickFestaAi()
  };
}

/** No-op host for King simplified (PT-only flows are unused). */
export function createNoopKingFlowHost(): KingFlowHost {
  const noop = (): void => undefined;
  return {
    advanceKohRevealStep: noop,
    confirmKohReveal: noop,
    submitAuctionPass: noop,
    submitAuctionBid: noop,
    acceptContract: noop,
    rejectContract: noop,
    requestHigherBid: noop,
    respondToHigherBid: noop,
    declareEightOrNulls: noop,
    respondEightOrNulls: noop,
    chooseFallback: noop,
    setupFesta: noop,
    dismissScorePopup: noop,
    acceptEarlyEnd: noop,
    declineEarlyEnd: noop,
    tickFestaAi: () => false
  };
}

export type VariantFlowKind = GameVariant;
