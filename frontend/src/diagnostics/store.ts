/**
 * Diagnostic log persistence — IndexedDB primary, localStorage fallback.
 * Separate from sueca-match-history-v1 and Card Intelligence schemas.
 */

import {
  DURABLE_SCHEMA_VERSION,
  isDurableEnvelope,
  loadDurableJson,
  writeDurableEnvelope
} from '../services/durableLocalStorage';
import { DiagnosticMatchLog, MAX_DIAGNOSTIC_MATCH_LOGS } from './types';

export const DIAGNOSTIC_IDB_NAME = 'suecaoDiagnosticMatchLogs';
export const DIAGNOSTIC_IDB_VERSION = 1;
export const DIAGNOSTIC_IDB_STORE = 'logs';

/** Fallback / index key when IndexedDB unavailable. */
export const DIAGNOSTIC_LS_KEY = 'sueca-diagnostic-match-logs-v1';

export interface DiagnosticLogStoreData {
  logs: DiagnosticMatchLog[];
}

function emptyStore(): DiagnosticLogStoreData {
  return { logs: [] };
}

function isLog(value: unknown): value is DiagnosticMatchLog {
  if (!value || typeof value !== 'object') return false;
  const l = value as DiagnosticMatchLog;
  return (
    typeof l.logId === 'string' &&
    typeof l.schemaVersion === 'number' &&
    typeof l.gameVariant === 'string' &&
    Array.isArray(l.events)
  );
}

function sanitizeLogs(raw: unknown[]): DiagnosticMatchLog[] {
  return raw.filter(isLog);
}

function normalizeStore(data: unknown): DiagnosticLogStoreData {
  if (data && typeof data === 'object' && Array.isArray((data as DiagnosticLogStoreData).logs)) {
    return {
      logs: sanitizeLogs((data as DiagnosticLogStoreData).logs).slice(
        0,
        MAX_DIAGNOSTIC_MATCH_LOGS
      )
    };
  }
  if (Array.isArray(data)) {
    return { logs: sanitizeLogs(data).slice(0, MAX_DIAGNOSTIC_MATCH_LOGS) };
  }
  return emptyStore();
}

function isIdbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIdbAvailable()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DIAGNOSTIC_IDB_NAME, DIAGNOSTIC_IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DIAGNOSTIC_IDB_STORE)) {
        db.createObjectStore(DIAGNOSTIC_IDB_STORE, { keyPath: 'logId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
  });
}

async function idbGetAll(): Promise<DiagnosticMatchLog[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIAGNOSTIC_IDB_STORE, 'readonly');
    const store = tx.objectStore(DIAGNOSTIC_IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const logs = sanitizeLogs((req.result ?? []) as unknown[]);
      logs.sort((a, b) => (b.completedAt || b.startedAt).localeCompare(a.completedAt || a.startedAt));
      resolve(logs);
    };
    req.onerror = () => reject(req.error ?? new Error('IDB getAll failed'));
  });
}

async function idbPut(log: DiagnosticMatchLog): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIAGNOSTIC_IDB_STORE, 'readwrite');
    tx.objectStore(DIAGNOSTIC_IDB_STORE).put(log);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB put failed'));
  });
}

async function idbDelete(logId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DIAGNOSTIC_IDB_STORE, 'readwrite');
    tx.objectStore(DIAGNOSTIC_IDB_STORE).delete(logId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB delete failed'));
  });
}

function readLocalFallback(): DiagnosticLogStoreData {
  const result = loadDurableJson<DiagnosticLogStoreData>({
    key: DIAGNOSTIC_LS_KEY,
    schemaVersion: DURABLE_SCHEMA_VERSION,
    emptyFallback: emptyStore(),
    migrateLegacy: (parsed) => {
      if (parsed == null) return null;
      return normalizeStore(parsed);
    },
    validateData: (data): data is DiagnosticLogStoreData => {
      if (data && typeof data === 'object' && Array.isArray((data as DiagnosticLogStoreData).logs)) {
        return true;
      }
      return Array.isArray(data);
    }
  });
  return normalizeStore(result.data);
}

function writeLocalFallback(store: DiagnosticLogStoreData): boolean {
  return writeDurableEnvelope(
    DIAGNOSTIC_LS_KEY,
    {
      logs: store.logs.slice(0, MAX_DIAGNOSTIC_MATCH_LOGS)
    },
    DURABLE_SCHEMA_VERSION
  );
}

export async function loadDiagnosticMatchLogs(): Promise<DiagnosticMatchLog[]> {
  try {
    if (isIdbAvailable()) {
      return (await idbGetAll()).slice(0, MAX_DIAGNOSTIC_MATCH_LOGS);
    }
  } catch {
    /* fall through to LS */
  }
  return readLocalFallback().logs;
}

export async function getDiagnosticMatchLog(
  logId: string
): Promise<DiagnosticMatchLog | null> {
  const all = await loadDiagnosticMatchLogs();
  return all.find((l) => l.logId === logId) ?? null;
}

export async function persistCompletedDiagnosticLog(
  log: DiagnosticMatchLog,
  retention: number = MAX_DIAGNOSTIC_MATCH_LOGS
): Promise<void> {
  try {
    if (isIdbAvailable()) {
      await idbPut(log);
      const all = await idbGetAll();
      if (all.length > retention) {
        const drop = all.slice(retention);
        for (const old of drop) {
          await idbDelete(old.logId);
        }
      }
      return;
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[diagnostics] IndexedDB persist failed; using localStorage', err);
    }
  }

  const store = readLocalFallback();
  store.logs = [log, ...store.logs.filter((l) => l.logId !== log.logId)].slice(
    0,
    retention
  );
  writeLocalFallback(store);
}

/** Test helper: wipe both backends. */
export async function clearDiagnosticMatchLogsForTests(): Promise<void> {
  try {
    if (isIdbAvailable()) {
      const all = await idbGetAll();
      for (const l of all) await idbDelete(l.logId);
    }
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(DIAGNOSTIC_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function salvageDiagnosticLogsFromUnknown(raw: unknown): DiagnosticMatchLog[] {
  if (isDurableEnvelope(raw)) {
    return normalizeStore(raw.data).logs;
  }
  return normalizeStore(raw).logs;
}
