import { Card } from '../../../types/game';
import { KingFestaMode } from './kingContracts';

export type KingFestaPhase =
  | 'auction'
  | 'negotiation'
  | 'negotiation_counter'
  | 'fallback'
  | 'setup'
  | null;

export interface KingKohRevealState {
  sequence: Array<{ card: Card; playerIndex: number }>;
  winnerIndex: number;
  startPlayerIndex: number;
  step: number;
}

export interface KingRoundBreakdown {
  tricksWon: number[];
  heartsTaken: number[];
  queensTaken: number[];
  menTaken: number[];
  kingTakenBy: number | null;
  lastTwoWinners: number[];
  contractLabel: string | null;
  festaMode: KingFestaMode | null;
  nullTransfer: { beneficiary: number; bidder: number; amount: number } | null;
  lines: string[];
}

export interface KingRoundSummary {
  gameIndex: number;
  title: string;
  deltas: number[];
  scoresAfter: number[];
  breakdownLines: string[];
}

export function emptyBreakdown(): KingRoundBreakdown {
  return {
    tricksWon: [0, 0, 0, 0],
    heartsTaken: [0, 0, 0, 0],
    queensTaken: [0, 0, 0, 0],
    menTaken: [0, 0, 0, 0],
    kingTakenBy: null,
    lastTwoWinners: [],
    contractLabel: null,
    festaMode: null,
    nullTransfer: null,
    lines: []
  };
}

export function isMenRank(rank: string): boolean {
  return rank === 'K' || rank === 'J';
}
