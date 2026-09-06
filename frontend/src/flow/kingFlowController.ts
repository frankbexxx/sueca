/**
 * King flow controller (C4) — festa / KOH / score popup / early-end coordination.
 * No rules, no mutable state, no JSX.
 */

import type { GameState, Suit } from '../types/game';
import type { KingVariantFlow } from '../models/games/variantFlowApi';
import type { KingPtVariantState } from '../models/games/KingPtGame';
import type { KingBidType, KingFestaChoice } from '../models/games/king/kingContracts';

export type KingPtOverlay = 'koh_reveal' | 'festa' | 'score_popup';

export type KingFestaUiAction =
  | { type: 'auction_pass'; playerIndex: number }
  | { type: 'auction_bid'; playerIndex: number; bidType: KingBidType; amount: number }
  | { type: 'accept_contract' }
  | { type: 'reject_contract' }
  | { type: 'request_higher'; bidType: KingBidType; amount: number }
  | { type: 'respond_higher'; raise: boolean; bidType?: KingBidType; amount?: number }
  | { type: 'declare_eight_or_nulls' }
  | { type: 'respond_eight'; targetIndex: number; offerEight: boolean }
  | { type: 'fallback'; choice: KingFestaChoice }
  | { type: 'setup'; trump: Suit | null; noTrump: boolean; firstPlayerIndex: number };

export interface KingFlowController {
  isPtNormal(rulesPresetId?: string): boolean;
  readPtState(state: GameState): KingPtVariantState;
  readPlayerScores(state: GameState): number[];
  readSimplifiedHandType(state: GameState): string | undefined;
  isInFestaFlow(king: KingPtVariantState): boolean;
  buildFestaSyncKey(king: KingPtVariantState): string;
  shouldTickFestaAi(
    state: GameState,
    rulesPresetId: string | undefined
  ): boolean;
  tickFestaAi(): boolean;
  /** After shared round-continue — nudge festa AI if PT. */
  afterContinueToNextRound(): void;
  shouldSuppressRoundEndModal(state: GameState, rulesPresetId?: string): boolean;
  resolvePtOverlay(state: GameState, rulesPresetId?: string): KingPtOverlay | null;
  advanceKohRevealStep(): void;
  confirmKohReveal(): void;
  dispatchFestaAction(action: KingFestaUiAction): void;
  dismissScorePopup(): void;
  resolveEarlyEnd(accept: boolean): void;
}

export function isKingInFestaFlow(king: KingPtVariantState): boolean {
  return (
    king.festaPhase === 'auction' ||
    king.festaPhase === 'negotiation' ||
    king.festaPhase === 'negotiation_counter' ||
    king.waitingForFallback ||
    king.waitingForFestaSetup ||
    king.eightOrNullsPending
  );
}

export function buildKingFestaSyncKey(king: KingPtVariantState): string {
  return [
    king.festaPhase,
    king.auctionTurnIndex,
    king.bestBid?.bidderIndex,
    king.bestBid?.amount,
    king.requestedBid?.amount,
    king.waitingForFallback,
    king.waitingForFestaSetup,
    king.eightOrNullsPending,
    king.eightOrNullsTarget
  ].join('|');
}

export function createKingFlowController(flow: KingVariantFlow): KingFlowController {
  return {
    isPtNormal(rulesPresetId) {
      return flow.isPtNormal(rulesPresetId);
    },

    readPtState(state) {
      return flow.readPtState(state);
    },

    readPlayerScores(state) {
      return flow.readPlayerScores(state);
    },

    readSimplifiedHandType(state) {
      return flow.readSimplifiedHandType(state);
    },

    isInFestaFlow: isKingInFestaFlow,

    buildFestaSyncKey: buildKingFestaSyncKey,

    shouldTickFestaAi(state, rulesPresetId) {
      if (!flow.isPtNormal(rulesPresetId)) return false;
      if (!state.waitingForRoundStart) return false;
      return isKingInFestaFlow(flow.readPtState(state));
    },

    tickFestaAi() {
      return flow.tickFestaAi();
    },

    afterContinueToNextRound() {
      flow.tickFestaAi();
    },

    shouldSuppressRoundEndModal(state, rulesPresetId) {
      if (!flow.isPtNormal(rulesPresetId)) return false;
      return Boolean(flow.readPtState(state).showScorePopup);
    },

    resolvePtOverlay(state, rulesPresetId) {
      if (!flow.isPtNormal(rulesPresetId)) return null;
      const king = flow.readPtState(state);
      if (king.phase === 'koh_reveal' && state.waitingForRoundStart) return 'koh_reveal';
      if (isKingInFestaFlow(king) && state.waitingForRoundStart) return 'festa';
      if (king.showScorePopup) return 'score_popup';
      return null;
    },

    advanceKohRevealStep() {
      flow.advanceKohRevealStep();
    },

    confirmKohReveal() {
      flow.confirmKohReveal();
    },

    dispatchFestaAction(action) {
      switch (action.type) {
        case 'auction_pass':
          flow.submitAuctionPass(action.playerIndex);
          break;
        case 'auction_bid':
          flow.submitAuctionBid(action.playerIndex, action.bidType, action.amount);
          break;
        case 'accept_contract':
          flow.acceptContract();
          break;
        case 'reject_contract':
          flow.rejectContract();
          break;
        case 'request_higher':
          flow.requestHigherBid(action.bidType, action.amount);
          break;
        case 'respond_higher':
          flow.respondToHigherBid(action.raise, action.bidType, action.amount);
          break;
        case 'declare_eight_or_nulls':
          flow.declareEightOrNulls();
          break;
        case 'respond_eight':
          flow.respondEightOrNulls(action.targetIndex, action.offerEight);
          break;
        case 'fallback':
          flow.chooseFallback(action.choice);
          break;
        case 'setup':
          flow.setupFesta(action.trump, action.noTrump, action.firstPlayerIndex);
          break;
        default: {
          const _exhaustive: never = action;
          return _exhaustive;
        }
      }
    },

    dismissScorePopup() {
      flow.dismissScorePopup();
    },

    resolveEarlyEnd(accept) {
      if (accept) flow.acceptEarlyEnd();
      else flow.declineEarlyEnd();
    }
  };
}
