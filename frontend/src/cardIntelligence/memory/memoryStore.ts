import {
  MemoryQuery,
  MemoryStore,
  MetricMemoryAggregate,
  SessionMemoryPatch,
  SessionMemoryState,
} from './types';
import { isMemoryIndexedDbAvailable } from './memoryDb';
import { IndexedDbMemoryStore } from './memoryStore.indexedDb';

export class InMemoryMemoryStore implements MemoryStore {
  private aggregates = new Map<string, MetricMemoryAggregate>();

  private sessions = new Map<string, SessionMemoryState>();

  async upsertAggregate(aggregate: MetricMemoryAggregate): Promise<void> {
    this.aggregates.set(aggregate.memoryId, aggregate);
  }

  async getAggregate(memoryId: string): Promise<MetricMemoryAggregate | null> {
    return this.aggregates.get(memoryId) ?? null;
  }

  async listAggregates(query: MemoryQuery): Promise<MetricMemoryAggregate[]> {
    return Array.from(this.aggregates.values()).filter((agg) =>
      matchesQuery(agg, query)
    );
  }

  async appendSessionRollup(
    sessionId: string,
    patch: SessionMemoryPatch
  ): Promise<void> {
    const existing = this.sessions.get(sessionId);
    const rollups = existing ? [...existing.rollups] : [];
    const key = `${patch.variant}|${patch.metricId}`;
    const idx = rollups.findIndex(
      (r) => `${r.variant}|${r.metricId}` === key
    );
    if (idx >= 0) {
      rollups[idx] = {
        ...rollups[idx],
        totalCount: rollups[idx].totalCount + 1,
        badCount:
          rollups[idx].badCount + (patch.classification === 'bad' ? 1 : 0),
      };
    } else {
      rollups.push({
        variant: patch.variant,
        metricId: patch.metricId,
        totalCount: 1,
        badCount: patch.classification === 'bad' ? 1 : 0,
      });
    }
    this.sessions.set(sessionId, {
      sessionId,
      rollups,
      lastUpdatedAt: new Date().toISOString(),
    });
  }

  async getSessionMemory(sessionId: string): Promise<SessionMemoryState | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async clearForTests(): Promise<void> {
    this.aggregates.clear();
    this.sessions.clear();
  }
}

function matchesQuery(agg: MetricMemoryAggregate, query: MemoryQuery): boolean {
  if (query.subjectType && agg.subjectType !== query.subjectType) return false;
  if (query.subjectId && agg.subjectId !== query.subjectId) return false;
  if (query.variant && agg.variant !== query.variant) return false;
  if (query.metricId && agg.metricId !== query.metricId) return false;
  if (query.difficulty !== undefined && agg.difficulty !== query.difficulty) {
    return false;
  }
  if (
    query.evaluatorVersion &&
    agg.evaluatorVersion !== query.evaluatorVersion
  ) {
    return false;
  }
  return true;
}

let storeInstance: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (storeInstance) return storeInstance;
  if (isMemoryIndexedDbAvailable()) {
    storeInstance = new IndexedDbMemoryStore();
  } else {
    storeInstance = new InMemoryMemoryStore();
  }
  return storeInstance;
}

export function setMemoryStoreForTests(store: MemoryStore | null): void {
  storeInstance = store;
}

export async function resetMemoryStoreForTests(): Promise<void> {
  const store = getMemoryStore();
  if (store.clearForTests) {
    await store.clearForTests();
  }
}
