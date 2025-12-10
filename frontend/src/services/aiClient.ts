const DEFAULT_AI_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://127.0.0.1:8000';

export interface AiPlayPayload {
  hand: string[];   // ex: ["AS","KD","5C"]
  trick: string[];  // cartas já jogadas no trick atual
  trump: string;    // 'C','D','H','S'
  played?: string[]; // cartas já jogadas na ronda
  history?: string[][]; // opcional
  config?: Record<string, unknown>;
}

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

