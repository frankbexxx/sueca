import {
  getHeartsRoundEndDisplayDeltas,
  isHeartsShootTheMoon,
  settleHeartsRoundDeltas
} from './heartsRoundDisplay';

describe('heartsRoundDisplay', () => {
  it('normal round: deltas equal raw round points', () => {
    expect(settleHeartsRoundDeltas([5, 8, 10, 3])).toEqual([5, 8, 10, 3]);
    expect(isHeartsShootTheMoon([5, 8, 10, 3])).toBe(false);
  });

  it('shoot the moon: shooter 0, others +26', () => {
    expect(settleHeartsRoundDeltas([26, 0, 0, 0])).toEqual([0, 26, 26, 26]);
    expect(settleHeartsRoundDeltas([0, 26, 0, 0])).toEqual([26, 0, 26, 26]);
    expect(isHeartsShootTheMoon([26, 0, 0, 0])).toBe(true);
  });

  it('partial 26 without full moon is not moon settlement', () => {
    expect(settleHeartsRoundDeltas([13, 13, 0, 0])).toEqual([13, 13, 0, 0]);
    expect(isHeartsShootTheMoon([13, 13, 0, 0])).toBe(false);
  });

  it('display prefers stored lastRoundDeltas including moon shooter 0', () => {
    expect(
      getHeartsRoundEndDisplayDeltas({
        roundPoints: [26, 0, 0, 0],
        lastRoundDeltas: [0, 26, 26, 26]
      })
    ).toEqual([0, 26, 26, 26]);
  });

  it('display falls back to settlement when lastRoundDeltas missing', () => {
    expect(
      getHeartsRoundEndDisplayDeltas({
        roundPoints: [26, 0, 0, 0],
        lastRoundDeltas: [0, 0, 0, 0]
      })
    ).toEqual([0, 26, 26, 26]);
  });
});
