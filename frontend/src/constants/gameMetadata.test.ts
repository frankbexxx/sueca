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

  it('shows only Sueca by default', () => {
    delete process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES;
    const games = getAvailableGames();
    expect(games).toHaveLength(1);
    expect(games[0].variant).toBe('sueca');
  });

  it('includes experimental games when env flag is set', () => {
    process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES = 'true';
    const games = getAvailableGames();
    const variants = games.map((g) => g.variant);
    expect(variants).toContain('sueca');
    expect(variants).toContain('spades');
    expect(variants).toContain('hearts');
    expect(variants).not.toContain('king');
  });

  it('marks King as placeholder in metadata', () => {
    expect(GAME_METADATA.king.status).toBe('placeholder');
  });
});
