import React from 'react';
import { kingSyntheticRoundEndCopy } from '../models/games/king/kingContracts';
import './VariantModals.css';

/**
 * UX-ROUND-01 — restrained intermediate cue after synthetic negatives.
 * Table stays visible; score sheet opens after the hold timer.
 */
export const KingSyntheticRoundCompleteCue: React.FC<{ locale?: 'pt' | 'en' }> = ({
  locale = 'pt'
}) => {
  const copy = kingSyntheticRoundEndCopy(locale);
  return (
    <div className="king-synthetic-complete-cue" role="status" aria-live="polite">
      {copy.title}
    </div>
  );
};
