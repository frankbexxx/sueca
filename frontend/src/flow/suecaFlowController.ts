/**
 * Sueca flow controller (C4) — dealing setup coordination only.
 * No rules, no mutable state, no JSX.
 */

import type { DealingDirection, DealingMethod } from '../types/game';
import type { SuecaVariantFlow } from '../models/games/variantFlowApi';

export interface SuecaFlowController {
  applyDealSetup(method: DealingMethod, direction: DealingDirection): void;
}

export function createSuecaFlowController(flow: SuecaVariantFlow): SuecaFlowController {
  return {
    applyDealSetup(method, direction) {
      flow.setDealingMethod(method);
      flow.setDealingDirection(direction);
    }
  };
}
