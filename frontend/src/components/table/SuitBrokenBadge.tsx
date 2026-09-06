import React from 'react';
import { resolveSuitBrokenVisual } from '../../utils/suitBrokenStatus';

export interface SuitBrokenBadgeProps {
  broken: boolean;
  closedLabel: string;
  brokenLabel: string;
}

/** Compact closed/broken suit badge (Spades ♠ / Hearts ♥). */
export const SuitBrokenBadge: React.FC<SuitBrokenBadgeProps> = ({
  broken,
  closedLabel,
  brokenLabel
}) => {
  const visual = resolveSuitBrokenVisual(broken);
  const label = visual === 'broken' ? brokenLabel : closedLabel;
  return (
    <span className={`suit-broken-badge suit-broken-badge--${visual}`} aria-label={label}>
      {label}
    </span>
  );
};
