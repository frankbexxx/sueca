import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../Game';
import { HeartsGame, getHeartsState } from './HeartsGame';
import { KingPtGame, getKingPtState } from './KingPtGame';
import { SpadesGame } from './SpadesGame';
import { KING_TOTAL_GAMES } from './king/kingContracts';
import {
  audioCueFromMatchResult,
  historyFieldsFromMatchResult,
  modalFocusFromMatchResult
} from '../matchResult';
import { recordMatchHistory } from '../../services/matchHistoryStorage';
import { loadLocalStats, recordGameResult } from '../../services/gameSessionStorage';
import type { GameState } from '../../types/game';
import type { MatchResult } from '../../types/matchResult';

const names = ['A', 'B', 'C', 'D'];

function agree(state: GameState, localIndex: number) {
  const result = state.matchResult as MatchResult;
  const team = state.players[localIndex]?.team ?? null;
  const focus = modalFocusFromMatchResult(result);
  const audio = audioCueFromMatchResult(result, { playerIndex: localIndex, team });
  const history = historyFieldsFromMatchResult(result, team, localIndex);
  return { result, focus, audio, history };
}

function finishHearts(scores: number[]): GameState {
  const game = new HeartsGame();
  game.initialize(names, {});
  const internal = game as unknown as {
    state: GameState;
    endRound: (s: GameState) => void;
  };
  const hearts = getHeartsState(internal.state);
  hearts.playerScores = [...scores];
  hearts.roundPoints = [0, 0, 0, 0];
  internal.state.variantState = { ...internal.state.variantState, hearts };
  internal.endRound(internal.state);
  return internal.state;
}

function finishKing(scores: number[]): GameState {
  const game = new KingPtGame();
  game.initialize(names, {});
  const internal = game as unknown as {
    state: GameState;
    advanceOrFinish: (king: ReturnType<typeof getKingPtState>) => void;
  };
  const king = getKingPtState(internal.state);
  king.gameIndex = KING_TOTAL_GAMES - 1;
  king.playerScores = [...scores];
  internal.advanceOrFinish(king);
  return internal.state;
}

function finishSueca(winningTeam: 1 | 2): GameState {
  const game = new Game(names);
  game.startRound();
  const internal = game as unknown as { state: GameState; endRound: () => void };
  if (winningTeam === 1) {
    internal.state.gameScore = { team1: 3, team2: 0 };
    internal.state.scores = { team1: 65, team2: 55 };
  } else {
    internal.state.gameScore = { team1: 0, team2: 3 };
    internal.state.scores = { team1: 55, team2: 65 };
  }
  internal.endRound();
  return internal.state;
}

function finishSpades(start: { team1: number; team2: number }, bids: {
  team1Bid: number;
  team2Bid: number;
  team1Tricks: number;
  team2Tricks: number;
}): GameState {
  const game = new SpadesGame();
  game.initialize(names, {});
  const internal = game as unknown as {
    state: GameState;
    endRound: (s: GameState) => void;
  };
  internal.state.gameScore = { ...start };
  const spades = internal.state.variantState?.spades as {
    team1Bid: number;
    team2Bid: number;
    team1Tricks: number;
    team2Tricks: number;
  };
  Object.assign(spades, bids);
  internal.endRound(internal.state);
  return internal.state;
}

describe('canonical match result', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Sueca publishes a team result and every surface reads it', () => {
    const team1 = finishSueca(1);
    const team2 = finishSueca(2);
    expect(team1.matchResult).toEqual({ kind: 'team', winnerTeam: 1, draw: false });
    expect(team2.matchResult).toEqual({ kind: 'team', winnerTeam: 2, draw: false });
    expect(team1.winner).toBe(1);
    expect(team2.winner).toBe(2);

    const surfaces = agree(team2, 0);
    expect(surfaces.focus.winnerTeam).toBe(2);
    expect(surfaces.history).toEqual({ resultKind: 'team', winner: 2, playerWon: false });
    expect(surfaces.audio).toBe('lose');
    expect(agree(team2, 1).audio).toBe('win');
  });

  it('Spades publishes a team result only when a winner exists', () => {
    const team1 = finishSpades(
      { team1: 490, team2: 400 },
      { team1Bid: 1, team1Tricks: 1, team2Bid: 1, team2Tricks: 1 }
    );
    const team2 = finishSpades(
      { team1: 490, team2: 480 },
      { team1Bid: 2, team1Tricks: 2, team2Bid: 5, team2Tricks: 5 }
    );
    const tied = finishSpades(
      { team1: 490, team2: 490 },
      { team1Bid: 2, team1Tricks: 2, team2Bid: 2, team2Tricks: 2 }
    );

    expect(team1.isGameOver).toBe(true);
    expect(team1.matchResult).toEqual({ kind: 'team', winnerTeam: 1, draw: false });
    expect(agree(team1, 0).history.winner).toBe(1);
    expect(agree(team1, 0).audio).toBe('win');

    expect(team2.matchResult).toEqual({ kind: 'team', winnerTeam: 2, draw: false });
    expect(agree(team2, 0).focus.winnerTeam).toBe(2);
    expect(agree(team2, 0).audio).toBe('lose');
    expect(agree(team2, 1).history.playerWon).toBe(true);

    expect(tied.isGameOver).toBe(false);
    expect(tied.winner).toBeNull();
    expect(tied.matchResult).toBeNull();
  });

  it('Hearts lowest unique seat wins, and a shared low score is a tie', () => {
    const unique = finishHearts([100, 40, 90, 80]);
    expect(unique.isGameOver).toBe(true);
    expect(unique.matchResult).toEqual({
      kind: 'individual',
      winnerSeats: [1],
      draw: false
    });
    expect(unique.winner).toBe(2);
    const uniqueSurfaces = agree(unique, 0);
    expect(uniqueSurfaces.focus.winnerSeats).toEqual([1]);
    expect(uniqueSurfaces.history.winner).toBe(1);
    expect(uniqueSurfaces.history.tiedSeats).toBeUndefined();
    expect(uniqueSurfaces.history.winner).not.toBe(unique.winner);
    expect(agree(unique, 1).audio).toBe('win');
    expect(uniqueSurfaces.audio).toBe('lose');

    const tied = finishHearts([50, 120, 50, 90]);
    expect(tied.matchResult).toEqual({
      kind: 'individual',
      winnerSeats: [0, 2],
      draw: true
    });
    const tiedSurfaces = agree(tied, 1);
    expect(tiedSurfaces.focus.winnerSeats).toEqual([0, 2]);
    expect(tiedSurfaces.focus.draw).toBe(true);
    expect(tiedSurfaces.history.winner).toBeNull();
    expect(tiedSurfaces.history.tiedSeats).toEqual([0, 2]);
    expect(tiedSurfaces.history.playerWon).toBe(false);
    expect(tiedSurfaces.audio).toBe('draw');
    expect([50, 120, 50, 90].indexOf(50)).toBe(0);
    expect(tiedSurfaces.history.winner).not.toBe(0);

    recordGameResult('hearts', tiedSurfaces.history.playerWon);
    const recorded = recordMatchHistory({
      gameVariant: 'hearts',
      players: tied.players.map((p, index) => ({ index, name: p.name, team: p.team })),
      localPlayerIndex: 1,
      playerWon: tiedSurfaces.history.playerWon,
      resultKind: tiedSurfaces.history.resultKind,
      winner: tiedSurfaces.history.winner,
      tiedSeats: tiedSurfaces.history.tiedSeats,
      finalScores: { players: [50, 120, 50, 90] },
      summary: 'tie'
    });
    expect(recorded?.winner).toBeNull();
    expect(recorded?.tiedSeats).toEqual([0, 2]);
    expect(loadLocalStats().wins).toBe(0);
    expect(loadLocalStats().byVariant.hearts.played).toBe(1);
  });

  it('King highest unique seat wins, and a shared high score is a tie', () => {
    const unique = finishKing([10, 20, 30, 80]);
    expect(unique.isGameOver).toBe(true);
    expect(unique.matchResult).toEqual({
      kind: 'individual',
      winnerSeats: [3],
      draw: false
    });
    expect(unique.winner).toBe(2);
    const uniqueSurfaces = agree(unique, 3);
    expect(uniqueSurfaces.focus.winnerSeats).toEqual([3]);
    expect(uniqueSurfaces.history.winner).toBe(3);
    expect(uniqueSurfaces.history.playerWon).toBe(true);
    expect(uniqueSurfaces.audio).toBe('win');
    expect(agree(unique, 0).audio).toBe('lose');

    const tied = finishKing([80, 10, 80, 5]);
    expect(tied.matchResult).toEqual({
      kind: 'individual',
      winnerSeats: [0, 2],
      draw: true
    });
    const tiedSurfaces = agree(tied, 0);
    expect(tiedSurfaces.history.winner).toBeNull();
    expect(tiedSurfaces.history.tiedSeats).toEqual([0, 2]);
    expect(tiedSurfaces.focus.winnerSeats).toEqual([0, 2]);
    expect(tiedSurfaces.audio).toBe('draw');
    expect([80, 10, 80, 5].indexOf(80)).toBe(0);
    expect(tiedSurfaces.history.winner).not.toBe(0);
  });
});
