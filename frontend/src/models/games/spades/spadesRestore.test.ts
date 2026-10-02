import { SpadesGame, getSpadesState, isBlindNilDecisionPending } from '../SpadesGame';
import { buildTableRenderModel } from '../../../table/buildTableRenderModel';
import { mapTableModelToPhaserView } from '../../../renderers/phaser/mapTableModelToPhaserView';
import { isSpadesBidActive, resolveGameBoardFlow } from '../../../utils/gameFlowOrchestrator';
import { GameState } from '../../../types/game';

const names = ['A', 'B', 'C', 'D'];

function engine(): SpadesGame {
  return new SpadesGame();
}

function started(preset?: string): SpadesGame {
  const game = engine();
  game.initialize(names, {
    aiDifficulty: 'easy',
    localPlayerIndex: 0,
    ...(preset ? { rulesPresetId: preset } : {})
  });
  return game;
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function spadesOf(state: GameState): Record<string, unknown> {
  return state.variantState!.spades as Record<string, unknown>;
}

function bidAround(game: SpadesGame, bid = 3): void {
  const leader = getSpadesState(game.getCurrentState()).bidLeaderIndex;
  for (let step = 0; step < 4; step++) {
    const seat = (leader + step) % 4;
    game.declineBlindNil(seat);
    expect(game.submitBid(seat, bid, 'normal')).toBe(true);
  }
}

function localHandCount(state: GameState): { model: number; phaser: number } {
  const spades = getSpadesState(state);
  const model = buildTableRenderModel({
    gameState: state,
    variant: 'spades',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow: resolveGameBoardFlow({ variant: 'spades', gameState: state }),
    spadesState: spades
  });
  const view = mapTableModelToPhaserView({
    model,
    width: 390,
    height: 740,
    isLocalCardPlayable: () => false
  });
  return { model: model.localHand.length, phaser: view.localHand.length };
}

describe('Spades persisted state restore', () => {
  it('does not turn a missing Spades object into an open auction', () => {
    const saved = cloneState(started().getCurrentState());
    delete saved.variantState!.spades;
    const before = JSON.stringify(saved);

    const read = getSpadesState(saved);
    expect(read.waitingForBids).toBe(false);
    expect(read.currentBidderIndex).toBe(-1);
    expect(read.bidLeaderIndex).toBe(-1);
    expect(isSpadesBidActive('spades', saved)).toBe(false);
    expect(JSON.stringify(saved)).toBe(before);

    const host = engine();
    const internal = host as unknown as { state: GameState };
    internal.state = saved;
    host.tickBidAi();
    expect(saved.variantState!.spades).toBeUndefined();
    expect(host.canPlayCard(saved, 0, 0)).toBe(false);
    expect(host.chooseAICard(saved, 0)).toBe(-1);

    const fresh = engine();
    expect(() => fresh.restoreState(saved)).toThrow(/missing_variant_state/);
    expect(() => fresh.getCurrentState()).toThrow(/not initialized/);
    fresh.tickBidAi();
  });

  it('keeps existing bids and fills only safe optional fields', () => {
    const game = started();
    const leader = getSpadesState(game.getCurrentState()).bidLeaderIndex;
    expect(game.submitBid(leader, 4, 'normal')).toBe(true);
    expect(game.submitBid((leader + 1) % 4, 2, 'normal')).toBe(true);
    const snap = cloneState(game.getCurrentState());
    const raw = spadesOf(snap);
    const bids = [...(raw.playerBids as (number | null)[])];
    const bidder = raw.currentBidderIndex;
    delete raw.playerBidTypes;
    delete raw.blindNilResolved;
    delete raw.spadesBroken;
    delete raw.team1Tricks;
    delete raw.team2Tricks;
    delete raw.playerTricks;
    delete raw.team1Bags;
    delete raw.team2Bags;
    delete raw.team1Bid;
    delete raw.team2Bid;
    delete raw.nilEnabled;
    delete raw.blindNilEnabled;
    delete raw.waitingForBids;

    const hands = snap.players.map((player) => player.hand.map((card) => ({ ...card })));
    const resumed = engine().restoreState(snap);
    const spades = getSpadesState(resumed);
    expect(spades.playerBids).toEqual(bids);
    expect(spades.currentBidderIndex).toBe(bidder);
    expect(spades.waitingForBids).toBe(true);
    expect(spades.playerBidTypes).toEqual(['normal', 'normal', 'normal', 'normal']);
    expect(spades.blindNilResolved).toEqual([true, true, true, true]);
    expect(spades.spadesBroken).toBe(false);
    expect(spades.team1Bags).toBe(0);
    expect(spades.team2Bags).toBe(0);
    expect(spades.nilEnabled).toBe(false);
    expect(resumed.gameScore).toEqual(snap.gameScore);
    expect(resumed.currentTrick).toEqual(snap.currentTrick);
    expect(resumed.players.map((player) => player.hand)).toEqual(hands);
    expect(isBlindNilDecisionPending(spades, bidder as number)).toBe(false);
  });

  it('rejects a partial object that would have to invent the auction', () => {
    const snap = cloneState(started().getCurrentState());
    delete spadesOf(snap).playerBids;
    const before = JSON.stringify(snap);
    expect(getSpadesState(snap).waitingForBids).toBe(false);
    expect(getSpadesState(snap).currentBidderIndex).toBe(-1);
    expect(JSON.stringify(snap)).toBe(before);
    expect(() => engine().restoreState(snap)).toThrow(/incomplete_variant_state/);

    const wiped = cloneState(started().getCurrentState());
    const wipedSpades = spadesOf(wiped);
    wipedSpades.playerBids = [null, null, null, null];
    delete wipedSpades.waitingForBids;
    expect(() => engine().restoreState(wiped)).toThrow(/incomplete_variant_state/);
    expect(isSpadesBidActive('spades', wiped)).toBe(false);
  });

  it('does not reopen bidding when every seat already bid', () => {
    const game = started();
    bidAround(game, 3);
    const snap = cloneState(game.getCurrentState());
    const bids = [...getSpadesState(snap).playerBids];
    spadesOf(snap).waitingForBids = true;
    const resumed = engine();
    const state = resumed.restoreState(snap);
    const spades = getSpadesState(state);
    expect(spades.waitingForBids).toBe(false);
    expect(spades.playerBids).toEqual(bids);
    resumed.tickBidAi();
    expect(getSpadesState(resumed.getCurrentState()).playerBids).toEqual(bids);
  });

  it('does not hide a pre-0E hand or offer Blind Nil again', () => {
    const game = started('spades-pt-nil');
    const internal = game as unknown as { state: GameState };
    const live = getSpadesState(internal.state);
    live.bidLeaderIndex = 0;
    live.currentBidderIndex = 0;
    const snap = cloneState(game.getCurrentState());
    delete spadesOf(snap).blindNilResolved;

    const resumed = engine();
    const state = resumed.restoreState(snap);
    const spades = getSpadesState(state);
    expect(spades.blindNilResolved).toEqual([true, true, true, true]);
    expect(spades.waitingForBids).toBe(true);
    expect(isBlindNilDecisionPending(spades, 0)).toBe(false);
    expect(localHandCount(state).model).toBeGreaterThan(0);
    expect(localHandCount(state).phaser).toBeGreaterThan(0);
    expect(resumed.submitBid(0, 0, 'blindNil')).toBe(false);
    expect(resumed.submitBid(0, 0, 'nil')).toBe(true);
    expect(getSpadesState(resumed.getCurrentState()).playerBidTypes[0]).toBe('nil');
  });

  it('resumes an in-progress auction, a mid-trick hand, and a round end unchanged', () => {
    const bidding = started();
    const leader = getSpadesState(bidding.getCurrentState()).bidLeaderIndex;
    expect(bidding.submitBid(leader, 5, 'normal')).toBe(true);
    const bidSnap = cloneState(bidding.getCurrentState());
    const bidState = engine().restoreState(bidSnap);
    expect(getSpadesState(bidState).playerBids).toEqual(getSpadesState(bidSnap).playerBids);
    expect(getSpadesState(bidState).currentBidderIndex).toBe(getSpadesState(bidSnap).currentBidderIndex);
    expect(bidState.players.map((player) => player.hand)).toEqual(bidSnap.players.map((player) => player.hand));

    const playing = started();
    bidAround(playing, 2);
    const actor = playing.getCurrentState().currentPlayerIndex;
    let cardIndex = -1;
    for (let i = 0; i < playing.getCurrentState().players[actor].hand.length; i++) {
      if (playing.canPlayCard(playing.getCurrentState(), actor, i)) {
        cardIndex = i;
        break;
      }
    }
    expect(cardIndex).toBeGreaterThanOrEqual(0);
    expect(playing.playCard(playing.getCurrentState(), actor, cardIndex)).toBe(true);
    const trickSnap = cloneState(playing.getCurrentState());
    const trickState = engine().restoreState(trickSnap);
    expect(trickState.currentTrick).toEqual(trickSnap.currentTrick);
    expect(trickState.currentPlayerIndex).toBe(trickSnap.currentPlayerIndex);
    expect(trickState.gameScore).toEqual(trickSnap.gameScore);
    expect(getSpadesState(trickState).playerBids).toEqual(getSpadesState(trickSnap).playerBids);
    expect(getSpadesState(trickState).playerTricks).toEqual(getSpadesState(trickSnap).playerTricks);
    expect(getSpadesState(trickState).spadesBroken).toBe(getSpadesState(trickSnap).spadesBroken);

    const ended = cloneState(trickState);
    ended.waitingForRoundEnd = true;
    ended.gameScore = { team1: 140, team2: 90 };
    ended.scores = { team1: 40, team2: 20 };
    const endState = engine().restoreState(ended);
    expect(endState.waitingForRoundEnd).toBe(true);
    expect(endState.gameScore).toEqual({ team1: 140, team2: 90 });
    expect(endState.scores).toEqual({ team1: 40, team2: 20 });
    expect(getSpadesState(endState).playerBids).toEqual(getSpadesState(ended).playerBids);
    expect(getSpadesState(endState).waitingForBids).toBe(false);
  });

  it('refuses to invent bags or the broken-spades flag once the hand is in play', () => {
    const game = started();
    bidAround(game, 3);
    const snap = cloneState(game.getCurrentState());
    snap.round = 2;
    delete spadesOf(snap).team1Bags;
    delete spadesOf(snap).team2Bags;
    expect(() => engine().restoreState(snap)).toThrow(/incomplete_variant_state/);

    const broken = cloneState(game.getCurrentState());
    delete spadesOf(broken).spadesBroken;
    expect(() => engine().restoreState(broken)).toThrow(/incomplete_variant_state/);
  });
});
