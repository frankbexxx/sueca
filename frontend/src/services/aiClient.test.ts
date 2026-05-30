import { AiPlayPayload } from './aiClient';

const PAYLOAD: AiPlayPayload = {
  hand: ['AS', 'KD'],
  trick: [],
  trump: 'S',
  played: [],
};

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllMocks();
});

it('throws immediately when USE_LOCAL_AI_ONLY is true, without calling fetch', async () => {
  jest.doMock('../config/features', () => ({ USE_LOCAL_AI_ONLY: true }));
  const { requestAiPlay } = await import('./aiClient');
  global.fetch = jest.fn() as jest.Mock;
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow('External AI disabled');
  expect(global.fetch).not.toHaveBeenCalled();
});

it('returns the card code on a successful response', async () => {
  jest.doMock('../config/features', () => ({ USE_LOCAL_AI_ONLY: false }));
  const { requestAiPlay } = await import('./aiClient');
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ play: 'AS', reason: 'lead_highest' }),
  }) as jest.Mock;
  const result = await requestAiPlay(PAYLOAD);
  expect(result).toBe('AS');
});

it('throws when response JSON lacks a play field', async () => {
  jest.doMock('../config/features', () => ({ USE_LOCAL_AI_ONLY: false }));
  const { requestAiPlay } = await import('./aiClient');
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ reason: 'no_card' }),
  }) as jest.Mock;
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow('AI service response invalid');
});

it('throws when HTTP status is not ok (500)', async () => {
  jest.doMock('../config/features', () => ({ USE_LOCAL_AI_ONLY: false }));
  const { requestAiPlay } = await import('./aiClient');
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status: 500,
  }) as jest.Mock;
  await expect(requestAiPlay(PAYLOAD)).rejects.toThrow('AI service error: 500');
});

it('throws when the AbortController fires (timeout)', async () => {
  jest.doMock('../config/features', () => ({ USE_LOCAL_AI_ONLY: false }));
  const { requestAiPlay } = await import('./aiClient');

  global.fetch = jest.fn().mockImplementationOnce(
    (_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        (options.signal as AbortSignal).addEventListener('abort', () =>
          reject(new DOMException('The user aborted a request.', 'AbortError'))
        );
      })
  ) as jest.Mock;

  jest.useFakeTimers();
  const promise = requestAiPlay(PAYLOAD);
  jest.advanceTimersByTime(3001);
  await expect(promise).rejects.toThrow();
  jest.useRealTimers();
});
