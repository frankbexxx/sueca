import { describe, expect, it } from 'vitest';
import { getTablePositionForPlayer, seatsAroundLocal } from '../utils/tableLayout';

describe('KingKohRevealModal seat orientation (UX-SEAT-01)', () => {
  it('matches live table compass for local 0', () => {
    expect(getTablePositionForPlayer(0, 0)).toBe('south');
    expect(getTablePositionForPlayer(1, 0)).toBe('west');
    expect(getTablePositionForPlayer(2, 0)).toBe('north');
    expect(getTablePositionForPlayer(3, 0)).toBe('east');
  });

  it.each([0, 1, 2, 3] as const)('rotates with localPlayerIndex=%i', (local) => {
    const seats = seatsAroundLocal(local);
    expect(getTablePositionForPlayer(seats.west, local)).toBe('west');
    expect(getTablePositionForPlayer(seats.east, local)).toBe('east');
  });
});
