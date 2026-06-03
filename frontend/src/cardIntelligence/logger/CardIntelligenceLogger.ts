import { GameAdapter } from '../../models/games/GameAdapter';
import { GameState, GameVariant } from '../../types/game';
import { createGameId, getOrCreateSessionId, resetSessionIdForTests } from '../shared/ids';
import { appendLogEvent } from '../shared/storage/logStore';
import { LogSessionMeta, LogSource } from '../shared/types/logEvents';
import {
  buildCardDecisionEvent,
} from './buildCardDecisionEvent';
import { normalizeRoundIndex, resolveTurnIndex, trickIndexTracker, resetTrickIndexTrackerForTests } from './resolveTrickIndex';
import { resetRoundHistorySessionForTests, roundHistorySession } from './roundHistorySession';

export interface LogCardDecisionInput {
  gameAdapter: GameAdapter;
  stateBefore: GameState;
  playerIndex: number;
  cardIndex: number;
  gameConfigMode?: string | null;
  source?: LogSource;
  isMultiplayer?: boolean;
}

let activeGameId: string | null = null;
let activeGameVariant: GameVariant | null = null;

function getOrCreateGameId(variant: GameVariant): string {
  if (!activeGameId || activeGameVariant !== variant) {
    activeGameId = createGameId();
    activeGameVariant = variant;
    roundHistorySession.reset();
    trickIndexTracker.reset();
  }
  return activeGameId;
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
  } = input;

  const sessionId = getOrCreateSessionId();
  const gameId = getOrCreateGameId(gameAdapter.variant);
  const roundIndex = normalizeRoundIndex(stateBefore);
  const turnIndex = resolveTurnIndex(stateBefore);
  const trickIndex = trickIndexTracker.resolve(roundIndex, turnIndex);
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

const sessionStartedAt = new Map<string, string>();

function sessionMetaStartedAt(sessionId: string): string {
  if (!sessionStartedAt.has(sessionId)) {
    sessionStartedAt.set(sessionId, new Date().toISOString());
  }
  return sessionStartedAt.get(sessionId)!;
}

const sessionEventCounts = new Map<string, number>();

function bumpSessionMeta(meta: LogSessionMeta): LogSessionMeta {
  const next = (sessionEventCounts.get(meta.sessionId) ?? 0) + 1;
  sessionEventCounts.set(meta.sessionId, next);
  return { ...meta, eventCount: next };
}

export function resetLoggerSessionForTests(): void {
  activeGameId = null;
  activeGameVariant = null;
  sessionStartedAt.clear();
  sessionEventCounts.clear();
  resetSessionIdForTests();
  resetRoundHistorySessionForTests();
  resetTrickIndexTrackerForTests();
}
