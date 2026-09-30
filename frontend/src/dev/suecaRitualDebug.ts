/**
 * UX-SUECA-08 — Sueca ritual visual debug stepper (QA only).
 * Enabled solely via `?ritualDebug=1` (works in production). Not persisted.
 */

export const SUECA_RITUAL_DEBUG_PARAM = 'ritualDebug';

/** Internal QA phase labels — English, not localized. */
export type SuecaRitualDebugPhase =
  | 'table-ready'
  | 'shuffle'
  | 'cut'
  | 'dealer-decision'
  | 'dealer-choice'
  | 'dealer-decision-result'
  | 'deal-confirmed'
  | 'distributing'
  | 'hands-reveal'
  | 'trump-reveal'
  | 'first-player'
  | 'play-ready';

export function parseSuecaRitualDebugParam(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return false;
  }
  const value = params.get(SUECA_RITUAL_DEBUG_PARAM);
  return value === '1' || value === 'true';
}

export function isSuecaRitualDebugEnabled(
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): boolean {
  return parseSuecaRitualDebugParam(search);
}

export function formatSuecaRitualDebugLabel(phase: SuecaRitualDebugPhase): string {
  return `DEV · ${phase}`;
}

/**
 * Whether the Continuar control may advance presentation.
 * Human dealer-choice requires real selection + Distribuir — Continuar is inert.
 */
export function ritualDebugContinueEnabled(phase: SuecaRitualDebugPhase | null): boolean {
  if (phase == null) return false;
  return phase !== 'dealer-choice';
}
