import { getAvailableGames, GAME_METADATA } from './gameMetadata';

describe('gameMetadata', () => {
  const originalEnv = process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES;
    } else {
      process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES = originalEnv;
    }
  });

  it('shows all four active games by default', () => {
    delete process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES;
    const games = getAvailableGames();
    const variants = games.map((g) => g.variant).sort();
    expect(variants).toEqual(['hearts', 'king', 'spades', 'sueca']);
  });

  it('includes experimental games when env flag is set', () => {
    process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES = 'true';
    const games = getAvailableGames();
    expect(games.length).toBeGreaterThanOrEqual(4);
  });

  it('marks all SUECÂO variants as active', () => {
    expect(GAME_METADATA.sueca.status).toBe('active');
    expect(GAME_METADATA.spades.status).toBe('active');
    expect(GAME_METADATA.hearts.status).toBe('active');
    expect(GAME_METADATA.king.status).toBe('active');
  });
});
