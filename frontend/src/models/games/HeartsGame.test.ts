import { HeartsGame } from './HeartsGame';

describe('HeartsGame', () => {
  it('requires pass before play', () => {
    const game = new HeartsGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], {});
    expect((state.variantState?.hearts as { waitingForPass: boolean }).waitingForPass).toBe(true);
    expect(game.canPlayCard(state, 0, 0)).toBe(false);
  });

  it('confirms pass with 3 cards selected', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const g = game as HeartsGame;
    g.togglePassCard(0, 0);
    g.togglePassCard(1, 0);
    g.togglePassCard(2, 0);
    expect(g.confirmPass(0)).toBe(true);
    const after = game.getCurrentState();
    expect((after.variantState?.hearts as { waitingForPass: boolean }).waitingForPass).toBe(false);
    expect(after.players[0].hand).toHaveLength(13);
  });

  it('uses hold pass on round 4', () => {
    const game = new HeartsGame();
    const internal = game as unknown as {
      createRoundState: (
        names: string[],
        opts: Record<string, unknown> | undefined,
        round: number,
        scores: number[]
      ) => ReturnType<HeartsGame['getCurrentState']>;
    };
    const state = internal.createRoundState(['A', 'B', 'C', 'D'], {}, 4, [0, 0, 0, 0]);
    expect((state.variantState?.hearts as { passDirection: string }).passDirection).toBe('hold');
    expect((state.variantState?.hearts as { waitingForPass: boolean }).waitingForPass).toBe(false);
  });

  it('blocks hearts on first trick follow', () => {
    const game = new HeartsGame();
    game.initialize(['A', 'B', 'C', 'D'], {});
    const g = game as HeartsGame;
    g.confirmPass(0);
    const internal = game as unknown as { state: ReturnType<HeartsGame['getCurrentState']> };
    const s = internal.state;
    s.isFirstTrick = true;
    s.waitingForRoundStart = false;
    (s.variantState?.hearts as { waitingForPass: boolean }).waitingForPass = false;
    s.currentTrick = [{ id: '1', rank: '2', suit: 'clubs' }];
    s.currentPlayerIndex = 1;
    s.players[1].hand = [
      { id: 'h', rank: '3', suit: 'hearts' },
      { id: 'c', rank: '4', suit: 'clubs' }
    ];
    internal.state = s;
    expect(game.canPlayCard(s, 1, 0)).toBe(false);
    expect(game.canPlayCard(s, 1, 1)).toBe(true);
  });
});
