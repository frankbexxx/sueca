import { Card } from '../../types/game';
import { roundHistoryEngine, resetRoundHistoryEngineForTests } from './roundHistory';

const c = (suit: Card['suit'], rank: Card['rank'], id: string): Card => ({
  suit,
  rank,
  id,
});

describe('RoundHistoryEngine', () => {
  beforeEach(() => {
    resetRoundHistoryEngineForTests();
  });

  it('recordPlay accumulates entries', () => {
    roundHistoryEngine.recordPlay({
      roundIndex: 0,
      trickIndex: 0,
      turnIndex: 0,
      playerIndex: 0,
      card: c('clubs', 'A', 'A-clubs'),
    });
    roundHistoryEngine.recordPlay({
      roundIndex: 0,
      trickIndex: 0,
      turnIndex: 1,
      playerIndex: 1,
      card: c('hearts', '2', '2-hearts'),
    });
    expect(roundHistoryEngine.snapshotEntries()).toHaveLength(2);
  });

  it('completeTrick stores completed trick with 4 plays', () => {
    const plays = [0, 1, 2, 3].map((turnIndex) => ({
      roundIndex: 0,
      trickIndex: 0,
      turnIndex,
      playerIndex: turnIndex,
      card: c('clubs', 'A', `c-${turnIndex}`),
    }));
    plays.forEach((p) => roundHistoryEngine.recordPlay(p));

    roundHistoryEngine.completeTrick({
      roundIndex: 0,
      trickIndex: 0,
      trickLeader: 0,
      plays,
      winnerIndex: 2,
      ledSuit: 'clubs',
      trumpSuit: 'spades',
      completedAt: new Date().toISOString(),
      pointsInTrick: 11,
      penaltiesInTrick: null,
      contractId: null,
      variantFields: {
        partnerIndex: 0,
        partnerWinning: true,
        acesSeen: { clubs: true, diamonds: false, hearts: false, spades: false },
        trumpCardsSeenCount: 0,
      },
    });

    expect(roundHistoryEngine.getCompletedTricks()).toHaveLength(1);
    expect(roundHistoryEngine.getCompletedTricks()[0].plays).toHaveLength(4);
  });
});
