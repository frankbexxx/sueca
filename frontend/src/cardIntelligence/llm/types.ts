import { AIDifficulty, Card, GameVariant, PlayerType } from '../../types/game';
import {
  EncodedDecisionState,
  HiddenInformationPolicy,
  MetricContextEntry,
} from '../encoder/types';

export const MINI_LLM_SCHEMA_VERSION = '7.0.0' as const;
export const DEFAULT_MINI_LLM_TIMEOUT_MS = 1500;
export const DEFAULT_MAX_REASON_LENGTH = 120;
export const METRIC_CATALOG_VERSION = '1.1' as const;

export type MiniLLMFallbackReason =
  | 'disabled'
  | 'empty_legal_moves'
  | 'phase_not_play'
  | 'provider_unavailable'
  | 'provider_error'
  | 'timeout'
  | 'invalid_json'
  | 'invalid_index'
  | 'illegal_card'
  | 'fallback_recommended'
  | 'low_confidence_policy'
  | 'mock_stub';

export type DecisionSource =
  | 'human'
  | 'bot'
  | 'ai_internal'
  | 'ai_external'
  | 'mini_llm'
  | 'fallback';

export interface EvaluatorHint {
  metricId: string;
  riskLevel: 'low' | 'medium' | 'high';
  reasonShort: string;
  source: 'heuristic' | 'prior_evaluation' | 'fixture';
}

export interface MemoryHint {
  metricId: string;
  badRate?: number;
  trend?: 'improving' | 'worsening' | 'stable' | 'unknown';
  reasonShort: string;
  confidence: 'high' | 'medium' | 'low';
  subjectType: 'bot' | 'human' | 'global';
}

export interface RulesContext {
  variant: string;
  objectiveShort: string;
  contractSummary?: string;
  mandatoryRules?: string[];
  phaseNotes?: string;
}

export interface MiniLLMDecisionInput {
  schemaVersion: typeof MINI_LLM_SCHEMA_VERSION;
  requestId: string;

  variant: GameVariant;
  playerIndex: number;
  difficulty: AIDifficulty | null;
  playerType: PlayerType;

  encodedState: EncodedDecisionState;
  legalMoves: Card[];
  metricContext: MetricContextEntry[];

  evaluatorHints?: EvaluatorHint[];
  memoryContext?: MemoryHint[];
  rulesContext: RulesContext;

  fallbackMove: Card;
  fallbackMoveIndex: number;

  timeoutMs: number;
  maxReasonLength: number;

  viewType: 'player';
  hiddenInformationPolicy: HiddenInformationPolicy;

  encoderVersion: '4.0.0';
  metricCatalogVersion: typeof METRIC_CATALOG_VERSION;
  memorySchemaVersion?: '6.0.0';
}

export interface RejectedAlternative {
  card: Card;
  reasonShort: string;
}

export interface MiniLLMDecisionOutput {
  schemaVersion: typeof MINI_LLM_SCHEMA_VERSION;
  requestId: string;

  selectedCard: Card | null;
  selectedCardIndex: number | null;

  confidence: 'high' | 'medium' | 'low';
  reasonShort: string;
  consideredMetricIds: string[];
  rejectedAlternatives?: RejectedAlternative[];
  uncertaintyFlags?: string[];

  fallbackRecommended: boolean;
  modelId: string | null;
  latencyMs: number;

  validByEngine: boolean | null;
  appliedCard?: Card;
  appliedSource?: DecisionSource;
}

export interface MiniLLMProvider {
  readonly id: string;
  complete(prompt: string, input: MiniLLMDecisionInput): Promise<MiniLLMDecisionOutput>;
}

export interface MiniLLMAdvisoryResult {
  schemaVersion: typeof MINI_LLM_SCHEMA_VERSION;
  requestId: string;
  mode: 'disabled' | 'advisory';

  advisoryCard: Card;
  advisoryCardIndex: number;

  confidence: 'high' | 'medium' | 'low';
  reasonShort: string;
  consideredMetricIds: string[];

  usedFallback: boolean;
  fallbackReason: MiniLLMFallbackReason | null;

  rawOutput: MiniLLMDecisionOutput | null;
  validByEngine: boolean;

  promptText?: string;
  warnings: string[];
}

export interface GetMiniLLMAdviceOptions {
  provider?: MiniLLMProvider;
  includePromptText?: boolean;
  forceAdvisory?: boolean;
}

export interface ValidationResult {
  appliedCard: Card;
  appliedSource: DecisionSource;
  validByEngine: boolean;
  usedFallback: boolean;
  fallbackReason: MiniLLMFallbackReason | null;
  warnings: string[];
}
