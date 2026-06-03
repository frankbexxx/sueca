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
} from '../shared/types/logEvents';
import { extractLegalMoves } from './extractLegalMoves';
import { extractVariantFields } from './extractVariantFields';
import { normalizeRoundIndex, resolveTurnIndex } from './resolveTrickIndex';
import { resolveContract, resolveMode } from './resolveMode';
import { roundHistoryEngine } from '../history/roundHistory';
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
  /** Pre-play snapshot; required when adapter state is already mutated after playCard */
  legalMoves?: Card[];
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

function resolveLegalMoves(
  legalMovesInput: Card[] | undefined,
  gameAdapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number
): Card[] {
  if (legalMovesInput) {
    return legalMovesInput;
  }
  if (process.env.NODE_ENV === 'test') {
    return extractLegalMoves(gameAdapter, stateBefore, playerIndex);
  }
  throw new Error('legalMoves required outside unit tests');
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
    legalMoves: legalMovesInput,
  } = input;

  const handBefore = cloneCards(stateBefore.players[playerIndex]?.hand ?? []);
  const chosenCard = handBefore[cardIndex];
  if (!chosenCard) {
    throw new Error(`Invalid cardIndex ${cardIndex} for player ${playerIndex}`);
  }

  const legalMoves = resolveLegalMoves(
    legalMovesInput,
    gameAdapter,
    stateBefore,
    playerIndex
  );
  const trickBefore = cloneCards(stateBefore.currentTrick);
  const trickAfter = [...trickBefore, cloneCard(chosenCard)];
  const roundIndex = normalizeRoundIndex(stateBefore);
  const turnIndex = resolveTurnIndex(stateBefore);
  const playerType = resolvePlayerType(stateBefore, playerIndex);
  const difficulty = resolveDifficulty(stateBefore, playerType);
  const variant = gameAdapter.variant;

  const roundPlayHistory = roundHistoryEngine.snapshotEntries();

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
