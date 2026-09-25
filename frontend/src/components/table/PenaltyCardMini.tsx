import React, { useCallback, useState } from 'react';
import type { Card } from '../../types/game';
import { formatPenaltyCardAriaLabel } from './penaltyCardLabel';

export interface PenaltyCardMiniProps {
  card: Pick<Card, 'id' | 'rank' | 'suit'>;
  src: string;
  locale?: 'pt' | 'en';
}

/**
 * UX-KING-CARD-PREVIEW-01 — press-and-hold enlarge for HUD penalty mosaics.
 * Shared by King normal + King Sintético (and Hearts when that path is used).
 */
export const PenaltyCardMini: React.FC<PenaltyCardMiniProps> = ({
  card,
  src,
  locale = 'pt'
}) => {
  const [previewing, setPreviewing] = useState(false);

  const open = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* jsdom / older browsers */
    }
    setPreviewing(true);
  }, []);

  const close = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* ignore */
    }
    setPreviewing(false);
  }, []);

  return (
    <>
      <button
        type="button"
        className="game-status-panel__penalty-card-btn"
        aria-label={formatPenaltyCardAriaLabel(card, locale)}
        aria-pressed={previewing}
        onPointerDown={open}
        onPointerUp={close}
        onPointerCancel={close}
        onLostPointerCapture={() => setPreviewing(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="game-status-panel__penalty-card"
        />
      </button>
      {previewing ? (
        <div className="penalty-card-preview-layer" role="presentation">
          <img
            src={src}
            alt=""
            draggable={false}
            className="penalty-card-preview"
            data-testid="penalty-card-preview"
            data-card-id={card.id}
          />
        </div>
      ) : null}
    </>
  );
};
