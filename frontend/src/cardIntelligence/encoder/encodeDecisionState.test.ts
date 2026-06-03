import { createTestLogEvent, encodeDecisionState } from './encodeDecisionState';
import { EngineViewNotSupportedError } from './types';

const card = (suit: 'clubs' | 'hearts' | 'spades' | 'diamonds', rank: string, id: string) =>
  ({ suit, rank, id }) as import('../../types/game').Card;

describe('encodeDecisionState', () => {
  it('encodes basic sueca post_decision', () => {
    const event = createTestLogEvent({
      variant: 'sueca',
      trumpSuit: 'spades',
      handBefore: [card('clubs', 'A', 'Ac'), card('hearts', '2', '2h')],
      legalMoves: [card('clubs', 'A', 'Ac'), card('hearts', '2', '2h')],
      chosenCard: card('clubs', 'A', 'Ac'),
      variantFields: { partnerIndex: 2, teamIndex: 1 },
    });
    const state = encodeDecisionState({ event });
    expect(state.schemaVersion).toBe('4.0.0');
    expect(state.viewType).toBe('player');
    expect(state.encodeMode).toBe('post_decision');
    expect(state.chosenCard?.id).toBe('Ac');
    expect(state.hiddenInformationPolicy.excludedFields).toContain('opponentHands');
  });

  it('Player View does not expose opponent hands', () => {
    const event = createTestLogEvent({
      variant: 'sueca',
      handBefore: [card('clubs', '2', '2c')],
      legalMoves: [card('clubs', '2', '2c')],
    });
    const state = encodeDecisionState({ event });
    expect(state.hand).toHaveLength(1);
    expect(state.hiddenInformationPolicy.excludedFields).toContain('opponentHands');
    expect(state.availableInformation.hidden).toContain('opponentHands');
    expect(JSON.stringify(state)).not.toMatch(/"opponentHands":\s*\[/);
  });

  it('pre_decision sets chosenCard null', () => {
    const event = createTestLogEvent({ variant: 'sueca' });
    const state = encodeDecisionState({ event, encodeMode: 'pre_decision' });
    expect(state.chosenCard).toBeNull();
  });

  it('throws on engine view without allowEngineView', () => {
    const event = createTestLogEvent({ variant: 'sueca' });
    expect(() => encodeDecisionState({ event, viewType: 'engine' })).toThrow(
      EngineViewNotSupportedError
    );
  });

  it('allows engine view in tests with flag', () => {
    const event = createTestLogEvent({ variant: 'sueca' });
    const state = encodeDecisionState(
      { event, viewType: 'engine' },
      { allowEngineView: true }
    );
    expect(state.viewType).toBe('engine');
  });

  it('output has no classification fields', () => {
    const event = createTestLogEvent({ variant: 'king' });
    const json = JSON.stringify(encodeDecisionState({ event }));
    expect(json).not.toContain('"classification"');
    expect(json).not.toContain('"good"');
    expect(json).not.toContain('"bad"');
  });
});
