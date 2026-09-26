import { playFirstLegal } from '../../ai/core/FallbackMoveSelector';
import { CARD_INTELLIGENCE_LOGGER_ENABLED } from '../../config/features';
import {
  recordAiDecision,
  recordCardPlayed,
  recordTrickCompleted,
  getActiveDiagnosticLog
} from '../../diagnostics/session';
import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState, GameVariant } from '../../types/game';
import { cloneGameStateSnapshot } from '../shared/clone';
import { logCardDecision, logTrickEndDecision } from './CardIntelligenceLogger';
import { extractLegalMoves } from './extractLegalMoves';
import { recordLogFailure } from './logFailureTelemetry';

export interface PlayLogOptions {
  gameConfigMode?: string | null;
  isMultiplayer?: boolean;
}

function createPlayLogSnapshot(
  adapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number
): { legalMoves: Card[] } {
  return { legalMoves: extractLegalMoves(adapter, stateBefore, playerIndex) };
}

function resolveTrickIndex(state: GameState): number {
  return Math.floor((state.playedCards?.length ?? 0) / 4);
}

function recordDiagnosticPlay(
  stateBeforeSnapshot: GameState,
  stateAfter: GameState,
  playerIndex: number,
  cardIndex: number,
  legalMoves: Card[],
  options: PlayLogOptions
): void {
  if (!getActiveDiagnosticLog()) return;
  try {
    const hand = stateBeforeSnapshot.players[playerIndex]?.hand ?? [];
    const chosen = hand[cardIndex];
    if (!chosen) return;
    const playerType = stateBeforeSnapshot.players[playerIndex]?.type;
    const trickIndex = resolveTrickIndex(stateBeforeSnapshot);
    const isAi = playerType === 'ai';
    const active = getActiveDiagnosticLog();
    const gameVariant = (stateBeforeSnapshot.variant ??
      active?.gameVariant ??
      'sueca') as GameVariant;

    if (isAi) {
      recordAiDecision({
        seat: playerIndex,
        difficulty: stateBeforeSnapshot.aiDifficulty ?? null,
        legalCards: legalMoves,
        chosenCard: chosen,
        trickIndex,
        gameVariant,
        rulesPresetId:
          options.gameConfigMode ??
          (stateBeforeSnapshot.variantState?.rulesPresetId as string | undefined) ??
          active?.rulesPresetId,
        context: {
          trumpSuit: stateBeforeSnapshot.trumpSuit,
          trickLenBefore: stateBeforeSnapshot.currentTrick.length,
          round: stateBeforeSnapshot.round
        }
      });
    }

    recordCardPlayed({
      seat: playerIndex,
      card: chosen,
      trickIndex,
      playerType,
      legalCards: legalMoves,
      linkAiDecision: isAi
    });

    if (
      stateAfter.currentTrick.length === 0 &&
      stateBeforeSnapshot.currentTrick.length + 1 === 4
    ) {
      recordTrickCompleted({
        trickIndex,
        winnerSeat: stateAfter.lastTrickWinner,
        cards: [...stateBeforeSnapshot.currentTrick, chosen]
      });
    }
  } catch {
    /* never break gameplay */
  }
}

function logSuccessfulPlay(
  adapter: GameAdapter,
  stateBeforeSnapshot: GameState,
  playerIndex: number,
  cardIndex: number,
  legalMoves: Card[],
  options: PlayLogOptions
): void {
  if (CARD_INTELLIGENCE_LOGGER_ENABLED) {
    void logCardDecision({
      gameAdapter: adapter,
      stateBefore: stateBeforeSnapshot,
      playerIndex,
      cardIndex,
      gameConfigMode: options.gameConfigMode ?? null,
      isMultiplayer: options.isMultiplayer ?? false,
      legalMoves,
    }).catch(recordLogFailure);
  }

  const stateAfter = adapter.getCurrentState();

  if (CARD_INTELLIGENCE_LOGGER_ENABLED) {
    void logTrickEndDecision({
      gameAdapter: adapter,
      stateBefore: stateBeforeSnapshot,
      stateAfter,
      isMultiplayer: options.isMultiplayer ?? false,
    }).catch(recordLogFailure);
  }

  recordDiagnosticPlay(
    stateBeforeSnapshot,
    stateAfter,
    playerIndex,
    cardIndex,
    legalMoves,
    options
  );
}

/**
 * Play a card; log on success when logger is enabled.
 * Caller must pass stateBefore from getCurrentState() immediately before play
 * (e.g. after await tryExternal() in AI paths).
 * A deep snapshot is taken before playCard so Sueca shallow getState() cannot mutate pre-play trick.
 */
export function playCardAndLogDecision(
  adapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
  options: PlayLogOptions = {}
): boolean {
  const needsSnapshot =
    CARD_INTELLIGENCE_LOGGER_ENABLED || !!getActiveDiagnosticLog();
  const stateSnapshot = needsSnapshot
    ? cloneGameStateSnapshot(stateBefore)
    : null;
  const legalMoves = needsSnapshot
    ? createPlayLogSnapshot(adapter, stateBefore, playerIndex).legalMoves
    : null;

  const played = adapter.playCard(stateBefore, playerIndex, cardIndex);

  if (played && legalMoves && stateSnapshot) {
    logSuccessfulPlay(adapter, stateSnapshot, playerIndex, cardIndex, legalMoves, options);
  }

  return played;
}

/**
 * Play first legal card; log on success when logger is enabled.
 * Snapshot is taken before any playFirstLegal attempt.
 */
export function playFirstLegalAndLogDecision(
  adapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number,
  options: PlayLogOptions = {}
): number {
  const needsSnapshot =
    CARD_INTELLIGENCE_LOGGER_ENABLED || !!getActiveDiagnosticLog();
  const stateSnapshot = needsSnapshot
    ? cloneGameStateSnapshot(stateBefore)
    : null;
  const legalMoves = needsSnapshot
    ? createPlayLogSnapshot(adapter, stateBefore, playerIndex).legalMoves
    : null;

  const cardIndex = playFirstLegal(adapter, stateBefore, playerIndex);

  if (cardIndex >= 0 && legalMoves && stateSnapshot) {
    logSuccessfulPlay(adapter, stateSnapshot, playerIndex, cardIndex, legalMoves, options);
  }

  return cardIndex;
}
