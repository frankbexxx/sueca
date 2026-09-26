/**
 * In-memory diagnostic session for the active match.
 * Persist only at completion (cheap append during play).
 */

import { RulesPresetId } from '../constants/rulesPresets';
import { getDurableBuildVersion } from '../services/durableLocalStorage';
import { AIDifficulty, Card, GameVariant, PlayerType, Suit } from '../types/game';
import { createDiagnosticLogId, handsFromPlayers, toCardRef, toCardRefs } from './cards';
import { createMatchSeed } from './rng';
import {
  DiagnosticEvent,
  DiagnosticMatchLog,
  DiagnosticPlayerSnapshot,
  MAX_DIAGNOSTIC_MATCH_LOGS
} from './types';
import { persistCompletedDiagnosticLog } from './store';

export interface StartDiagnosticMatchInput {
  gameVariant: GameVariant;
  rulesPresetId: string;
  difficulty?: AIDifficulty;
  players: DiagnosticPlayerSnapshot[];
  localPlayerIndex?: number;
  /** Optional fixed seed for tests; production generates a fresh seed. */
  seed?: string;
}

let active: DiagnosticMatchLog | null = null;
let lastAiDecisionSeq: number | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function pushEvent(event: Omit<DiagnosticEvent, 'seq' | 'at'> & { at?: string }): DiagnosticEvent | null {
  if (!active) return null;
  const seq = active.events.length + 1;
  const full = {
    ...event,
    seq,
    at: event.at ?? nowIso()
  } as DiagnosticEvent;
  active.events.push(full);
  return full;
}

export function getActiveDiagnosticLog(): DiagnosticMatchLog | null {
  return active;
}

export function resetDiagnosticSessionForTests(): void {
  active = null;
  lastAiDecisionSeq = null;
}

export function startDiagnosticMatch(input: StartDiagnosticMatchInput): DiagnosticMatchLog {
  const seed = input.seed ?? createMatchSeed();
  active = {
    schemaVersion: 1,
    logId: createDiagnosticLogId(),
    startedAt: nowIso(),
    buildVersion: getDurableBuildVersion(),
    gameVariant: input.gameVariant,
    rulesPresetId: input.rulesPresetId,
    difficulty: input.difficulty,
    rng: {
      // Honest: seed is recorded for future LEVEL-2, but gameplay is not driven by it yet.
      algorithm: 'math-random',
      seed,
      deterministic: false
    },
    players: input.players.map((p) => ({ ...p })),
    localPlayerIndex: input.localPlayerIndex,
    events: [],
    replayLevel: 1
  };
  lastAiDecisionSeq = null;

  pushEvent({
    type: 'MATCH_STARTED',
    payload: {
      gameVariant: input.gameVariant,
      rulesPresetId: input.rulesPresetId as RulesPresetId,
      difficulty: input.difficulty
    }
  });

  return active;
}

export function recordDealCompleted(input: {
  players: Array<{ hand?: Card[] }>;
  trumpSuit?: Suit | null;
  trumpCard?: Card | null;
  dealerIndex?: number;
  roundIndex?: number;
}): void {
  if (!active) return;
  const hands = handsFromPlayers(input.players);
  active.initialHands = hands;
  active.trumpSuit = input.trumpSuit ?? null;
  pushEvent({
    type: 'DEAL_COMPLETED',
    payload: {
      hands,
      trumpSuit: input.trumpSuit ?? null,
      trumpCard: input.trumpCard ? toCardRef(input.trumpCard) : null,
      dealerIndex: input.dealerIndex,
      roundIndex: input.roundIndex
    }
  });
}

export function recordAuctionAction(payload: {
  seat: number;
  action: string;
  bidType?: string;
  bidAmount?: number;
  minBidToBeat?: number;
  details?: Record<string, unknown>;
}): void {
  pushEvent({ type: 'AUCTION_ACTION', payload });
}

export function recordFestaDecision(payload: {
  action: string;
  seat?: number;
  details?: Record<string, unknown>;
}): void {
  pushEvent({ type: 'FESTA_DECISION', payload });
}

export function recordHeartsPass(payload: {
  passDirection: string;
  sourceSeat: number;
  destinationSeat: number;
  cards: Card[];
  roundIndex?: number;
}): void {
  pushEvent({
    type: 'HEARTS_PASS',
    payload: {
      passDirection: payload.passDirection,
      sourceSeat: payload.sourceSeat,
      destinationSeat: payload.destinationSeat,
      cards: toCardRefs(payload.cards),
      roundIndex: payload.roundIndex
    }
  });
}

export function recordSpadesBid(payload: {
  seat: number;
  bid: number;
  bidType: string;
  nil: boolean;
  blindNil?: boolean;
  nilEnabled?: boolean;
  currentBidderAfter?: number;
  bidsComplete?: boolean;
  team1Bid?: number | null;
  team2Bid?: number | null;
  roundIndex?: number;
}): void {
  pushEvent({ type: 'SPADES_BID', payload });
}

export function recordSubgame(
  type: 'SUBGAME_STARTED' | 'SUBGAME_COMPLETED',
  payload: {
    subgameIndex?: number;
    kind?: string;
    scoreDelta?: number[];
    details?: Record<string, unknown>;
  }
): void {
  pushEvent({ type, payload });
}

export function recordAiDecision(input: {
  seat: number;
  difficulty?: AIDifficulty | null;
  legalCards: Card[];
  chosenCard: Card;
  trickIndex: number | null;
  gameVariant: GameVariant;
  rulesPresetId?: string;
  context?: Record<string, unknown>;
}): number | null {
  const ev = pushEvent({
    type: 'AI_DECISION',
    payload: {
      seat: input.seat,
      difficulty: input.difficulty ?? null,
      legalCards: toCardRefs(input.legalCards),
      chosenCard: toCardRef(input.chosenCard),
      trickIndex: input.trickIndex,
      gameVariant: input.gameVariant,
      rulesPresetId: input.rulesPresetId,
      ...(input.context ? { context: input.context } : {})
    }
  });
  if (ev) lastAiDecisionSeq = ev.seq;
  return ev?.seq ?? null;
}

export function recordCardPlayed(input: {
  seat: number;
  card: Card;
  trickIndex: number | null;
  playerType?: PlayerType;
  legalCards?: Card[];
  linkAiDecision?: boolean;
}): void {
  pushEvent({
    type: 'CARD_PLAYED',
    payload: {
      seat: input.seat,
      card: toCardRef(input.card),
      trickIndex: input.trickIndex,
      playerType: input.playerType,
      ...(input.legalCards ? { legalCards: toCardRefs(input.legalCards) } : {}),
      ...(input.linkAiDecision && lastAiDecisionSeq != null
        ? { aiDecisionSeq: lastAiDecisionSeq }
        : {})
    }
  });
}

export function recordTrickCompleted(payload: {
  trickIndex: number | null;
  winnerSeat?: number | null;
  cards?: Card[];
}): void {
  pushEvent({
    type: 'TRICK_COMPLETED',
    payload: {
      trickIndex: payload.trickIndex,
      winnerSeat: payload.winnerSeat,
      ...(payload.cards ? { cards: toCardRefs(payload.cards) } : {})
    }
  });
}

export function recordScoreUpdated(scores: Record<string, unknown>): void {
  pushEvent({ type: 'SCORE_UPDATED', payload: { scores } });
}

/**
 * Finalize active match and persist. Safe no-op if no session.
 * Never throws into gameplay.
 */
export async function completeDiagnosticMatch(input?: {
  playerWon?: boolean;
  winner?: number | null;
  finalScores?: Record<string, unknown>;
  summary?: string;
}): Promise<DiagnosticMatchLog | null> {
  if (!active) return null;
  try {
    pushEvent({
      type: 'MATCH_COMPLETED',
      payload: {
        playerWon: input?.playerWon,
        winner: input?.winner ?? null,
        finalScores: input?.finalScores,
        summary: input?.summary
      }
    });
    active.completedAt = nowIso();
    active.finalResult = {
      playerWon: input?.playerWon,
      winner: input?.winner ?? null,
      finalScores: input?.finalScores,
      summary: input?.summary
    };
    const finished = active;
    active = null;
    lastAiDecisionSeq = null;
    await persistCompletedDiagnosticLog(finished, MAX_DIAGNOSTIC_MATCH_LOGS);
    return finished;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[diagnostics] completeDiagnosticMatch failed', err);
    }
    active = null;
    lastAiDecisionSeq = null;
    return null;
  }
}

export function abandonDiagnosticMatch(): void {
  active = null;
  lastAiDecisionSeq = null;
}
