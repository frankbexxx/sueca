import {
  getPlayerSeatTeamClass,
  isIndividualTableVariant,
  shouldShowTeamLabel
} from './playerSeatHelpers';

describe('playerSeatHelpers', () => {
  it('treats hearts and king as individual table variants', () => {
    expect(isIndividualTableVariant('hearts')).toBe(true);
    expect(isIndividualTableVariant('king')).toBe(true);
    expect(isIndividualTableVariant('sueca')).toBe(false);
    expect(isIndividualTableVariant('spades')).toBe(false);
  });

  it('uses neutral seat class for individual variants', () => {
    expect(getPlayerSeatTeamClass('hearts', 1, 1)).toBe('player-seat--individual');
    expect(getPlayerSeatTeamClass('hearts', 1, 2)).toBe('player-seat--individual');
    expect(getPlayerSeatTeamClass('king', 2, 1)).toBe('player-seat--individual');
  });

  it('uses team classes for team variants', () => {
    expect(getPlayerSeatTeamClass('sueca', 1, 1)).toBe('team-us');
    expect(getPlayerSeatTeamClass('sueca', 1, 2)).toBe('team-them');
  });

  it('never shows team labels on individual variants even when showTeamLabels is true', () => {
    expect(shouldShowTeamLabel('hearts', true)).toBe(false);
    expect(shouldShowTeamLabel('king', true)).toBe(false);
    expect(shouldShowTeamLabel('sueca', true)).toBe(true);
    expect(shouldShowTeamLabel('sueca', false)).toBe(false);
  });
});
