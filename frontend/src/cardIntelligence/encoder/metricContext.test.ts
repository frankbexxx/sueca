import { createTestLogEvent, encodeDecisionState } from './encodeDecisionState';

describe('metricContext', () => {
  it('always includes T01 for play phase', () => {
    const event = createTestLogEvent({ variant: 'sueca' });
    const state = encodeDecisionState({ event });
    const t01 = state.metricContext.find((m) => m.metricId === 'T01');
    expect(t01).toBeDefined();
    expect(t01?.applicable).toBe(true);
    expect(t01?.reasonShort).not.toMatch(/bad|good|má|boa/i);
  });

  it('lists sueca P0 metrics without classification', () => {
    const event = createTestLogEvent({
      variant: 'sueca',
      trumpSuit: 'spades',
      trickBefore: [],
      handBefore: [{ suit: 'clubs', rank: '7', id: '7c' }],
      legalMoves: [{ suit: 'clubs', rank: '7', id: '7c' }],
      chosenCard: { suit: 'clubs', rank: '7', id: '7c' },
      variantFields: { partnerIndex: 2, teamIndex: 1 },
    });
    const ids = encodeDecisionState({ event }).metricContext.map((m) => m.metricId);
    expect(ids).toContain('S16');
    expect(ids).toContain('S08');
    for (const entry of encodeDecisionState({ event }).metricContext) {
      expect(entry).not.toHaveProperty('classification');
    }
  });
});
