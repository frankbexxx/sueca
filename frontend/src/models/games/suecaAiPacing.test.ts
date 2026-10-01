/**
 * Sueca AI mid-trick pacing — lead vs follow delays.
 */
import { describe, expect, it } from 'vitest';
import { AI_PLAY_DELAY_MS } from '../../constants/gameConstants';
import {
  resolveAiPlayDelayMs,
  suecaAiPlayDelayMs,
  SUECA_AI_FOLLOW_DELAY_MS,
  SUECA_AI_LEAD_DELAY_MS
} from './suecaAiPacing';

describe('suecaAiPacing', () => {
  it('exports explicit Sueca lead/follow constants', () => {
    expect(SUECA_AI_LEAD_DELAY_MS).toBe(1000);
    expect(SUECA_AI_FOLLOW_DELAY_MS).toBe(800);
  });

  it('Sueca AI lead (empty trick) uses 1000 ms', () => {
    expect(suecaAiPlayDelayMs(0)).toBe(1000);
    expect(resolveAiPlayDelayMs({ variant: 'sueca', trickLength: 0 })).toBe(1000);
  });

  it('Sueca AI follow (cards already in trick) uses 800 ms', () => {
    expect(suecaAiPlayDelayMs(1)).toBe(800);
    expect(suecaAiPlayDelayMs(2)).toBe(800);
    expect(suecaAiPlayDelayMs(3)).toBe(800);
    expect(resolveAiPlayDelayMs({ variant: 'sueca', trickLength: 1 })).toBe(800);
  });

  it('human → AI follow and AI → AI follow both use 800 ms (trickLength >= 1)', () => {
    // After human or AI plays, currentTrick.length >= 1 when next AI arms.
    expect(resolveAiPlayDelayMs({ variant: 'sueca', trickLength: 1 })).toBe(
      SUECA_AI_FOLLOW_DELAY_MS
    );
  });

  it('next-trick AI leader uses 1000 ms (trickLength 0)', () => {
    expect(resolveAiPlayDelayMs({ variant: 'sueca', trickLength: 0 })).toBe(
      SUECA_AI_LEAD_DELAY_MS
    );
  });

  it('other games keep existing AI_PLAY_DELAY_MS', () => {
    expect(AI_PLAY_DELAY_MS).toBe(1500);
    for (const variant of ['spades', 'hearts', 'king'] as const) {
      expect(resolveAiPlayDelayMs({ variant, trickLength: 0 })).toBe(AI_PLAY_DELAY_MS);
      expect(resolveAiPlayDelayMs({ variant, trickLength: 2 })).toBe(AI_PLAY_DELAY_MS);
    }
  });

  it('guards non-finite trick length as lead', () => {
    expect(suecaAiPlayDelayMs(Number.NaN)).toBe(SUECA_AI_LEAD_DELAY_MS);
  });
});
