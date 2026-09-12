import { isProdMode, viteEnvFlag } from '../config/runtimeEnv';

/** True when MP debug logs should print (dev, env flag, or localStorage). */
export function isMpDebugEnabled(): boolean {
  if (!isProdMode()) return true;
  if (viteEnvFlag('VITE_DEBUG_MP')) return true;
  try {
    return localStorage.getItem('sueca-mp-debug') === '1';
  } catch {
    return false;
  }
}

export function mpLog(...args: unknown[]): void {
  if (isMpDebugEnabled()) console.log(...args);
}

export function mpWarn(...args: unknown[]): void {
  if (isMpDebugEnabled()) console.warn(...args);
}
