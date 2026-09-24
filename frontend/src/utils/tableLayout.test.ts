import {
  COMPASS_FROM_LOCAL_OFFSET,
  compassOffsetFromLocal,
  getTablePosition,
  getTablePositionForPlayer,
  isMobileDevice,
  seatsAroundLocal,
  truncatePlayerName
} from './tableLayout';

describe('tableLayout canonical seats (UX-SEAT-01)', () => {
  it('offset order is south → west → north → east', () => {
    expect([...COMPASS_FROM_LOCAL_OFFSET]).toEqual(['south', 'west', 'north', 'east']);
  });

  it('absolute map (local 0): 0 south, 1 west, 2 north, 3 east', () => {
    expect(getTablePosition(0)).toBe('south');
    expect(getTablePosition(1)).toBe('west');
    expect(getTablePosition(2)).toBe('north');
    expect(getTablePosition(3)).toBe('east');
  });

  it.each([
    [0, { south: 0, west: 1, north: 2, east: 3 }],
    [1, { south: 1, west: 2, north: 3, east: 0 }],
    [2, { south: 2, west: 3, north: 0, east: 1 }],
    [3, { south: 3, west: 0, north: 1, east: 2 }]
  ] as const)('seatsAroundLocal(%i)', (local, expected) => {
    expect(seatsAroundLocal(local)).toEqual(expected);
    expect(getTablePositionForPlayer(expected.south, local)).toBe('south');
    expect(getTablePositionForPlayer(expected.west, local)).toBe('west');
    expect(getTablePositionForPlayer(expected.north, local)).toBe('north');
    expect(getTablePositionForPlayer(expected.east, local)).toBe('east');
  });

  it('rotates compass relative to local player', () => {
    expect(getTablePositionForPlayer(2, 0)).toBe('north');
    expect(getTablePositionForPlayer(0, 2)).toBe('north');
    expect(getTablePositionForPlayer(2, 2)).toBe('south');
    expect(getTablePositionForPlayer(1, 0)).toBe('west');
    expect(getTablePositionForPlayer(3, 0)).toBe('east');
  });

  it('compassOffsetFromLocal matches seatsAroundLocal', () => {
    for (let local = 0; local < 4; local++) {
      const seats = seatsAroundLocal(local);
      expect(compassOffsetFromLocal(seats.south, local)).toBe(0);
      expect(compassOffsetFromLocal(seats.west, local)).toBe(1);
      expect(compassOffsetFromLocal(seats.north, local)).toBe(2);
      expect(compassOffsetFromLocal(seats.east, local)).toBe(3);
    }
  });

  it('partner remains opposite (offset 2) for every local', () => {
    for (let local = 0; local < 4; local++) {
      const partner = (local + 2) % 4;
      expect(getTablePositionForPlayer(partner, local)).toBe('north');
      expect(seatsAroundLocal(local).north).toBe(partner);
    }
  });

  it('truncates long player names', () => {
    expect(truncatePlayerName('Short')).toBe('Short');
    expect(truncatePlayerName('VeryLongPlayerName')).toBe('VeryL...');
  });

  it('isMobileDevice returns boolean', () => {
    expect(typeof isMobileDevice()).toBe('boolean');
  });
});
