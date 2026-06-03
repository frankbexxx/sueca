import { playFirstLegal } from '../../ai/core/FallbackMoveSelector';
import { CARD_INTELLIGENCE_LOGGER_ENABLED } from '../../config/features';
import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
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

function logSuccessfulPlay(
  adapter: GameAdapter,
  stateBeforeSnapshot: GameState,
  playerIndex: number,
  cardIndex: number,
  legalMoves: Card[],
  options: PlayLogOptions
): void {
  void logCardDecision({
    gameAdapter: adapter,
    stateBefore: stateBeforeSnapshot,
    playerIndex,
    cardIndex,
    gameConfigMode: options.gameConfigMode ?? null,
    isMultiplayer: options.isMultiplayer ?? false,
    legalMoves,
  }).catch(recordLogFailure);

  const stateAfter = adapter.getCurrentState();
  void logTrickEndDecision({
    gameAdapter: adapter,
    stateBefore: stateBeforeSnapshot,
    stateAfter,
    isMultiplayer: options.isMultiplayer ?? false,
  }).catch(recordLogFailure);
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
  const stateSnapshot = CARD_INTELLIGENCE_LOGGER_ENABLED
    ? cloneGameStateSnapshot(stateBefore)
    : null;
  const legalMoves = CARD_INTELLIGENCE_LOGGER_ENABLED
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
  const stateSnapshot = CARD_INTELLIGENCE_LOGGER_ENABLED
    ? cloneGameStateSnapshot(stateBefore)
    : null;
  const legalMoves = CARD_INTELLIGENCE_LOGGER_ENABLED
    ? createPlayLogSnapshot(adapter, stateBefore, playerIndex).legalMoves
    : null;

  const cardIndex = playFirstLegal(adapter, stateBefore, playerIndex);

  if (cardIndex >= 0 && legalMoves && stateSnapshot) {
    logSuccessfulPlay(adapter, stateSnapshot, playerIndex, cardIndex, legalMoves, options);
  }

  return cardIndex;
}
