import {
  AIDifficulty,
  DealAlignment,
  GameState,
  GameVariant,
  Player,
  PlayDirection,
} from '../types/game';
import { mpWarn } from '../utils/mpDebug';
import {
  migrateSuecaPersistedState,
  stampSuecaSchemaV2,
  SUECA_STATE_SCHEMA_VERSION
} from '../models/games/migrateSuecaPersistedState';

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

function isSeat(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3;
}

/** Ensures RTDB payloads (missing undefined-stripped keys) are safe for UI and engine. Idempotent. */
export function normalizeGameState(
  partial: Partial<GameState> | null | undefined
): GameState {
  const source = partial && typeof partial === 'object' ? partial : {};
  if (!partial || typeof partial !== 'object') {
    mpWarn('[MP] normalize: empty or invalid payload');
  }

  const variant = (source.variant ?? 'sueca') as GameVariant;

  // Sueca: central schema migrator is source of truth for playDirection / dealAlignment.
  if (variant === 'sueca') {
    const sourcePlayers = Array.isArray(source.players) ? source.players : [];
    if (sourcePlayers.length > 0 && sourcePlayers.length < 4) {
      mpWarn('[MP] normalize padded players', { had: sourcePlayers.length });
    }
    const migrated = migrateSuecaPersistedState({ ...source, variant: 'sueca' });
    if (migrated.ok && migrated.state) {
      return migrated.state;
    }
    mpWarn('[MP] normalize: Sueca migration rejected', {
      reason: migrated.reason,
      action: migrated.action
    });
    // Soft-hidden MP / corrupt payload: do not invent mid-hand progression.
    // Prefer safe waiting boundary rather than bogus currentPlayer=0.
    const fallback = migrateSuecaPersistedState({
      ...source,
      variant: 'sueca',
      waitingForRoundStart: true,
      currentTrick: [],
      waitingForTrickEnd: false,
      playDirection: source.playDirection === 'left' ? 'left' : 'right',
      dealAlignment: 'same',
      players: (Array.isArray(source.players) ? source.players : []).map((p) => ({
        ...p,
        hand: []
      })),
      trumpSuit: null,
      trumpCard: null,
      playedCards: []
    });
    if (fallback.ok && fallback.state) {
      return fallback.state;
    }
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
    currentPlayerIndex: isSeat(source.currentPlayerIndex) ? source.currentPlayerIndex : 0,
    dealerIndex: isSeat(source.dealerIndex) ? source.dealerIndex : 0,
    trumpSuit: source.trumpSuit ?? null,
    trumpCard: source.trumpCard ?? null,
    currentTrick: Array.isArray(source.currentTrick) ? source.currentTrick : [],
    trickLeader: isSeat(source.trickLeader) ? source.trickLeader : 0,
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
    playDirection: (source.playDirection === 'left' || source.playDirection === 'right'
      ? source.playDirection
      : 'right') as PlayDirection,
    dealAlignment: (source.dealAlignment === 'same' || source.dealAlignment === 'opposite'
      ? source.dealAlignment
      : 'same') as DealAlignment,
    waitingForRoundStart: source.waitingForRoundStart ?? false,
    waitingForRoundEnd: source.waitingForRoundEnd ?? false,
    waitingForGameStart: source.waitingForGameStart ?? false,
    playedCards: Array.isArray(source.playedCards) ? source.playedCards : [],
    isPaused: source.isPaused ?? false,
    playerName: source.playerName ?? normalizedPlayers[0]?.name ?? 'Player 1',
    aiDifficulty: (source.aiDifficulty ?? 'medium') as AIDifficulty,
    partnerSignals: Array.isArray(source.partnerSignals) ? source.partnerSignals : [],
    variant
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
  if (source.variantState !== undefined) {
    normalized.variantState = source.variantState;
  }
  if (typeof source.schemaVersion === 'number') {
    normalized.schemaVersion = source.schemaVersion;
  } else if (variant === 'sueca') {
    normalized.schemaVersion = SUECA_STATE_SCHEMA_VERSION;
  }

  return variant === 'sueca' ? stampSuecaSchemaV2(normalized) : normalized;
}
