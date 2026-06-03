import { LogEvent, LogSessionMeta } from '../types/logEvents';
import { openLogDatabase } from './indexedDb';
import { LocalStorageLogStore, LogStore } from './logStore.localStorage';

export class IndexedDbLogStore implements LogStore {
  async appendEvent(event: LogEvent, sessionMeta: LogSessionMeta): Promise<void> {
    const db = await openLogDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['events', 'sessions'], 'readwrite');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('IndexedDB transaction failed'));
      };

      tx.objectStore('events').put(event);
      tx.objectStore('sessions').put(sessionMeta);
    });
  }
}

let storeInstance: LogStore | null = null;

export function getLogStore(): LogStore {
  if (storeInstance) return storeInstance;
  if (typeof indexedDB !== 'undefined') {
    storeInstance = new IndexedDbLogStore();
  } else {
    storeInstance = new LocalStorageLogStore();
  }
  return storeInstance;
}

export function setLogStoreForTests(store: LogStore | null): void {
  storeInstance = store;
}

export async function appendLogEvent(
  event: LogEvent,
  sessionMeta: LogSessionMeta
): Promise<void> {
  const primary = getLogStore();
  try {
    await primary.appendEvent(event, sessionMeta);
  } catch (primaryError) {
    if (primary instanceof IndexedDbLogStore) {
      const fallback = new LocalStorageLogStore();
      await fallback.appendEvent(event, sessionMeta);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[CardIntelligence] IndexedDB append failed; used localStorage fallback', primaryError);
      }
      return;
    }
    throw primaryError;
  }
}
