export {
  capturePlayDecision,
  logCardDecision,
  resetLoggerSessionForTests,
  playCardAndLogDecision,
  playFirstLegalAndLogDecision,
  getLogFailureCount,
  resetLogFailureCountForTests,
} from './logger';
export type { LogCardDecisionInput, PlayLogOptions } from './logger';
export { encodeDecisionState, createTestLogEvent } from './encoder/encodeDecisionState';
export type { EncodedDecisionState, EncoderInput } from './encoder/types';
export { ALL_FIXTURES, FIXTURE_IDS, getFixtureById } from './fixtures';
export type { FixtureCase } from './fixtures';
export {
  evaluateDecision,
  aggregateMetricResults,
  EVALUATOR_SCHEMA_VERSION,
} from './evaluator';
export type {
  DecisionEvaluationInput,
  DecisionEvaluationResult,
  MetricEvaluationResult,
  EvaluationClassification,
} from './evaluator';
export {
  ingestEvaluationResult,
  buildMemoryIngestRecord,
  queryMemory,
  listAggregates,
  MEMORY_SCHEMA_VERSION,
} from './memory';
export type {
  MemoryIngestRecord,
  MetricMemoryAggregate,
  MemoryQuery,
  MemoryStore,
  MemorySubjectType,
} from './memory';
export {
  exportCardIntelligenceJsonl,
  buildJsonlLines,
  evaluateStoredPlay,
  evaluateStoredPlayByEventId,
  listMemoryAggregates,
  buildPostGameReport,
} from './debug';
export type { ExportOptions, ExportResult, EvaluateStoredResult } from './debug';
export {
  getMiniLLMAdvice,
  buildMiniLLMInput,
  buildMiniLLMInputFromStoredEvent,
  createMockProvider,
} from './llm';
export type {
  MiniLLMAdvisoryResult,
  MiniLLMDecisionInput,
  MiniLLMFallbackReason,
} from './llm';
