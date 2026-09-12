import React from 'react';
import { GameState, GameVariant, Suit } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getSpadesState } from '../models/games/SpadesGame';
import { SuitBrokenBadge } from './table/SuitBrokenBadge';
import { getCardImagePath } from '../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../utils/cardMappings';
import { resolveTrumpSuitBadge } from '../utils/trumpSuitDisplay';
import type { Translations } from '../i18n/translations';

interface GameInfoProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
}

function suitLabelFor(t: Translations, suit: Suit): string {
  switch (suit) {
    case 'clubs':
      return t.gameBoard.suitClubs;
    case 'diamonds':
      return t.gameBoard.suitDiamonds;
    case 'hearts':
      return t.gameBoard.suitHearts;
    case 'spades':
      return t.gameBoard.suitSpades;
  }
}

/**
 * Center status for Sueca / Spades team strip (UX-P3.4b).
 * King/Hearts use UnifiedGameStatusPanel — keep this branch lean.
 */
export const GameInfo: React.FC<GameInfoProps> = ({ gameState, variant }) => {
  const { t } = useLanguage();

  if (variant === 'spades') {
    const spades = getSpadesState(gameState);
    if (spades?.waitingForBids) {
      const currentName = gameState.players[spades.currentBidderIndex]?.name ?? '…';
      // Seats own per-player bid badges; strip only names whose turn it is.
      return (
        <div className="game-info spades-info spades-info--bidding">
          <span className="spades-info__now">{t.spadesBid.biddingNow(currentName)}</span>
        </div>
      );
    }
    // Team bids live in TeamScoreBlock — only surface broken when it matters.
    if (!spades?.spadesBroken) return null;
    return (
      <div className="game-info spades-info">
        <SuitBrokenBadge
          broken
          closedLabel={t.spadesStatus.spadesClosed}
          brokenLabel={t.spadesStatus.spadesBroken}
        />
      </div>
    );
  }

  if (variant === 'sueca') {
    const trumpBadge = resolveTrumpSuitBadge(gameState.trumpSuit);
    const trumpCard = gameState.trumpCard;
    if (!trumpBadge && !trumpCard) return null;

    const rankName = trumpCard
      ? RANK_TO_IMAGE_NAME[trumpCard.rank as keyof typeof RANK_TO_IMAGE_NAME]
      : undefined;
    const suitName = trumpCard
      ? SUIT_TO_NAME[trumpCard.suit as keyof typeof SUIT_TO_NAME]
      : undefined;
    const trumpSrc = rankName && suitName ? getCardImagePath(rankName, suitName) : '';
    const aria =
      trumpBadge != null
        ? t.gameBoard.trumpAria(suitLabelFor(t, trumpBadge.suit))
        : undefined;

    // Dealer is on seats (D). HUD keeps a single trump face.
    return (
      <div className="game-info trump-info-in-team">
        {trumpSrc ? (
          <img
            src={trumpSrc}
            alt={aria ?? `Trump ${trumpCard?.rank} ${trumpCard?.suit}`}
            className="trump-card-mini"
            draggable={false}
          />
        ) : null}
      </div>
    );
  }

  return null;
};
