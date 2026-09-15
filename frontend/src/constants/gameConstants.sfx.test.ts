import {
  DEAL_DELAY_MS,
  ROUND_START_SFX_DELAY_MS,
  SHUFFLE_DELAY_MS,
  TRICK_COLLECT_DELAY_MS
} from './gameConstants';

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
});
