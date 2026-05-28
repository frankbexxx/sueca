import { CARD_SPACING, HAND_SCROLL_THRESHOLD } from '../constants/gameConstants';
import { LayoutSnapshot, NARROW_BREAKPOINT } from './useLayoutSnapshot';

export function computeHandLayout(isNarrow: boolean, cardCount: number): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
} {
  const cardSpacing = isNarrow ? 11 : CARD_SPACING;
  const useScrollLayout = cardCount > HAND_SCROLL_THRESHOLD || isNarrow;
  const centerOffset = ((Math.max(cardCount, 1) - 1) * cardSpacing) / 2;
  const cardWidth = isNarrow ? 42 : 45;
  const handMinWidth = Math.ceil(centerOffset * 2 + cardWidth + 16);

  return { isNarrow, cardSpacing, handMinWidth, useScrollLayout };
}

export function useHandLayout(
  cardCount: number,
  layoutSnapshot: LayoutSnapshot
): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
} {
  return computeHandLayout(layoutSnapshot.isNarrow, cardCount);
}

/** @deprecated Prefer useHandLayout with a frozen LayoutSnapshot from useLayoutSnapshot */
export function useMobileLayout(cardCount = 10): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
} {
  const isNarrow =
    typeof window !== 'undefined' && window.innerWidth <= NARROW_BREAKPOINT;
  return computeHandLayout(isNarrow, cardCount);
}
