/**
 * Hearts flow controller (C4) — pass + early-end coordination.
 * No rules, no mutable state, no JSX.
 */

import type { GameState } from '../types/game';
import type { HeartsVariantFlow } from '../models/games/variantFlowApi';
import type { HeartsVariantState } from '../models/games/HeartsGame';

export interface HeartsFlowController {
  readState(state: GameState): HeartsVariantState;
  isPassing(state: GameState): boolean;
  /** Toggle pass selection when in pass phase; returns true if handled. */
  togglePassCardIfPassing(
    state: GameState,
    cardIndex: number,
    localPlayerIndex: number
  ): boolean;
  confirmPass(localPlayerIndex: number): boolean;
  resolveEarlyEnd(accept: boolean): void;
}

export function createHeartsFlowController(flow: HeartsVariantFlow): HeartsFlowController {
  return {
    readState(state) {
      return flow.readState(state);
    },

    isPassing(state) {
      return Boolean(flow.readState(state).waitingForPass);
    },

    togglePassCardIfPassing(state, cardIndex, localPlayerIndex) {
      if (!flow.readState(state).waitingForPass) return false;
      flow.togglePassCard(cardIndex, localPlayerIndex);
      return true;
    },

    confirmPass(localPlayerIndex) {
      return flow.confirmPass(localPlayerIndex);
    },

    resolveEarlyEnd(accept) {
      if (accept) flow.acceptEarlyEnd();
      else flow.declineEarlyEnd();
    }
  };
}
