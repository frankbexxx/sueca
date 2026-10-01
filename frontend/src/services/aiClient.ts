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

/**
 * Requests a card play from external AI service.
 * Sends POST request to /play endpoint with game state.
 * Returns the card code (e.g., "AS") that AI wants to play.
 * Throws error if service is unavailable, times out (3s), or response is invalid.
 */
export async function requestAiPlay(payload: AiPlayPayload): Promise<string> {
  if (USE_LOCAL_AI_ONLY) {
    throw new Error('External AI disabled (local-only mode)');
  }

  const baseUrl = resolveExternalAiServiceUrl();
  if (!baseUrl) {
    throw new Error('External AI unavailable (no service URL)');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${baseUrl}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`AI service error: ${res.status}`);
    }
    const data = await res.json();
    if (!data.play || typeof data.play !== 'string') {
      throw new Error('AI service response invalid');
    }
    return data.play;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
