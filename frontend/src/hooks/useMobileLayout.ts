import { HUMAN_HAND_LAYOUT, computeHumanHandSpacing } from '../table/localHandLayout';
import { LayoutSnapshot, NARROW_BREAKPOINT } from './useLayoutSnapshot';

/** Approximate DOM card display width (matches .card-hand CSS scale). */
export function resolveDomHandCardWidth(isNarrow: boolean): number {
  // CSS --card-w ~44–63; rendered ×0.92. Use conservative mid values.
  return isNarrow ? 42 : 48;
}

export function computeHandLayout(
  isNarrow: boolean,
  cardCount: number,
  availableWidth?: number
): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
  expose: number;
} {
  const cardWidth = resolveDomHandCardWidth(isNarrow);
  // Prefer viewport budget when caller omits measured width (frozen snapshot path).
  const avail =
    availableWidth ??
    (typeof window !== 'undefined'
      ? Math.max(200, Math.floor(window.innerWidth * 0.92))
      : isNarrow
        ? 360 * 0.92
        : 420 * 0.92);

  const { spacing, expose, totalSpan } = computeHumanHandSpacing({
    cardCount,
    cardDisplayWidth: cardWidth,
    availableWidth: avail
  });

  // Scroll escape hatch only when capped spacing is too dense to read rank/suit.
  const useScrollLayout = expose < 0.22 && cardCount > 6;

  return {
    isNarrow,
    cardSpacing: Math.max(1, Math.round(spacing * 1000) / 1000),
    handMinWidth: Math.ceil(totalSpan + 16),
    useScrollLayout,
    expose
  };
}

export function useHandLayout(
  cardCount: number,
  layoutSnapshot: LayoutSnapshot,
  availableWidth?: number
): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
  expose: number;
} {
  return computeHandLayout(layoutSnapshot.isNarrow, cardCount, availableWidth);
}

/** @deprecated Prefer useHandLayout with a frozen LayoutSnapshot from useLayoutSnapshot */
export function useMobileLayout(cardCount = 10): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
  expose: number;
} {
  const isNarrow =
    typeof window !== 'undefined' && window.innerWidth <= NARROW_BREAKPOINT;
  return computeHandLayout(isNarrow, cardCount);
}

export { HUMAN_HAND_LAYOUT };
