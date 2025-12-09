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

export type DealingMethod = 'A' | 'B';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  dealerIndex: number; // Track current dealer
  trumpSuit: Suit | null;
  trumpCard: Card | null; // The actual trump card (for display)
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
  isFirstTrick: boolean; // Track if this is the first trick of the round
  dealingMethod: DealingMethod; // Current dealing method
  waitingForRoundStart: boolean; // Pause before starting new round
  waitingForRoundEnd: boolean; // Pause to show round results
  waitingForGameStart: boolean; // Pause before starting new game
  playedCards: Card[]; // Track all cards that have been played in this round
  isPaused: boolean; // Track if game is paused
  playerName: string; // Player's name
  aiDifficulty: AIDifficulty; // AI difficulty level
  partnerSignals: Array<{ playerIndex: number; signal: string; trick: number }>; // Partner coordination signals
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


