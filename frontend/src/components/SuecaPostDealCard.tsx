import React from 'react';
import type { Card } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getCardImagePath } from '../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../utils/cardMappings';
import type {
  SuecaPhysicalDealDirection,
  SuecaPostDealPhase
} from '../models/games/suecaHandRitual';
import { useSceneGeometrySnapshot } from '../hooks/SceneGeometryContext';
import { resolveSuecaRitualCanonicalZone } from '../runtime/canonicalScenePlacement';
import { CanonicalDecisionSurface } from './CanonicalDecisionSurface';
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
  const sceneGeometry = useSceneGeometrySnapshot();
  const geometry = sceneGeometry?.supported === true ? sceneGeometry.geometry : null;
  const ritualKind = phase === 'trump-reveal' ? 'decision' : 'status';
  const canonicalZone = geometry
    ? resolveSuecaRitualCanonicalZone(geometry, ritualKind)
    : 'decisionSheetRect';

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
  } else if (phase === 'hands-reveal') {
    // UX-SUECA-08 — inspectable beat: hands visible, trump not yet; kicker only.
    status = null;
  } else if (phase === 'trump-reveal') {
    kicker = t.modals.trumpRevealTitle;
  } else if (phase === 'first-player') {
    status = t.modals.firstPlayerStarts(firstPlayerName);
  }

  return (
    <CanonicalDecisionSurface
      zone={canonicalZone}
      align="center"
      testId="sueca-post-deal-overlay"
      className="canonical-decision-surface--sueca-ritual"
    >
      <div
        className={`variant-modal dealing-modal dealing-modal--ritual dealing-modal--ritual-plaque dealing-modal--ritual-clearance dealing-modal--ritual-${
          phase === 'trump-reveal' ? 'decision' : 'status'
        }`}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        data-post-deal-phase={phase}
        data-canonical-zone={canonicalZone}
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
    </CanonicalDecisionSurface>
  );
};
