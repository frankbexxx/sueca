import { EncodedDecisionState } from '../encoder/types';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import {
  DecisionEvaluationResult,
  MetricEvaluationResult,
} from '../evaluator/types';
import {
  appendUniqueCapped,
  applyClassificationIncrement,
  buildMemoryId,
  createEmptyAggregate,
  MEMORY_LIMITS,
  mergeViewTypeUsed,
} from './aggregateMemory';
import { getMemoryStore } from './memoryStore';
import {
  MemoryClassification,
  MemoryIngestRecord,
  MemorySubjectType,
  METRIC_CATALOG_VERSION,
  MEMORY_SCHEMA_VERSION,
  SessionMemoryPatch,
} from './types';

function defaultSubjectType(event: CardDecisionLogEvent): MemorySubjectType {
  if (event.playerType === 'human') return 'human';
  if (event.playerType === 'remote') return 'remote';
  return 'bot';
}

function defaultSubjectId(
  event: CardDecisionLogEvent,
  subjectType: MemorySubjectType
): string {
  if (subjectType === 'human') {
    return `human:local:seat-${event.playerIndex}`;
  }
  if (subjectType === 'remote') {
    return `remote:seat-${event.playerIndex}`;
  }
  const diff = event.difficulty ?? 'medium';
  return `bot:${diff}:seat-${event.playerIndex}`;
}

export function buildMemoryIngestRecord(input: {
  event: CardDecisionLogEvent;
  encoded: EncodedDecisionState;
  evaluation: DecisionEvaluationResult;
  subjectType?: MemorySubjectType;
  subjectId?: string;
}): MemoryIngestRecord {
  const { event, encoded, evaluation } = input;
  const subjectType = input.subjectType ?? defaultSubjectType(event);
  const subjectId =
    input.subjectId ?? defaultSubjectId(event, subjectType);

  return {
    schemaVersion: MEMORY_SCHEMA_VERSION,
    sourceEventId: event.eventId,
    gameId: event.gameId,
    sessionId: event.sessionId,
    timestamp: event.timestamp,
    variant: event.variant,
    playerIndex: event.playerIndex,
    subjectType,
    subjectId,
    playerType: event.playerType,
    difficulty: event.difficulty,
    classification: evaluation.classification,
    partialEvaluation: evaluation.partialEvaluation ?? false,
    confidence: evaluation.confidence,
    reasonShort: evaluation.reasonShort,
    activatedMetricIds: [...evaluation.activatedMetricIds],
    failedMetricIds: [...evaluation.failedMetricIds],
    metricResults: evaluation.metricResults.map((m) => ({ ...m })),
    roundIndex: event.roundIndex,
    trickIndex: event.trickIndex,
    contractId: encoded.contractId,
    viewTypeUsed: evaluation.viewTypeUsed,
    loggerVersion: event.schemaVersion,
    encoderVersion: encoded.schemaVersion,
    evaluatorVersion: evaluation.evaluatorVersion,
    metricCatalogVersion: METRIC_CATALOG_VERSION,
    rawLogEventId: event.eventId,
  };
}

function isActionableMetricClassification(
  classification: MetricEvaluationResult['classification']
): classification is MemoryClassification {
  return classification !== 'not_applicable';
}

async function upsertMetricAggregate(
  record: MemoryIngestRecord,
  metricId: string,
  metricNameHuman: string,
  classification: MemoryClassification,
  reasonShort: string
): Promise<void> {
  const store = getMemoryStore();
  const difficulty = record.difficulty;
  const memoryId = buildMemoryId({
    subjectType: record.subjectType,
    subjectId: record.subjectId,
    variant: record.variant,
    metricId,
    difficulty,
    evaluatorVersion: record.evaluatorVersion,
  });

  let aggregate =
    (await store.getAggregate(memoryId)) ??
    createEmptyAggregate({
      memoryId,
      subjectType: record.subjectType,
      subjectId: record.subjectId,
      variant: record.variant,
      metricId,
      metricNameHuman,
      difficulty,
      timestamp: record.timestamp,
      loggerVersion: record.loggerVersion,
      encoderVersion: record.encoderVersion,
      evaluatorVersion: record.evaluatorVersion,
      viewTypeUsed: record.viewTypeUsed,
    });

  aggregate.lastSeenAt = record.timestamp;
  if (record.timestamp < aggregate.firstSeenAt) {
    aggregate.firstSeenAt = record.timestamp;
  }
  aggregate.viewTypeUsed = mergeViewTypeUsed(
    aggregate.viewTypeUsed,
    record.viewTypeUsed
  );

  applyClassificationIncrement(
    aggregate,
    classification,
    record.partialEvaluation
  );

  if (classification === 'bad') {
    aggregate.commonMistakes = appendUniqueCapped(
      aggregate.commonMistakes,
      reasonShort,
      MEMORY_LIMITS.COMMON_STRINGS_CAP
    );
    aggregate.exampleEventIds = appendUniqueCapped(
      aggregate.exampleEventIds,
      record.sourceEventId,
      MEMORY_LIMITS.EXAMPLE_EVENT_IDS_CAP
    );
  } else if (classification === 'good') {
    aggregate.commonGoodPatterns = appendUniqueCapped(
      aggregate.commonGoodPatterns,
      reasonShort,
      MEMORY_LIMITS.COMMON_STRINGS_CAP
    );
  }

  await store.upsertAggregate(aggregate);
}

async function appendSessionForMetric(
  record: MemoryIngestRecord,
  metricId: string,
  classification: MemoryClassification
): Promise<void> {
  const patch: SessionMemoryPatch = {
    variant: record.variant,
    metricId,
    classification,
  };
  await getMemoryStore().appendSessionRollup(record.sessionId, patch);
}

export async function ingestEvaluationResult(
  record: MemoryIngestRecord
): Promise<void> {
  if (!record.evaluatorVersion) {
    return;
  }
  if (record.schemaVersion !== MEMORY_SCHEMA_VERSION) {
    return;
  }

  const metricResults =
    record.metricResults?.filter((m) =>
      isActionableMetricClassification(m.classification)
    ) ?? [];

  if (metricResults.length > 0) {
    for (const entry of metricResults) {
      if (!isActionableMetricClassification(entry.classification)) continue;
      await upsertMetricAggregate(
        record,
        entry.metricId,
        entry.metricId,
        entry.classification,
        entry.reasonShort
      );
      await appendSessionForMetric(
        record,
        entry.metricId,
        entry.classification
      );
    }
    return;
  }

  for (const metricId of record.activatedMetricIds) {
    await upsertMetricAggregate(
      record,
      metricId,
      metricId,
      record.classification,
      record.reasonShort
    );
    await appendSessionForMetric(record, metricId, record.classification);
  }
}
