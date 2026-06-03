import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState, GameVariant } from '../../types/game';
import { cloneCard } from '../shared/clone';
import { createGameId, getOrCreateSessionId, resetSessionIdForTests } from '../shared/ids';
import { appendLogEvent } from '../shared/storage/logStore';
import { LogSessionMeta, LogSource } from '../shared/types/logEvents';
import { isTrickJustClosed, buildTrickEndEvent } from '../history/trickEvents';
import { resetRoundHistoryEngineForTests, roundHistoryEngine } from '../history/roundHistory';
import {
  buildCardDecisionEvent,
} from './buildCardDecisionEvent';
import { resetLogFailureCountForTests } from './logFailureTelemetry';
import { normalizeRoundIndex, resolveTurnIndex, trickIndexTracker, resetTrickIndexTrackerForTests } from './resolveTrickIndex';
import { resetRoundHistorySessionForTests } from './roundHistorySession';

export interface LogCardDecisionInput {
  gameAdapter: GameAdapter;
  stateBefore: GameState;
  playerIndex: number;
  cardIndex: number;
  gameConfigMode?: string | null;
  source?: LogSource;
  isMultiplayer?: boolean;
  legalMoves: Card[];
}

export interface LogTrickEndInput {
  gameAdapter: GameAdapter;
  stateBefore: GameState;
  stateAfter: GameState;
  source?: LogSource;
  isMultiplayer?: boolean;
}

let activeGameId: string | null = null;
let activeGameVariant: GameVariant | null = null;

function getOrCreateGameId(variant: GameVariant): string {
  if (!activeGameId || activeGameVariant !== variant) {
    activeGameId = createGameId();
    activeGameVariant = variant;
    roundHistoryEngine.reset();
    trickIndexTracker.reset();
  }
  return activeGameId;
}

const sessionStartedAt = new Map<string, string>();
const sessionEventCounts = new Map<string, number>();

function sessionMetaStartedAt(sessionId: string): string {
  if (!sessionStartedAt.has(sessionId)) {
    sessionStartedAt.set(sessionId, new Date().toISOString());
  }
  return sessionStartedAt.get(sessionId)!;
}

function bumpSessionMeta(meta: LogSessionMeta): LogSessionMeta {
  const next = (sessionEventCounts.get(meta.sessionId) ?? 0) + 1;
  sessionEventCounts.set(meta.sessionId, next);
  return { ...meta, eventCount: next };
}

function recordPlayInHistory(
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
  trickIndex: number | null
): void {
  const hand = stateBefore.players[playerIndex]?.hand ?? [];
  const card = hand[cardIndex];
  if (!card) return;

  roundHistoryEngine.recordPlay({
    roundIndex: normalizeRoundIndex(stateBefore),
    trickIndex,
    turnIndex: resolveTurnIndex(stateBefore),
    playerIndex,
    card: cloneCard(card),
  });
}

export async function logCardDecision(input: LogCardDecisionInput): Promise<void> {
  const {
    gameAdapter,
    stateBefore,
    playerIndex,
    cardIndex,
    gameConfigMode,
    source = 'live_game',
    isMultiplayer = false,
    legalMoves,
  } = input;

  const sessionId = getOrCreateSessionId();
  const gameId = getOrCreateGameId(gameAdapter.variant);
  const roundIndex = normalizeRoundIndex(stateBefore);
  const turnIndex = resolveTurnIndex(stateBefore);
  const trickIndex = trickIndexTracker.resolve(roundIndex, turnIndex);

  recordPlayInHistory(stateBefore, playerIndex, cardIndex, trickIndex);

  const stateAfter = gameAdapter.getCurrentState();

  const event = buildCardDecisionEvent({
    gameAdapter,
    stateBefore,
    stateAfter,
    playerIndex,
    cardIndex,
    gameId,
    sessionId,
    trickIndex,
    gameConfigMode,
    source,
    legalMoves,
  });

  const sessionMeta: LogSessionMeta = {
    sessionId,
    gameId,
    variant: gameAdapter.variant,
    startedAt: sessionMetaStartedAt(sessionId),
    endedAt: null,
    eventCount: 0,
    schemaVersion: '3.0.0',
    source,
    isMultiplayer,
  };

  await appendLogEvent(event, bumpSessionMeta(sessionMeta));
}

export async function logTrickEndDecision(input: LogTrickEndInput): Promise<void> {
  const {
    gameAdapter,
    stateBefore,
    stateAfter,
    source = 'live_game',
    isMultiplayer = false,
  } = input;

  if (!isTrickJustClosed(stateBefore, stateAfter)) {
    return;
  }

  const sessionId = getOrCreateSessionId();
  const gameId = getOrCreateGameId(gameAdapter.variant);
  const roundIndex = normalizeRoundIndex(stateBefore);
  const turnIndex = resolveTurnIndex(stateBefore);
  let trickIndex = trickIndexTracker.resolve(roundIndex, turnIndex);

  if (trickIndex === null && turnIndex === 3) {
    trickIndex = roundHistoryEngine.getCompletedTricks().length;
  }

  if (trickIndex === null) {
    return;
  }

  const sessionMeta = bumpSessionMeta({
    sessionId,
    gameId,
    variant: gameAdapter.variant,
    startedAt: sessionMetaStartedAt(sessionId),
    endedAt: null,
    eventCount: 0,
    schemaVersion: '3.0.0',
    source,
    isMultiplayer,
  });

  const event = buildTrickEndEvent({
    gameAdapter,
    stateAfter,
    gameId,
    sessionId,
    trickIndex,
    source,
  });

  await appendLogEvent(event, sessionMeta);
}

export function resetLoggerSessionForTests(): void {
  activeGameId = null;
  activeGameVariant = null;
  sessionStartedAt.clear();
  sessionEventCounts.clear();
  resetSessionIdForTests();
  resetRoundHistorySessionForTests();
  resetRoundHistoryEngineForTests();
  resetTrickIndexTrackerForTests();
  resetLogFailureCountForTests();
}

export { isTrickJustClosed };
