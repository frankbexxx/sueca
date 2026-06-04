import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { buildMiniLLMInput } from './buildMiniLLMInput';
import { getMiniLLMAdvice } from './getMiniLLMAdvice';
import { createMockProvider } from './mockProvider';

jest.mock('../../config/features', () => ({
  CARD_INTELLIGENCE_LLM_ADVISORY: false,
}));

describe('getMiniLLMAdvice', () => {
  function makeInput() {
    const legalMoves = [
      { suit: 'clubs', rank: '2', id: '2c' },
      { suit: 'hearts', rank: '3', id: '3h' },
    ];
    const event = createTestLogEvent({
      variant: 'sueca',
      handBefore: [...legalMoves],
      legalMoves,
      chosenCard: legalMoves[0],
    });
    return buildMiniLLMInput({
      event,
      legalMoves: event.legalMoves,
      fallbackMove: event.legalMoves[0],
    });
  }

  it('returns disabled when flag off', async () => {
    const input = makeInput();
    const result = await getMiniLLMAdvice(input);
    expect(result.mode).toBe('disabled');
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe('disabled');
  });

  it('runs advisory with forceAdvisory and mock provider', async () => {
    const input = makeInput();
    const result = await getMiniLLMAdvice(input, {
      forceAdvisory: true,
      provider: createMockProvider('valid_fallback_index'),
    });
    expect(result.mode).toBe('advisory');
    expect(result.advisoryCard.id).toBe('2c');
    expect(result.validByEngine).toBe(true);
  });

  it('falls back on illegal mock output', async () => {
    const input = makeInput();
    const result = await getMiniLLMAdvice(input, {
      forceAdvisory: true,
      provider: createMockProvider('illegal_card'),
    });
    expect(result.usedFallback).toBe(true);
    expect(result.advisoryCard.id).toBe('2c');
  });

  it('does not mutate input event via encoded state reference', async () => {
    const event = createTestLogEvent({
      variant: 'sueca',
      eventId: 'immutable-llm',
      handBefore: [{ suit: 'clubs', rank: '2', id: '2c' }],
      legalMoves: [{ suit: 'clubs', rank: '2', id: '2c' }],
      chosenCard: { suit: 'clubs', rank: '2', id: '2c' },
    });
    const snapshot = JSON.stringify(event);
    const input = buildMiniLLMInput({
      event,
      legalMoves: event.legalMoves,
      fallbackMove: event.legalMoves[0],
    });
    await getMiniLLMAdvice(input, { forceAdvisory: true });
    expect(JSON.stringify(event)).toBe(snapshot);
  });
});
