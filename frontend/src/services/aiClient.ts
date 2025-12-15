/**
 * Default AI service URL
 * Can be overridden via REACT_APP_AI_SERVICE_URL environment variable
 * Falls back to localhost:8000 for development
 */
const DEFAULT_AI_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://127.0.0.1:8000';

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
 * Requests a card play from external AI service
 * Sends POST request to /play endpoint with game state
 * Returns the card code (e.g., "AS") that AI wants to play
 * Throws error if service is unavailable or response is invalid
 */
export async function requestAiPlay(payload: AiPlayPayload): Promise<string> {
  const res = await fetch(`${DEFAULT_AI_URL}/play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`AI service error: ${res.status}`);
  }
  const data = await res.json();
  if (!data.play || typeof data.play !== 'string') {
    throw new Error('AI service response invalid');
  }
  return data.play;
}

