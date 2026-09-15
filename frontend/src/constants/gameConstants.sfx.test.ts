import {
  DEAL_DELAY_MS,
  SHUFFLE_DELAY_MS,
  TRICK_COLLECT_DELAY_MS
} from './gameConstants';

describe('table SFX timing constants', () => {
  it('keeps shuffle at or before deal on the shared hands-appeared cue', () => {
    expect(SHUFFLE_DELAY_MS).toBeLessThanOrEqual(DEAL_DELAY_MS);
    expect(DEAL_DELAY_MS).toBe(600);
  });

  it('keeps a short delay before trick-collect', () => {
    expect(TRICK_COLLECT_DELAY_MS).toBe(200);
  });
});
