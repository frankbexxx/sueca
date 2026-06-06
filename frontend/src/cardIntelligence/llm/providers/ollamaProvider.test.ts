import { createTestLogEvent } from '../../encoder/encodeDecisionState';
import { buildMiniLLMInput } from '../buildMiniLLMInput';
import { MINI_LLM_SCHEMA_VERSION } from '../types';
import { createOllamaProvider } from './ollamaProvider';
import { ProviderError } from './providerErrors';

describe('ollamaProvider', () => {
  const legalMoves = [
    { suit: 'clubs', rank: '2', id: '2c' },
    { suit: 'hearts', rank: '3', id: '3h' },
  ];

  function makeInput() {
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
      timeoutMs: 1500,
    });
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns valid output from mocked fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          selectedCardIndex: 1,
          confidence: 'medium',
          reasonShort: 'Play heart',
          consideredMetricIds: ['S16'],
          fallbackRecommended: false,
        }),
      }),
    }) as jest.Mock;

    const provider = createOllamaProvider({
      endpoint: 'http://localhost:11434',
      model: 'llama3.2:3b',
    });
    const input = makeInput();
    const output = await provider.complete('prompt', input);

    expect(output.schemaVersion).toBe(MINI_LLM_SCHEMA_VERSION);
    expect(output.modelId).toBe('llama3.2:3b');
    expect(output.selectedCardIndex).toBe(1);
    expect(output.selectedCard?.id).toBe('3h');
    expect(output.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('throws ProviderError on invalid JSON response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'not-json' }),
    }) as jest.Mock;

    const provider = createOllamaProvider({
      endpoint: 'http://localhost:11434',
      model: 'llama3.2:3b',
    });

    await expect(provider.complete('prompt', makeInput())).rejects.toMatchObject({
      code: 'parse',
    });
  });

  it('throws ProviderError on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as jest.Mock;

    const provider = createOllamaProvider({
      endpoint: 'http://localhost:11434',
      model: 'llama3.2:3b',
    });

    await expect(provider.complete('prompt', makeInput())).rejects.toBeInstanceOf(
      ProviderError
    );
  });

  it('throws ProviderError on timeout abort', async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn(
      (_url, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        })
    ) as jest.Mock;

    const provider = createOllamaProvider({
      endpoint: 'http://localhost:11434',
      model: 'llama3.2:3b',
    });
    const input = makeInput();
    input.timeoutMs = 50;

    const pending = provider.complete('prompt', input);
    jest.advanceTimersByTime(60);

    await expect(pending).rejects.toMatchObject({ code: 'timeout' });
    jest.useRealTimers();
  });
});
