import { describe, expect, it } from 'vitest';
import {
  AI_PLAY_DELAY_MS,
  FESTA_AI_STEP_DELAY_MS,
  GAME_OVER_DELAY_MS,
  HEARTS_PASS_EXCHANGE_MS,
  SPADES_AI_BID_DELAY_MS,
  TRICK_AUTO_CONTINUE_SECONDS
} from '../../constants/gameConstants';
import { SUECA_RITUAL_TIMING } from './suecaHandRitual';
import {
  cardPlayDelayMs,
  getGamePacingPolicy,
  heartsPassExchangeMs,
  kingFestaTickDelayMs,
  kingSyntheticScoreHoldMs,
  spadesAiBidDelayMs
} from './gamePacingPolicy';
import { resolveAiPlayDelayMs } from './suecaAiPacing';
import type { GameVariant } from '../../types/game';

const VARIANTS: GameVariant[] = ['sueca', 'spades', 'hearts', 'king'];

describe('game pacing policies', () => {
  it('gives every live variant its own policy and refuses an unknown one', () => {
    for (const variant of VARIANTS) {
      expect(getGamePacingPolicy(variant).variant).toBe(variant);
      expect(getGamePacingPolicy(variant).trickHoldMs).toBe(TRICK_AUTO_CONTINUE_SECONDS * 1000);
    }
    expect(() => getGamePacingPolicy('unknown' as GameVariant)).toThrow(/No pacing policy/);
  });

  it('does not give Spades, Hearts, or King the Sueca card-play rhythm', () => {
    const sueca = getGamePacingPolicy('sueca').cardPlay;
    expect(sueca).toEqual({ aiLeadMs: 1000, aiFollowMs: 800 });
    for (const variant of ['spades', 'hearts', 'king'] as const) {
      const play = getGamePacingPolicy(variant).cardPlay;
      expect(play).toEqual({ aiLeadMs: 1500, aiFollowMs: 1500 });
      expect(play.aiLeadMs).not.toBe(sueca.aiLeadMs);
      expect(play.aiFollowMs).not.toBe(sueca.aiFollowMs);
      expect(cardPlayDelayMs(variant, 0)).toBe(1500);
      expect(cardPlayDelayMs(variant, 2)).toBe(1500);
      expect(resolveAiPlayDelayMs({ variant, trickLength: 0 })).toBe(AI_PLAY_DELAY_MS);
    }
  });

  it('keeps Sueca lead and follow on the shared resolver', () => {
    expect(cardPlayDelayMs('sueca', 0)).toBe(1000);
    expect(cardPlayDelayMs('sueca', 1)).toBe(800);
    expect(cardPlayDelayMs('sueca', Number.NaN)).toBe(1000);
  });

  it('keeps the Spades bid beat separate from card play', () => {
    const spades = getGamePacingPolicy('spades');
    if (spades.variant !== 'spades') throw new Error('expected spades');
    expect(spades.aiBidMs).toBe(1500);
    expect(spades.aiBidMs).toBe(SPADES_AI_BID_DELAY_MS);
    expect(spadesAiBidDelayMs()).toBe(spades.aiBidMs);
    expect(spades.cardPlay.aiLeadMs).toBe(AI_PLAY_DELAY_MS);
    expect('aiBidMs' in getGamePacingPolicy('sueca')).toBe(false);
    expect('aiBidMs' in getGamePacingPolicy('hearts')).toBe(false);
    expect('aiBidMs' in getGamePacingPolicy('king')).toBe(false);
  });

  it('gives Hearts an explicit pass-exchange beat, separate from other timers', () => {
    const hearts = getGamePacingPolicy('hearts');
    if (hearts.variant !== 'hearts') throw new Error('expected hearts');
    expect(hearts.passExchangeMs).toBe(800);
    expect(hearts.passExchangeMs).toBe(HEARTS_PASS_EXCHANGE_MS);
    expect(heartsPassExchangeMs()).toBe(800);
    expect('passExchangeMs' in getGamePacingPolicy('sueca')).toBe(false);
    expect('passExchangeMs' in getGamePacingPolicy('spades')).toBe(false);
    expect('passExchangeMs' in getGamePacingPolicy('king')).toBe(false);
    expect(hearts.cardPlay).toEqual({ aiLeadMs: 1500, aiFollowMs: 1500 });
  });

  it('keeps King festa at 350 ms and auction as a manual step', () => {
    const king = getGamePacingPolicy('king');
    if (king.variant !== 'king') throw new Error('expected king');
    expect(king.festaAiStepMs).toBe(350);
    expect(king.festaAiStepMs).toBe(FESTA_AI_STEP_DELAY_MS);
    expect(king.auctionAdvance).toBe('manual');
    expect(kingFestaTickDelayMs('auction')).toBe(0);
    expect(kingFestaTickDelayMs('negotiation')).toBe(350);
    expect(kingFestaTickDelayMs('setup')).toBe(350);
    expect(king.finalResultHoldMs).toBeNull();
    expect(kingSyntheticScoreHoldMs()).toBe(1000);
  });

  it('keeps the shared trick hold and the existing final-result split', () => {
    for (const variant of ['sueca', 'spades', 'hearts'] as const) {
      expect(getGamePacingPolicy(variant).trickHoldMs).toBe(5000);
      expect(getGamePacingPolicy(variant).finalResultHoldMs).toBe(GAME_OVER_DELAY_MS);
      expect(getGamePacingPolicy(variant).finalResultHoldMs).toBe(3000);
    }
    expect(getGamePacingPolicy('king').trickHoldMs).toBe(5000);
    expect(getGamePacingPolicy('king').finalResultHoldMs).toBeNull();
  });

  it('leaves Sueca ritual timings outside the card-play policy', () => {
    expect(getGamePacingPolicy('sueca').ritual).toBe('sueca-local');
    expect(SUECA_RITUAL_TIMING.shuffleMs).toEqual({ min: 1400, max: 1400 });
    expect(SUECA_RITUAL_TIMING.cutMs).toEqual({ min: 1200, max: 1200 });
  });
});
