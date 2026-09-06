import { createSuecaFlowController } from './suecaFlowController';
import type { SuecaVariantFlow } from '../models/games/variantFlowApi';

describe('suecaFlowController', () => {
  it('applyDealSetup forwards method and direction', () => {
    const calls: string[] = [];
    const flow: SuecaVariantFlow = {
      kind: 'sueca',
      setDealingMethod: (m) => calls.push(`method:${m}`),
      setDealingDirection: (d) => calls.push(`dir:${d}`)
    };
    createSuecaFlowController(flow).applyDealSetup('B', 'right');
    expect(calls).toEqual(['method:B', 'dir:right']);
  });
});
