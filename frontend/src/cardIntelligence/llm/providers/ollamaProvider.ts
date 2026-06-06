import {
  MINI_LLM_SCHEMA_VERSION,
  MiniLLMDecisionInput,
  MiniLLMDecisionOutput,
  MiniLLMProvider,
} from '../types';
import { parseProviderJson } from './parseProviderJson';
import { ProviderError } from './providerErrors';

export interface OllamaProviderConfig {
  endpoint: string;
  model: string;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

export function isOllamaConfigured(config: OllamaProviderConfig): boolean {
  return config.model.trim().length > 0 && config.endpoint.trim().length > 0;
}

export function createOllamaProvider(config: OllamaProviderConfig): MiniLLMProvider {
  const endpoint = normalizeEndpoint(config.endpoint);
  const model = config.model.trim();
  const providerId = `ollama:${model}`;

  if (!isOllamaConfigured({ endpoint, model })) {
    throw new ProviderError('config', 'Ollama provider requires endpoint and model');
  }

  return {
    id: providerId,
    async complete(
      prompt: string,
      input: MiniLLMDecisionInput
    ): Promise<MiniLLMDecisionOutput> {
      const startedAt = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), input.timeoutMs);

      try {
        const response = await fetch(`${endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            format: 'json',
          }),
          signal: controller.signal,
        });

        const latencyMs = Math.round(performance.now() - startedAt);

        if (!response.ok) {
          throw new ProviderError(
            'http',
            `Ollama HTTP ${response.status}`,
            response.status
          );
        }

        const payload = (await response.json()) as { response?: unknown };
        const rawText =
          typeof payload.response === 'string' ? payload.response : '';

        const parsed = parseProviderJson(rawText, input.maxReasonLength);
        if (!parsed) {
          throw new ProviderError('parse', 'Invalid JSON from Ollama provider');
        }

        const selectedCardIndex = parsed.selectedCardIndex;
        const cardFromIndex =
          selectedCardIndex !== null &&
          selectedCardIndex >= 0 &&
          selectedCardIndex < input.legalMoves.length
            ? input.legalMoves[selectedCardIndex]
            : null;

        return {
          schemaVersion: MINI_LLM_SCHEMA_VERSION,
          requestId: input.requestId,
          selectedCard: parsed.selectedCard ?? cardFromIndex,
          selectedCardIndex,
          confidence: parsed.confidence,
          reasonShort: parsed.reasonShort,
          consideredMetricIds: parsed.consideredMetricIds,
          fallbackRecommended: parsed.fallbackRecommended,
          modelId: model,
          latencyMs,
          validByEngine: null,
        };
      } catch (error) {
        if (error instanceof ProviderError) {
          throw error;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ProviderError('timeout', `Ollama request aborted after ${input.timeoutMs}ms`);
        }
        throw new ProviderError(
          'network',
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}
