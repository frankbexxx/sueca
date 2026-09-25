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
    // UX-KING-SCORE-LIVE-01: Total = roundStartScores (not live-projected playerScores)
    expect(container.textContent).toMatch(/Total\s*-50/);
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

describe('UnifiedGameStatusPanel King festa_play contract', () => {
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
    process.env.NODE_ENV = originalEnv;
  });

  function renderFestaPlay(opts: {
    noTrump: boolean;
    trump?: 'hearts' | 'clubs' | null;
    festaMode: 'positive' | 'negative_festa';
    amount?: number;
    bidType?: 'positive' | 'null';
    firstPlayerIndex: number;
  }) {
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      { festaGameNumber: 7, festaPhase: 'setup' },
      { localPlayerIndex: 0 }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    king.phase = 'festa_play';
    king.gameIndex = 6;
    king.contract = null;
    king.festaOwnerIndex = 0;
    king.festaMode = opts.festaMode;
    king.festaPhase = null;
    king.waitingForFestaSetup = false;
    king.noTrumpChosen = opts.noTrump;
    king.chosenTrump = opts.noTrump ? null : opts.trump ?? 'hearts';
    king.firstPlayerIndex = opts.firstPlayerIndex;
    if (opts.festaMode === 'negative_festa') {
      king.activeContract = null;
      king.bestBid = null;
    } else {
      king.activeContract = {
        bidType: opts.bidType ?? 'positive',
        amount: opts.amount ?? 3,
        bidderIndex: 0,
        beneficiaryIndex: 0
      };
      king.bestBid = {
        bidderIndex: 0,
        bidType: opts.bidType ?? 'positive',
        amount: opts.amount ?? 3
      };
    }
    const state: GameState = {
      ...base,
      trumpSuit: opts.noTrump ? null : opts.trump ?? 'hearts',
      variantState: { ...base.variantState, kingPt: king }
    };
    act(() => {
      ReactDOM.render(
        <UnifiedGameStatusPanel
          gameState={state}
          variant="king"
          rulesPresetId="king-pt-normal"
          trickLabel="Vaza 1/13"
        />,
        container
      );
    });
  }

  it('shows trump suit and first player during positive festa_play', () => {
    renderFestaPlay({
      noTrump: false,
      trump: 'hearts',
      festaMode: 'positive',
      firstPlayerIndex: 3
    });
    expect(container.textContent).toContain('Festa de Player 1');
    expect(container.textContent).toContain('3 positivas · ♥ Copas');
    expect(container.textContent).toContain('1.º jogador: Player 4');
  });

  it('shows Sem trunfo and first player during no-trump festa_play', () => {
    renderFestaPlay({
      noTrump: true,
      festaMode: 'positive',
      firstPlayerIndex: 1
    });
    expect(container.textContent).toContain('3 positivas · Sem trunfo');
    expect(container.textContent).toContain('1.º jogador: Player 2');
  });

  it('shows Nulos and first player during negative festa_play', () => {
    renderFestaPlay({
      noTrump: true,
      festaMode: 'negative_festa',
      firstPlayerIndex: 2
    });
    expect(container.textContent).toContain('Nulos');
    expect(container.textContent).toContain('1.º jogador: Player 3');
  });

  it('keeps full score table hidden by default and opens on Ver tabela', () => {
    renderFestaPlay({
      noTrump: false,
      trump: 'hearts',
      festaMode: 'positive',
      firstPlayerIndex: 0
    });
    expect(container.querySelector('[data-testid="king-ver-tabela"]')).not.toBeNull();
    expect(container.querySelector('.king-score-sheet')).toBeNull();

    const toggle = container.querySelector(
      '[data-testid="king-ver-tabela"]'
    ) as HTMLButtonElement;
    act(() => {
      toggle.click();
    });
    expect(container.querySelector('.king-score-sheet')).not.toBeNull();
    expect(container.querySelector('.top-strip--unified')).not.toBeNull();

    const ok = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'OK'
    ) as HTMLButtonElement;
    act(() => {
      ok.click();
    });
    expect(container.querySelector('.king-score-sheet')).toBeNull();
  });
});