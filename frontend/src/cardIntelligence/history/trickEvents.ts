import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState, Suit } from '../../types/game';
import { cloneCards } from '../shared/clone';
import { createEventId } from '../shared/ids';
import { appendLogEvent } from '../shared/storage/logStore';
import { LogSessionMeta, LogSource } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { normalizeRoundIndex } from '../logger/resolveTrickIndex';
import { resolveContract } from '../logger/resolveMode';
import { roundHistoryEngine } from './roundHistory';
import { TrickPlayRecord } from './types';
import { deriveTrickPoints, extractTrickEndVariantFields } from './variantTrickFields';

export function isTrickJustClosed(stateBefore: GameState, stateAfter: GameState): boolean {
  if (stateAfter.waitingForTrickEnd !== true) {
    return false;
  }
  if (stateAfter.currentTrick.length !== 4) {
    return false;
  }
  if (stateBefore.waitingForTrickEnd === true) {
    return false;
  }
  return true;
}

function resolveLedSuit(trick: Card[]): Suit | null {
  return trick.length > 0 ? trick[0].suit : null;
}

function buildPlaysFromTrick(
  stateAfter: GameState,
  roundIndex: number,
  trickIndex: number
): TrickPlayRecord[] {
  const fromHistory = roundHistoryEngine.lastTrickPlays(roundIndex, trickIndex);
  if (fromHistory.length === 4) {
    return fromHistory;
  }

  const trick = stateAfter.currentTrick;
  const leader = stateAfter.trickLeader;
  return trick.map((card, turnIndex) => ({
    roundIndex,
    trickIndex,
    turnIndex,
    playerIndex: (leader + turnIndex) % 4,
    card: { ...card },
  }));
}

function resolveTrickNumberForKing(stateAfter: GameState): number | null {
  const king = stateAfter.variantState?.king as { trickNumber?: number } | undefined;
  if (king && typeof king.trickNumber === 'number') {
    return king.trickNumber + 1;
  }
  return null;
}

export interface BuildTrickEndEventInput {
  gameAdapter: GameAdapter;
  stateAfter: GameState;
  gameId: string;
  sessionId: string;
  trickIndex: number;
  source?: LogSource;
}

export function buildTrickEndEvent(input: BuildTrickEndEventInput): TrickEndEvent {
  const { gameAdapter, stateAfter, gameId, sessionId, trickIndex, source = 'live_game' } = input;

  const winnerIndex = stateAfter.lastTrickWinner;
  if (winnerIndex === null || winnerIndex === undefined) {
    throw new Error('TrickEndEvent requires lastTrickWinner on stateAfter');
  }

  const roundIndex = normalizeRoundIndex(stateAfter);
  const trickCards = cloneCards(stateAfter.currentTrick);
  const plays = buildPlaysFromTrick(stateAfter, roundIndex, trickIndex);
  const trickNumberForKing = resolveTrickNumberForKing(stateAfter);
  const { pointsInTrick, penaltiesInTrick } = deriveTrickPoints(
    gameAdapter,
    stateAfter,
    plays,
    trickNumberForKing
  );
  const variantFields = extractTrickEndVariantFields(
    gameAdapter,
    stateAfter,
    plays,
    winnerIndex,
    trickNumberForKing
  );

  const contractId = resolveContract(stateAfter);
  let contractType: string | null = null;
  if (gameAdapter.variant === 'king') {
    const king = stateAfter.variantState?.king as { phase?: string } | undefined;
    const simplified = stateAfter.variantState?.kingSimplified as { handType?: string } | undefined;
    contractType = king?.phase ?? simplified?.handType ?? null;
  }

  const completedAt = new Date().toISOString();
  const completedTrick = {
    roundIndex,
    trickIndex,
    trickLeader: stateAfter.trickLeader,
    plays,
    winnerIndex,
    ledSuit: resolveLedSuit(trickCards),
    trumpSuit: stateAfter.trumpSuit,
    completedAt,
    pointsInTrick,
    penaltiesInTrick,
    contractId,
    variantFields,
  };

  roundHistoryEngine.completeTrick(completedTrick);

  return {
    eventType: 'trick_end',
    eventId: createEventId(),
    gameId,
    sessionId,
    timestamp: completedAt,
    schemaVersion: '3.0.0',
    variant: gameAdapter.variant,
    roundIndex,
    trickIndex,
    trickLeader: stateAfter.trickLeader,
    trickCards,
    plays,
    winnerIndex,
    ledSuit: resolveLedSuit(trickCards),
    trumpSuit: stateAfter.trumpSuit,
    pointsInTrick,
    penaltiesInTrick,
    contractId,
    contractType,
    roundPlayHistory: roundHistoryEngine.snapshotEntries(),
    variantFields,
    source,
  };
}

export interface LogTrickEndInput {
  gameAdapter: GameAdapter;
  stateAfter: GameState;
  gameId: string;
  sessionId: string;
  trickIndex: number;
  source?: LogSource;
  isMultiplayer?: boolean;
}

export async function logTrickEnd(input: LogTrickEndInput): Promise<void> {
  const event = buildTrickEndEvent(input);
  const sessionMeta: LogSessionMeta = {
    sessionId: input.sessionId,
    gameId: input.gameId,
    variant: input.gameAdapter.variant,
    startedAt: new Date().toISOString(),
    endedAt: null,
    eventCount: 0,
    schemaVersion: '3.0.0',
    source: input.source ?? 'live_game',
    isMultiplayer: input.isMultiplayer ?? false,
  };
  await appendLogEvent(event, sessionMeta);
}
