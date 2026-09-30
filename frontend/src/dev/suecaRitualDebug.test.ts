/**
 * @vitest-environment node
 * UX-SUECA-08 — ritual debug query + continue gating.
 */
import { describe, expect, it } from 'vitest';
import {
  formatSuecaRitualDebugLabel,
  isSuecaRitualDebugEnabled,
  parseSuecaRitualDebugParam,
  ritualDebugContinueEnabled,
  SUECA_RITUAL_DEBUG_PARAM
} from './suecaRitualDebug';

describe('UX-SUECA-08 suecaRitualDebug', () => {
  it('is OFF by default / without param', () => {
    expect(parseSuecaRitualDebugParam('')).toBe(false);
    expect(parseSuecaRitualDebugParam('?foo=1')).toBe(false);
    expect(parseSuecaRitualDebugParam(`?${SUECA_RITUAL_DEBUG_PARAM}=0`)).toBe(false);
    expect(isSuecaRitualDebugEnabled('')).toBe(false);
  });

  it('enables on ritualDebug=1 or true (production-safe query only)', () => {
    expect(parseSuecaRitualDebugParam('?ritualDebug=1')).toBe(true);
    expect(parseSuecaRitualDebugParam('ritualDebug=1')).toBe(true);
    expect(parseSuecaRitualDebugParam('?foo=bar&ritualDebug=1')).toBe(true);
    expect(parseSuecaRitualDebugParam('?ritualDebug=true')).toBe(true);
    expect(isSuecaRitualDebugEnabled('?ritualDebug=1')).toBe(true);
  });

  it('formats DEV phase label in English', () => {
    expect(formatSuecaRitualDebugLabel('trump-reveal')).toBe('DEV · trump-reveal');
    expect(formatSuecaRitualDebugLabel('table-ready')).toBe('DEV · table-ready');
  });

  it('Continuar disabled only on human dealer-choice', () => {
    expect(ritualDebugContinueEnabled('table-ready')).toBe(true);
    expect(ritualDebugContinueEnabled('shuffle')).toBe(true);
    expect(ritualDebugContinueEnabled('dealer-decision')).toBe(true);
    expect(ritualDebugContinueEnabled('dealer-choice')).toBe(false);
    expect(ritualDebugContinueEnabled('dealer-decision-result')).toBe(true);
    expect(ritualDebugContinueEnabled('first-player')).toBe(true);
    expect(ritualDebugContinueEnabled('play-ready')).toBe(true);
    expect(ritualDebugContinueEnabled(null)).toBe(false);
  });
});
