import { KingPtGame } from '../KingPtGame';
import { KING_TOTAL_GAMES } from './kingContracts';

describe('KingPtGame', () => {
  it('starts negative phase with contract no_tricks', () => {
    const game = new KingPtGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {});
    const king = state.variantState?.kingPt as { gameIndex: number; contract: string };
    expect(king.gameIndex).toBe(0);
    expect(king.contract).toBe('no_tricks');
    expect(state.players.every((p) => p.hand.length === 13)).toBe(true);
  });

  it('applies -20 for trick winner in no_tricks', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 1;
    internal.state.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    game.finishTrick(internal.state);
    const king = internal.state.variantState?.kingPt as { playerScores: number[] };
    expect(king.playerScores[1]).toBe(-20);
  });

  it('runs 10 games structure', () => {
    expect(KING_TOTAL_GAMES).toBe(10);
  });
});
