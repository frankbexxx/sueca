export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Q' | 'J' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type GameVariant = 'sueca' | 'spades' | 'hearts' | 'king';
export type PlayerType = 'human' | 'ai' | 'remote';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  team: 1 | 2;
  type?: PlayerType;
  status?: 'connected' | 'disconnected' | 'waiting';
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
  completedPentes: Array<{ team1: number; team2: number }>; // Array of completed pentes (stand alone pentes from 120 points)
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
  nextRoundValue?: number; // Internal: value for next round (used when continuing after round end)
  pendingRoundMultiplier?: number; // Sueca: 2 after 60-60 tie — doubles next hand's game award
  isMultiplayer?: boolean;
  sessionId?: string;
  localPlayerIndex?: number;
  variant?: GameVariant;
  /** Per-variant data (bids, hearts broken, king hand type, etc.) */
  variantState?: Record<string, unknown>;
}

// Sueca trick-taking order: A > 7 > K > J > Q > 6 > 5 > 4 > 3 > 2
// (8, 9, 10 are not in the 40-card Sueca deck — values are inert)
export const CARD_HIERARCHY: Record<Rank, number> = {
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '8': 6,
  '9': 7,
  '10': 8,
  'Q': 9,
  'J': 10,
  'K': 11,
  '7': 12,
  'A': 13,
};

export const CARD_POINTS: Record<Rank, number> = {
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
  '6': 0,
  '7': 10,
  '8': 0,
  '9': 0,
  '10': 0,
  'Q': 2,
  'J': 3,
  'K': 4,
  'A': 11
};


