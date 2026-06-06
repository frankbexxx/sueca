import {
  AIDifficulty,
  Card,
  GameVariant,
  PlayerType,
  Suit,
} from '../../types/game';
import { CardDecisionLogEvent, RoundPlayEntry } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';

export const ENCODED_SCHEMA_VERSION = '4.0.0' as const;

export type ViewType = 'engine' | 'player';
export type EncodeMode = 'pre_decision' | 'post_decision';

export type DecisionPhase =
  | 'play'
  | 'bid'
  | 'pass'
  | 'auction'
  | 'contract_select'
  | 'other';

export interface ImportantCardsSeen {
  acesBySuit: Record<Suit, boolean>;
  sevensBySuit: Record<Suit, boolean>;
  trumpSeenCount: number;
  queenSpadesPlayed: boolean;
  kingHeartsPlayed: boolean;
}

export interface ScoreContext {
  raw: Record<string, unknown>;
  teamIndex: 1 | 2 | null;
}

export interface RiskContext {
  cutRisk: 'low' | 'medium' | 'high' | null;
  avoidBagMode: boolean | null;
}

export interface MemoryContext {
  schemaVersion: '6.0.0-stub';
  aggregates: [];
}

export interface MetricContextEntry {
  metricId: string;
  metricNameHuman: string;
  applicable: boolean;
  neededFields: string[];
  missingFields: string[];
  confidence: number;
  reasonShort: string;
}

export interface InformationBucket {
  known: Record<string, unknown>;
  inferred: Record<string, unknown>;
  hidden: string[];
}

export interface HiddenInformationPolicy {
  viewType: ViewType;
  excludedFields: string[];
  inferenceAllowed: boolean;
  sourceOfTruth: 'log' | 'replay' | 'live_engine';
}

export interface SuecaEncoding {
  partnerIndex: number;
  teamIndex: 1 | 2;
  acesSeenBySuit: Record<Suit, boolean>;
  sevensSeenBySuit: Record<Suit, boolean>;
  trumpSeenCount: number;
  partnerWinning: boolean | null;
  canWinCheaply: boolean | null;
  canCutWithLowestTrump: boolean | null;
  cutRisk: 'low' | 'medium' | 'high' | null;
}

export interface SpadesEncoding {
  playerBid: number | null;
  teamBid: number | null;
  playerTricks: number | null;
  teamTricks: number | null;
  bags: number | null;
  spadesBroken: boolean | null;
  bidMet: boolean | null;
  needTricks: number | null;
  avoidBagMode: boolean | null;
  partnerWinning: boolean | null;
}

export interface HeartsEncoding {
  heartsBroken: boolean | null;
  queenSpadesPlayed: boolean;
  pointsInTrick: number | null;
  dangerousCardsInHand: Card[];
  trickIsSafeAndPointless: boolean | null;
  canCleanDangerousCard: boolean | null;
  moonThreatLevel: 'none' | 'possible' | 'likely' | null;
}

export interface KingEncoding {
  contractId: string | null;
  contractType: string | null;
  festaPhase: string | null;
  trumpSuit: Suit | null;
  noTrump: boolean | null;
  kingHeartsPlayed: boolean;
  mustPlayKingHeartsNow: boolean;
  cannotLeadHearts: boolean | null;
  penaltyMap: Record<string, number> | null;
  contractPenaltiesInTrick: number | null;
  nulosMode: boolean | null;
  isLastTwoPhase: boolean | null;
  trickNumberForLastTwo: number | null;
}

export type VariantEncoding =
  | SuecaEncoding
  | SpadesEncoding
  | HeartsEncoding
  | KingEncoding;

export interface EncodedDecisionState {
  schemaVersion: typeof ENCODED_SCHEMA_VERSION;
  sourceEventId: string | null;
  gameId: string;
  sessionId: string;
  timestamp: string;

  variant: GameVariant;
  mode: string | null;
  contractId: string | null;
  phase: DecisionPhase;

  playerIndex: number;
  playerType: PlayerType;
  difficulty: AIDifficulty | null;
  viewType: ViewType;
  encodeMode: EncodeMode;

  roundIndex: number;
  trickIndex: number;
  turnIndex: number;

  hand: Card[];
  legalMoves: Card[];
  chosenCard: Card | null;

  currentTrick: Card[];
  trickPosition: number;
  ledSuit: Suit | null;
  trumpSuit: Suit | null;
  currentWinner: number | null;

  visiblePlayedCards: RoundPlayEntry[];
  importantCardsSeen: ImportantCardsSeen;

  scoreContext: ScoreContext;
  riskContext: RiskContext;
  memoryContext: MemoryContext;

  metricContext: MetricContextEntry[];

  availableInformation: InformationBucket;
  hiddenInformationPolicy: HiddenInformationPolicy;

  variantEncoding: VariantEncoding;
}

export interface EncoderInput {
  event: CardDecisionLogEvent;
  trickEndEvent?: TrickEndEvent;
  encodeMode?: EncodeMode;
  viewType?: ViewType;
}

export interface EncodeDecisionStateOptions {
  allowEngineView?: boolean;
}

/** Engine View fields documented in FASE_4 — not populated in v0 */
export interface EngineEncodedExtras {
  opponentHands?: Card[][];
  deckRemaining?: Card[];
}

export class EngineViewNotSupportedError extends Error {
  constructor() {
    super('Engine View is not implemented in encoder v0; use allowEngineView in tests only');
    this.name = 'EngineViewNotSupportedError';
  }
}
