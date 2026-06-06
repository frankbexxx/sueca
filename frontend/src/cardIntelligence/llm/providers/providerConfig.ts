import {
  CARD_INTELLIGENCE_LLM_ENDPOINT,
  CARD_INTELLIGENCE_LLM_MODEL,
  CARD_INTELLIGENCE_LLM_PROVIDER,
} from '../../../config/features';
import { getDefaultMockProvider } from '../mockProvider';
import { MiniLLMProvider } from '../types';
import { createOllamaProvider, isOllamaConfigured } from './ollamaProvider';

export type LlmProviderKind = 'mock' | 'ollama';

export interface LlmProviderConfig {
  kind: LlmProviderKind;
  ollama?: {
    endpoint: string;
    model: string;
  };
}

export function readLlmProviderConfigFromEnv(): LlmProviderConfig {
  const kind: LlmProviderKind =
    CARD_INTELLIGENCE_LLM_PROVIDER === 'ollama' ? 'ollama' : 'mock';

  if (kind !== 'ollama') {
    return { kind: 'mock' };
  }

  return {
    kind: 'ollama',
    ollama: {
      endpoint: CARD_INTELLIGENCE_LLM_ENDPOINT,
      model: CARD_INTELLIGENCE_LLM_MODEL,
    },
  };
}

export function resolveProvider(config?: LlmProviderConfig): MiniLLMProvider {
  const resolved = config ?? readLlmProviderConfigFromEnv();

  if (
    resolved.kind === 'ollama' &&
    resolved.ollama &&
    isOllamaConfigured(resolved.ollama)
  ) {
    return createOllamaProvider(resolved.ollama);
  }

  return getDefaultMockProvider();
}
