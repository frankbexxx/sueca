import { GameVariant } from '../../../types/game';
import { EncodedDecisionState } from '../../encoder/types';
import {
  DecisionEvaluationResult,
  EvaluationClassification,
} from '../../evaluator/types';
import { CardDecisionLogEvent } from '../../shared/types/logEvents';
import { TrickEndEvent } from '../../shared/types/trickEndEvent';

export const DEBUG_REPORT_SCHEMA_VERSION = '10.0.0' as const;
export const DEBUG_REPORT_SOURCE = 'cardIntelligence/debug/reportFlow';

export type ReportSource =
  | 'live_log'
  | 'dev_lab_scenario'
  | 'fixture'
  | 'seeded_game'
  | 'synthetic_test';

export type ReportKind = 'scenario' | 'event' | 'game';

export type WarningSeverity = 'informational' | 'degraded' | 'blocking';

export interface ReportWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
}

export interface DebugReportMeta {
  schemaVersion: typeof DEBUG_REPORT_SCHEMA_VERSION;
  kind: ReportKind;
  source: ReportSource;
  generatedAt: string;
  offlineEvaluation: true;
  viewTypeUsed: 'player' | 'engine';
  scenarioId?: string;
  eventId?: string;
  gameId?: string;
  variant?: GameVariant;
}

export interface DebugReportSummary {
  classification?: EvaluationClassification;
  reasonShort?: string;
  activatedMetricIds: string[];
  failedMetricIds: string[];
  topIssues: Array<{ metricId: string; classification: string; reasonShort?: string }>;
}

export interface DebugReportDocument {
  meta: DebugReportMeta;
  summary: DebugReportSummary;
  sections: {
    scenario?: { primaryMetricId: string; humanNote: string; fixtureId?: string };
    play?: {
      chosenCard: string;
      legalMovesCount: number;
      trickIndex: number | null;
      eventId?: string;
    };
    encode?: Record<string, unknown>;
    evaluation?: Pick<
      DecisionEvaluationResult,
      | 'classification'
      | 'reasonShort'
      | 'partialEvaluation'
      | 'betterAlternatives'
      | 'equivalentAlternatives'
    >;
    gameStats?: {
      playCount: number;
      trickEndCount: number;
      byClassification: Record<string, number>;
    };
    memory?: { aggregateCount: number; highlights: string[] };
    highlights?: string[];
    metricResultsLine?: string;
  };
  warnings: ReportWarning[];
  text: string;
  rawPayload?: {
    play?: CardDecisionLogEvent;
    trickEnd?: TrickEndEvent | null;
    encoded?: EncodedDecisionState;
    evaluation?: DecisionEvaluationResult;
  };
}

export interface ReportFlowOptions {
  as?: 'text' | 'document';
  engineView?: boolean;
  includeMemory?: boolean;
  includeRawPayload?: boolean;
}

export interface ReportExportOptions {
  kind: ReportKind;
  scenarioId?: string;
  eventId?: string;
  gameId?: string;
  format: 'text' | 'json' | 'jsonl';
  includeRawPayload?: boolean;
  includeMemory?: boolean;
  engineView?: boolean;
}

export interface ExportReportResult {
  text?: string;
  json?: DebugReportDocument;
  blob?: Blob;
  filename: string;
  warnings: ReportWarning[];
}
