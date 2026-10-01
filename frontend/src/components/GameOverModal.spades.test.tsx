import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { GameOverModal } from './GameOverModal';
import { SpadesGame } from '../models/games/SpadesGame';

const names = ['A', 'B', 'C', 'D'];

describe('GameOverModal Spades result', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('names the engine winner when team 2 finishes higher above 500', () => {
    const game = new SpadesGame();
    const state = game.initialize(names, {});
    const internal = game as unknown as {
      state: typeof state;
      endRound: (s: typeof state) => void;
    };
    internal.state.gameScore = { team1: 490, team2: 480 };
    const spades = internal.state.variantState?.spades as {
      team1Bid: number;
      team2Bid: number;
      team1Tricks: number;
      team2Tricks: number;
    };
    spades.team1Bid = 2;
    spades.team1Tricks = 2;
    spades.team2Bid = 5;
    spades.team2Tricks = 5;
    internal.endRound(internal.state);

    expect(internal.state.winner).toBe(2);

    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      ReactDOM.render(
        <GameOverModal
          gameState={internal.state}
          variant="spades"
          usTeam={1}
          themTeam={2}
          localPlayerIndex={0}
          getTeamName={(team) => (team === 1 ? 'Team One' : 'Team Two')}
          onNewGame={() => undefined}
        />,
        container
      );
    });

    expect(container.textContent).toContain('Team Two');
    expect(container.textContent).toContain('510');
    expect(container.textContent).toContain('530');
    ReactDOM.unmountComponentAtNode(container);
  });
});
