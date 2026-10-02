import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SpadesBidMinibox } from './SpadesBidMinibox';
import { SpadesGame, getSpadesState } from '../models/games/SpadesGame';
import { buildTableRenderModel } from '../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../utils/gameFlowOrchestrator';
import { mapTableModelToPhaserView } from '../renderers/phaser/mapTableModelToPhaserView';

const names = ['Ana', 'Bia', 'Carla', 'Dina'];

function forceBidder(game: SpadesGame, seat: number) {
  const internal = game as unknown as { state: ReturnType<SpadesGame['getCurrentState']> };
  const spades = getSpadesState(internal.state);
  spades.currentBidderIndex = seat;
  spades.bidLeaderIndex = seat;
  spades.waitingForBids = true;
}

describe('Spades bid surface', () => {
  beforeEach(() => {
    localStorage.setItem('sueca-language', 'pt');
  });

  it('selects a numeric bid and confirms that normal bid', () => {
    const onConfirm = viConfirm();
    render(
      <SpadesBidMinibox currentBidderName="Ana" nilEnabled onConfirm={onConfirm.fn} />
    );

    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.querySelector('select')).toBeNull();
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('A tua vez, Ana')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar bid' }));
    expect(onConfirm.calls).toEqual([[7, 'normal']]);
  });

  it('keeps Nil distinct from numeric 0 after the hand is visible', () => {
    const onConfirm = viConfirm();
    render(
      <SpadesBidMinibox
        currentBidderName="Ana"
        nilEnabled
        blindDecisionPending={false}
        onConfirm={onConfirm.fn}
      />
    );

    expect(screen.queryByRole('button', { name: 'Blind nil' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Nil' }));
    expect(screen.getByRole('button', { name: 'Nil' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '0' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Nil (0 vazas)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar bid' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    expect(screen.getByRole('button', { name: 'Nil' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '0' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar bid' }));

    expect(onConfirm.calls).toEqual([
      [0, 'nil'],
      [0, 'normal']
    ]);
  });

  it('offers Blind Nil only on the pre-view choice', () => {
    const onConfirm = viConfirm();
    const onDecline = { called: false, fn: () => { onDecline.called = true; } };
    const { rerender } = render(
      <SpadesBidMinibox
        currentBidderName="Ana"
        nilEnabled
        blindDecisionPending
        onDeclineBlindNil={onDecline.fn}
        onConfirm={onConfirm.fn}
      />
    );

    expect(screen.getByTestId('spades-bid-surface')).toHaveAttribute('data-surface', 'preview');
    expect(document.querySelector('select')).toBeNull();
    expect(screen.queryByRole('button', { name: '0' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nil' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirmar bid' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Blind nil' }));
    expect(onConfirm.calls).toEqual([[0, 'blindNil']]);

    fireEvent.click(screen.getByRole('button', { name: 'Ver mão' }));
    expect(onDecline.called).toBe(true);

    rerender(
      <SpadesBidMinibox
        currentBidderName="Ana"
        nilEnabled
        blindDecisionPending={false}
        onConfirm={onConfirm.fn}
      />
    );
    expect(screen.getByTestId('spades-bid-surface')).toHaveAttribute('data-surface', 'normal');
    expect(screen.queryByRole('button', { name: 'Blind nil' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Nil' })).toBeTruthy();
  });

  it('uses the English confirm label', () => {
    localStorage.setItem('sueca-language', 'en');
    render(
      <SpadesBidMinibox currentBidderName="Ana" nilEnabled={false} onConfirm={() => undefined} />
    );
    expect(screen.getByRole('button', { name: 'Confirm bid' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Nil' })).toBeNull();
    expect(screen.getByText('Your turn, Ana')).toBeTruthy();
  });

  it('does not bypass an engine rejection', () => {
    const game = new SpadesGame();
    game.initialize(names, { localPlayerIndex: 0, aiDifficulty: 'easy' });
    forceBidder(game, 1);
    const before = [...getSpadesState(game.getCurrentState()).playerBids];

    render(
      <SpadesBidMinibox
        currentBidderName="Ana"
        nilEnabled
        onConfirm={(bid, bidType) => {
          game.submitBid(0, bid, bidType);
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar bid' }));

    const after = getSpadesState(game.getCurrentState());
    expect(after.playerBids).toEqual(before);
    expect(after.currentBidderIndex).toBe(1);
  });

  it('keeps a completed bid on the table and focuses the next bidder', () => {
    const game = new SpadesGame();
    game.initialize(names, { localPlayerIndex: 0, aiDifficulty: 'easy' });
    forceBidder(game, 0);
    expect(game.submitBid(0, 3, 'normal')).toBe(true);

    const gameState = game.getCurrentState();
    const spades = getSpadesState(gameState);
    const model = buildTableRenderModel({
      gameState,
      variant: 'spades',
      localPlayerIndex: 0,
      usTeam: 1,
      themTeam: 2,
      boardFlow: resolveGameBoardFlow({ variant: 'spades', gameState }),
      spadesState: spades
    });
    const view = mapTableModelToPhaserView({
      model,
      width: 390,
      height: 740,
      isLocalCardPlayable: () => false,
      activeTurnLabel: 'A JOGAR'
    });

    expect(spades.currentBidderIndex).toBe(1);
    expect(view.seats[0].bidLabel).toBe('3');
    expect(view.seats[1].showActiveHighlight).toBe(true);
    expect(view.seats.filter((seat) => seat.showActiveHighlight)).toHaveLength(1);
  });
});

function viConfirm() {
  const calls: Array<[number, string]> = [];
  return {
    calls,
    fn: (bid: number, bidType: string) => {
      calls.push([bid, bidType]);
    }
  };
}
