export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | 'Q' | 'J' | 'K' | '7' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  team: 1 | 2;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  trumpSuit: Suit | null;
  currentTrick: Card[];
  trickLeader: number;
  scores: { team1: number; team2: number };
  gameScore: { team1: number; team2: number };
  round: number;
  isGameOver: boolean;
  winner: 1 | 2 | null;
  lastTrickWinner: number | null;
  waitingForTrickEnd: boolean;
  nextTrickLeader: number | null;
}

export const CARD_HIERARCHY: Record<Rank, number> = {
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  'Q': 6,
  'J': 7,
  'K': 8,
  '7': 9,
  'A': 10
};

export const CARD_POINTS: Record<Rank, number> = {
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
  '6': 0,
  'Q': 2,
  'J': 3,
  'K': 4,
  '7': 10,
  'A': 11
};


