import { GameVariant, AIDifficulty, PlayerType } from '../../types/game';
import { MetricEvaluationResult } from '../evaluator/types';

export const MEMORY_SCHEMA_VERSION = '6.0.0' as const;
export const METRIC_CATALOG_VERSION = '1.1' as const;

export type MemoryClassification =
  | 'good'
  | 'medium'
  | 'bad'
  | 'partial'
  | 'unknown';

export type MemorySubjectType = 'human' | 'bot' | 'remote' | 'global' | 'ai';

export type MemoryTrend = 'improving' | 'worsening' | 'stable' | 'unknown';

export type MemoryConfidence = 'high' | 'medium' | 'low';

export type MemoryViewTypeUsed = 'player' | 'engine' | 'mixed';

export interface MemoryIngestRecord {
  schemaVersion: typeof MEMORY_SCHEMA_VERSION;

  sourceEventId: string;
  gameId: string;
  sessionId: string;
  timestamp: string;

  variant: GameVariant;
  playerIndex: number;
  subjectType: MemorySubjectType;
  subjectId: string;
  playerType: PlayerType;
  difficulty: AIDifficulty | null;

  classification: MemoryClassification;
  partialEvaluation: boolean;
  confidence: MemoryConfidence;
  reasonShort: string;
  activatedMetricIds: string[];
  failedMetricIds: string[];
  metricResults?: MetricEvaluationResult[];

  roundIndex?: number;
  trickIndex?: number | null;
  contractId?: string | null;
  viewTypeUsed: 'player' | 'engine';

  loggerVersion: string;
  encoderVersion: string;
  evaluatorVersion: string;
  metricCatalogVersion: string;

  rawLogEventId?: string;
}

export interface MetricMemoryAggregate {
  schemaVersion: typeof MEMORY_SCHEMA_VERSION;
  memoryId: string;

  subjectType: MemorySubjectType;
  subjectId: string;
  variant: GameVariant | 'all';
  metricId: string;
  metricNameHuman: string;
  difficulty: AIDifficulty | 'all' | null;

  totalCount: number;
  evaluatedCount: number;
  goodCount: number;
  mediumCount: number;
  badCount: number;
  partialCount: number;
  unknownCount: number;

  badRate: number;
  partialRate: number;

  firstSeenAt: string;
  lastSeenAt: string;

  trend: MemoryTrend;
  confidence: MemoryConfidence;

  commonMistakes: string[];
  commonGoodPatterns: string[];
  exampleEventIds: string[];

  loggerVersion: string;
  encoderVersion: string;
  evaluatorVersion: string;
  metricCatalogVersion: string;
  viewTypeUsed: MemoryViewTypeUsed;

  recentOutcomes?: boolean[];
}

export interface MemoryQuery {
  subjectType?: MemorySubjectType;
  subjectId?: string;
  variant?: MetricMemoryAggregate['variant'];
  metricId?: string;
  difficulty?: MetricMemoryAggregate['difficulty'];
  evaluatorVersion?: string;
}

export interface SessionMetricRollup {
  variant: GameVariant;
  metricId: string;
  totalCount: number;
  badCount: number;
}

export interface SessionMemoryState {
  sessionId: string;
  rollups: SessionMetricRollup[];
  lastUpdatedAt: string;
}

export interface SessionMemoryPatch {
  variant: GameVariant;
  metricId: string;
  classification: MemoryClassification;
}

export interface MemoryStore {
  upsertAggregate(aggregate: MetricMemoryAggregate): Promise<void>;
  getAggregate(memoryId: string): Promise<MetricMemoryAggregate | null>;
  listAggregates(query: MemoryQuery): Promise<MetricMemoryAggregate[]>;
  appendSessionRollup(sessionId: string, patch: SessionMemoryPatch): Promise<void>;
  getSessionMemory(sessionId: string): Promise<SessionMemoryState | null>;
  clearForTests?(): Promise<void>;
}
