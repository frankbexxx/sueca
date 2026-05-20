import { useEffect, useState } from 'react';
import { CARD_SPACING, MAX_CARDS_IN_HAND } from '../constants/gameConstants';

const NARROW_BREAKPOINT = 430;

export function useMobileLayout(): { isNarrow: boolean; cardSpacing: number; handMinWidth: number } {
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
  const centerOffset = ((MAX_CARDS_IN_HAND - 1) * cardSpacing) / 2;
  const handMinWidth = Math.ceil(centerOffset * 2 + cardWidth + 16);

  return { isNarrow, cardSpacing, handMinWidth };
}
