/** True when MP debug logs should print (dev, env flag, or localStorage). */
export function isMpDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  if (process.env.REACT_APP_DEBUG_MP === 'true') return true;
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
