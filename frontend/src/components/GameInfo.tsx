import React from 'react';
import { GameState, GameVariant } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import { getKingPtState } from '../models/games/KingPtGame';
import {
  kingContractLabel,
  kingGameTitle,
  KING_NEGATIVE_GAMES
} from '../models/games/king/kingContracts';
import { resolvePresetId } from '../constants/rulesPresets';
import { getKingRulesHint } from './KingRulesHelper';
import { KingGameHistoryPanel } from './KingGameHistoryPanel';

interface GameInfoProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
}

export const GameInfo: React.FC<GameInfoProps> = ({ gameState, variant, rulesPresetId }) => {
  const { language } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';

  if (variant === 'king') {
    const preset = resolvePresetId('king', rulesPresetId);
    if (preset === 'king-pt-normal') {
      const king = getKingPtState(gameState);
      const ownerName = gameState.players[king.festaOwnerIndex]?.name ?? '';
      const title = kingGameTitle(
        king.gameIndex,
        king.contract,
        king.gameIndex >= KING_NEGATIVE_GAMES ? ownerName : null,
        locale
      );
      const hint = getKingRulesHint(gameState, locale);
      return (
        <div className="game-info king-info">
          <span className="king-game-title">{title}</span>
          {king.contract && (
            <span className="king-contract-label">
              {kingContractLabel(king.contract, locale)}
            </span>
          )}
          {hint && (
            <div className="king-rules-hint" title={hint.body}>
              <strong>{hint.title}</strong>
              <span>{hint.body}</span>
            </div>
          )}
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
    const spades = gameState.variantState?.spades as
      | { team1Bid?: number; team2Bid?: number; playerBids?: number[] }
      | undefined;
    return (
      <div className="game-info spades-info">
        <span>
          ♠ Bids: {spades?.team1Bid ?? '—'} vs {spades?.team2Bid ?? '—'}
        </span>
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
    return (
      <div className="game-info trump-info-in-team">
        <span className="dealer-name">{gameState.players[gameState.dealerIndex]?.name}</span>
        <span className="trump-minimal">{gameState.trumpCard.rank}</span>
      </div>
    );
  }

  return null;
};
