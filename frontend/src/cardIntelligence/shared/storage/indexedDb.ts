export const LOG_DB_NAME = 'cardIntelligenceLogs';
export const LOG_DB_VERSION = 1;

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function openLogDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(LOG_DB_NAME, LOG_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains('events')) {
        const events = db.createObjectStore('events', { keyPath: 'eventId' });
        events.createIndex('gameId', 'gameId', { unique: false });
        events.createIndex('sessionId', 'sessionId', { unique: false });
        events.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}
