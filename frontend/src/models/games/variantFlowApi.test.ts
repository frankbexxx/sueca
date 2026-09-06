import { GameFactory } from './GameFactory';
import {
  isHeartsFlow,
  isKingFlow,
  isSpadesFlow,
  isSuecaFlow
} from './variantFlowApi';

const names = ['P1', 'P2', 'P3', 'P4'];

describe('variantFlowApi (C3)', () => {
  it('exposes typed Sueca dealing flow without casts', () => {
    const adapter = GameFactory.getAdapter('sueca');
    adapter.initialize(names);
    const flow = adapter.getVariantFlow();
    expect(isSuecaFlow(flow)).toBe(true);
    if (!isSuecaFlow(flow)) return;
    expect(() => flow.setDealingMethod('A')).not.toThrow();
    expect(() => flow.setDealingDirection('left')).not.toThrow();
  });

  it('exposes Spades bid flow + state read', () => {
    const adapter = GameFactory.getAdapter('spades');
    const state = adapter.initialize(names);
    const flow = adapter.getVariantFlow();
    expect(isSpadesFlow(flow)).toBe(true);
    if (!isSpadesFlow(flow)) return;
    const vs = flow.readState(state);
    expect(typeof vs.waitingForBids).toBe('boolean');
    expect(typeof flow.submitBid).toBe('function');
    expect(typeof flow.tickBidAi).toBe('function');
  });

  it('exposes Hearts pass / early-end flow + state read', () => {
    const adapter = GameFactory.getAdapter('hearts');
    const state = adapter.initialize(names);
    const flow = adapter.getVariantFlow();
    expect(isHeartsFlow(flow)).toBe(true);
    if (!isHeartsFlow(flow)) return;
    const vs = flow.readState(state);
    expect(Array.isArray(vs.playerScores)).toBe(true);
    expect(typeof flow.togglePassCard).toBe('function');
    expect(typeof flow.confirmPass).toBe('function');
    expect(typeof flow.acceptEarlyEnd).toBe('function');
    expect(typeof flow.declineEarlyEnd).toBe('function');
  });

  it('exposes King PT flow methods via discriminated kind', () => {
    const adapter = GameFactory.getAdapter('king');
    const state = adapter.initialize(names, { rulesPresetId: 'king-pt-normal' });
    const flow = adapter.getVariantFlow();
    expect(isKingFlow(flow)).toBe(true);
    if (!isKingFlow(flow)) return;
    expect(flow.isPtNormal('king-pt-normal')).toBe(true);
    expect(flow.readPtState(state).phase).toBeTruthy();
    expect(flow.readPlayerScores(state)).toHaveLength(4);
    expect(typeof flow.tickFestaAi).toBe('function');
    expect(typeof flow.acceptEarlyEnd).toBe('function');
  });

  it('narrows early-end accept to hearts or king only', () => {
    for (const variant of ['hearts', 'king'] as const) {
      const adapter = GameFactory.getAdapter(variant);
      adapter.initialize(names, variant === 'king' ? { rulesPresetId: 'king-pt-normal' } : undefined);
      const flow = adapter.getVariantFlow();
      expect(isHeartsFlow(flow) || isKingFlow(flow)).toBe(true);
      if (isHeartsFlow(flow) || isKingFlow(flow)) {
        expect(() => flow.acceptEarlyEnd()).not.toThrow();
      }
    }

    const sueca = GameFactory.getAdapter('sueca').getVariantFlow();
    expect(isSuecaFlow(sueca)).toBe(true);
    expect('acceptEarlyEnd' in sueca).toBe(false);
  });
});
