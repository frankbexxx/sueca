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
});
