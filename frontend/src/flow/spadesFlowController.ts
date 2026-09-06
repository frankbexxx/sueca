/**
 * Spades flow controller (C4) — bid-phase coordination.
 * No rules, no mutable state, no JSX.
 */

import type { GameState, Player } from '../types/game';
import type { SpadesVariantFlow } from '../models/games/variantFlowApi';
import type { SpadesBidType } from '../models/games/spades/spadesRules';
import type { SpadesVariantState } from '../models/games/SpadesGame';

export interface SpadesBidAiGateInput {
  bidActive: boolean;
  state: GameState;
  localPlayerIndex: number;
  /** Optional cached read; otherwise read from flow. */
  spadesState?: SpadesVariantState;
}

export interface SpadesFlowController {
  readState(state: GameState): SpadesVariantState;
  isLocalBidTurn(
    spadesState: SpadesVariantState,
    bidActive: boolean,
    localPlayerIndex: number
  ): boolean;
  /** True when an AI bidder should receive tickBidAi. */
  shouldTickBidAi(input: SpadesBidAiGateInput): boolean;
  submitHumanBid(playerIndex: number, bid: number, bidType: SpadesBidType): boolean;
  tickBidAi(): void;
}

export function createSpadesFlowController(flow: SpadesVariantFlow): SpadesFlowController {
  return {
    readState(state) {
      return flow.readState(state);
    },

    isLocalBidTurn(spadesState, bidActive, localPlayerIndex) {
      return bidActive && spadesState.currentBidderIndex === localPlayerIndex;
    },

    shouldTickBidAi({ bidActive, state, localPlayerIndex, spadesState }) {
      if (!bidActive) return false;
      const vs = spadesState ?? flow.readState(state);
      const bidderIndex = vs.currentBidderIndex;
      const bidder: Player | undefined = state.players[bidderIndex];
      if (!bidder) return false;
      if (bidder.type === 'human') return false;
      if (bidderIndex === localPlayerIndex) return false;
      return true;
    },

    submitHumanBid(playerIndex, bid, bidType) {
      return flow.submitBid(playerIndex, bid, bidType);
    },

    tickBidAi() {
      flow.tickBidAi();
    }
  };
}
