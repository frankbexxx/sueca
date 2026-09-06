import React from 'react';
import { GameState, GameVariant, Suit } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getKingPtState } from '../models/games/KingPtGame';
import {
  kingGameTitle,
  KING_NEGATIVE_GAMES
} from '../models/games/king/kingContracts';
import { resolvePresetId } from '../constants/rulesPresets';
import { getKingRulesHint } from './KingRulesHelper';
import { getSpadesState } from '../models/games/SpadesGame';
import { getHeartsState } from '../models/games/HeartsGame';
import { partialTeamBids } from '../models/games/spades/spadesRules';
import { SuitBrokenBadge } from './table/SuitBrokenBadge';
import { KingGameHistoryPanel } from './KingGameHistoryPanel';
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

export const GameInfo: React.FC<GameInfoProps> = ({ gameState, variant, rulesPresetId }) => {
  const { language, t } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';

  if (variant === 'king') {
    const preset = resolvePresetId('king', rulesPresetId);
    if (preset === 'king-pt-normal') {
      const king = getKingPtState(gameState);
      const ownerName = gameState.players[king.festaOwnerIndex]?.name ?? '';
      const title =
        king.phase === 'koh_reveal'
          ? locale === 'pt'
            ? 'Viragem do Rei de Copas'
            : 'King of Hearts draw'
          : kingGameTitle(
              king.gameIndex,
              king.contract,
              king.gameIndex >= KING_NEGATIVE_GAMES ? ownerName : null,
              locale
            );
      const hint = king.phase === 'koh_reveal' ? null : getKingRulesHint(gameState, locale);
      return (
        <div className="game-info king-info">
          <span className="king-game-title">{title}</span>
          {hint && <span className="king-rules-hint">{hint.body}</span>}
          {king.nullAuctionStartNote && (
            <div className="king-null-start-note">{king.nullAuctionStartNote}</div>
          )}
          <KingGameHistoryPanel gameState={gameState} />
        </div>
      );
    }
    const simplified = gameState.variantState?.kingSimplified as { handType?: string } | undefined;
    return (
      <div className="game-info king-info">
        <span>
          King simplificado · {gameState.round}/10 ({simplified?.handType ?? '…'})
        </span>
      </div>
    );
  }

  if (variant === 'spades') {
    const spades = getSpadesState(gameState);
    const brokenBadge = (
      <SuitBrokenBadge
        broken={Boolean(spades?.spadesBroken)}
        closedLabel={t.spadesStatus.spadesClosed}
        brokenLabel={t.spadesStatus.spadesBroken}
      />
    );
    if (spades?.waitingForBids) {
      const currentName = gameState.players[spades.currentBidderIndex]?.name ?? '…';
      const partial = partialTeamBids(spades.playerBids, spades.playerBidTypes);
      return (
        <div className="game-info spades-info">
          <span>{t.spadesBid.biddingNow(currentName)}</span>
          <span className="spades-info__partial">
            ♠ {partial.team1} vs {partial.team2}
          </span>
          {brokenBadge}
        </div>
      );
    }
    return (
      <div className="game-info spades-info">
        <span>
          ♠ Bids: {spades?.team1Bid ?? '—'} vs {spades?.team2Bid ?? '—'}
        </span>
        {brokenBadge}
      </div>
    );
  }

  if (variant === 'hearts') {
    const hearts = getHeartsState(gameState);
    return (
      <div className="game-info hearts-info">
        <span>♥ Hearts · individual</span>
        <SuitBrokenBadge
          broken={Boolean(hearts.heartsBroken)}
          closedLabel={t.heartsStatus.heartsClosed}
          brokenLabel={t.heartsStatus.heartsBroken}
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
    const dealerName = gameState.players[gameState.dealerIndex]?.name ?? '';
    const aria =
      trumpBadge != null
        ? t.gameBoard.trumpAria(suitLabelFor(t, trumpBadge.suit))
        : undefined;

    return (
      <div className="game-info trump-info-in-team">
        {dealerName ? <span className="dealer-name">{dealerName}</span> : null}
        {trumpBadge ? (
          <span
            className={`sueca-trump-badge sueca-trump-badge--${trumpBadge.tone}`}
            aria-label={aria}
            title={aria}
          >
            <span className="sueca-trump-badge__label">{t.gameBoard.trump}</span>
            <span className="sueca-trump-badge__symbol" aria-hidden="true">
              {trumpBadge.symbol}
            </span>
          </span>
        ) : null}
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
