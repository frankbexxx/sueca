import { useEffect, useState } from 'react';
import { CARD_SPACING, HAND_SCROLL_THRESHOLD } from '../constants/gameConstants';

const NARROW_BREAKPOINT = 430;

export function useMobileLayout(cardCount = 10): {
  isNarrow: boolean;
  cardSpacing: number;
  handMinWidth: number;
  useScrollLayout: boolean;
} {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= NARROW_BREAKPOINT
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= NARROW_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cardSpacing = isNarrow ? 11 : CARD_SPACING;
  const cardWidth = isNarrow ? 42 : 45;
  const gap = isNarrow ? 4 : 6;
  const useScrollLayout = cardCount > HAND_SCROLL_THRESHOLD || isNarrow;
  const centerOffset = ((Math.max(cardCount, 1) - 1) * cardSpacing) / 2;
  const handMinWidth = useScrollLayout
    ? Math.ceil(cardCount * (cardWidth + gap) + 16)
    : Math.ceil(centerOffset * 2 + cardWidth + 16);

  return { isNarrow, cardSpacing, handMinWidth, useScrollLayout };
}
