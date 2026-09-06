export type SuitBrokenVisual = 'closed' | 'broken';

/** Shared closed/broken visual for Spades / Hearts status badges. */
export function resolveSuitBrokenVisual(broken: boolean): SuitBrokenVisual {
  return broken ? 'broken' : 'closed';
}
