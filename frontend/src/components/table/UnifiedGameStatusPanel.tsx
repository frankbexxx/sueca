import React from 'react';
import { Card, GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import { getKingPtState } from '../../models/games/KingPtGame';
import {
  kingGameTitle,
  KING_NEGATIVE_GAMES,
  KingNegativeContract
} from '../../models/games/king/kingContracts';
import { resolvePresetId } from '../../constants/rulesPresets';
import { getKingRulesHint } from '../KingRulesHelper';
import { getHeartsRulesHint } from '../HeartsRulesHelper';
import { KingGameHistoryPanel } from '../KingGameHistoryPanel';
import { getHeartsState } from '../../models/games/HeartsGame';
import { getCardImagePath } from '../../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../../utils/cardMappings';

export interface UnifiedGameStatusPanelProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
}

const PENALTY_CARD_CONTRACTS: KingNegativeContract[] = [
  'no_hearts',
  'no_queens',
  'no_men',
  'no_king_hearts'
];

function truncateHint(text: string, maxLength = 36): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function penaltyCardImage(card: { rank: string; suit: string }): string {
  const rankName = RANK_TO_IMAGE_NAME[card.rank as keyof typeof RANK_TO_IMAGE_NAME];
  const suitName = SUIT_TO_NAME[card.suit as keyof typeof SUIT_TO_NAME];
  if (!rankName || !suitName) return '';
  return getCardImagePath(rankName, suitName);
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

  const scores =
    variant === 'hearts'
      ? getHeartsState(gameState).playerScores
      : kingPt?.playerScores ?? kingSimple?.playerScores ?? [0, 0, 0, 0];

  const pointsLabel = isPt ? 'Pontos' : 'Points';
  const contractHeader = isPt ? 'Contrato + regra curta' : 'Contract + short rule';

  let contractLine = '';
  let ruleLine = '';
  let heartsRuleLines: string[] = [];
  let kingContract: KingNegativeContract | null = null;
  let penaltyCardsByPlayer: Card[][] = [[], [], [], []];
  const kingPreset = variant === 'king' ? resolvePresetId('king', rulesPresetId) : null;
  const showKingPtExtras = variant === 'king' && kingPreset === 'king-pt-normal';
  const kingPtState = showKingPtExtras ? getKingPtState(gameState) : null;

  if (variant === 'king') {
    if (kingPreset === 'king-pt-normal' && kingPtState) {
      kingContract = kingPtState.contract;
      penaltyCardsByPlayer = kingPtState.roundBreakdown.penaltyCardsTaken;
      const ownerName = gameState.players[kingPtState.festaOwnerIndex]?.name ?? '';
      const title =
        kingPtState.phase === 'koh_reveal'
          ? isPt
            ? 'Viragem do Rei de Copas'
            : 'King of Hearts draw'
          : kingGameTitle(
              kingPtState.gameIndex,
              kingPtState.contract,
              kingPtState.gameIndex >= KING_NEGATIVE_GAMES ? ownerName : null,
              locale
            );
      const hint = kingPtState.phase === 'koh_reveal' ? null : getKingRulesHint(gameState, locale);
      contractLine = title;
      ruleLine = hint ? truncateHint(hint.body) : '';
    } else {
      const simplified = gameState.variantState?.kingSimplified as { handType?: string } | undefined;
      contractLine = isPt ? 'King simplificado' : 'King simplified';
      ruleLine = `${gameState.round}/10 · ${simplified?.handType ?? '…'}`;
    }
  } else if (variant === 'hearts') {
    const heartsState = getHeartsState(gameState);
    const heartsHint = getHeartsRulesHint(locale);
    contractLine = heartsHint.title;
    heartsRuleLines = heartsHint.lines;
    penaltyCardsByPlayer = heartsState.penaltyCardsTaken;
  }

  const showPenaltyCards =
    (variant === 'king' &&
      kingContract !== null &&
      PENALTY_CARD_CONTRACTS.includes(kingContract)) ||
    variant === 'hearts';

  return (
    <div className="top-strip top-strip--unified">
      <div className="game-status-panel">
        <div className="game-status-panel__grid">
          <div className="game-status-panel__col game-status-panel__col--scores">
            <div className="game-status-panel__label">{pointsLabel}</div>
            <div className="game-status-panel__scores">
              {gameState.players.map((player, index) => (
                <div key={player.id} className="game-status-panel__score-row">
                  <span className="game-status-panel__score-item">
                    {variant === 'hearts' ? player.name : `P${index + 1}`}: {scores[index] ?? 0}
                  </span>
                  {showPenaltyCards && penaltyCardsByPlayer[index]?.length > 0 && (
                    <div className="game-status-panel__penalty-cards">
                      {penaltyCardsByPlayer[index].map((card) => {
                        const src = penaltyCardImage(card);
                        if (!src) return null;
                        return (
                          <img
                            key={card.id}
                            src={src}
                            alt={`${card.rank} ${card.suit}`}
                            className="game-status-panel__penalty-card"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="game-status-panel__divider" aria-hidden="true" />
          <div className="game-status-panel__col game-status-panel__col--contract">
            <div className="game-status-panel__label">{contractHeader}</div>
            <div className="game-status-panel__contract">
              <span className="game-status-panel__contract-title">{contractLine}</span>
              {variant === 'hearts' && heartsRuleLines.length > 0 ? (
                <div className="game-status-panel__contract-rules">
                  {heartsRuleLines.map((line) => (
                    <div key={line} className="game-status-panel__contract-rule-line">
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                ruleLine && (
                  <>
                    <span className="game-status-panel__contract-sep"> · </span>
                    <span className="game-status-panel__contract-hint">{ruleLine}</span>
                  </>
                )
              )}
            </div>
            {showKingPtExtras && kingPtState?.nullAuctionStartNote && (
              <div className="king-null-start-note">{kingPtState.nullAuctionStartNote}</div>
            )}
            {showKingPtExtras && <KingGameHistoryPanel gameState={gameState} />}
          </div>
        </div>
      </div>
    </div>
  );
};
