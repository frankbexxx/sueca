import {
  MemoryQuery,
  MemoryStore,
  MetricMemoryAggregate,
  SessionMemoryPatch,
  SessionMemoryState,
} from './types';
import { openMemoryDatabase } from './memoryDb';

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

function applySessionPatch(
  existing: SessionMemoryState | null,
  sessionId: string,
  patch: SessionMemoryPatch
): SessionMemoryState {
  const rollups = existing ? [...existing.rollups] : [];
  const key = `${patch.variant}|${patch.metricId}`;
  const idx = rollups.findIndex((r) => `${r.variant}|${r.metricId}` === key);
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
  return {
    sessionId,
    rollups,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export class IndexedDbMemoryStore implements MemoryStore {
  async upsertAggregate(aggregate: MetricMemoryAggregate): Promise<void> {
    const db = await openMemoryDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['memoryAggregates'], 'readwrite');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB transaction failed'));
      };
      tx.objectStore('memoryAggregates').put(aggregate);
    });
  }

  async getAggregate(memoryId: string): Promise<MetricMemoryAggregate | null> {
    const db = await openMemoryDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['memoryAggregates'], 'readonly');
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB read failed'));
      };
      const req = tx.objectStore('memoryAggregates').get(memoryId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB get failed'));
    });
  }

  async listAggregates(query: MemoryQuery): Promise<MetricMemoryAggregate[]> {
    const db = await openMemoryDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['memoryAggregates'], 'readonly');
      const results: MetricMemoryAggregate[] = [];
      tx.oncomplete = () => {
        db.close();
        resolve(results.filter((agg) => matchesQuery(agg, query)));
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB list failed'));
      };
      const req = tx.objectStore('memoryAggregates').openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          results.push(cursor.value as MetricMemoryAggregate);
          cursor.continue();
        }
      };
      req.onerror = () =>
        reject(req.error ?? new Error('IndexedDB cursor failed'));
    });
  }

  async appendSessionRollup(
    sessionId: string,
    patch: SessionMemoryPatch
  ): Promise<void> {
    const existing = await this.getSessionMemory(sessionId);
    const updated = applySessionPatch(existing, sessionId, patch);
    const db = await openMemoryDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['sessionMemory'], 'readwrite');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB session write failed'));
      };
      tx.objectStore('sessionMemory').put(updated);
    });
  }

  async getSessionMemory(sessionId: string): Promise<SessionMemoryState | null> {
    const db = await openMemoryDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['sessionMemory'], 'readonly');
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB session read failed'));
      };
      const req = tx.objectStore('sessionMemory').get(sessionId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () =>
        reject(req.error ?? new Error('IndexedDB session get failed'));
    });
  }
}
