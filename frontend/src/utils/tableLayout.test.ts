import { getTablePosition, getTablePositionForPlayer, truncatePlayerName, isMobileDevice } from './tableLayout';

describe('tableLayout', () => {
  it('maps player indices to compass positions', () => {
    expect(getTablePosition(0)).toBe('south');
    expect(getTablePosition(1)).toBe('east');
    expect(getTablePosition(2)).toBe('north');
    expect(getTablePosition(3)).toBe('west');
  });

  it('rotates compass relative to local player', () => {
    expect(getTablePositionForPlayer(2, 0)).toBe('north');
    expect(getTablePositionForPlayer(0, 2)).toBe('north');
    expect(getTablePositionForPlayer(2, 2)).toBe('south');
  });

  it('truncates long player names', () => {
    expect(truncatePlayerName('Short')).toBe('Short');
    expect(truncatePlayerName('VeryLongPlayerName')).toBe('VeryL...');
  });

  it('isMobileDevice returns boolean', () => {
    expect(typeof isMobileDevice()).toBe('boolean');
  });
});
