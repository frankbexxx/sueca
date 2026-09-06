/**
 * Factory: pick the active variant flow controller from a VariantFlowApi.
 */

import type { VariantFlowApi } from '../models/games/variantFlowApi';
import {
  isHeartsFlow,
  isKingFlow,
  isSpadesFlow,
  isSuecaFlow
} from '../models/games/variantFlowApi';
import { createSuecaFlowController, SuecaFlowController } from './suecaFlowController';
import { createSpadesFlowController, SpadesFlowController } from './spadesFlowController';
import { createHeartsFlowController, HeartsFlowController } from './heartsFlowController';
import { createKingFlowController, KingFlowController } from './kingFlowController';

export interface VariantFlowControllers {
  sueca: SuecaFlowController | null;
  spades: SpadesFlowController | null;
  hearts: HeartsFlowController | null;
  king: KingFlowController | null;
}

export function createVariantFlowControllers(
  flow: VariantFlowApi | null | undefined
): VariantFlowControllers {
  return {
    sueca: flow && isSuecaFlow(flow) ? createSuecaFlowController(flow) : null,
    spades: flow && isSpadesFlow(flow) ? createSpadesFlowController(flow) : null,
    hearts: flow && isHeartsFlow(flow) ? createHeartsFlowController(flow) : null,
    king: flow && isKingFlow(flow) ? createKingFlowController(flow) : null
  };
}
