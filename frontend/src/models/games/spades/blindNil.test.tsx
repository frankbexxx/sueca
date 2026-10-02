import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import { SpadesGame, getSpadesState, isBlindNilDecisionPending } from '../SpadesGame';
import { chooseSpadesBid } from '../../../ai/games/spades/SpadesBidEstimator';
import { buildTableRenderModel } from '../../../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../../../utils/gameFlowOrchestrator';
import { mapTableModelToPhaserView } from '../../../renderers/phaser/mapTableModelToPhaserView';
import { PlayerHand } from '../../../components/PlayerHand';
import { SpadesBidMinibox } from '../../../components/SpadesBidMinibox';
import { Card } from '../../../types/game';

const names = ['A', 'B', 'C', 'D'];

function nilGame() {
  const game = new SpadesGame();
  game.initialize(names, { rulesPresetId: 'spades-pt-nil', localPlayerIndex: 0, aiDifficulty: 'medium' });
  return game;
}

function forceBidder(game: SpadesGame, seat: number) {
  const internal = game as unknown as { state: ReturnType<SpadesGame['getCurrentState']> };
  const spades = getSpadesState(internal.state);
  spades.currentBidderIndex = seat;
  spades.bidLeaderIndex = seat;
  return internal;
}

function tableModel(game: SpadesGame) {
  const gameState = game.getCurrentState();
  return buildTableRenderModel({
    gameState,
    variant: 'spades',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow: resolveGameBoardFlow({ variant: 'spades', gameState }),
    spadesState: getSpadesState(gameState)
  });
}

function phaserHand(game: SpadesGame) {
  const model = tableModel(game);
  const view = mapTableModelToPhaserView({
    model,
    width: 390,
    height: 740,
    isLocalCardPlayable: () => false
  });
  return { model, view };
}

describe('Spades blind nil information boundary', () => {
  it('hides the local hand until the human accepts or declines', () => {
    const game = nilGame();
    forceBidder(game, 0);
    const before = phaserHand(game);
    expect(isBlindNilDecisionPending(getSpadesState(game.getCurrentState()), 0)).toBe(true);
    expect(before.model.localHand).toEqual([]);
    expect(before.view.localHand).toEqual([]);
    expect(before.model.seats[1].handCount).toBeGreaterThan(0);

    const state = game.getCurrentState();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const pending = isBlindNilDecisionPending(getSpadesState(state), 0);
    act(() => {
      ReactDOM.render(
        pending ? null : (
          <PlayerHand
            gameState={state}
            localPlayerIndex={0}
            selectedCard={null}
            canPlayCard={() => false}
            onCardClick={() => undefined}
            getCardImage={() => '/card.png'}
            layoutSnapshot={{ isMobileLayout: false, isNarrow: false }}
          />
        ),
        container
      );
    });
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.textContent ?? '').not.toMatch(/of /);

    expect(game.declineBlindNil(0)).toBe(true);
    const after = phaserHand(game);
    expect(after.model.localHand.length).toBeGreaterThan(0);
    expect(after.view.localHand.length).toBeGreaterThan(0);
    expect(after.view.localHand.some((card) => card.card.rank && card.card.suit)).toBe(true);

    const revealed = game.getCurrentState();
    act(() => {
      ReactDOM.render(
        <PlayerHand
          gameState={revealed}
          localPlayerIndex={0}
          selectedCard={null}
          canPlayCard={() => false}
          onCardClick={() => undefined}
          getCardImage={() => '/card.png'}
          layoutSnapshot={{ isMobileLayout: false, isNarrow: false }}
        />,
        container
      );
    });
    expect(container.querySelector('img')?.getAttribute('alt')).toMatch(/of /);
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('accepts Blind Nil only before the hand is revealed and then advances', () => {
    const game = nilGame();
    forceBidder(game, 0);
    expect(game.submitBid(0, 3, 'normal')).toBe(false);
    expect(game.submitBid(0, 0, 'nil')).toBe(false);
    expect(game.submitBid(0, 0, 'blindNil')).toBe(true);
    const spades = getSpadesState(game.getCurrentState());
    expect(spades.playerBidTypes[0]).toBe('blindNil');
    expect(spades.playerBids[0]).toBe(0);
    expect(spades.currentBidderIndex).toBe(1);
    expect(isBlindNilDecisionPending(spades, 0)).toBe(false);
    expect(game.submitBid(0, 0, 'blindNil')).toBe(false);
  });

  it('after decline, Nil remains and Blind Nil is rejected', () => {
    const game = nilGame();
    forceBidder(game, 0);
    expect(game.declineBlindNil(0)).toBe(true);
    expect(game.submitBid(0, 0, 'blindNil')).toBe(false);
    expect(game.submitBid(0, 0, 'nil')).toBe(true);
    expect(getSpadesState(game.getCurrentState()).playerBidTypes[0]).toBe('nil');
  });

  it('keeps both nil types out of the team contract and scores ±100 / ±200', () => {
    const game = nilGame();
    forceBidder(game, 0);
    expect(game.submitBid(0, 0, 'blindNil')).toBe(true);
    expect(game.declineBlindNil(1)).toBe(true);
    expect(game.submitBid(1, 0, 'nil')).toBe(true);
    expect(game.declineBlindNil(2)).toBe(true);
    expect(game.submitBid(2, 3, 'normal')).toBe(true);
    expect(game.declineBlindNil(3)).toBe(true);
    expect(game.submitBid(3, 4, 'normal')).toBe(true);

    const internal = game as unknown as {
      state: ReturnType<SpadesGame['getCurrentState']>;
      endRound: (s: ReturnType<SpadesGame['getCurrentState']>) => void;
    };
    const spades = getSpadesState(internal.state);
    expect(spades.waitingForBids).toBe(false);
    expect(spades.team1Bid).toBe(3);
    expect(spades.team2Bid).toBe(4);
    spades.team1Tricks = 3;
    spades.team2Tricks = 4;
    spades.playerTricks = [0, 0, 3, 4];
    internal.endRound(internal.state);
    expect(internal.state.scores).toEqual({ team1: 230, team2: 140 });
  });

  it('AI Blind Nil does not change when the dealt hand changes', () => {
    const decide = (ranks: Array<[string, string]>) => {
      const game = nilGame();
      const internal = forceBidder(game, 1);
      internal.state.players[1].hand = ranks.map(([rank, suit], index) => ({
        id: `h${index}`,
        rank,
        suit
      })) as Card[];
      internal.state.aiDifficulty = 'medium';
      const random = vi.spyOn(Math, 'random').mockReturnValue(0);
      game.tickBidAi();
      random.mockRestore();
      return getSpadesState(game.getCurrentState()).playerBidTypes[1];
    };

    const weak = decide([
      ['2', 'clubs'],
      ['3', 'diamonds'],
      ['4', 'hearts']
    ]);
    const strong = decide([
      ['A', 'spades'],
      ['K', 'spades'],
      ['A', 'hearts']
    ]);
    expect(weak).toBe('blindNil');
    expect(strong).toBe('blindNil');
  });

  it('after the AI declines, the normal bid can read the hand and cannot be blind nil', () => {
    const bidFor = (ranks: Array<[string, string]>) => {
      const game = nilGame();
      const internal = forceBidder(game, 1);
      internal.state.players[1].hand = ranks.map(([rank, suit], index) => ({
        id: `h${index}`,
        rank,
        suit
      })) as Card[];
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.9);
      game.tickBidAi();
      random.mockRestore();
      const spades = getSpadesState(game.getCurrentState());
      return { bid: spades.playerBids[1], type: spades.playerBidTypes[1] };
    };

    const weak = bidFor([
      ['2', 'clubs'],
      ['3', 'diamonds'],
      ['4', 'hearts']
    ]);
    const strong = bidFor([
      ['A', 'spades'],
      ['K', 'spades'],
      ['A', 'hearts'],
      ['K', 'hearts']
    ]);
    expect(weak.type).not.toBe('blindNil');
    expect(strong.type).not.toBe('blindNil');
    expect(strong.bid).toBeGreaterThan(weak.bid ?? 0);
    expect(chooseSpadesBid([{ id: 'a', rank: '2', suit: 'clubs' } as Card], true, true, 'hard').bidType).not.toBe(
      'blindNil'
    );
  });

  it('does not let a paused AI take Blind Nil', () => {
    const game = nilGame();
    const internal = forceBidder(game, 1);
    internal.state.isPaused = true;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    game.tickBidAi();
    random.mockRestore();
    const spades = getSpadesState(game.getCurrentState());
    expect(spades.playerBids[1]).toBeNull();
    expect(isBlindNilDecisionPending(spades, 1)).toBe(true);
  });

  it('resumes a pending decision with the hand still hidden', () => {
    const game = nilGame();
    forceBidder(game, 0);
    const snap = JSON.parse(JSON.stringify(game.getCurrentState()));
    game.restoreState(snap);
    const spades = getSpadesState(game.getCurrentState());
    expect(isBlindNilDecisionPending(spades, 0)).toBe(true);
    expect(tableModel(game).localHand).toEqual([]);
  });

  it('resumes a decline with a visible hand and no Blind Nil', () => {
    const game = nilGame();
    forceBidder(game, 0);
    expect(game.declineBlindNil(0)).toBe(true);
    const snap = JSON.parse(JSON.stringify(game.getCurrentState()));
    game.restoreState(snap);
    expect(tableModel(game).localHand.length).toBeGreaterThan(0);
    expect(game.submitBid(0, 0, 'blindNil')).toBe(false);
    expect(game.submitBid(0, 0, 'nil')).toBe(true);
  });

  it('resumes a submitted Blind Nil on the next bidder', () => {
    const game = nilGame();
    forceBidder(game, 0);
    expect(game.submitBid(0, 0, 'blindNil')).toBe(true);
    const snap = JSON.parse(JSON.stringify(game.getCurrentState()));
    game.restoreState(snap);
    const spades = getSpadesState(game.getCurrentState());
    expect(spades.playerBidTypes[0]).toBe('blindNil');
    expect(spades.playerBids[0]).toBe(0);
    expect(spades.currentBidderIndex).toBe(1);
    expect(isBlindNilDecisionPending(spades, 1)).toBe(true);
  });

  it('shows Blind Nil only on the pre-view choice, then Nil on the normal bid', () => {
    localStorage.setItem('sueca-language', 'pt');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const render = (pending: boolean) => {
      act(() => {
        ReactDOM.render(
          <SpadesBidMinibox
            currentBidderName="A"
            nilEnabled
            blindNilEnabled={false}
            blindDecisionPending={pending}
            onDeclineBlindNil={() => undefined}
            onConfirm={() => undefined}
          />,
          container
        );
      });
    };
    render(true);
    expect(container.textContent).toContain('Blind nil');
    expect(container.textContent).toContain('Ver mão');
    expect(container.querySelector('select')).toBeNull();
    render(false);
    expect(container.textContent).not.toContain('Blind nil');
    expect(container.textContent).toContain('Nil');
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });
});
