import React, { useState } from 'react';
import { Card, GameState, GameVariant } from '../../types/game';
import { useLanguage } from '../../i18n/useLanguage';
import { getKingPtState, isSyntheticAllNegatives } from '../../models/games/KingPtGame';
import {
  kingHudContractPrimary,
  kingHudMatchProgress,
  kingSyntheticHudSubtitle,
  kingSyntheticProductName,
  KING_NEGATIVE_GAMES,
  type KingNegativeContract
} from '../../models/games/king/kingContracts';
import { isKingSyntheticSession, isKingPtEnginePreset } from '../../models/games/king/kingSyntheticMode';
import { buildKingHudFestaPlayLines } from '../../models/games/king/kingFestaSetupSummary';
import { shouldShowKingPenaltyCards } from '../../models/games/king/kingHudPenaltyDisplay';
import {
  formatKingHudTotalLabel,
  formatSignedScore,
  resolveKingNegativeHudScore
} from '../../models/games/king/kingHudScoreDisplay';
import { resolvePresetId } from '../../constants/rulesPresets';
import { getHeartsRulesHint } from '../HeartsRulesHelper';
import { getHeartsState } from '../../models/games/HeartsGame';
import { getCardImagePath } from '../../constants/cardAssets';
import { RANK_TO_IMAGE_NAME, SUIT_TO_NAME } from '../../utils/cardMappings';
import { SuitBrokenBadge } from './SuitBrokenBadge';
import { KingScoreSheetModal } from '../KingScoreSheetModal';
import { PenaltyCardMini } from './PenaltyCardMini';

export interface UnifiedGameStatusPanelProps {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
  /** Compact global trick progress (replaces seat card counts). */
  trickLabel?: string;
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
  rulesPresetId,
  trickLabel
}) => {
  const { language, t } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';
  const isPt = locale === 'pt';
  const [scoreTableOpen, setScoreTableOpen] = useState(false);

  const kingPt = gameState.variantState?.kingPt as { playerScores?: number[] } | undefined;

  const fallbackTotals =
    variant === 'hearts'
      ? getHeartsState(gameState).playerScores
      : kingPt?.playerScores ?? [0, 0, 0, 0];

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
  let contractDetail: string | null = null;
  let contractFirstPlayer: string | null = null;
  let matchLine: string | null = null;
  let kingContract: KingNegativeContract | null = null;
  let penaltyCardsByPlayer: Card[][] = [[], [], [], []];
  let heartsBroken = false;
  let showNullNote: string | null = null;
  const kingPreset = variant === 'king' ? resolvePresetId('king', rulesPresetId) : null;
  const showKingPtExtras = variant === 'king' && isKingPtEnginePreset(kingPreset ?? undefined);
  const kingPtState = showKingPtExtras ? getKingPtState(gameState) : null;

  if (variant === 'king') {
    if (showKingPtExtras && kingPtState) {
      kingContract = kingPtState.contract;
      penaltyCardsByPlayer = kingPtState.roundBreakdown.penaltyCardsTaken;
      const ownerName = gameState.players[kingPtState.festaOwnerIndex]?.name ?? '';
      const syntheticSession = isKingSyntheticSession(gameState);
      const matchOpts = { syntheticSession };
      if (kingPtState.phase === 'koh_reveal') {
        contractLine = isPt ? 'Viragem do Rei de Copas' : 'King of Hearts draw';
        matchLine = null;
      } else if (
        kingPtState.gameIndex >= KING_NEGATIVE_GAMES &&
        kingPtState.phase === 'festa_play'
      ) {
        const firstIdx = kingPtState.firstPlayerIndex;
        const lines = buildKingHudFestaPlayLines({
          gameIndex: kingPtState.gameIndex,
          phase: kingPtState.phase,
          festaOwnerName: ownerName,
          activeContract: kingPtState.activeContract,
          bestBid: kingPtState.bestBid,
          festaMode: kingPtState.festaMode,
          noTrumpChosen: kingPtState.noTrumpChosen,
          chosenTrump: kingPtState.chosenTrump,
          trumpSuit: gameState.trumpSuit,
          firstPlayerIndex: firstIdx,
          firstPlayerName:
            firstIdx != null ? gameState.players[firstIdx]?.name ?? '' : '',
          locale
        });
        contractLine = lines.primary;
        contractDetail = lines.detail;
        contractFirstPlayer = lines.firstPlayer;
        matchLine = kingHudMatchProgress(kingPtState.gameIndex, locale, matchOpts);
      } else if (
        syntheticSession &&
        kingPtState.gameIndex < KING_NEGATIVE_GAMES
      ) {
        contractLine = kingSyntheticProductName(locale);
        contractDetail = kingSyntheticHudSubtitle(locale);
        matchLine = kingHudMatchProgress(kingPtState.gameIndex, locale, matchOpts);
      } else {
        contractLine = kingHudContractPrimary(
          kingPtState.gameIndex,
          kingPtState.contract,
          kingPtState.gameIndex >= KING_NEGATIVE_GAMES ? ownerName : null,
          locale
        );
        matchLine = kingHudMatchProgress(kingPtState.gameIndex, locale, matchOpts);
      }
      // UX-P3.4b: null note only while it carries setup meaning.
      if (kingPtState.nullAuctionStartNote && kingPtState.phase !== 'koh_reveal') {
        showNullNote = kingPtState.nullAuctionStartNote;
      }
    } else {
      contractLine = isPt ? 'King' : 'King';
      matchLine = null;
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
      shouldShowKingPenaltyCards(kingContract, {
        syntheticAllNegatives: Boolean(kingPtState && isSyntheticAllNegatives(kingPtState))
      })) ||
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
              {gameState.players.map((player, index) => {
                const kingHud =
                  kingPtState != null
                    ? resolveKingNegativeHudScore({
                        gameIndex: kingPtState.gameIndex,
                        phase: kingPtState.phase,
                        lastRoundDeltas: kingPtState.lastRoundDeltas,
                        playerScores: kingPtState.playerScores,
                        roundStartScores: kingPtState.roundStartScores,
                        playerIndex: index
                      })
                    : null;
                const useRoundPrimary = Boolean(kingHud?.roundPrimary);
                const primaryValue = useRoundPrimary
                  ? formatSignedScore(kingHud!.roundDelta)
                  : String(fallbackTotals[index] ?? 0);
                const seatLabel = variant === 'hearts' ? player.name : `P${index + 1}`;

                return (
                  <div key={player.id} className="game-status-panel__score-row">
                    <div className="game-status-panel__score-item">
                      <span className="game-status-panel__score-primary">
                        {seatLabel}: {primaryValue}
                      </span>
                      {useRoundPrimary ? (
                        <span className="game-status-panel__score-total">
                          {formatKingHudTotalLabel(kingHud!.totalScore, locale)}
                        </span>
                      ) : null}
                    </div>
                    {showPenaltyCards && penaltyCardsByPlayer[index]?.length > 0 && (
                      <div className="game-status-panel__penalty-cards">
                        {penaltyCardsByPlayer[index].map((card) => {
                          const src = penaltyCardImage(card);
                          if (!src) return null;
                          return (
                            <PenaltyCardMini
                              key={card.id}
                              card={card}
                              src={src}
                              locale={locale}
                            />
                          );
                        })}
                      </div>
                    )}                  </div>
                );
              })}
            </div>
          </div>
          <div className="game-status-panel__divider" aria-hidden="true" />
          <div className="game-status-panel__col game-status-panel__col--contract">
            <div className="game-status-panel__label">{statusHeader}</div>
            <div className="game-status-panel__contract">
              <span className="game-status-panel__contract-title">{contractLine}</span>
              {contractDetail ? (
                <span className="game-status-panel__contract-detail">{contractDetail}</span>
              ) : null}
              {contractFirstPlayer ? (
                <span className="game-status-panel__contract-first">
                  {contractFirstPlayer}
                </span>
              ) : null}
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
            {showKingPtExtras && kingPtState && !kingPtState.showScorePopup ? (
              <div className="king-score-peek">
                <button
                  type="button"
                  className="sueca-btn sueca-btn--secondary sueca-btn--compact king-score-peek__toggle"
                  data-testid="king-ver-tabela"
                  aria-expanded={scoreTableOpen}
                  onClick={() => setScoreTableOpen(true)}
                >
                  {isPt ? 'Ver tabela' : 'View table'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {scoreTableOpen && showKingPtExtras ? (
        <KingScoreSheetModal
          gameState={gameState}
          onDismiss={() => setScoreTableOpen(false)}
          showContinue={false}
        />
      ) : null}
    </div>
  );
};
