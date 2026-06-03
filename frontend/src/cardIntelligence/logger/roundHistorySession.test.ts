import { RoundHistorySession } from './roundHistorySession';

describe('RoundHistorySession', () => {
  it('appends entries and returns growing snapshots', () => {
    const session = new RoundHistorySession();
    const first = session.append({
      roundIndex: 0,
      trickIndex: 0,
      turnIndex: 0,
      playerIndex: 0,
      card: { suit: 'clubs', rank: 'A', id: 'A-clubs' },
    });
    expect(first).toHaveLength(1);

    const second = session.append({
      roundIndex: 0,
      trickIndex: 0,
      turnIndex: 1,
      playerIndex: 1,
      card: { suit: 'hearts', rank: '2', id: '2-hearts' },
    });
    expect(second).toHaveLength(2);
    expect(second[0].card.id).toBe('A-clubs');
  });
});
