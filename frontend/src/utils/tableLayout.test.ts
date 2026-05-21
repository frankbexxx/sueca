import { getTablePosition, truncatePlayerName, isMobileDevice } from './tableLayout';

describe('tableLayout', () => {
  it('maps player indices to compass positions', () => {
    expect(getTablePosition(0)).toBe('south');
    expect(getTablePosition(1)).toBe('east');
    expect(getTablePosition(2)).toBe('north');
    expect(getTablePosition(3)).toBe('west');
  });

  it('truncates long player names', () => {
    expect(truncatePlayerName('Short')).toBe('Short');
    expect(truncatePlayerName('VeryLongPlayerName')).toBe('VeryL...');
  });

  it('isMobileDevice returns boolean', () => {
    expect(typeof isMobileDevice()).toBe('boolean');
  });
});
