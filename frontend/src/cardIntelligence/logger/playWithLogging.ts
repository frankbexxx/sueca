import { playFirstLegal } from '../../ai/core/FallbackMoveSelector';
import { CARD_INTELLIGENCE_LOGGER_ENABLED } from '../../config/features';
import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { logCardDecision } from './CardIntelligenceLogger';
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
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
  legalMoves: Card[],
  options: PlayLogOptions
): void {
  void logCardDecision({
    gameAdapter: adapter,
    stateBefore,
    playerIndex,
    cardIndex,
    gameConfigMode: options.gameConfigMode ?? null,
    isMultiplayer: options.isMultiplayer ?? false,
    legalMoves,
  }).catch(recordLogFailure);
}

/**
 * Play a card; log on success when logger is enabled.
 * Caller must pass stateBefore from getCurrentState() immediately before play
 * (e.g. after await tryExternal() in AI paths).
 */
export function playCardAndLogDecision(
  adapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
  options: PlayLogOptions = {}
): boolean {
  const legalMoves = CARD_INTELLIGENCE_LOGGER_ENABLED
    ? createPlayLogSnapshot(adapter, stateBefore, playerIndex).legalMoves
    : null;

  const played = adapter.playCard(stateBefore, playerIndex, cardIndex);

  if (played && legalMoves) {
    logSuccessfulPlay(adapter, stateBefore, playerIndex, cardIndex, legalMoves, options);
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
  const legalMoves = CARD_INTELLIGENCE_LOGGER_ENABLED
    ? createPlayLogSnapshot(adapter, stateBefore, playerIndex).legalMoves
    : null;

  const cardIndex = playFirstLegal(adapter, stateBefore, playerIndex);

  if (cardIndex >= 0 && legalMoves) {
    logSuccessfulPlay(adapter, stateBefore, playerIndex, cardIndex, legalMoves, options);
  }

  return cardIndex;
}
