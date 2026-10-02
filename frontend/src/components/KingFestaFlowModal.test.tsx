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

    expect(container.querySelector('[data-testid="king-festa-sheet"]')).not.toBeNull();
    expect(container.querySelector('.variant-modal--bottom-sheet.king-festa-sheet')).not.toBeNull();
    expect(container.querySelector('[data-testid="king-festa-sheet-header"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="king-festa-sheet-body"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="king-auction-timeline"]')).toBeNull();
    expect(container.querySelector('[data-testid="king-auction-history-toggle"]')).not.toBeNull();
    expect(container.querySelector('.king-auction-toolbar')).not.toBeNull();
    // Toolbar lives in pinned header so history can scroll in body.
    expect(
      container.querySelector('[data-testid="king-festa-sheet-header"] .king-auction-toolbar')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="king-festa-sheet-body"] [data-testid="king-auction-history"]')
    ).not.toBeNull();
  });

  it('UX-FESTA-02: auction stepper defaults, type switch, min/max, no number input', () => {
    const offers: Array<{ bidType: string; amount: number }> = [];
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
    king.bestBid = null;
    king.auctionHistory = [];
    const state: GameState = {
      ...base,
      variantState: { ...base.variantState, kingPt: king }
    };

    act(() => {
      ReactDOM.render(
        <KingFestaFlowModal
          gameState={state}
          localPlayerIndex={1}
          {...festaHandlers}
          onAuctionBid={(bidType, amount) => {
            offers.push({ bidType, amount });
          }}
        />,
        container
      );
    });

    expect(container.querySelector('input[type="number"]')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
    expect(container.textContent).toContain('A tua licitação, Bruno');
    expect(container.textContent).toContain('Ainda sem ofertas.');
    expect(container.textContent).toContain('Oferecer');
    expect(container.textContent).toContain('Passar');
    expect(container.querySelector('.king-auction-amount-stepper')).not.toBeNull();
    expect(
      container.querySelector('.king-auction-amount-stepper__value')?.textContent
    ).toBe('3');

    const typeButtons = Array.from(
      container.querySelectorAll('.king-auction-type button')
    ) as HTMLButtonElement[];
    const nullType = typeButtons.find((btn) => btn.textContent === 'Nulos');
    const positiveType = typeButtons.find((btn) => btn.textContent === 'Positivas');
    expect(positiveType?.getAttribute('aria-pressed')).toBe('true');
    act(() => {
      nullType?.click();
    });
    expect(
      container.querySelector('.king-auction-amount-stepper__value')?.textContent
    ).toBe('1');
    expect(nullType?.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      positiveType?.click();
    });
    expect(
      container.querySelector('.king-auction-amount-stepper__value')?.textContent
    ).toBe('3');

    const minus = container.querySelector(
      'button[aria-label="Diminuir vazas"]'
    ) as HTMLButtonElement;
    const plus = container.querySelector(
      'button[aria-label="Aumentar vazas"]'
    ) as HTMLButtonElement;

    // Floor is 1; at default 3, minus works then stops at 1.
    act(() => {
      minus.click();
    });
    act(() => {
      minus.click();
    });
    act(() => {
      minus.click();
    });
    expect(
      container.querySelector('.king-auction-amount-stepper__value')?.textContent
    ).toBe('1');
    expect(minus.disabled).toBe(true);

    for (let i = 0; i < 20; i++) {
      act(() => {
        plus.click();
      });
    }
    expect(
      container.querySelector('.king-auction-amount-stepper__value')?.textContent
    ).toBe('8');
    expect(plus.disabled).toBe(true);

    act(() => {
      (
        container.querySelector(
          '.king-auction-toolbar .sueca-btn--primary'
        ) as HTMLButtonElement
      ).click();
    });
    expect(offers).toEqual([{ bidType: 'positive', amount: 8 }]);
  });

  it('pins auction result CTA in sheet footer and keeps history in scroll body', () => {
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Ana', 'Bruno', 'Carla', 'Diogo'],
      { festaGameNumber: 7, festaPhase: 'auction_result' },
      { localPlayerIndex: 0 }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    king.festaPhase = 'auction_result';
    king.festaOwnerIndex = 0;
    king.bestBid = { bidderIndex: 0, bidType: 'positive', amount: 3 };
    king.auctionHistory = [
      { sequence: 1, seat: 0, action: 'bid', bidType: 'positive', amount: 3 },
      { sequence: 2, seat: 1, action: 'pass' },
      { sequence: 3, seat: 2, action: 'pass' },
      { sequence: 4, seat: 3, action: 'pass' }
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

    const footer = container.querySelector('[data-testid="king-festa-sheet-footer"]');
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toContain('Prosseguir para negociação');
    expect(container.textContent).toContain('Vencedor:');
    expect(container.textContent).toContain('Oferta:');
    expect(container.textContent).toContain('Beneficiário:');
    expect(
      container.querySelector('[data-testid="king-festa-sheet-body"] .king-festa-winner-box')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="king-festa-sheet-body"] [data-testid="king-auction-history"]')
    ).not.toBeNull();
  });

  it('uses the same setup shell with footer Continuar for festa choice', () => {
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Ana', 'Bruno', 'Carla', 'Diogo'],
      { festaGameNumber: 7, festaPhase: 'setup' },
      { localPlayerIndex: 0 }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    king.festaPhase = 'setup';
    king.festaMode = 'positive';
    king.festaOwnerIndex = 0;
    king.bestBid = { bidderIndex: 0, bidType: 'positive', amount: 3 };
    king.benefitOwnerIndex = 0;
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

    const sheet = container.querySelector('[data-testid="king-festa-sheet"]');
    expect(sheet?.className).toContain('variant-modal--festa-setup');
    expect(sheet?.className).toContain('king-festa-sheet');
    expect(container.querySelector('[data-testid="king-festa-sheet-body"] .king-festa-choice-grid')).not.toBeNull();
    expect(container.querySelector('[data-testid="king-festa-sheet-footer"]')?.textContent).toContain(
      'Rever contrato'
    );
    expect(container.querySelector('select')).toBeNull();
  });
});

describe('King festa decision surfaces', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.setItem('sueca-language', 'pt');
    container = document.createElement('div');
    container.style.width = '390px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  function renderKing(
    mutate: (king: ReturnType<typeof getKingPtState>) => void,
    localPlayerIndex = 0,
    handlers: Partial<typeof festaHandlers> = {}
  ) {
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Ana', 'Bruno', 'Carla', 'Diogo'],
      { festaGameNumber: 7, festaPhase: 'auction' },
      { localPlayerIndex }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    mutate(king);
    const state: GameState = {
      ...base,
      variantState: { ...base.variantState, kingPt: king }
    };
    act(() => {
      ReactDOM.render(
        <KingFestaFlowModal
          gameState={state}
          localPlayerIndex={localPlayerIndex}
          {...festaHandlers}
          {...handlers}
        />,
        container
      );
    });
  }

  function labels(selector: string) {
    return Array.from(container.querySelectorAll(selector)).map((el) => el.textContent);
  }

  it('names the waiting bidder and the standing offer', () => {
    renderKing((king) => {
      king.festaPhase = 'auction';
      king.festaOwnerIndex = 0;
      king.auctionOrder = [1, 2, 3];
      king.auctionTurnIndex = 1;
      king.currentBidder = 2;
      king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
    });
    expect(container.textContent).toContain('A licitar: Carla');
    expect(container.textContent).toContain('Melhor oferta:');
    expect(container.textContent).toContain('4 positivas');
    expect(container.querySelector('select')).toBeNull();
  });

  it('shows Passo on the Portuguese voice echo and still submits pass', () => {
    let passes = 0;
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
    king.auctionHistory = [];
    const bidding: GameState = {
      ...base,
      variantState: { ...base.variantState, kingPt: king }
    };
    act(() => {
      ReactDOM.render(
        <KingFestaFlowModal
          gameState={bidding}
          localPlayerIndex={1}
          {...festaHandlers}
          onAuctionPass={() => {
            passes += 1;
          }}
        />,
        container
      );
    });
    const pass = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Passar'
    ) as HTMLButtonElement;
    act(() => pass.click());
    expect(passes).toBe(1);

    king.waitingForAuctionContinue = true;
    king.auctionHistory = [{ sequence: 1, seat: 1, action: 'pass' }];
    const echoed: GameState = {
      ...bidding,
      variantState: { ...bidding.variantState, kingPt: king }
    };
    act(() => {
      ReactDOM.render(
        <KingFestaFlowModal gameState={echoed} localPlayerIndex={1} {...festaHandlers} />,
        container
      );
    });
    expect(container.querySelector('.king-auction-current-bid')?.textContent).toContain('Passo');
    expect(container.querySelector('.king-auction-current-bid')?.textContent).not.toContain('PASS');
  });

  it('keeps Continuar as the acknowledge beat between auction voices', () => {
    renderKing((king) => {
      king.festaPhase = 'auction';
      king.waitingForAuctionContinue = true;
      king.festaOwnerIndex = 0;
      king.auctionHistory = [
        { sequence: 1, seat: 1, action: 'bid', bidType: 'positive', amount: 4 }
      ];
    });
    const footer = container.querySelector('[data-testid="king-festa-sheet-footer"]');
    expect(footer?.textContent).toContain('Continuar');
    expect(container.textContent).toContain('Bruno');
  });

  it('shows negotiation roles and the four legal actions', () => {
    renderKing((king) => {
      king.festaPhase = 'negotiation';
      king.festaOwnerIndex = 0;
      king.eightOrNullsPending = false;
      king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 5 };
    });
    const actions = labels('.king-festa-actions button');
    expect(actions).toEqual(expect.arrayContaining(['Aceitar', 'Pedir mais', 'Recusar', '8 ou nulos']));
    expect(container.textContent).toContain('Beneficiário: Ana');
    expect(container.textContent).toContain('Licitante: Bruno');
    expect(container.textContent).toContain('5 positivas');
    const ask = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Pedir mais'
    ) as HTMLButtonElement;
    expect(ask.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      ask.click();
    });
    expect(ask.className).toContain('sueca-btn--toggle-on');
    expect(ask.getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('Enviar pedido');
  });

  it('names the counter responder and the requested raise', () => {
    renderKing(
      (king) => {
        king.festaPhase = 'negotiation_counter';
        king.festaOwnerIndex = 0;
        king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
        king.requestedBid = { bidderIndex: 1, bidType: 'positive', amount: 6 };
      },
      1
    );
    expect(container.textContent).toContain('Pedido de subida');
    expect(container.textContent).toContain('A tua resposta, Bruno');
    expect(container.textContent).toContain('6 positivas');
    expect(container.textContent).toContain('4 positivas');
    const actions = labels('.king-auction-toolbar button');
    expect(actions).toEqual(expect.arrayContaining(['Subir oferta', 'Recusar subida']));
  });

  it('labels the two 8-or-nulls outcomes without treating refusal as nulls', () => {
    renderKing(
      (king) => {
        king.festaPhase = 'negotiation';
        king.festaOwnerIndex = 0;
        king.eightOrNullsPending = true;
        king.eightOrNullsTarget = 1;
        king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
      },
      1
    );
    expect(container.textContent).toContain('Ana declarou');
    expect(container.textContent).toContain('A tua resposta');
    expect(container.textContent).toContain('Não escolhe nulos');
    const actions = labels('.king-festa-actions button');
    expect(actions).toEqual(expect.arrayContaining(['Oferecer 8', 'Recusar 8']));
    expect(container.textContent).not.toMatch(/recusa escolhe nulos|refusal chooses nulls/i);
  });

  it('shows legal fallback choices and hides an illegal 4×3×3', () => {
    renderKing((king) => {
      king.festaPhase = 'fallback';
      king.waitingForFallback = true;
      king.festaOwnerIndex = 0;
      king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 3 };
      king.highestEquivalentValue = 3;
    });
    expect(labels('.king-festa-actions button')).toEqual(
      expect.arrayContaining(['Trunfo', 'Sem trunfo', 'Nulos', '4×3×3'])
    );
    expect(container.textContent).toContain('Escolha de contrato');
    expect(container.querySelector('select')).toBeNull();

    renderKing((king) => {
      king.festaPhase = 'fallback';
      king.waitingForFallback = true;
      king.festaOwnerIndex = 0;
      king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 6 };
      king.highestEquivalentValue = 6;
    });
    expect(labels('.king-festa-actions button')).not.toContain('4×3×3');
  });

  it('selects trump and first player, then starts play from the review step', () => {
    const setups: Array<[string | null, boolean, number]> = [];
    renderKing(
      (king) => {
        king.festaPhase = 'setup';
        king.waitingForFestaSetup = true;
        king.festaMode = 'positive';
        king.festaOwnerIndex = 0;
        king.benefitOwnerIndex = 0;
        king.bestBid = { bidderIndex: 0, bidType: 'positive', amount: 4 };
      },
      0,
      {
        onSetup: (trump, noTrump, first) => {
          setups.push([trump, noTrump, first]);
        }
      }
    );
    expect(container.querySelector('select')).toBeNull();
    const suitButtons = Array.from(
      container.querySelectorAll('.king-festa-choice-grid button')
    ) as HTMLButtonElement[];
    const trump = suitButtons.find((btn) => btn.getAttribute('aria-pressed') === 'true');
    expect(trump).toBeTruthy();
    const noTrump = suitButtons.find((btn) => btn.textContent === 'Sem trunfo') as HTMLButtonElement;
    act(() => {
      noTrump.click();
    });
    expect(noTrump.getAttribute('aria-pressed')).toBe('true');
    expect(noTrump.className).toContain('king-festa-choice-btn--selected');

    const bruno = Array.from(container.querySelectorAll('.king-festa-setup-row button')).find(
      (btn) => btn.textContent === 'Bruno'
    ) as HTMLButtonElement;
    act(() => {
      bruno.click();
    });
    expect(bruno.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      (
        Array.from(container.querySelectorAll('[data-testid="king-festa-sheet-footer"] button')).find(
          (btn) => btn.textContent === 'Rever contrato'
        ) as HTMLButtonElement
      ).click();
    });
    const start = Array.from(
      container.querySelectorAll('[data-testid="king-festa-sheet-footer"] button')
    ).find((btn) => btn.textContent === 'Iniciar jogo') as HTMLButtonElement;
    expect(start).toBeTruthy();
    act(() => {
      start.click();
    });
    expect(setups).toEqual([[null, true, 1]]);
  });

  it('renders each festa phase inside a 390px frame without a native select', () => {
    const phases: Array<(king: ReturnType<typeof getKingPtState>) => void> = [
      (king) => {
        king.festaPhase = 'auction';
        king.festaOwnerIndex = 0;
        king.currentBidder = 0;
        king.auctionOrder = [0, 1, 2, 3];
        king.auctionTurnIndex = 0;
      },
      (king) => {
        king.festaPhase = 'auction_result';
        king.festaOwnerIndex = 0;
        king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
      },
      (king) => {
        king.festaPhase = 'negotiation';
        king.festaOwnerIndex = 0;
        king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 4 };
      },
      (king) => {
        king.festaPhase = 'negotiation_counter';
        king.festaOwnerIndex = 0;
        king.bestBid = { bidderIndex: 0, bidType: 'positive', amount: 4 };
        king.requestedBid = { bidderIndex: 0, bidType: 'positive', amount: 6 };
      },
      (king) => {
        king.eightOrNullsPending = true;
        king.eightOrNullsTarget = 0;
        king.festaOwnerIndex = 1;
        king.festaPhase = 'negotiation';
      },
      (king) => {
        king.festaPhase = 'fallback';
        king.waitingForFallback = true;
        king.festaOwnerIndex = 0;
        king.highestEquivalentValue = 3;
      },
      (king) => {
        king.festaPhase = 'setup';
        king.waitingForFestaSetup = true;
        king.festaMode = 'positive';
        king.festaOwnerIndex = 0;
        king.benefitOwnerIndex = 0;
      }
    ];
    phases.forEach((mutate) => {
      renderKing(mutate);
      expect(container.querySelector('[data-testid="king-festa-sheet"]')).not.toBeNull();
      expect(container.querySelector('select')).toBeNull();
      expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth || container.scrollWidth);
    });
  });
});
