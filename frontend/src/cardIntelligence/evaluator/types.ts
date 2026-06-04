import { Card } from '../../types/game';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { EncodedDecisionState, MetricContextEntry } from '../encoder/types';

export const EVALUATOR_SCHEMA_VERSION = '5.0.0' as const;

export type EvaluationClassification =
  | 'good'
  | 'medium'
  | 'bad'
  | 'partial'
  | 'unknown';

export type MetricClassification =
  | EvaluationClassification
  | 'not_applicable';

export type EvaluatorMode = 'strict' | 'advisory' | 'debug';
export type EvaluationScope = 'p0' | 'p1' | 'all';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface DecisionEvaluationInput {
  schemaVersion: typeof EVALUATOR_SCHEMA_VERSION;
  encodedState: EncodedDecisionState;
  chosenCard: Card | null;
  legalMoves: Card[];
  metricContext?: MetricContextEntry[];
  fixtureId?: string;
  evaluatorMode?: EvaluatorMode;
  evaluationScope?: EvaluationScope;
  viewType?: 'player' | 'engine';
  rawLogEvent?: CardDecisionLogEvent;
}

export interface MetricEvaluationResult {
  metricId: string;
  classification: MetricClassification;
  reasonShort: string;
  betterAlternatives: Card[];
}

export interface DecisionEvaluationResult {
  schemaVersion: typeof EVALUATOR_SCHEMA_VERSION;
  evaluatorVersion: typeof EVALUATOR_SCHEMA_VERSION;
  classification: EvaluationClassification;
  confidence: ConfidenceLevel;
  reasonShort: string;
  metricResults: MetricEvaluationResult[];
  activatedMetricIds: string[];
  failedMetricIds: string[];
  betterAlternatives: Card[];
  equivalentAlternatives: Card[];
  missingFields: string[];
  evaluatorWarnings: string[];
  viewTypeUsed: 'player' | 'engine';
  partialEvaluation?: boolean;
  evaluatedAt: string;
}

export interface EvaluatorContext {
  state: EncodedDecisionState;
  chosenCard: Card;
  legalMoves: Card[];
  metricContext: MetricContextEntry[];
  fixtureId?: string;
  evaluatorMode: EvaluatorMode;
  rawLogEvent?: CardDecisionLogEvent;
}

export type MetricEvaluatorFn = (ctx: EvaluatorContext) => MetricEvaluationResult | null;
