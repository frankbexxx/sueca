import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/game';
import { HeartsGame, getHeartsState } from '../../models/games/HeartsGame';
import { SpadesGame, getSpadesState } from '../../models/games/SpadesGame';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import {
  mapTableModelToDomDockProps,
  mapTableModelToDomSurfaceProps
} from '../../table/mapTableModelToDomProps';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { mapTableModelToPhaserView } from '../../renderers/phaser/mapTableModelToPhaserView';
import { LocalPlayerDock } from './LocalPlayerDock';
import { TableSurface } from './TableSurface';

const NAMES = ['Ana', 'Bruno', 'Carla', 'Diogo'];

function players(): GameState['players'] {
  return [0, 1, 2, 3].map((index) => ({
    id: `p${index}`,
    name: NAMES[index],
    hand: [],
    team: (index % 2 === 0 ? 1 : 2) as 1 | 2,
    type: index === 0 ? 'human' as const : 'ai' as const
  }));
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: players(),
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trickLeader: 0,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    completedPentes: [],
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: true,
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'Ana',
    aiDifficulty: 'medium',
    partnerSignals: [],
    ...overrides
  };
}

function cueSeats(container: HTMLElement, localPlayerIndex: number): number[] {
  const seats = Array.from(container.querySelectorAll('.player-seat--active')).map((node) =>
    Number((node as HTMLElement).dataset.seatIndex)
  );
  if (container.querySelector('.local-player-dock--active')) seats.push(localPlayerIndex);
  return seats.sort((a, b) => a - b);
}

function phaserCueSeats(state: GameState, variant: GameState['variant']): number[] {
  const boardFlow = resolveGameBoardFlow({
    variant: variant ?? 'sueca',
    gameState: state,
    rulesPresetId: variant === 'king' ? 'king-pt-normal' : undefined
  });
  const model = buildTableRenderModel({
    gameState: state,
    variant: variant ?? 'sueca',
    rulesPresetId: variant === 'king' ? 'king-pt-normal' : undefined,
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow,
    kingPt: variant === 'king' ? (state.variantState?.kingPt as never) : null,
    spadesState: variant === 'spades' ? getSpadesState(state) : null,
    heartsState: variant === 'hearts' ? getHeartsState(state) : null
  });
  const view = mapTableModelToPhaserView({
    model,
    width: 390,
    height: 740,
    activeTurnLabel: 'A JOGAR'
  });
  return view.seats
    .filter((seat) => seat.showActiveHighlight)
    .map((seat) => seat.seatIndex)
    .sort((a, b) => a - b);
}

function renderCues(state: GameState, variant: NonNullable<GameState['variant']>): number[] {
  const boardFlow = resolveGameBoardFlow({
    variant,
    gameState: state,
    rulesPresetId: variant === 'king' ? 'king-pt-normal' : undefined
  });
  const model = buildTableRenderModel({
    gameState: state,
    variant,
    rulesPresetId: variant === 'king' ? 'king-pt-normal' : undefined,
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow,
    kingPt: variant === 'king' ? (state.variantState?.kingPt as never) : null,
    spadesState: variant === 'spades' ? getSpadesState(state) : null,
    heartsState: variant === 'hearts' ? getHeartsState(state) : null
  });
  const surface = mapTableModelToDomSurfaceProps(
    model,
    state,
    variant === 'spades' ? getSpadesState(state) : null
  );
  const dock = mapTableModelToDomDockProps(
    model,
    state,
    variant === 'spades' ? getSpadesState(state) : null
  );
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(
      <>
        <TableSurface
          {...surface}
          getCardImage={() => ''}
          getTeamName={(team) => (team === 1 ? 'NÓS' : 'ELES')}
        />
        <LocalPlayerDock {...dock} getTeamName={(team) => (team === 1 ? 'NÓS' : 'ELES')} />
      </>,
      container
    );
  });
  const cues = cueSeats(container, 0);
  ReactDOM.unmountComponentAtNode(container);
  container.remove();
  return cues;
}

describe('DOM active-seat cue follows the shared model', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hides the Sueca current-player cue while paused and restores it', () => {
    const playing = baseState({ variant: 'sueca', currentPlayerIndex: 2 });
    expect(renderCues(playing, 'sueca')).toEqual([2]);
    expect(renderCues({ ...playing, isPaused: true }, 'sueca')).toEqual([]);
    expect(renderCues({ ...playing, isPaused: false }, 'sueca')).toEqual([2]);
    expect(phaserCueSeats(playing, 'sueca')).toEqual([2]);
    expect(phaserCueSeats({ ...playing, isPaused: true }, 'sueca')).toEqual([]);
  });

  it('hides the local Sueca dock cue while paused and restores it', () => {
    const playing = baseState({ variant: 'sueca', currentPlayerIndex: 0 });
    expect(renderCues(playing, 'sueca')).toEqual([0]);
    expect(renderCues({ ...playing, isPaused: true }, 'sueca')).toEqual([]);
    expect(renderCues(playing, 'sueca')).toEqual([0]);
  });

  it('keeps the Spades bidder cue on the same seat across pause', () => {
    const game = new SpadesGame();
    const bidding = game.initialize(NAMES, { aiDifficulty: 'easy', localPlayerIndex: 0 });
    const bidder = getSpadesState(bidding).currentBidderIndex;
    expect(renderCues(bidding, 'spades')).toEqual([bidder]);
    expect(renderCues({ ...bidding, isPaused: true }, 'spades')).toEqual([]);
    expect(renderCues({ ...bidding, isPaused: false }, 'spades')).toEqual([bidder]);
    expect(phaserCueSeats({ ...bidding, isPaused: true }, 'spades')).toEqual([]);
    expect(phaserCueSeats(bidding, 'spades')).toEqual([bidder]);

    const dealt = { ...bidding, waitingForRoundStart: false };
    const spades = getSpadesState(dealt);
    spades.waitingForBids = false;
    spades.playerBids = [1, 1, 1, 1];
    dealt.variantState = { ...dealt.variantState, spades };
    dealt.currentPlayerIndex = 3;
    expect(renderCues(dealt, 'spades')).toEqual([3]);
    expect(renderCues({ ...dealt, isPaused: true }, 'spades')).toEqual([]);
    expect(renderCues(dealt, 'spades')).toEqual([3]);
  });

  it('shows no Hearts cue during the pass and restores the leader after pause', () => {
    const game = new HeartsGame();
    const passing = game.initialize(NAMES, {});
    expect(getHeartsState(passing).waitingForPass).toBe(true);
    expect(renderCues(passing, 'hearts')).toEqual([]);
    expect(phaserCueSeats(passing, 'hearts')).toEqual([]);

    const playing = {
      ...passing,
      waitingForRoundStart: false,
      currentPlayerIndex: 2,
      isPaused: false
    };
    const hearts = getHeartsState(playing);
    hearts.waitingForPass = false;
    playing.variantState = { ...playing.variantState, hearts };
    expect(renderCues(playing, 'hearts')).toEqual([2]);
    expect(renderCues({ ...playing, isPaused: true }, 'hearts')).toEqual([]);
    expect(renderCues(playing, 'hearts')).toEqual([2]);
    expect(phaserCueSeats({ ...playing, isPaused: true }, 'hearts')).toEqual([]);
  });

  it('shows no King cue during festa and restores the player cue after pause', () => {
    const festa = baseState({
      variant: 'king',
      waitingForRoundStart: true,
      currentPlayerIndex: 1,
      variantState: { kingPt: { festaPhase: 'negotiation', phase: 'negative' } }
    });
    expect(renderCues(festa, 'king')).toEqual([]);
    expect(phaserCueSeats(festa, 'king')).toEqual([]);

    const playing = baseState({
      variant: 'king',
      waitingForRoundStart: false,
      currentPlayerIndex: 3,
      variantState: { kingPt: { festaPhase: null, phase: 'negative' } }
    });
    expect(renderCues(playing, 'king')).toEqual([3]);
    expect(renderCues({ ...playing, isPaused: true }, 'king')).toEqual([]);
    expect(renderCues(playing, 'king')).toEqual([3]);
    expect(phaserCueSeats(playing, 'king')).toEqual([3]);
    expect(phaserCueSeats({ ...playing, isPaused: true }, 'king')).toEqual([]);
  });
});
