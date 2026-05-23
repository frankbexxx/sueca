import { KingGame } from './KingGame';
import { KingSimplifiedGame } from './KingSimplifiedGame';

describe('KingGame simplified preset', () => {
  it('starts with negative hand 1 and trump clubs', () => {
    const game = new KingSimplifiedGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {});
    const king = state.variantState?.kingSimplified as {
      handIndex: number;
      handType: string;
      trumpSuit: string;
    };
    expect(king.handIndex).toBe(0);
    expect(king.handType).toBe('negative');
    expect(king.trumpSuit).toBe('clubs');
  });

  it('applies -5 per trick on negative hands', () => {
    const game = new KingSimplifiedGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const internal = game as unknown as { state: ReturnType<KingSimplifiedGame['getCurrentState']> };
    internal.state.waitingForRoundStart = false;
    internal.state.waitingForTrickEnd = true;
    internal.state.nextTrickLeader = 0;
    game.finishTrick(internal.state);
    const king = internal.state.variantState?.kingSimplified as { playerScores: number[] };
    expect(king.playerScores[0]).toBe(-5);
  });
});

describe('KingGame router', () => {
  it('uses PT normal by default', () => {
    const game = new KingGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {});
    expect(state.variantState?.kingPt).toBeDefined();
  });

  it('uses simplified when preset requested', () => {
    const game = new KingGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], { rulesPresetId: 'king-simplified' });
    expect(state.variantState?.kingSimplified).toBeDefined();
  });
});
