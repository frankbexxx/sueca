import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { KingFestaFlowModal } from './KingFestaFlowModal';
import { GameState } from '../types/game';
import { getKingPtState, KingPtGame } from '../models/games/KingPtGame';

const noop = () => undefined;

const festaHandlers = {
  onAuctionPass: noop,
  onAuctionBid: noop,
  onAuctionContinue: noop,
  onAcceptContract: noop,
  onRejectContract: noop,
  onRequestHigherBid: noop,
  onRespondHigherBid: noop,
  onEightOrNulls: noop,
  onRespondEight: noop,
  onFallback: noop,
  onSetup: noop
};

describe('KingFestaFlowModal density', () => {
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

  function renderFallback(opts: {
    bestBidAmount: number;
    highestEquivalentValue: number;
  }) {
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Ana', 'Bruno', 'Carla', 'Diogo'],
      { festaGameNumber: 7, festaPhase: 'fallback' },
      { localPlayerIndex: 0 }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    king.festaPhase = 'fallback';
    king.waitingForFallback = true;
    king.festaOwnerIndex = 0;
    king.bestBid = {
      bidderIndex: 1,
      bidType: 'positive',
      amount: opts.bestBidAmount
    };
    king.highestEquivalentValue = opts.highestEquivalentValue;
    king.auctionHistory = [
      { sequence: 1, seat: 1, action: 'bid', bidType: 'positive', amount: opts.bestBidAmount },
      { sequence: 2, seat: 2, action: 'pass' }
    ];
    const state: GameState = {
      ...base,
      variantState: { ...base.variantState, kingPt: king }
    };

    act(() => {
      ReactDOM.render(
        <KingFestaFlowModal gameState={state} localPlayerIndex={0} {...festaHandlers} />,
        container
      );
    });
    return state;
  }

  it('hides unavailable fallback actions instead of rendering disabled buttons', () => {
    renderFallback({ bestBidAmount: 6, highestEquivalentValue: 6 });
    const labels = Array.from(container.querySelectorAll('.king-festa-actions button')).map(
      (el) => el.textContent
    );
    expect(labels).toContain('Trunfo');
    expect(labels).toContain('Sem trunfo');
    expect(labels).toContain('Nulos');
    expect(labels).not.toContain('4×3×3');
    expect(container.querySelectorAll('.king-festa-action--disabled')).toHaveLength(0);
    expect(container.querySelectorAll('.king-festa-action-hint')).toHaveLength(0);
  });

  it('keeps Festa choices directly actionable when available', () => {
    renderFallback({ bestBidAmount: 3, highestEquivalentValue: 3 });
    const buttons = container.querySelectorAll('.king-festa-actions--dominant button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
    expect(container.textContent).toContain('Festa de');
  });

  it('collapses auction history by default without unmounting the game sheet', () => {
    renderFallback({ bestBidAmount: 3, highestEquivalentValue: 3 });
    // Fallback does not show auction timeline (phase filter) — use negotiation instead.
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Ana', 'Bruno', 'Carla', 'Diogo'],
      { festaGameNumber: 7, festaPhase: 'auction' },
      { localPlayerIndex: 1 }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    king.festaPhase = 'auction';
    king.festaOwnerIndex = 0;
    king.auctionOrder = [1, 2, 3];
    king.auctionTurnIndex = 0;
    king.currentBidder = 1;
    king.bestBid = { bidderIndex: 2, bidType: 'positive', amount: 3 };
    king.auctionHistory = [
      { sequence: 1, seat: 2, action: 'bid', bidType: 'positive', amount: 3 },
      { sequence: 2, seat: 3, action: 'pass' },
      { sequence: 3, seat: 1, action: 'pass' }
    ];
    const state: GameState = {
      ...base,
      variantState: { ...base.variantState, kingPt: king }
    };

    act(() => {
      ReactDOM.render(
        <KingFestaFlowModal gameState={state} localPlayerIndex={1} {...festaHandlers} />,
        container
      );
    });

    expect(container.querySelector('.variant-modal--bottom-sheet')).not.toBeNull();
    expect(container.querySelector('[data-testid="king-auction-timeline"]')).toBeNull();
    expect(container.querySelector('[data-testid="king-auction-history-toggle"]')).not.toBeNull();
    expect(container.querySelector('.king-auction-toolbar')).not.toBeNull();
  });
});
