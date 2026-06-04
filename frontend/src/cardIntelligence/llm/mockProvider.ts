import {
  MINI_LLM_SCHEMA_VERSION,
  MiniLLMDecisionInput,
  MiniLLMDecisionOutput,
  MiniLLMProvider,
} from './types';

export type MockProviderBehavior =
  | 'valid_fallback_index'
  | 'illegal_card'
  | 'invalid_index'
  | 'fallback_recommended'
  | 'throw';

export function createMockProvider(
  behavior: MockProviderBehavior = 'valid_fallback_index'
): MiniLLMProvider {
  return {
    id: 'mock:local-stub-v0',
    async complete(
      _prompt: string,
      input: MiniLLMDecisionInput
    ): Promise<MiniLLMDecisionOutput> {
      if (behavior === 'throw') {
        throw new Error('mock provider error');
      }

      if (behavior === 'invalid_index') {
        return {
          schemaVersion: MINI_LLM_SCHEMA_VERSION,
          requestId: input.requestId,
          selectedCard: input.fallbackMove,
          selectedCardIndex: 999,
          confidence: 'medium',
          reasonShort: 'invalid index test',
          consideredMetricIds: [],
          fallbackRecommended: false,
          modelId: 'mock:local-stub-v0',
          latencyMs: 0,
          validByEngine: null,
        };
      }

      if (behavior === 'illegal_card') {
        return {
          schemaVersion: MINI_LLM_SCHEMA_VERSION,
          requestId: input.requestId,
          selectedCard: { suit: 'spades', rank: 'A', id: 'fake-illegal' },
          selectedCardIndex: 0,
          confidence: 'high',
          reasonShort: 'illegal card test',
          consideredMetricIds: [],
          fallbackRecommended: false,
          modelId: 'mock:local-stub-v0',
          latencyMs: 0,
          validByEngine: null,
        };
      }

      if (behavior === 'fallback_recommended') {
        return {
          schemaVersion: MINI_LLM_SCHEMA_VERSION,
          requestId: input.requestId,
          selectedCard: input.fallbackMove,
          selectedCardIndex: input.fallbackMoveIndex,
          confidence: 'low',
          reasonShort: 'prefer fallback',
          consideredMetricIds: [],
          fallbackRecommended: true,
          modelId: 'mock:local-stub-v0',
          latencyMs: 0,
          validByEngine: null,
        };
      }

      return {
        schemaVersion: MINI_LLM_SCHEMA_VERSION,
        requestId: input.requestId,
        selectedCard: input.fallbackMove,
        selectedCardIndex: input.fallbackMoveIndex,
        confidence: 'medium',
        reasonShort: 'Mock stub — baseline heuristic move.',
        consideredMetricIds: input.metricContext
          .filter((m) => m.applicable)
          .map((m) => m.metricId)
          .slice(0, 3),
        fallbackRecommended: false,
        modelId: 'mock:local-stub-v0',
        latencyMs: 0,
        validByEngine: null,
      };
    },
  };
}

let defaultProvider: MiniLLMProvider | null = null;

export function getDefaultMockProvider(): MiniLLMProvider {
  if (!defaultProvider) {
    defaultProvider = createMockProvider('valid_fallback_index');
  }
  return defaultProvider;
}

export function setMockProviderForTests(provider: MiniLLMProvider | null): void {
  defaultProvider = provider;
}
