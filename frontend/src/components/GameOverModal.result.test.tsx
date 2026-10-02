import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { GameOverModal } from './GameOverModal';
import { HeartsGame, getHeartsState } from '../models/games/HeartsGame';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import { KING_TOTAL_GAMES } from '../models/games/king/kingContracts';
import type { GameState } from '../types/game';

const names = ['A', 'B', 'C', 'D'];

function renderModal(gameState: GameState, variant: 'hearts' | 'king' | 'spades' | 'sueca') {
  localStorage.setItem('sueca-language', 'pt');
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(
      <GameOverModal
        gameState={gameState}
        variant={variant}
        usTeam={1}
        themTeam={2}
        localPlayerIndex={0}
        getTeamName={(team) => (team === 1 ? 'Team One' : 'Team Two')}
        onNewGame={() => undefined}
      />,
      container
    );
  });
  return container;
}

function winnerNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.hearts-modal-score-row--winner')).map(
    (row) => row.querySelector('span')?.textContent ?? ''
  );
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

describe('GameOverModal canonical result', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('highlights the unique Hearts winner and not the first low-score index', () => {
    const container = renderModal(finishHearts([100, 40, 90, 80]), 'hearts');
    expect(container.textContent).toContain('B venceu (menos pontos)');
    expect(winnerNames(container)).toEqual(['B']);
  });

  it('shows a Hearts tie instead of the first seat that shares the low score', () => {
    const container = renderModal(finishHearts([50, 120, 50, 90]), 'hearts');
    expect(container.textContent).toContain('Empate');
    expect(container.textContent).not.toContain('venceu (menos pontos)');
    expect(winnerNames(container).sort()).toEqual(['A', 'C']);
  });

  it('highlights the unique King winner', () => {
    const container = renderModal(finishKing([10, 20, 30, 80]), 'king');
    expect(container.textContent).toContain('D Venceu!');
    expect(winnerNames(container)).toEqual(['D']);
  });

  it('shows a King tie instead of the first seat that shares the high score', () => {
    const container = renderModal(finishKing([80, 10, 80, 5]), 'king');
    expect(container.textContent).toContain('Empate');
    expect(container.textContent).not.toContain('Venceu!');
    expect(winnerNames(container).sort()).toEqual(['A', 'C']);
  });
});
