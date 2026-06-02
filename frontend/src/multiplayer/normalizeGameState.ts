import {
  AIDifficulty,
  DealingMethod,
  GameState,
  GameVariant,
  Player,
} from '../types/game';
import { mpWarn } from '../utils/mpDebug';

function defaultPlayer(index: number, existing?: Partial<Player>): Player {
  const isTeam1 = index === 0 || index === 2;
  return {
    id: existing?.id ?? `player_${index}`,
    name: existing?.name ?? `Player ${index + 1}`,
    hand: [],
    team: (existing?.team ?? (isTeam1 ? 1 : 2)) as 1 | 2,
    type: existing?.type,
    status: existing?.status,
  };
}

function normalizeScores(scores: GameState['scores'] | undefined): GameState['scores'] {
  return {
    team1: scores?.team1 ?? 0,
    team2: scores?.team2 ?? 0,
  };
}

/** Ensures RTDB payloads (missing undefined-stripped keys) are safe for UI and engine. Idempotent. */
export function normalizeGameState(
  partial: Partial<GameState> | null | undefined
): GameState {
  const source = partial && typeof partial === 'object' ? partial : {};
  if (!partial || typeof partial !== 'object') {
    mpWarn('[MP] normalize: empty or invalid payload');
  }

  let players = Array.isArray(source.players) ? source.players : [];
  if (players.length < 4) {
    if (players.length > 0) {
      mpWarn('[MP] normalize padded players', { had: players.length });
    }
    const padded = [...players];
    while (padded.length < 4) {
      padded.push(defaultPlayer(padded.length));
    }
    players = padded;
  }

  const normalizedPlayers: Player[] = players.slice(0, 4).map((p, index) => ({
    ...defaultPlayer(index, p),
    hand: Array.isArray(p?.hand) ? p.hand : [],
  }));

  const normalized: GameState = {
    players: normalizedPlayers,
    currentPlayerIndex: source.currentPlayerIndex ?? 0,
    dealerIndex: source.dealerIndex ?? 0,
    trumpSuit: source.trumpSuit ?? null,
    trumpCard: source.trumpCard ?? null,
    currentTrick: Array.isArray(source.currentTrick) ? source.currentTrick : [],
    trickLeader: source.trickLeader ?? 0,
    scores: normalizeScores(source.scores),
    gameScore: normalizeScores(source.gameScore),
    completedPentes: Array.isArray(source.completedPentes) ? source.completedPentes : [],
    round: source.round ?? 1,
    isGameOver: source.isGameOver ?? false,
    winner: source.winner ?? null,
    lastTrickWinner: source.lastTrickWinner ?? null,
    waitingForTrickEnd: source.waitingForTrickEnd ?? false,
    nextTrickLeader: source.nextTrickLeader ?? null,
    isFirstTrick: source.isFirstTrick ?? true,
    dealingMethod: (source.dealingMethod ?? 'A') as DealingMethod,
    waitingForRoundStart: source.waitingForRoundStart ?? false,
    waitingForRoundEnd: source.waitingForRoundEnd ?? false,
    waitingForGameStart: source.waitingForGameStart ?? false,
    playedCards: Array.isArray(source.playedCards) ? source.playedCards : [],
    isPaused: source.isPaused ?? false,
    playerName: source.playerName ?? normalizedPlayers[0]?.name ?? 'Player 1',
    aiDifficulty: (source.aiDifficulty ?? 'medium') as AIDifficulty,
    partnerSignals: Array.isArray(source.partnerSignals) ? source.partnerSignals : [],
  };

  if (source.nextRoundValue !== undefined) {
    normalized.nextRoundValue = source.nextRoundValue;
  }
  if (source.pendingRoundMultiplier !== undefined) {
    normalized.pendingRoundMultiplier = source.pendingRoundMultiplier;
  }
  if (source.isMultiplayer !== undefined) {
    normalized.isMultiplayer = source.isMultiplayer;
  }
  if (source.sessionId !== undefined) {
    normalized.sessionId = source.sessionId;
  }
  if (source.localPlayerIndex !== undefined) {
    normalized.localPlayerIndex = source.localPlayerIndex;
  }
  if (source.variant !== undefined) {
    normalized.variant = source.variant as GameVariant;
  }
  if (source.variantState !== undefined) {
    normalized.variantState = source.variantState;
  }

  return normalized;
}
