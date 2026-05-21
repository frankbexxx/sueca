import { KingGame } from './KingGame';

describe('KingGame simplified', () => {
  it('starts with negative hand 1 and trump clubs', () => {
    const game = new KingGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {});
    const king = state.variantState?.king as { handIndex: number; handType: string; trumpSuit: string };
    expect(king.handIndex).toBe(0);
    expect(king.handType).toBe('negative');
    expect(king.trumpSuit).toBe('clubs');
  });

  it('hand index 6 is first positive hand', () => {
    const game = new KingGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: ReturnType<KingGame['getCurrentState']> };
    internal.state.waitingForRoundEnd = true;
    for (let i = 0; i < 6; i++) {
      game.continueToNextRound(internal.state);
      internal.state.waitingForRoundEnd = true;
    }
    const king = internal.state.variantState?.king as { handIndex: number; handType: string };
    expect(king.handIndex).toBe(6);
    expect(king.handType).toBe('positive');
  });

  it('applies -5 per trick on negative hands', () => {
    const game = new KingGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: ReturnType<KingGame['getCurrentState']> };
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 0;
    game.finishTrick(internal.state);
    const king = internal.state.variantState?.king as { playerScores: number[] };
    expect(king.playerScores[0]).toBe(-5);
  });
});
