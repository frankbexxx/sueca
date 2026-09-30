import { createSuecaFlowController } from './suecaFlowController';
import type { SuecaVariantFlow } from '../models/games/variantFlowApi';

describe('suecaFlowController', () => {
  it('applyDealSetup forwards dealAlignment only', () => {
    const calls: string[] = [];
    const flow: SuecaVariantFlow = {
      kind: 'sueca',
      setDealAlignment: (a) => calls.push(`align:${a}`)
    };
    createSuecaFlowController(flow).applyDealSetup('opposite');
    expect(calls).toEqual(['align:opposite']);
  });
});
