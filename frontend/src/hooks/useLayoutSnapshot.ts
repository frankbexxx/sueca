import { useMemo } from 'react';
import { isMobileDevice } from '../utils/tableLayout';

export const NARROW_BREAKPOINT = 430;

export type LayoutSnapshot = {
  isMobileLayout: boolean;
  isNarrow: boolean;
};

/** Portrait-only game; layout frozen at session start. */
export function useLayoutSnapshot(): LayoutSnapshot {
  return useMemo(
    () => ({
      isMobileLayout: isMobileDevice(),
      isNarrow: typeof window !== 'undefined' && window.innerWidth <= NARROW_BREAKPOINT
    }),
    []
  );
}
