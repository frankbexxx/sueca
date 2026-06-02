/** True when MP debug logs should print (dev or explicit flag). */
export function isMpDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.REACT_APP_DEBUG_MP === 'true'
  );
}

export function mpLog(...args: unknown[]): void {
  if (isMpDebugEnabled()) console.log(...args);
}

export function mpWarn(...args: unknown[]): void {
  if (isMpDebugEnabled()) console.warn(...args);
}
