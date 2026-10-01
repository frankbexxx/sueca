import { USE_LOCAL_AI_ONLY } from '../config/features';
import { isDevMode, readViteEnv } from '../config/runtimeEnv';

/** Local AI service used only when developing against a machine-local backend. */
const DEV_LOCALHOST_AI_URL = 'http://127.0.0.1:8000';

/**
 * Payload interface for AI service requests
 * Cards are encoded as strings: rank + suit letter (e.g., "AS" = Ace of Spades)
 */
export interface AiPlayPayload {
  hand: string[];   // ex: ["AS","KD","5C"] - player's current hand
  trick: string[];  // cartas já jogadas no trick atual - cards in current trick
  trump: string;    // 'C','D','H','S' - trump suit letter
  played?: string[]; // cartas já jogadas na ronda - cards played in round (optional)
  history?: string[][]; // opcional - trick history (optional)
  config?: Record<string, unknown>; // optional configuration
}

/**
 * Resolves the external AI base URL (no trailing slash).
 *
 * - Explicit `VITE_AI_SERVICE_URL` always wins when non-empty.
 * - Development may fall back to localhost for the local AI workflow.
 * - Production never implies localhost — missing URL means external AI is unavailable.
 */
export function resolveExternalAiServiceUrl(): string | null {
  const explicit = readViteEnv('VITE_AI_SERVICE_URL')?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  if (isDevMode()) {
    return DEV_LOCALHOST_AI_URL;
  }
  return null;
}

/** True when external AI may be attempted (not local-only and a usable URL exists). */
export function isExternalAiAvailable(): boolean {
  return !USE_LOCAL_AI_ONLY && resolveExternalAiServiceUrl() !== null;
}

/** Why an in-flight /play was aborted. Timeout may fall back; cancellation must not. */
export type AiPlayAbortReason = 'timeout' | 'cancelled';

export class AiPlayRequestError extends Error {
  readonly reason: AiPlayAbortReason;

  constructor(reason: AiPlayAbortReason) {
    super(reason === 'timeout' ? 'AI request timed out' : 'AI request cancelled');
    this.name = 'AiPlayRequestError';
    this.reason = reason;
  }
}

/** True only for lifecycle/stale abort. Timeout and network errors are real failures. */
export function isExternalAiCancellation(error: unknown): boolean {
  return error instanceof AiPlayRequestError && error.reason === 'cancelled';
}

export interface RequestAiPlayOptions {
  /** Aborted by the caller when the turn, board, or effect scope ends. */
  signal?: AbortSignal;
}

/**
 * Requests a card play from external AI service.
 * Sends POST request to /play endpoint with game state.
 * Returns the card code (e.g., "AS") that AI wants to play.
 * Throws if the service is unavailable, times out (3s), the caller aborts, or the response is invalid.
 * Caller abort and the 3s timeout are different errors: only timeout is a failure of this turn.
 */
export async function requestAiPlay(
  payload: AiPlayPayload,
  options?: RequestAiPlayOptions
): Promise<string> {
  if (USE_LOCAL_AI_ONLY) {
    throw new Error('External AI disabled (local-only mode)');
  }

  const baseUrl = resolveExternalAiServiceUrl();
  if (!baseUrl) {
    throw new Error('External AI unavailable (no service URL)');
  }

  if (options?.signal?.aborted) {
    throw new AiPlayRequestError('cancelled');
  }

  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 3000);
  const onCallerAbort = () => timeoutController.abort();
  options?.signal?.addEventListener('abort', onCallerAbort);

  try {
    if (options?.signal?.aborted) {
      throw new AiPlayRequestError('cancelled');
    }

    const res = await fetch(`${baseUrl}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: timeoutController.signal,
    });

    if (options?.signal?.aborted) {
      throw new AiPlayRequestError('cancelled');
    }

    if (!res.ok) {
      throw new Error(`AI service error: ${res.status}`);
    }
    const data = await res.json();
    if (!data.play || typeof data.play !== 'string') {
      throw new Error('AI service response invalid');
    }
    return data.play;
  } catch (err) {
    if (err instanceof AiPlayRequestError) throw err;
    if (options?.signal?.aborted) {
      throw new AiPlayRequestError('cancelled');
    }
    if (timeoutController.signal.aborted) {
      throw new AiPlayRequestError('timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener('abort', onCallerAbort);
  }
}
