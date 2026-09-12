import React from 'react';
import { Card, GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import { getKingPtState } from '../../models/games/KingPtGame';
import {
  kingHudContractPrimary,
  kingHudMatchProgress,
  KING_NEGATIVE_GAMES,
  type KingNegativeContract
} from '../../models/games/king/kingContracts';
import { resolvePresetId } from '../../constants/rulesPresets';
import { getHeartsRulesHint } from '../HeartsRulesHelper';
import { getHeartsState } from '../../models/games/HeartsGame';
import { getCardImagePath } from '../../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../../utils/cardMappings';
import { SuitBrokenBadge } from './SuitBrokenBadge';

export interface UnifiedGameStatusPanelProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
  /** Compact global trick progress (replaces seat card counts). */
  trickLabel?: string;
}

const PENALTY_CARD_CONTRACTS: KingNegativeContract[] = [
  'no_hearts',
  'no_queens',
  'no_men',
  'no_king_hearts'
];

function penaltyCardImage(card: { rank: string; suit: string }): string {
  const rankName = RANK_TO_IMAGE_NAME[card.rank as keyof typeof RANK_TO_IMAGE_NAME];
  const suitName = SUIT_TO_NAME[card.suit as keyof typeof SUIT_TO_NAME];
  if (!rankName || !suitName) return '';
  return getCardImagePath(rankName, suitName);
}

export const UnifiedGameStatusPanel: React.FC<UnifiedGameStatusPanelProps> = ({
  gameState,
  variant,
  rulesPresetId,
  trickLabel
}) => {
  const { language, t } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';
  const isPt = locale === 'pt';

  const kingPt = gameState.variantState?.kingPt as { playerScores?: number[] } | undefined;
  const kingSimple = gameState.variantState?.kingSimplified as { playerScores?: number[] } | undefined;

  const scores =
    variant === 'hearts'
      ? getHeartsState(gameState).playerScores
      : kingPt?.playerScores ?? kingSimple?.playerScores ?? [0, 0, 0, 0];

  const pointsLabel = isPt ? 'Pontos' : 'Points';
  const statusHeader =
    variant === 'king'
      ? isPt
        ? 'Contrato'
        : 'Contract'
      : isPt
        ? 'Estado'
        : 'Status';

  let contractLine = '';
  let matchLine: string | null = null;
  let kingContract: KingNegativeContract | null = null;
  let penaltyCardsByPlayer: Card[][] = [[], [], [], []];
  let heartsBroken = false;
  let showNullNote: string | null = null;
  const kingPreset = variant === 'king' ? resolvePresetId('king', rulesPresetId) : null;
  const showKingPtExtras = variant === 'king' && kingPreset === 'king-pt-normal';
  const kingPtState = showKingPtExtras ? getKingPtState(gameState) : null;

  if (variant === 'king') {
    if (kingPreset === 'king-pt-normal' && kingPtState) {
      kingContract = kingPtState.contract;
      penaltyCardsByPlayer = kingPtState.roundBreakdown.penaltyCardsTaken;
      const ownerName = gameState.players[kingPtState.festaOwnerIndex]?.name ?? '';
      if (kingPtState.phase === 'koh_reveal') {
        contractLine = isPt ? 'Viragem do Rei de Copas' : 'King of Hearts draw';
        matchLine = null;
      } else {
        contractLine = kingHudContractPrimary(
          kingPtState.gameIndex,
          kingPtState.contract,
          kingPtState.gameIndex >= KING_NEGATIVE_GAMES ? ownerName : null,
          locale
        );
        matchLine = kingHudMatchProgress(kingPtState.gameIndex, locale);
      }
      // UX-P3.4b: null note only while it carries setup meaning.
      if (kingPtState.nullAuctionStartNote && kingPtState.phase !== 'koh_reveal') {
        showNullNote = kingPtState.nullAuctionStartNote;
      }
    } else {
      const simplified = gameState.variantState?.kingSimplified as { handType?: string } | undefined;
      contractLine = isPt ? 'King simplificado' : 'King simplified';
      matchLine = isPt
        ? `Jogo ${gameState.round}/10`
        : `Game ${gameState.round}/10`;
      if (simplified?.handType) {
        contractLine = `${contractLine} · ${simplified.handType}`;
      }
    }
  } else if (variant === 'hearts') {
    const heartsState = getHeartsState(gameState);
    // UX-P3.4b: title only — rule encyclopedia lines stay out of the live HUD.
    contractLine = getHeartsRulesHint(locale).title;
    penaltyCardsByPlayer = heartsState.penaltyCardsTaken;
    heartsBroken = heartsState.heartsBroken;
  }

  const showPenaltyCards =
    (variant === 'king' &&
      kingContract !== null &&
      PENALTY_CARD_CONTRACTS.includes(kingContract)) ||
    variant === 'hearts';

  // King festa trump face only during positive festa play.
  const showTrump =
    variant === 'king' &&
    Boolean(gameState.trumpCard) &&
    kingPtState?.festaMode === 'positive';
  const trumpCard = showTrump ? gameState.trumpCard : null;
  const trumpRank = trumpCard
    ? RANK_TO_IMAGE_NAME[trumpCard.rank as keyof typeof RANK_TO_IMAGE_NAME]
    : undefined;
  const trumpSuitName = trumpCard
    ? SUIT_TO_NAME[trumpCard.suit as keyof typeof SUIT_TO_NAME]
    : undefined;
  const trumpSrc =
    trumpRank && trumpSuitName ? getCardImagePath(trumpRank, trumpSuitName) : '';

  const showMeta = Boolean(trickLabel || matchLine || trumpSrc);

  return (
    <div className="top-strip top-strip--unified">
      <div className="game-status-panel game-status-panel--hierarchy">
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
            <div className="game-status-panel__label">{statusHeader}</div>
            <div className="game-status-panel__contract">
              <span className="game-status-panel__contract-title">{contractLine}</span>
            </div>
            {showMeta && (
              <div className="game-status-panel__meta">
                {trickLabel ? (
                  <span className="game-status-panel__trick">{trickLabel}</span>
                ) : null}
                {matchLine ? (
                  <span className="game-status-panel__match">{matchLine}</span>
                ) : null}
                {trumpSrc ? (
                  <img
                    src={trumpSrc}
                    alt={
                      trumpCard
                        ? `Trump ${trumpCard.rank} ${trumpCard.suit}`
                        : 'Trump'
                    }
                    className="trump-card-mini"
                    draggable={false}
                  />
                ) : null}
              </div>
            )}
            {variant === 'hearts' && heartsBroken && (
              <div className="game-status-panel__suit-status">
                <SuitBrokenBadge
                  broken
                  closedLabel={t.heartsStatus.heartsClosed}
                  brokenLabel={t.heartsStatus.heartsBroken}
                />
              </div>
            )}
            {showNullNote && <div className="king-null-start-note">{showNullNote}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
