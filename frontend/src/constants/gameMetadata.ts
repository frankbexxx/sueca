import { GameVariant } from '../types/game';

export interface GameMetadata {
  variant: GameVariant;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  deckType: 'sueca40' | 'standard52';
  status: 'active' | 'placeholder' | 'experimental';
}

export const GAME_METADATA: Record<GameVariant, GameMetadata> = {
  sueca: {
    variant: 'sueca',
    name: 'Sueca',
    description: 'Portuguese trick-taking card game with 40-card deck',
    minPlayers: 4,
    maxPlayers: 4,
    deckType: 'sueca40',
    status: 'active'
  },
  spades: {
    variant: 'spades',
    name: 'Spades',
    description: 'Bid-based trick-taking game where spades are always trump (prototype)',
    minPlayers: 4,
    maxPlayers: 4,
    deckType: 'standard52',
    status: 'experimental'
  },
  hearts: {
    variant: 'hearts',
    name: 'Hearts',
    description: 'Point-avoidance game where hearts and Queen of Spades lose points (prototype)',
    minPlayers: 4,
    maxPlayers: 4,
    deckType: 'standard52',
    status: 'experimental'
  },
  king: {
    variant: 'king',
    name: 'King',
    description: 'Brazilian trick-taking game with negative and positive hands (placeholder)',
    minPlayers: 4,
    maxPlayers: 4,
    deckType: 'standard52',
    status: 'placeholder'
  }
};

export const getGameMetadata = (variant: GameVariant): GameMetadata => {
  const metadata = GAME_METADATA[variant];
  if (!metadata) {
    throw new Error(`Unknown game variant: ${variant}`);
  }
  return metadata;
};

const showExperimentalGames = (): boolean =>
  process.env.REACT_APP_SHOW_EXPERIMENTAL_GAMES === 'true';

/** Games shown in the selector. Only Sueca is active in production by default. */
export const getAvailableGames = (): GameMetadata[] => {
  return Object.values(GAME_METADATA)
    .filter((game) => {
      if (game.status === 'active') return true;
      if (game.status === 'experimental') return showExperimentalGames();
      return false;
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
};
