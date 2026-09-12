import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { UnifiedGameStatusPanel } from './UnifiedGameStatusPanel';
import { GameState } from '../../types/game';
import { getKingPtState, KingPtGame } from '../../models/games/KingPtGame';
import { applyDevNegativeFixture } from '../../dev/kingNegativeJump';

describe('UnifiedGameStatusPanel King negatives', () => {
  const originalEnv = process.env.NODE_ENV;
  let container: HTMLDivElement;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    localStorage.setItem('sueca-language', 'pt');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    process.env.NODE_ENV = originalEnv;
  });

  function renderKing(
    contract: 'no_hearts' | 'no_tricks' | 'no_queens' | 'no_men' | 'no_king_hearts'
  ) {
    const game = new KingPtGame();
    const state = applyDevNegativeFixture(game, ['P1', 'P2', 'P3', 'P4'], contract) as GameState;
    act(() => {
      ReactDOM.render(
        <UnifiedGameStatusPanel
          gameState={state}
          variant="king"
          rulesPresetId="king-pt-normal"
          trickLabel="Vaza 5/13"
        />,
        container
      );
    });
    return getKingPtState(state);
  }

  it('shows penalty cards and round-primary scores for no_hearts', () => {
    renderKing('no_hearts');
    const cards = container.querySelectorAll('.game-status-panel__penalty-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);
    expect(container.textContent).toMatch(/P1:\s*-40/);
    expect(container.textContent).toMatch(/Total\s*-90/);
    expect(container.querySelectorAll('.game-status-panel__score-total').length).toBe(4);
  });

  it('hides mosaics for no_tricks but keeps round score hierarchy', () => {
    renderKing('no_tricks');
    expect(container.querySelectorAll('.game-status-panel__penalty-card')).toHaveLength(0);
    expect(container.textContent).toMatch(/P1:\s*-20/);
    expect(container.textContent).toMatch(/Total/);
  });

  it('places K♥ under the capturing player for no_king_hearts', () => {
    renderKing('no_king_hearts');
    const rows = container.querySelectorAll('.game-status-panel__score-row');
    expect(rows[1].querySelectorAll('.game-status-panel__penalty-card')).toHaveLength(1);
    expect(rows[0].querySelectorAll('.game-status-panel__penalty-card')).toHaveLength(0);
    expect(container.textContent).toMatch(/P2:\s*-160/);
  });
});
