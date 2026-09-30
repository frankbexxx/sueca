/**
 * ARCH-SUECA-08 — Sueca persisted schema migrator + resume contracts.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../Game';
import { SuecaGame } from './SuecaGame';
import {
  migrateSuecaPersistedState,
  stampSuecaSchemaV2,
  SUECA_STATE_SCHEMA_VERSION
} from './migrateSuecaPersistedState';
import { normalizeGameState } from '../../multiplayer/normalizeGameState';
import { saveGameSession, loadGameSession, clearGameSession } from '../../services/gameSessionStorage';
import { STORAGE_KEYS } from '../../constants/gameConstants';
import type { Card, GameState } from '../../types/game';
import { asSeat, firstLeader, seatAtOffset } from './suecaRules';

function card(rank: Card['rank'], suit: Card['suit'], id: string): Card {
  return { rank, suit, id };
}

function basePlayers() {
  return [
    { id: 'p0', name: 'P0', hand: [] as Card[], team: 1 as const, type: 'human' as const },
    { id: 'p1', name: 'P1', hand: [] as Card[], team: 2 as const, type: 'ai' as const },
    { id: 'p2', name: 'P2', hand: [] as Card[], team: 1 as const, type: 'ai' as const },
    { id: 'p3', name: 'P3', hand: [] as Card[], team: 2 as const, type: 'ai' as const }
  ];
}

describe('migrateSuecaPersistedState', () => {
  it('V2 RIGHT exact restore — no mutation of seats/trick', () => {
    const raw: Partial<GameState> = {
      schemaVersion: 2,
      variant: 'sueca',
      playDirection: 'right',
      dealAlignment: 'same',
      dealerIndex: 0,
      trickLeader: 3,
      currentPlayerIndex: 1,
      waitingForRoundStart: false,
      currentTrick: [card('2', 'clubs', 'a'), card('3', 'clubs', 'b')],
      players: basePlayers().map((p, i) => ({
        ...p,
        hand: i === 1 || i === 0 ? [card('4', 'clubs', `h${i}`)] : [card('5', 'clubs', `h${i}`)]
      })),
      dealingMethod: 'A',
      dealingDirection: 'right',
      round: 2,
      scores: { team1: 1, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: 'spades',
      trumpCard: null
    };
    const result = migrateSuecaPersistedState(raw);
    expect(result.ok).toBe(true);
    expect(result.action).toBe('exact');
    expect(result.state!.playDirection).toBe('right');
    expect(result.state!.dealAlignment).toBe('same');
    expect(result.state!.trickLeader).toBe(3);
    expect(result.state!.currentPlayerIndex).toBe(1);
    expect(result.state!.currentTrick).toHaveLength(2);
    expect(result.state!.schemaVersion).toBe(SUECA_STATE_SCHEMA_VERSION);
  });

  it('V2 LEFT exact — setup preference RIGHT must not overwrite session', () => {
    localStorage.setItem(STORAGE_KEYS.PLAY_DIRECTION, 'right');
    const raw: Partial<GameState> = {
      schemaVersion: 2,
      variant: 'sueca',
      playDirection: 'left',
      dealAlignment: 'opposite',
      dealerIndex: 0,
      trickLeader: 1,
      currentPlayerIndex: 1,
      waitingForRoundStart: true,
      currentTrick: [],
      players: basePlayers(),
      dealingMethod: 'B',
      dealingDirection: 'right',
      round: 1,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: null,
      trumpCard: null
    };
    const result = migrateSuecaPersistedState(raw);
    expect(result.ok).toBe(true);
    expect(result.action).toBe('exact');
    expect(result.state!.playDirection).toBe('left');
    expect(localStorage.getItem(STORAGE_KEYS.PLAY_DIRECTION)).toBe('right');
  });

  it('V1 A+right → RIGHT + SAME', () => {
    const result = migrateSuecaPersistedState({
      variant: 'sueca',
      dealingMethod: 'A',
      dealingDirection: 'right',
      dealerIndex: 0,
      waitingForRoundStart: true,
      players: basePlayers(),
      currentPlayerIndex: 3,
      trickLeader: 3,
      currentTrick: [],
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: null,
      trumpCard: null
    });
    expect(result.ok).toBe(true);
    expect(result.action).toBe('migrated');
    expect(result.state!.playDirection).toBe('right');
    expect(result.state!.dealAlignment).toBe('same');
    expect(result.state!.schemaVersion).toBe(2);
  });

  it('V1 B+left → RIGHT + OPPOSITE', () => {
    const result = migrateSuecaPersistedState({
      variant: 'sueca',
      dealingMethod: 'B',
      dealingDirection: 'left',
      dealerIndex: 0,
      waitingForRoundStart: true,
      players: basePlayers(),
      currentPlayerIndex: 3,
      trickLeader: 3,
      currentTrick: [],
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: null,
      trumpCard: null
    });
    expect(result.ok).toBe(true);
    expect(result.state!.playDirection).toBe('right');
    expect(result.state!.dealAlignment).toBe('opposite');
  });

  it('V1 A+left between hands → reset-hand SAME', () => {
    const result = migrateSuecaPersistedState({
      variant: 'sueca',
      dealingMethod: 'A',
      dealingDirection: 'left',
      dealerIndex: 2,
      waitingForRoundStart: true,
      players: basePlayers().map((p, i) => ({
        ...p,
        // Stale hand data must not survive reset-hand (should already be empty between hands,
        // but guard against half-cleared legacy saves).
        hand: i === 0 ? [card('A', 'hearts', 'stale')] : []
      })),
      currentPlayerIndex: 0,
      trickLeader: 0,
      currentTrick: [card('2', 'clubs', 'staleTrick')],
      scores: { team1: 2, team2: 1 },
      gameScore: { team1: 1, team2: 0 },
      completedPentes: [],
      round: 2,
      isGameOver: false,
      winner: null,
      lastTrickWinner: 1,
      waitingForTrickEnd: false,
      nextTrickLeader: 1,
      isFirstTrick: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [card('3', 'clubs', 'old')],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: 'spades',
      trumpCard: card('A', 'spades', 'trump')
    });
    expect(result.ok).toBe(true);
    expect(result.action).toBe('reset-hand');
    const s = result.state!;
    const expectedLeader = firstLeader(asSeat(2), 'right');
    expect(s.dealAlignment).toBe('same');
    expect(s.waitingForRoundStart).toBe(true);
    expect(s.playDirection).toBe('right');
    expect(s.dealerIndex).toBe(2);
    expect(s.trickLeader).toBe(expectedLeader);
    expect(s.currentPlayerIndex).toBe(expectedLeader);
    expect(s.currentPlayerIndex).not.toBe(0); // stale index discarded
    expect(s.currentTrick).toEqual([]);
    expect(s.playedCards).toEqual([]);
    expect(s.trumpSuit).toBeNull();
    expect(s.trumpCard).toBeNull();
    expect(s.lastTrickWinner).toBeNull();
    expect(s.nextTrickLeader).toBeNull();
    expect(s.players.every((p) => p.hand.length === 0)).toBe(true);
    // Session-safe scores preserved
    expect(s.scores).toEqual({ team1: 2, team2: 1 });
    expect(s.gameScore).toEqual({ team1: 1, team2: 0 });
    expect(s.round).toBe(2);
  });

  it('V1 A+left mid-hand → reject', () => {
    const players = basePlayers();
    players[0].hand = [card('A', 'clubs', 'x')];
    const result = migrateSuecaPersistedState({
      variant: 'sueca',
      dealingMethod: 'A',
      dealingDirection: 'left',
      dealerIndex: 0,
      waitingForRoundStart: false,
      players,
      currentPlayerIndex: 3,
      trickLeader: 0,
      currentTrick: [card('2', 'clubs', 't')],
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: 'spades',
      trumpCard: null
    });
    expect(result.ok).toBe(false);
    expect(result.action).toBe('rejected');
    expect(result.reason).toMatch(/ambiguous_legacy_mid_hand/);
  });

  it('V1 B+right mid-hand → reject', () => {
    const players = basePlayers();
    players[0].hand = [card('A', 'clubs', 'x')];
    const result = migrateSuecaPersistedState({
      variant: 'sueca',
      dealingMethod: 'B',
      dealingDirection: 'right',
      dealerIndex: 0,
      waitingForRoundStart: false,
      players,
      currentPlayerIndex: 3,
      trickLeader: 0,
      currentTrick: [card('2', 'clubs', 't')],
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: 'spades',
      trumpCard: null
    });
    expect(result.ok).toBe(false);
    expect(result.action).toBe('rejected');
    expect(result.reason).toMatch(/ambiguous_legacy_mid_hand/);
  });

  it('invalid seat index → reject (never ??0)', () => {
    const result = migrateSuecaPersistedState({
      schemaVersion: 2,
      variant: 'sueca',
      playDirection: 'right',
      dealAlignment: 'same',
      dealerIndex: 7 as unknown as number,
      currentPlayerIndex: 0,
      trickLeader: 0,
      waitingForRoundStart: true,
      players: basePlayers(),
      currentTrick: [],
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: null,
      trumpCard: null,
      dealingMethod: 'A',
      dealingDirection: 'right'
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/invalid_seat|v2_invalid_seat/);
  });

  it('missing waitingForRoundStart → safe boundary (not blindly false)', () => {
    const result = migrateSuecaPersistedState({
      variant: 'sueca',
      dealingMethod: 'A',
      dealingDirection: 'right',
      dealerIndex: 0,
      players: basePlayers(),
      currentTrick: [],
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      trumpSuit: null,
      trumpCard: null
    });
    expect(result.ok).toBe(true);
    expect(result.state!.waitingForRoundStart).toBe(true);
    expect(result.reason).toMatch(/waitingForRoundStart/);
  });
});

describe('ARCH-SUECA-08 mid-trick resume', () => {
  it('RIGHT leader 3 trickLen 2 → currentPlayer 1', () => {
    const leader = 3;
    const trickLen = 2;
    const expected = seatAtOffset(asSeat(leader), trickLen, 'right');
    expect(expected).toBe(1);
    const players = basePlayers().map((p) => ({
      ...p,
      hand: [card('6', 'hearts', `r${p.id}`)]
    }));
    const state = stampSuecaSchemaV2({
      players,
      dealerIndex: 0,
      trickLeader: leader,
      currentPlayerIndex: expected,
      currentTrick: [card('2', 'clubs', 't0'), card('3', 'clubs', 't1')],
      playDirection: 'right',
      dealAlignment: 'same',
      waitingForRoundStart: false,
      waitingForTrickEnd: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      dealingMethod: 'A',
      dealingDirection: 'right',
      trumpSuit: 'spades',
      trumpCard: null,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      nextTrickLeader: null,
      isFirstTrick: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      variant: 'sueca',
      schemaVersion: 2
    });
    const migrated = migrateSuecaPersistedState(state);
    expect(migrated.ok).toBe(true);
    expect(migrated.state!.currentPlayerIndex).toBe(1);
    const game = new Game(['P0', 'P1', 'P2', 'P3'], 'medium', undefined, undefined, 'right');
    game.loadState(migrated.state!);
    expect(game.getState().playDirection).toBe('right');
    expect(game.getState().trickLeader).toBe(3);
    expect(game.getState().currentPlayerIndex).toBe(1);
    expect(game.getState().currentTrick).toHaveLength(2);
  });

  it('LEFT leader 1 trickLen 2 → currentPlayer 3', () => {
    const leader = 1;
    const trickLen = 2;
    const expected = seatAtOffset(asSeat(leader), trickLen, 'left');
    expect(expected).toBe(3);
    const players = basePlayers().map((p) => ({
      ...p,
      hand: [card('6', 'hearts', `l${p.id}`)]
    }));
    const state = stampSuecaSchemaV2({
      players,
      dealerIndex: 0,
      trickLeader: leader,
      currentPlayerIndex: expected,
      currentTrick: [card('2', 'clubs', 't0'), card('3', 'clubs', 't1')],
      playDirection: 'left',
      dealAlignment: 'same',
      waitingForRoundStart: false,
      waitingForTrickEnd: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      dealingMethod: 'A',
      dealingDirection: 'left',
      trumpSuit: 'spades',
      trumpCard: null,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 0, team2: 0 },
      completedPentes: [],
      round: 1,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      nextTrickLeader: null,
      isFirstTrick: false,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      variant: 'sueca',
      schemaVersion: 2
    });
    const adapter = new SuecaGame();
    const restored = adapter.restoreState(state);
    expect(restored.playDirection).toBe('left');
    expect(restored.trickLeader).toBe(1);
    expect(restored.currentPlayerIndex).toBe(3);
  });
});

describe('ARCH-SUECA-08 round-boundary resume', () => {
  beforeEach(() => {
    localStorage.clear();
    clearGameSession('sueca');
  });

  it('waiting hand: resume keeps playDirection; new hand defaults SAME', () => {
    const dealer = 0;
    const play = 'left' as const;
    const leader = firstLeader(asSeat(dealer), play);
    const state = stampSuecaSchemaV2({
      players: basePlayers(),
      dealerIndex: dealer,
      trickLeader: leader,
      currentPlayerIndex: leader,
      currentTrick: [],
      playDirection: play,
      dealAlignment: 'opposite',
      waitingForRoundStart: true,
      waitingForTrickEnd: false,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      dealingMethod: 'B',
      dealingDirection: 'right',
      trumpSuit: null,
      trumpCard: null,
      scores: { team1: 0, team2: 0 },
      gameScore: { team1: 1, team2: 0 },
      completedPentes: [],
      round: 2,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      nextTrickLeader: null,
      isFirstTrick: true,
      playedCards: [],
      isPaused: false,
      playerName: 'P0',
      aiDifficulty: 'medium',
      partnerSignals: [],
      variant: 'sueca',
      schemaVersion: 2
    });
    saveGameSession(
      {
        playerNames: ['P0', 'P1', 'P2', 'P3'],
        aiDifficulty: 'medium',
        dealingMethod: 'A',
        playDirection: 'left',
        multiplayerEnabled: false,
        gameVariant: 'sueca',
        rulesPresetId: 'sueca-pt-normal'
      },
      state
    );
    localStorage.setItem(STORAGE_KEYS.PLAY_DIRECTION, 'right');
    const loaded = loadGameSession('sueca');
    expect(loaded).not.toBeNull();
    expect(loaded!.state.playDirection).toBe('left');
    expect(loaded!.state.waitingForRoundStart).toBe(true);
    expect(loaded!.state.trickLeader).toBe(leader);
    // Prior hand was opposite; product defaults next modal to SAME (UI), persisted last may remain until modal.
    expect(loaded!.state.dealAlignment).toBe('opposite');
  });
});

describe('normalizeGameState Sueca path', () => {
  it('uses migrator and stamps schema v2', () => {
    const fixed = normalizeGameState({
      variant: 'sueca',
      dealingMethod: 'A',
      dealingDirection: 'right',
      waitingForRoundStart: true,
      dealerIndex: 0,
      currentPlayerIndex: 3,
      trickLeader: 3,
      players: basePlayers()
    });
    expect(fixed.schemaVersion).toBe(2);
    expect(fixed.playDirection).toBe('right');
    expect(fixed.dealAlignment).toBe('same');
  });
});
