import { createTestLogEvent } from '../encoder/encodeDecisionState';
import { buildMiniLLMInput } from './buildMiniLLMInput';
import { createMockProvider } from './mockProvider';
import { validateLLMOutput } from './validateLLMOutput';
import { MINI_LLM_SCHEMA_VERSION } from './types';

describe('validateLLMOutput', () => {
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

  it('accepts valid mock output', () => {
    const input = makeInput();
    const raw = {
      schemaVersion: MINI_LLM_SCHEMA_VERSION,
      requestId: input.requestId,
      selectedCard: input.legalMoves[0],
      selectedCardIndex: 0,
      confidence: 'medium' as const,
      reasonShort: 'ok',
      consideredMetricIds: [],
      fallbackRecommended: false,
      modelId: 'mock',
      latencyMs: 0,
      validByEngine: null,
    };
    const result = validateLLMOutput(input, raw);
    expect(result.validByEngine).toBe(true);
    expect(result.usedFallback).toBe(false);
  });

  it('rejects illegal card', () => {
    const input = makeInput();
    const raw = {
      schemaVersion: MINI_LLM_SCHEMA_VERSION,
      requestId: input.requestId,
      selectedCard: { suit: 'spades', rank: 'A', id: 'fake' },
      selectedCardIndex: 0,
      confidence: 'high' as const,
      reasonShort: 'bad',
      consideredMetricIds: [],
      fallbackRecommended: false,
      modelId: 'mock',
      latencyMs: 0,
      validByEngine: null,
    };
    const result = validateLLMOutput(input, raw);
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe('illegal_card');
  });

  it('uses fallback when fallbackRecommended', () => {
    const input = makeInput();
    const result = validateLLMOutput(input, {
      schemaVersion: MINI_LLM_SCHEMA_VERSION,
      requestId: input.requestId,
      selectedCard: input.legalMoves[1],
      selectedCardIndex: 1,
      confidence: 'low' as const,
      reasonShort: 'unsure',
      consideredMetricIds: [],
      fallbackRecommended: true,
      modelId: 'mock',
      latencyMs: 0,
      validByEngine: null,
    });
    expect(result.fallbackReason).toBe('fallback_recommended');
  });
});

describe('mockProvider', () => {
  it('returns legal fallback card', async () => {
    const legalMoves = [{ suit: 'clubs', rank: '2', id: '2c' }];
    const event = createTestLogEvent({
      variant: 'spades',
      handBefore: [...legalMoves],
      legalMoves,
      chosenCard: legalMoves[0],
    });
    const input = buildMiniLLMInput({
      event,
      legalMoves: event.legalMoves,
      fallbackMove: event.legalMoves[0],
    });
    const provider = createMockProvider('valid_fallback_index');
    const out = await provider.complete('prompt', input);
    expect(out.selectedCardIndex).toBe(0);
  });
});
