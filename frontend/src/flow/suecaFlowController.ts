/**
 * Sueca flow controller (C4) — dealing setup coordination only.
 * No rules, no mutable state, no JSX.
 */

import type { DealAlignment } from '../types/game';
import type { SuecaVariantFlow } from '../models/games/variantFlowApi';

export interface SuecaFlowController {
  applyDealSetup(alignment: DealAlignment): void;
}

export function createSuecaFlowController(flow: SuecaVariantFlow): SuecaFlowController {
  return {
    applyDealSetup(alignment) {
      flow.setDealAlignment(alignment);
    }
  };
}
