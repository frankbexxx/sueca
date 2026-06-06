import { GameVariant, PlayerType } from '../../types/game';
import { EncodedDecisionState } from '../encoder/types';
import { DecisionEvaluationResult } from '../evaluator/types';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { MetricMemoryAggregate, MemoryQuery } from '../memory/types';

export const EXPORT_SCHEMA_VERSION = '7.0.0' as const;
export const EXPORT_SOURCE = 'cardIntelligence/debug/exportJsonl';

export type ExportRecordType =
  | 'card_decision_log'
  | 'trick_end'
  | 'encoded_state'
  | 'evaluation'
  | 'memory_aggregate'
  | 'export_meta'
  | 'debug_report';

export interface CardIntelligenceExportEnvelope {
  exportRecordType: ExportRecordType;
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  source: string;
  payload: unknown;
}

export interface ExportOptions {
  format?: 'envelope' | 'raw';
  gameId?: string;
  variant?: GameVariant;
  playerType?: PlayerType;
  includeEncoded?: boolean;
  includeEvaluations?: boolean;
  includeMemory?: boolean;
  engineView?: boolean;
}

export interface ExportResult {
  lineCount: number;
  warnings: string[];
  filename: string;
}

export interface EvaluateStoredOptions {
  engineView?: boolean;
}

export interface EvaluateStoredResult {
  play: CardDecisionLogEvent;
  trickEnd: TrickEndEvent | null;
  encoded?: EncodedDecisionState;
  evaluation?: DecisionEvaluationResult;
  warnings: string[];
}

export interface IngestEvaluationItem {
  play: CardDecisionLogEvent;
  encoded: EncodedDecisionState;
  evaluation: DecisionEvaluationResult;
}

export interface ClearDebugDataOptions {
  logs?: boolean;
  memory?: boolean;
}

export type { MemoryQuery, MetricMemoryAggregate };
