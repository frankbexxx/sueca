import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getKingPtState } from '../models/games/KingPtGame';
import {
  kingGameTitle,
  KING_NEGATIVE_GAMES
} from '../models/games/king/kingContracts';
import { resolvePresetId } from '../constants/rulesPresets';
import { getKingRulesHint } from './KingRulesHelper';
import { getSpadesState } from '../models/games/SpadesGame';
import { partialTeamBids } from '../models/games/spades/spadesRules';
import { resolveSpadesBrokenVisual } from '../utils/spadesStatusDisplay';
import { KingGameHistoryPanel } from './KingGameHistoryPanel';
import { getCardImagePath } from '../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../utils/cardMappings';

interface GameInfoProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
}

function SpadesBrokenBadge({ broken }: { broken: boolean }) {
  const { t } = useLanguage();
  const visual = resolveSpadesBrokenVisual(broken);
  const label =
    visual === 'broken' ? t.spadesStatus.spadesBroken : t.spadesStatus.spadesClosed;
  return (
    <span
      className={`spades-broken-badge spades-broken-badge--${visual}`}
      aria-label={label}
    >
      {label}
    </span>
  );
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
    if (spades?.waitingForBids) {
      const currentName = gameState.players[spades.currentBidderIndex]?.name ?? '…';
      const partial = partialTeamBids(spades.playerBids, spades.playerBidTypes);
      return (
        <div className="game-info spades-info">
          <span>{t.spadesBid.biddingNow(currentName)}</span>
          <span className="spades-info__partial">
            ♠ {partial.team1} vs {partial.team2}
          </span>
          <SpadesBrokenBadge broken={Boolean(spades.spadesBroken)} />
        </div>
      );
    }
    return (
      <div className="game-info spades-info">
        <span>
          ♠ Bids: {spades?.team1Bid ?? '—'} vs {spades?.team2Bid ?? '—'}
        </span>
        <SpadesBrokenBadge broken={Boolean(spades?.spadesBroken)} />
      </div>
    );
  }

  if (variant === 'hearts') {
    return (
      <div className="game-info hearts-info">
        <span>♥ Hearts · individual</span>
      </div>
    );
  }

  if (variant === 'sueca' && gameState.trumpCard && gameState.trumpSuit) {
    const rankName = RANK_TO_IMAGE_NAME[gameState.trumpCard.rank as keyof typeof RANK_TO_IMAGE_NAME];
    const suitName = SUIT_TO_NAME[gameState.trumpCard.suit as keyof typeof SUIT_TO_NAME];
    const trumpSrc = rankName && suitName ? getCardImagePath(rankName, suitName) : '';
    const dealerName = gameState.players[gameState.dealerIndex]?.name ?? '';
    return (
      <div className="game-info trump-info-in-team">
        <span className="dealer-name">{dealerName}</span>
        {trumpSrc ? (
          <img
            src={trumpSrc}
            alt={`Trunfo ${gameState.trumpCard.rank} ${gameState.trumpCard.suit}`}
            className="trump-card-mini"
            draggable={false}
          />
        ) : (
          <span className="trump-minimal">{gameState.trumpCard.rank}</span>
        )}
      </div>
    );
  }

  return null;
};
