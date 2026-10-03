/**
 * Pure host-side builder: authoritative GameState → one seat's viewer DTO.
 * No Firebase / React. Allow-list construction only (no blacklist strip).
 */

import type { Card, GameState, Player } from '../types/game';
import { isMatchResult } from '../models/matchResult';
import {
  MULTIPLAYER_VIEWER_SCHEMA,
  type MultiplayerViewerPlayer,
  type MultiplayerViewerState
} from './viewerState';

function isViewerSeat(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3;
}

function cloneCard(card: Card): Card {
  return { suit: card.suit, rank: card.rank, id: card.id };
}

function cloneCards(cards: Card[] | undefined | null): Card[] {
  if (!Array.isArray(cards)) return [];
  return cards.map(cloneCard);
}

function cloneScore(scores: { team1: number; team2: number } | undefined): {
  team1: number;
  team2: number;
} {
  return {
    team1: scores?.team1 ?? 0,
    team2: scores?.team2 ?? 0
  };
}

function buildViewerPlayer(player: Player, seatIndex: number, viewerSeat: number): MultiplayerViewerPlayer {
  const hand = Array.isArray(player.hand) ? player.hand : [];
  const row: MultiplayerViewerPlayer = {
    id: player.id,
    name: player.name,
    team: player.team,
    handCount: hand.length
  };
  if (player.type !== undefined) {
    row.type = player.type;
  }
  if (seatIndex === viewerSeat) {
    row.hand = cloneCards(hand);
  }
  return row;
}

/**
 * Build a viewer-safe Sueca snapshot for `viewerSeat`.
 * @throws if `viewerSeat` is not an integer 0..3, players are incomplete, or variant is non-sueca
 */
export function buildViewerState(
  fullState: GameState,
  viewerSeat: number
): MultiplayerViewerState {
  if (!isViewerSeat(viewerSeat)) {
    throw new Error('invalid_viewer_seat');
  }

  const variant = fullState.variant ?? 'sueca';
  if (variant !== 'sueca') {
    throw new Error('invalid_viewer_variant');
  }

  const players = fullState.players;
  if (!Array.isArray(players) || players.length !== 4) {
    throw new Error('invalid_viewer_players');
  }
  for (let i = 0; i < 4; i++) {
    if (!players[i]) {
      throw new Error('invalid_viewer_players');
    }
  }

  const view: MultiplayerViewerState = {
    schema: MULTIPLAYER_VIEWER_SCHEMA,
    variant: 'sueca',
    viewerSeat,
    players: players.map((p, i) => buildViewerPlayer(p, i, viewerSeat)),
    currentPlayerIndex: fullState.currentPlayerIndex,
    dealerIndex: fullState.dealerIndex,
    trickLeader: fullState.trickLeader,
    trumpSuit: fullState.trumpSuit ?? null,
    trumpCard: fullState.trumpCard ? cloneCard(fullState.trumpCard) : null,
    currentTrick: cloneCards(fullState.currentTrick),
    lastTrickWinner: fullState.lastTrickWinner ?? null,
    nextTrickLeader: fullState.nextTrickLeader ?? null,
    scores: cloneScore(fullState.scores),
    gameScore: cloneScore(fullState.gameScore),
    completedPentes: Array.isArray(fullState.completedPentes)
      ? fullState.completedPentes.map((p) => ({ team1: p.team1, team2: p.team2 }))
      : [],
    round: fullState.round,
    isGameOver: Boolean(fullState.isGameOver),
    winner: fullState.winner ?? null,
    waitingForTrickEnd: Boolean(fullState.waitingForTrickEnd),
    waitingForRoundStart: Boolean(fullState.waitingForRoundStart),
    waitingForRoundEnd: Boolean(fullState.waitingForRoundEnd),
    waitingForGameStart: Boolean(fullState.waitingForGameStart),
    isFirstTrick: Boolean(fullState.isFirstTrick),
    isPaused: Boolean(fullState.isPaused),
    playDirection: fullState.playDirection === 'left' ? 'left' : 'right',
    dealAlignment: fullState.dealAlignment === 'opposite' ? 'opposite' : 'same',
    playedCards: cloneCards(fullState.playedCards),
    partnerSignals: Array.isArray(fullState.partnerSignals)
      ? fullState.partnerSignals.map((s) => ({
          playerIndex: s.playerIndex,
          signal: s.signal,
          trick: s.trick
        }))
      : []
  };

  if (typeof fullState.schemaVersion === 'number') {
    view.schemaVersion = fullState.schemaVersion;
  }
  if (isMatchResult(fullState.matchResult)) {
    view.matchResult = fullState.matchResult;
  } else if (fullState.matchResult === null) {
    view.matchResult = null;
  }
  if (typeof fullState.pendingRoundMultiplier === 'number') {
    view.pendingRoundMultiplier = fullState.pendingRoundMultiplier;
  }

  return view;
}
