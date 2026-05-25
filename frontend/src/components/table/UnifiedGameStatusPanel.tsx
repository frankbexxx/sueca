import React from 'react';
import { GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import { getKingPtState } from '../../models/games/KingPtGame';
import {
  kingGameTitle,
  KING_NEGATIVE_GAMES
} from '../../models/games/king/kingContracts';
import { resolvePresetId } from '../../constants/rulesPresets';
import { getKingRulesHint } from '../KingRulesHelper';
import { KingGameHistoryPanel } from '../KingGameHistoryPanel';

export interface UnifiedGameStatusPanelProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
}

function truncateHint(text: string, maxLength = 48): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export const UnifiedGameStatusPanel: React.FC<UnifiedGameStatusPanelProps> = ({
  gameState,
  variant,
  rulesPresetId
}) => {
  const { language } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';
  const isPt = locale === 'pt';

  const kingPt = gameState.variantState?.kingPt as { playerScores?: number[] } | undefined;
  const kingSimple = gameState.variantState?.kingSimplified as { playerScores?: number[] } | undefined;
  const hearts = gameState.variantState?.hearts as { playerScores?: number[] } | undefined;

  const scores =
    variant === 'hearts'
      ? hearts?.playerScores ?? [0, 0, 0, 0]
      : kingPt?.playerScores ?? kingSimple?.playerScores ?? [0, 0, 0, 0];

  const pointsLabel = isPt ? 'Pontos (4 jogadores)' : 'Points (4 players)';
  const contractHeader = isPt ? 'Contrato + regra curta' : 'Contract + short rule';

  let contractLine = '';
  let ruleLine = '';

  if (variant === 'king') {
    const preset = resolvePresetId('king', rulesPresetId);
    if (preset === 'king-pt-normal') {
      const king = getKingPtState(gameState);
      const ownerName = gameState.players[king.festaOwnerIndex]?.name ?? '';
      const title =
        king.phase === 'koh_reveal'
          ? isPt
            ? 'Viragem do Rei de Copas'
            : 'King of Hearts draw'
          : kingGameTitle(
              king.gameIndex,
              king.contract,
              king.gameIndex >= KING_NEGATIVE_GAMES ? ownerName : null,
              locale
            );
      const hint = king.phase === 'koh_reveal' ? null : getKingRulesHint(gameState, locale);
      contractLine = title;
      ruleLine = hint ? truncateHint(hint.body) : '';
    } else {
      const simplified = gameState.variantState?.kingSimplified as { handType?: string } | undefined;
      contractLine = isPt ? 'King simplificado' : 'King simplified';
      ruleLine = `${gameState.round}/10 · ${simplified?.handType ?? '…'}`;
    }
  } else if (variant === 'hearts') {
    contractLine = isPt ? 'Copas' : 'Hearts';
    ruleLine = isPt ? 'Individual · evita pontos' : 'Individual · avoid points';
  }

  return (
    <div className="top-strip top-strip--unified">
      <div className="game-status-panel">
        <div className="game-status-panel__grid">
          <div className="game-status-panel__col game-status-panel__col--scores">
            <div className="game-status-panel__label">{pointsLabel}</div>
            <div className="game-status-panel__scores">
              {gameState.players.map((player, index) => (
                <span key={player.id} className="game-status-panel__score-item">
                  P{index + 1}: {scores[index] ?? 0}
                </span>
              ))}
            </div>
          </div>
          <div className="game-status-panel__divider" aria-hidden="true" />
          <div className="game-status-panel__col game-status-panel__col--contract">
            <div className="game-status-panel__label">{contractHeader}</div>
            <div className="game-status-panel__contract">
              <span className="game-status-panel__contract-title">{contractLine}</span>
              {ruleLine && (
                <>
                  <span className="game-status-panel__contract-sep"> · </span>
                  <span className="game-status-panel__contract-hint">{ruleLine}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {variant === 'king' && resolvePresetId('king', rulesPresetId) === 'king-pt-normal' && (() => {
          const king = getKingPtState(gameState);
          return (
            <>
              {king.nullAuctionStartNote && (
                <div className="king-null-start-note">{king.nullAuctionStartNote}</div>
              )}
              <KingGameHistoryPanel gameState={gameState} />
            </>
          );
        })()}
      </div>
    </div>
  );
};
