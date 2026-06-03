import { GameAdapter } from '../../models/games/GameAdapter';
import {
  AIDifficulty,
  Card,
  GameState,
  PlayerType,
  Suit,
} from '../../types/game';
import { buildScoreSnapshot, cloneCard, cloneCards } from '../shared/clone';
import { createEventId } from '../shared/ids';
import {
  CardDecisionLogEvent,
  LogSource,
  RoundPlayEntry,
} from '../shared/types/logEvents';
import { extractLegalMoves } from './extractLegalMoves';
import { extractVariantFields } from './extractVariantFields';
import { normalizeRoundIndex, resolveTurnIndex } from './resolveTrickIndex';
import { resolveContract, resolveMode } from './resolveMode';
import { roundHistorySession } from './roundHistorySession';
import { suggestMetricCandidates } from './suggestMetricCandidates';
import { validateCardDecisionEvent } from './validateCardDecisionEvent';

export interface BuildCardDecisionEventInput {
  gameAdapter: GameAdapter;
  stateBefore: GameState;
  stateAfter: GameState;
  playerIndex: number;
  cardIndex: number;
  gameId: string;
  sessionId: string;
  trickIndex: number | null;
  gameConfigMode?: string | null;
  source?: LogSource;
}

function resolvePlayerType(state: GameState, playerIndex: number): PlayerType {
  return state.players[playerIndex]?.type ?? 'human';
}

function resolveDifficulty(state: GameState, playerType: PlayerType): AIDifficulty | null {
  return playerType === 'ai' ? state.aiDifficulty ?? null : null;
}

function resolveLedSuit(trickBefore: Card[], chosenCard: Card): Suit | null {
  if (trickBefore.length > 0) {
    return trickBefore[0].suit;
  }
  return null;
}

export function buildCardDecisionEvent(input: BuildCardDecisionEventInput): CardDecisionLogEvent {
  const {
    gameAdapter,
    stateBefore,
    stateAfter,
    playerIndex,
    cardIndex,
    gameId,
    sessionId,
    trickIndex,
    gameConfigMode,
    source = 'live_game',
  } = input;

  const handBefore = cloneCards(stateBefore.players[playerIndex]?.hand ?? []);
  const chosenCard = handBefore[cardIndex];
  if (!chosenCard) {
    throw new Error(`Invalid cardIndex ${cardIndex} for player ${playerIndex}`);
  }

  const legalMoves = extractLegalMoves(gameAdapter, stateBefore, playerIndex);
  const trickBefore = cloneCards(stateBefore.currentTrick);
  const trickAfter = [...trickBefore, cloneCard(chosenCard)];
  const roundIndex = normalizeRoundIndex(stateBefore);
  const turnIndex = resolveTurnIndex(stateBefore);
  const playerType = resolvePlayerType(stateBefore, playerIndex);
  const difficulty = resolveDifficulty(stateBefore, playerType);
  const variant = gameAdapter.variant;

  const historyEntry: RoundPlayEntry = {
    roundIndex,
    trickIndex,
    turnIndex,
    playerIndex,
    card: cloneCard(chosenCard),
  };
  const roundPlayHistory = roundHistorySession.append(historyEntry);

  const event: CardDecisionLogEvent = {
    eventId: createEventId(),
    gameId,
    sessionId,
    timestamp: new Date().toISOString(),
    variant,
    mode: resolveMode(stateBefore, gameConfigMode),
    contract: resolveContract(stateBefore),
    roundIndex,
    trickIndex,
    turnIndex,
    playerIndex,
    playerType,
    difficulty,
    handBefore,
    legalMoves,
    chosenCard: cloneCard(chosenCard),
    trickBefore,
    trickAfter,
    trumpSuit: stateBefore.trumpSuit,
    ledSuit: resolveLedSuit(trickBefore, chosenCard),
    currentWinnerBefore: null,
    currentWinnerAfter: null,
    roundPlayHistory,
    scoreBefore: buildScoreSnapshot(stateBefore),
    scoreAfter: buildScoreSnapshot(stateAfter),
    metricsCandidateIds: suggestMetricCandidates(
      variant,
      stateBefore.variantState as Record<string, unknown> | undefined
    ),
    fixtureCandidateIds: [],
    classification: 'unknown',
    reason: null,
    source,
    aiSource: null,
    schemaVersion: '3.0.0',
    variantFields: extractVariantFields(variant, stateBefore, playerIndex),
  };

  validateCardDecisionEvent(event);
  return event;
}
