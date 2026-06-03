import { Card, GameVariant, Suit } from '../../types/game';
import { RoundPlayEntry } from '../shared/types/logEvents';

/** Same shape as RoundPlayEntry — semantic alias for history engine */
export interface TrickPlayRecord {
  roundIndex: number;
  trickIndex: number | null;
  turnIndex: number;
  playerIndex: number;
  card: Card;
}

export interface SuecaTrickEndFields {
  partnerIndex: number;
  partnerWinning: boolean;
  acesSeen: Record<Suit, boolean>;
  trumpCardsSeenCount: number;
}

export interface SpadesTrickEndFields {
  spadesBroken: boolean;
  spadesSeenInTrick: number;
  winnerTeam: 1 | 2;
  team1Tricks: number | null;
  team2Tricks: number | null;
}

export interface HeartsTrickEndFields {
  heartsBroken: boolean;
  heartsSeenInTrick: number;
  queenSpadesInTrick: boolean;
  roundPointsSnapshot: number[];
}

export interface KingPtTrickEndFields {
  engine: 'king_pt';
  contractId: string | null;
  contractType: string | null;
  festaPhase: string | null;
  festaMode: string | null;
  noTrump: boolean | null;
  trickNumber: number;
  penalizingCardIds: string[];
}

export interface KingSimplifiedTrickEndFields {
  engine: 'king_simplified';
  handType: 'negative' | 'positive';
  handIndex: number;
  trickScoreDelta: number;
}

export type TrickEndVariantFields =
  | SuecaTrickEndFields
  | SpadesTrickEndFields
  | HeartsTrickEndFields
  | KingPtTrickEndFields
  | KingSimplifiedTrickEndFields;

export interface CompletedTrickRecord {
  roundIndex: number;
  trickIndex: number;
  trickLeader: number;
  plays: TrickPlayRecord[];
  winnerIndex: number;
  ledSuit: Suit | null;
  trumpSuit: Suit | null;
  completedAt: string;
  pointsInTrick: number | null;
  penaltiesInTrick: number | null;
  contractId: string | null;
  variantFields: TrickEndVariantFields;
}

export interface RoundPlayHistoryState {
  plays: TrickPlayRecord[];
  completedTricks: CompletedTrickRecord[];
}

export type RoundPlayHistorySnapshot = RoundPlayEntry[];
