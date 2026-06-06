jest.mock('../../../config/features', () => ({
  CARD_INTELLIGENCE_LLM_PROVIDER: 'mock',
  CARD_INTELLIGENCE_LLM_ENDPOINT: 'http://localhost:11434',
  CARD_INTELLIGENCE_LLM_MODEL: '',
}));

import { getDefaultMockProvider } from '../mockProvider';
import { readLlmProviderConfigFromEnv, resolveProvider } from './providerConfig';

describe('providerConfig', () => {
  it('reads mock config by default', () => {
    expect(readLlmProviderConfigFromEnv()).toEqual({ kind: 'mock' });
  });

  it('resolveProvider returns mock when kind is mock', () => {
    const provider = resolveProvider({ kind: 'mock' });
    expect(provider.id).toBe(getDefaultMockProvider().id);
  });

  it('resolveProvider falls back to mock when ollama model empty', () => {
    const provider = resolveProvider({
      kind: 'ollama',
      ollama: { endpoint: 'http://localhost:11434', model: '' },
    });
    expect(provider.id).toBe(getDefaultMockProvider().id);
  });

  it('resolveProvider returns ollama when configured', () => {
    const provider = resolveProvider({
      kind: 'ollama',
      ollama: { endpoint: 'http://localhost:11434', model: 'llama3.2:3b' },
    });
    expect(provider.id).toBe('ollama:llama3.2:3b');
  });
});
