import { EvaluationClassification } from '../evaluator/types';
import {
  MemoryClassification,
  MemoryConfidence,
  MemorySubjectType,
  MemoryTrend,
  MemoryViewTypeUsed,
  METRIC_CATALOG_VERSION,
  MEMORY_SCHEMA_VERSION,
  MetricMemoryAggregate,
} from './types';
import { GameVariant, AIDifficulty } from '../../types/game';

const RECENT_OUTCOMES_CAP = 40;
const EXAMPLE_EVENT_IDS_CAP = 10;
const COMMON_STRINGS_CAP = 20;
const TREND_DELTA_THRESHOLD = 0.05;

export function buildMemoryId(input: {
  subjectType: MemorySubjectType;
  subjectId: string;
  variant: GameVariant | 'all';
  metricId: string;
  difficulty: AIDifficulty | 'all' | null;
  evaluatorVersion: string;
}): string {
  const diff = input.difficulty ?? 'null';
  return [
    input.subjectType,
    input.subjectId,
    input.variant,
    input.metricId,
    diff,
    input.evaluatorVersion,
  ].join('|');
}

export function createEmptyAggregate(input: {
  memoryId: string;
  subjectType: MemorySubjectType;
  subjectId: string;
  variant: GameVariant | 'all';
  metricId: string;
  metricNameHuman?: string;
  difficulty: AIDifficulty | 'all' | null;
  timestamp: string;
  loggerVersion: string;
  encoderVersion: string;
  evaluatorVersion: string;
  viewTypeUsed: MemoryViewTypeUsed;
}): MetricMemoryAggregate {
  return {
    schemaVersion: MEMORY_SCHEMA_VERSION,
    memoryId: input.memoryId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    variant: input.variant,
    metricId: input.metricId,
    metricNameHuman: input.metricNameHuman ?? input.metricId,
    difficulty: input.difficulty,
    totalCount: 0,
    evaluatedCount: 0,
    goodCount: 0,
    mediumCount: 0,
    badCount: 0,
    partialCount: 0,
    unknownCount: 0,
    badRate: 0,
    partialRate: 0,
    firstSeenAt: input.timestamp,
    lastSeenAt: input.timestamp,
    trend: 'unknown',
    confidence: 'low',
    commonMistakes: [],
    commonGoodPatterns: [],
    exampleEventIds: [],
    loggerVersion: input.loggerVersion,
    encoderVersion: input.encoderVersion,
    evaluatorVersion: input.evaluatorVersion,
    metricCatalogVersion: METRIC_CATALOG_VERSION,
    viewTypeUsed: input.viewTypeUsed,
    recentOutcomes: [],
  };
}

export function applyClassificationIncrement(
  aggregate: MetricMemoryAggregate,
  classification: MemoryClassification | EvaluationClassification,
  partialEvaluation: boolean
): void {
  aggregate.totalCount += 1;

  if (classification === 'unknown') {
    aggregate.unknownCount += 1;
  } else if (classification === 'partial') {
    aggregate.partialCount += 1;
  } else if (classification === 'good') {
    aggregate.goodCount += 1;
    if (partialEvaluation) aggregate.partialCount += 1;
  } else if (classification === 'medium') {
    aggregate.mediumCount += 1;
    if (partialEvaluation) aggregate.partialCount += 1;
  } else if (classification === 'bad') {
    aggregate.badCount += 1;
    if (partialEvaluation) aggregate.partialCount += 1;
  }

  const outcomes = aggregate.recentOutcomes ?? [];
  outcomes.push(classification === 'bad');
  while (outcomes.length > RECENT_OUTCOMES_CAP) {
    outcomes.shift();
  }
  aggregate.recentOutcomes = outcomes;

  recomputeDerivedFields(aggregate);
}

export function recomputeDerivedFields(aggregate: MetricMemoryAggregate): void {
  aggregate.evaluatedCount = aggregate.totalCount - aggregate.unknownCount;
  aggregate.badRate =
    aggregate.evaluatedCount > 0
      ? aggregate.badCount / aggregate.evaluatedCount
      : 0;
  aggregate.partialRate =
    aggregate.totalCount > 0
      ? aggregate.partialCount / aggregate.totalCount
      : 0;
  aggregate.trend = computeTrend(aggregate.recentOutcomes ?? []);
  aggregate.confidence = computeConfidence(aggregate.evaluatedCount);
}

export function computeTrend(recentOutcomes: boolean[]): MemoryTrend {
  if (recentOutcomes.length < RECENT_OUTCOMES_CAP) {
    return 'unknown';
  }
  const prev20 = recentOutcomes.slice(0, 20);
  const last20 = recentOutcomes.slice(20, 40);
  const badRatePrev =
    prev20.filter(Boolean).length / prev20.length;
  const badRateLast =
    last20.filter(Boolean).length / last20.length;
  const delta = badRateLast - badRatePrev;
  if (delta > TREND_DELTA_THRESHOLD) return 'worsening';
  if (delta < -TREND_DELTA_THRESHOLD) return 'improving';
  return 'stable';
}

export function computeConfidence(evaluatedCount: number): MemoryConfidence {
  if (evaluatedCount >= 50) return 'high';
  if (evaluatedCount >= 10) return 'medium';
  return 'low';
}

export function mergeViewTypeUsed(
  existing: MemoryViewTypeUsed,
  incoming: 'player' | 'engine'
): MemoryViewTypeUsed {
  if (existing === 'mixed') return 'mixed';
  if (existing === incoming) return existing;
  return 'mixed';
}

export function appendUniqueCapped(
  list: string[],
  value: string,
  cap: number
): string[] {
  if (!value || list.includes(value)) return list;
  const next = [...list, value];
  if (next.length <= cap) return next;
  return next.slice(next.length - cap);
}

export const MEMORY_LIMITS = {
  EXAMPLE_EVENT_IDS_CAP,
  COMMON_STRINGS_CAP,
  RECENT_OUTCOMES_CAP,
} as const;
