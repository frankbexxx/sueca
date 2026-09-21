import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { KingAuctionTimeline } from './KingAuctionTimeline';
import { KingAuctionHistoryEntry, KingBid } from '../models/games/king/kingContracts';

describe('KingAuctionTimeline progressive disclosure', () => {
  let container: HTMLDivElement;

  const history: KingAuctionHistoryEntry[] = [
    {
      sequence: 1,
      seat: 0,
      action: 'bid',
      bidType: 'positive',
      amount: 3
    },
    {
      sequence: 2,
      seat: 1,
      action: 'pass'
    }
  ];

  const bestBid: KingBid = {
    bidderIndex: 0,
    bidType: 'positive',
    amount: 3
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('collapses auction history by default', () => {
    act(() => {
      ReactDOM.render(
        <KingAuctionTimeline
          history={history}
          playerNames={['Ana', 'Bruno', 'Carla', 'Diogo']}
          festaPhase="auction"
          bestBid={bestBid}
        />,
        container
      );
    });

    expect(container.querySelector('[data-testid="king-auction-history-toggle"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="king-auction-timeline"]')).toBeNull();
    expect(container.textContent).toContain('Histórico do leilão (2)');
  });

  it('opens and closes auction history on toggle', () => {
    act(() => {
      ReactDOM.render(
        <KingAuctionTimeline
          history={history}
          playerNames={['Ana', 'Bruno', 'Carla', 'Diogo']}
          festaPhase="auction"
          bestBid={bestBid}
        />,
        container
      );
    });

    const toggle = container.querySelector(
      '[data-testid="king-auction-history-toggle"]'
    ) as HTMLButtonElement;

    act(() => {
      toggle.click();
    });
    expect(container.querySelector('[data-testid="king-auction-timeline"]')).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      toggle.click();
    });
    expect(container.querySelector('[data-testid="king-auction-timeline"]')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
