export const MEMORY_DB_NAME = 'cardIntelligenceMemory';
export const MEMORY_DB_VERSION = 1;

export function isMemoryIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function openMemoryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isMemoryIndexedDbAvailable()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(MEMORY_DB_NAME, MEMORY_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('memoryAggregates')) {
        db.createObjectStore('memoryAggregates', { keyPath: 'memoryId' });
      }
      if (!db.objectStoreNames.contains('sessionMemory')) {
        db.createObjectStore('sessionMemory', { keyPath: 'sessionId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB open failed'));
  });
}
