import { getMemoryStore } from './memoryStore';
import { MemoryQuery, MetricMemoryAggregate } from './types';

export async function listAggregates(
  query: MemoryQuery = {}
): Promise<MetricMemoryAggregate[]> {
  return getMemoryStore().listAggregates(query);
}

export async function queryMemory(
  query: MemoryQuery
): Promise<MetricMemoryAggregate | null> {
  const results = await listAggregates(query);
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  return [...results].sort(
    (a, b) =>
      new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )[0];
}

export async function getAggregateById(
  memoryId: string
): Promise<MetricMemoryAggregate | null> {
  return getMemoryStore().getAggregate(memoryId);
}
