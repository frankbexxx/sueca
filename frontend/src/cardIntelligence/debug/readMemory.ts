import { buildMemoryIngestRecord, ingestEvaluationResult } from '../memory/ingestEvaluation';
import { listAggregates } from '../memory/memoryQueries';
import { MemoryQuery, MetricMemoryAggregate } from '../memory/types';
import { IngestEvaluationItem } from './types';

export async function listMemoryAggregates(
  query: MemoryQuery = {}
): Promise<MetricMemoryAggregate[]> {
  return listAggregates(query);
}

export async function ingestEvaluationsOffline(
  items: IngestEvaluationItem[]
): Promise<{ ingested: number; warnings: string[] }> {
  const warnings: string[] = [];
  let ingested = 0;

  for (const item of items) {
    try {
      const record = buildMemoryIngestRecord({
        event: item.play,
        encoded: item.encoded,
        evaluation: item.evaluation,
      });
      await ingestEvaluationResult(record);
      ingested += 1;
    } catch (error) {
      warnings.push(
        `ingest failed for ${item.play.eventId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return { ingested, warnings };
}
