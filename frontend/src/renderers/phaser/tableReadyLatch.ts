/**
 * UX-SUECA-04 — one-shot latch for Sueca table visual readiness.
 * Presentation only; does not touch engine/rules.
 */

export type TableReadyNotify = () => void;

/**
 * Fires `onReady` at most once when surface + seats are ready.
 * Safe to call when readiness arrives before or after the subscriber is installed:
 * keep calling `tryNotify` whenever either side of the race updates.
 */
export function createTableReadyLatch(onReady: TableReadyNotify): {
  tryNotify: (ready: { surfaceReady: boolean; seatsReady: boolean }) => boolean;
  hasFired: () => boolean;
} {
  let fired = false;
  return {
    hasFired: () => fired,
    tryNotify: ({ surfaceReady, seatsReady }) => {
      if (fired) return true;
      if (!surfaceReady || !seatsReady) return false;
      fired = true;
      onReady();
      return true;
    }
  };
}
