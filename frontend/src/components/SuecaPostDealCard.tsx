import React from 'react';
import type { Card } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getCardImagePath } from '../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../utils/cardMappings';
import type {
  SuecaPhysicalDealDirection,
  SuecaPostDealPhase
} from '../models/games/suecaHandRitual';
import './VariantModals.css';

export interface SuecaPostDealCardProps {
  phase: SuecaPostDealPhase;
  dealerName: string;
  firstPlayerName: string;
  physicalDeal: SuecaPhysicalDealDirection;
  trumpCard: Card | null;
}

/** UX-SUECA-04 — compact ceremony card for post-Distribuir beats. */
export const SuecaPostDealCard: React.FC<SuecaPostDealCardProps> = ({
  phase,
  dealerName,
  firstPlayerName,
  physicalDeal,
  trumpCard
}) => {
  const { t } = useLanguage();

  const trumpSrc = (() => {
    if (!trumpCard) return '';
    const rankName = RANK_TO_IMAGE_NAME[trumpCard.rank as keyof typeof RANK_TO_IMAGE_NAME];
    const suitName = SUIT_TO_NAME[trumpCard.suit as keyof typeof SUIT_TO_NAME];
    return rankName && suitName ? getCardImagePath(rankName, suitName) : '';
  })();

  let kicker = t.modals.dealingTitle;
  let status: string | null = null;
  if (phase === 'deal-confirmed') {
    status =
      physicalDeal === 'right'
        ? t.modals.willDealRight(dealerName)
        : t.modals.willDealLeft(dealerName);
  } else if (phase === 'distributing') {
    status = t.modals.distributing;
  } else if (phase === 'trump-reveal') {
    kicker = t.modals.trumpRevealTitle;
  } else if (phase === 'first-player') {
    status = t.modals.firstPlayerStarts(firstPlayerName);
  }

  return (
    <div
      className="variant-modal-overlay dealing-modal-overlay dealing-modal-overlay--table-ritual"
      data-testid="sueca-post-deal-overlay"
      data-post-deal-phase={phase}
    >
      <div
        className={`variant-modal dealing-modal dealing-modal--ritual dealing-modal--ritual-plaque dealing-modal--ritual-clearance dealing-modal--ritual-${
          phase === 'trump-reveal' ? 'decision' : 'status'
        }`}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
      >
        <p className="dealing-modal-kicker">{kicker}</p>
        {phase === 'trump-reveal' ? (
          <div className="dealing-modal-trump-beat">
            {trumpSrc ? (
              <img
                src={trumpSrc}
                alt={t.modals.trumpRevealTitle}
                className="dealing-modal-trump-card"
                draggable={false}
              />
            ) : (
              <p className="dealing-modal-status">{t.modals.trumpRevealTitle}</p>
            )}
          </div>
        ) : status ? (
          <p className="dealing-modal-status">{status}</p>
        ) : null}
      </div>
    </div>
  );
};
