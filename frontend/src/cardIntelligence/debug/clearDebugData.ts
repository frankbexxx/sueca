import { LOG_DB_NAME } from '../shared/storage/indexedDb';
import { MEMORY_DB_NAME } from '../memory/memoryDb';
import { ClearDebugDataOptions } from './types';

function deleteDatabase(name: string): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error(`Failed to delete ${name}`));
    req.onblocked = () => resolve();
  });
}

export async function clearLogDatabase(): Promise<void> {
  await deleteDatabase(LOG_DB_NAME);
}

export async function clearMemoryDatabase(): Promise<void> {
  await deleteDatabase(MEMORY_DB_NAME);
}

export async function clearAllCardIntelligenceDebugData(
  opts: ClearDebugDataOptions = {}
): Promise<{ clearedLogs: boolean; clearedMemory: boolean }> {
  const clearLogs = opts.logs !== false;
  const clearMemory = opts.memory !== false;

  if (clearLogs) await clearLogDatabase();
  if (clearMemory) await clearMemoryDatabase();

  return { clearedLogs: clearLogs, clearedMemory: clearMemory };
}

export function confirmClearAllCardIntelligenceDebugData(
  opts: ClearDebugDataOptions = {}
): boolean {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
    return false;
  }

  const parts: string[] = [];
  if (opts.logs !== false) parts.push('logs Card Intelligence (H1–H6)');
  if (opts.memory !== false) parts.push('memória agregada');

  const target = parts.length > 0 ? parts.join(' e ') : 'dados Card Intelligence';
  const first = window.confirm(
    `Apagar ${target} local? Esta acção é irreversível.`
  );
  if (!first) return false;

  return window.confirm('Confirmar segunda vez: apagar dados locais Card Intelligence?');
}
