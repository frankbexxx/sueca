import { AiPlayPayload } from './aiClient';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const PAYLOAD: AiPlayPayload = {
  hand: ['AS', 'KD'],
  trick: [],
  trump: 'S',
  played: [],
};

const EXPLICIT_URL = 'https://ai.example.com';

beforeEach(() => {
  vi.resetModules();
  delete process.env.VITE_AI_SERVICE_URL;
  delete process.env.NODE_ENV;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.VITE_AI_SERVICE_URL;
  delete process.env.NODE_ENV;
});

async function loadAiClient(opts: {
  localOnly: boolean;
  serviceUrl?: string;
  nodeEnv?: string;
}) {
  if (opts.serviceUrl !== undefined) {
    process.env.VITE_AI_SERVICE_URL = opts.serviceUrl;
  }
  if (opts.nodeEnv !== undefined) {
    process.env.NODE_ENV = opts.nodeEnv;
  }
  vi.doMock('../config/features', () => ({ USE_LOCAL_AI_ONLY: opts.localOnly }));
  return import('./aiClient');
}

it('throws immediately when USE_LOCAL_AI_ONLY is true, without calling fetch', async () => {
  const { requestAiPlay, isExternalAiAvailable } = await loadAiClient({
    localOnly: true,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  global.fetch = vi.fn() as unknown as typeof fetch;
  expect(isExternalAiAvailable()).toBe(false);
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow('External AI disabled');
  expect(global.fetch).not.toHaveBeenCalled();
});

it('PROD + URL missing → no external fetch (unavailable)', async () => {
  const { requestAiPlay, resolveExternalAiServiceUrl, isExternalAiAvailable } =
    await loadAiClient({ localOnly: false, nodeEnv: 'production' });
  global.fetch = vi.fn() as unknown as typeof fetch;

  expect(resolveExternalAiServiceUrl()).toBeNull();
  expect(isExternalAiAvailable()).toBe(false);
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow(
    'External AI unavailable (no service URL)'
  );
  expect(global.fetch).not.toHaveBeenCalled();
});

it('PROD + explicit URL → external path allowed', async () => {
  const { requestAiPlay, resolveExternalAiServiceUrl, isExternalAiAvailable } =
    await loadAiClient({
      localOnly: false,
      serviceUrl: `${EXPLICIT_URL}/`,
      nodeEnv: 'production',
    });
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ play: 'AS', reason: 'lead_highest' }),
  }) as unknown as typeof fetch;

  expect(resolveExternalAiServiceUrl()).toBe(EXPLICIT_URL);
  expect(isExternalAiAvailable()).toBe(true);
  const result = await requestAiPlay(PAYLOAD);
  expect(result).toBe('AS');
  expect(global.fetch).toHaveBeenCalledWith(
    `${EXPLICIT_URL}/play`,
    expect.objectContaining({ method: 'POST' })
  );
});

it('DEV + URL missing → localhost dev fallback preserved', async () => {
  const { requestAiPlay, resolveExternalAiServiceUrl, isExternalAiAvailable } =
    await loadAiClient({ localOnly: false, nodeEnv: 'development' });
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ play: 'KD' }),
  }) as unknown as typeof fetch;

  expect(resolveExternalAiServiceUrl()).toBe('http://127.0.0.1:8000');
  expect(isExternalAiAvailable()).toBe(true);
  await expect(requestAiPlay(PAYLOAD)).resolves.toBe('KD');
  expect(global.fetch).toHaveBeenCalledWith(
    'http://127.0.0.1:8000/play',
    expect.objectContaining({ method: 'POST' })
  );
});

it('returns the card code on a successful response', async () => {
  const { requestAiPlay } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ play: 'AS', reason: 'lead_highest' }),
  }) as unknown as typeof fetch;
  const result = await requestAiPlay(PAYLOAD);
  expect(result).toBe('AS');
});

it('throws when response JSON lacks a play field', async () => {
  const { requestAiPlay } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ reason: 'no_card' }),
  }) as unknown as typeof fetch;
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow('AI service response invalid');
});

it('throws when HTTP status is not ok (500)', async () => {
  const { requestAiPlay } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    status: 500,
  }) as unknown as typeof fetch;
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow('AI service error: 500');
});

function hangingFetch() {
  global.fetch = vi.fn().mockImplementation(
    (_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        (options.signal as AbortSignal).addEventListener('abort', () =>
          reject(new DOMException('The user aborted a request.', 'AbortError'))
        );
      })
  ) as unknown as typeof fetch;
}

it('throws a timeout failure when the 3s AbortController fires', async () => {
  const { requestAiPlay, isExternalAiCancellation } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });

  hangingFetch();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers();
  try {
    const promise = requestAiPlay(PAYLOAD);
    const assertion = promise.then(
      () => {
        throw new Error('expected timeout');
      },
      (err: unknown) => err
    );
    await vi.advanceTimersByTimeAsync(3001);
    const err = await assertion;
    expect(isExternalAiCancellation(err)).toBe(false);
    expect(err).toMatchObject({ name: 'AiPlayRequestError', reason: 'timeout' });
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
    vi.useRealTimers();
  }
});

it('caller abort is cancellation, not a timeout, and does not warn', async () => {
  const { requestAiPlay, isExternalAiCancellation } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  hangingFetch();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const caller = new AbortController();
  const promise = requestAiPlay(PAYLOAD, { signal: caller.signal });
  caller.abort();
  await expect(promise).rejects.toMatchObject({ reason: 'cancelled' });
  await promise.catch((err: unknown) => {
    expect(isExternalAiCancellation(err)).toBe(true);
  });
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('does not fetch when the caller signal is already aborted', async () => {
  const { requestAiPlay, isExternalAiCancellation } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  global.fetch = vi.fn() as unknown as typeof fetch;
  const caller = new AbortController();
  caller.abort();
  await expect(requestAiPlay(PAYLOAD, { signal: caller.signal })).rejects.toMatchObject({
    reason: 'cancelled',
  });
  await requestAiPlay(PAYLOAD, { signal: caller.signal }).catch((err: unknown) => {
    expect(isExternalAiCancellation(err)).toBe(true);
  });
  expect(global.fetch).not.toHaveBeenCalled();
});

it('gate close aborts an in-flight /play as cancellation, not timeout', async () => {
  const { requestAiPlay, isExternalAiCancellation } = await loadAiClient({
    localOnly: false,
    serviceUrl: EXPLICIT_URL,
    nodeEnv: 'production',
  });
  const { createAiTurnGate } = await import('./aiTurnGate');
  hangingFetch();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const gate = createAiTurnGate();
  const scope = gate.open();
  const promise = requestAiPlay(PAYLOAD, { signal: scope.signal });
  gate.close();
  expect(scope.isCurrent()).toBe(false);
  expect(scope.signal.aborted).toBe(true);
  const err = await promise.then(
    () => {
      throw new Error('expected cancellation');
    },
    (error: unknown) => error
  );
  expect(err).toMatchObject({ reason: 'cancelled' });
  expect(isExternalAiCancellation(err)).toBe(true);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
