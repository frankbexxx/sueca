/**
 * One decision timer.
 * Nothing is queued while paused. The callback re-reads pause before it mutates,
 * so a timer that was already armed cannot commit after pause.
 * Unpause is a new call with the full delay — leftover timers are not kept.
 */
export function schedulePauseGatedAction(
  isPaused: boolean,
  delayMs: number,
  stillUnpaused: () => boolean,
  action: () => void
): () => void {
  if (isPaused) {
    return () => undefined;
  }
  const timer = setTimeout(() => {
    if (!stillUnpaused()) return;
    action();
  }, delayMs);
  return () => clearTimeout(timer);
}
