import {
  AI_PLAY_DELAY_MS,
  DEAL_DELAY_MS,
  ROUND_START_SFX_DELAY_MS,
  SHUFFLE_DELAY_MS,
  TRICK_COLLECT_DELAY_MS
} from './gameConstants';
import {
  SUECA_AI_FOLLOW_DELAY_MS,
  SUECA_AI_LEAD_DELAY_MS
} from '../models/games/suecaAiPacing';

describe('table SFX timing constants', () => {
  it('keeps shuffle → deal → round-start audio order', () => {
    expect(SHUFFLE_DELAY_MS).toBeLessThanOrEqual(DEAL_DELAY_MS);
    expect(DEAL_DELAY_MS).toBeLessThan(ROUND_START_SFX_DELAY_MS);
    expect(DEAL_DELAY_MS).toBe(600);
    expect(ROUND_START_SFX_DELAY_MS).toBe(1000);
  });

  it('keeps a short delay before trick-collect', () => {
    expect(TRICK_COLLECT_DELAY_MS).toBe(200);
  });

  it('keeps shared AI_PLAY_DELAY_MS; Sueca lead/follow are faster and distinct', () => {
    expect(AI_PLAY_DELAY_MS).toBe(1500);
    expect(SUECA_AI_LEAD_DELAY_MS).toBe(1000);
    expect(SUECA_AI_FOLLOW_DELAY_MS).toBe(800);
    expect(SUECA_AI_FOLLOW_DELAY_MS).toBeLessThan(SUECA_AI_LEAD_DELAY_MS);
    expect(SUECA_AI_LEAD_DELAY_MS).toBeLessThan(AI_PLAY_DELAY_MS);
  });
});
