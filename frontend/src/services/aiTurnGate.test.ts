import { describe, expect, it, vi } from 'vitest';
import { AiPlayRequestError } from './aiClient';
import {
  bindAiTurnScope,
  createAiTurnGate,
  isSameLiveAiTurn,
  runGuardedAiPlay,
  type AiTurnIdentity,
  type AiTurnScope,
  type LiveAiTurnState,
} from './aiTurnGate';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function live(overrides: Partial<LiveAiTurnState> = {}): LiveAiTurnState {
  return {
    currentPlayerIndex: 1,
    round: 2,
    trickLeader: 1,
    trickLength: 0,
    isPaused: false,
    isGameOver: false,
    waitingForTrickEnd: false,
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    ...overrides,
  };
}

const identity: AiTurnIdentity = {
  playerIndex: 1,
  round: 2,
  trickLeader: 1,
  trickLength: 0,
};

function scoped(scope: AiTurnScope, state: LiveAiTurnState) {
  return bindAiTurnScope(scope, () => isSameLiveAiTurn(identity, state));
}

function start(
  scope: AiTurnScope,
  requestExternal: () => Promise<number>,
  playImpl: (index: number) => boolean = () => true
) {
  const play = vi.fn(playImpl);
  const chooseLocal = vi.fn(() => 7);
  const onExternalFailure = vi.fn();
  const onPlayRejected = vi.fn();
  const onStuck = vi.fn();
  const playFirstLegal = vi.fn(() => -1);
  const done = runGuardedAiPlay({
    scope,
    requestExternal,
    onExternalFailure,
    chooseLocal,
    play,
    playFirstLegal,
    onPlayRejected,
    onStuck,
  });
  return { play, chooseLocal, onExternalFailure, onPlayRejected, onStuck, playFirstLegal, done };
}

describe('Sueca external AI turn races', () => {
  it('A normal success plays the external card once', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const request = deferred<number>();
    const run = start(scope, () => request.promise);
    request.resolve(3);
    await expect(run.done).resolves.toBe('external');
    expect(run.play).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledWith(3);
    expect(run.chooseLocal).not.toHaveBeenCalled();
    expect(run.onExternalFailure).not.toHaveBeenCalled();
    expect(run.playFirstLegal).not.toHaveBeenCalled();
  });

  it('B current-turn network failure falls back to local exactly once', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const run = start(scope, () => Promise.reject(new Error('network down')));
    await expect(run.done).resolves.toBe('local');
    expect(run.onExternalFailure).toHaveBeenCalledTimes(1);
    expect(run.chooseLocal).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledWith(7);
  });

  it('C late external success after the turn changes does not play or fall back', async () => {
    const gate = createAiTurnGate();
    const state = live();
    const scope = scoped(gate.open(), state);
    const request = deferred<number>();
    const run = start(scope, () => request.promise);
    state.currentPlayerIndex = 2;
    gate.close();
    request.resolve(3);
    await expect(run.done).resolves.toBe('ignored');
    expect(run.play).not.toHaveBeenCalled();
    expect(run.chooseLocal).not.toHaveBeenCalled();
    expect(run.onExternalFailure).not.toHaveBeenCalled();
    expect(run.playFirstLegal).not.toHaveBeenCalled();
  });

  it('C obsolete network failure does not fall back into the new turn', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const request = deferred<number>();
    const run = start(scope, () => request.promise);
    gate.close();
    request.reject(new Error('network down'));
    await expect(run.done).resolves.toBe('ignored');
    expect(run.play).not.toHaveBeenCalled();
    expect(run.chooseLocal).not.toHaveBeenCalled();
    expect(run.onExternalFailure).not.toHaveBeenCalled();
  });

  it('D pause drops the in-flight result; the next scope after unpause plays once', async () => {
    const gate = createAiTurnGate();
    const state = live();
    const pausedScope = scoped(gate.open(), state);
    const pausedRequest = deferred<number>();
    const paused = start(pausedScope, () => pausedRequest.promise);
    state.isPaused = true;
    gate.close();
    pausedRequest.resolve(2);
    await expect(paused.done).resolves.toBe('ignored');
    expect(paused.play).not.toHaveBeenCalled();
    expect(paused.chooseLocal).not.toHaveBeenCalled();

    state.isPaused = false;
    const resumed = scoped(gate.open(), state);
    const resumedRequest = deferred<number>();
    const next = start(resumed, () => resumedRequest.promise);
    resumedRequest.resolve(5);
    await expect(next.done).resolves.toBe('external');
    expect(next.play).toHaveBeenCalledTimes(1);
    expect(next.play).toHaveBeenCalledWith(5);
    expect(paused.play).not.toHaveBeenCalled();
  });

  it('E a new hand cannot accept the previous response', async () => {
    const gate = createAiTurnGate();
    const state = live();
    const oldScope = scoped(gate.open(), state);
    const oldRequest = deferred<number>();
    const oldRun = start(oldScope, () => oldRequest.promise);
    state.round = 3;
    state.waitingForRoundStart = true;
    gate.close();
    oldRequest.resolve(1);
    await expect(oldRun.done).resolves.toBe('ignored');

    state.waitingForRoundStart = false;
    const nextIdentityScope = bindAiTurnScope(gate.open(), () =>
      isSameLiveAiTurn({ ...identity, round: 3 }, state)
    );
    const nextRequest = deferred<number>();
    const next = start(nextIdentityScope, () => nextRequest.promise);
    nextRequest.resolve(6);
    await expect(next.done).resolves.toBe('external');
    expect(oldRun.play).not.toHaveBeenCalled();
    expect(next.play).toHaveBeenCalledTimes(1);
    expect(next.play).toHaveBeenCalledWith(6);
  });

  it('F unmount aborts the scope so a late result cannot play', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const request = deferred<number>();
    const run = start(scope, () => request.promise);
    gate.close();
    expect(scope.signal.aborted).toBe(true);
    expect(scope.isCurrent()).toBe(false);
    request.resolve(4);
    await expect(run.done).resolves.toBe('ignored');
    expect(run.play).not.toHaveBeenCalled();
    expect(run.chooseLocal).not.toHaveBeenCalled();
    expect(run.onExternalFailure).not.toHaveBeenCalled();
  });

  it('G genuine timeout on the current turn falls back local exactly once', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const run = start(scope, () => Promise.reject(new AiPlayRequestError('timeout')));
    await expect(run.done).resolves.toBe('local');
    expect(run.onExternalFailure).toHaveBeenCalledTimes(1);
    expect(run.chooseLocal).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledWith(7);
    expect(run.playFirstLegal).not.toHaveBeenCalled();
  });

  it('G timeout after the turn is already stale does not fall back', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const request = deferred<number>();
    const run = start(scope, () => request.promise);
    gate.close();
    request.reject(new AiPlayRequestError('timeout'));
    await expect(run.done).resolves.toBe('ignored');
    expect(run.chooseLocal).not.toHaveBeenCalled();
    expect(run.play).not.toHaveBeenCalled();
    expect(run.onExternalFailure).not.toHaveBeenCalled();
  });

  it('H effect re-run cancels the first request and completes the second once', async () => {
    const gate = createAiTurnGate();
    const first = scoped(gate.open(), live());
    const firstRequest = deferred<number>();
    first.signal.addEventListener('abort', () => {
      firstRequest.reject(new AiPlayRequestError('cancelled'));
    });
    const firstRun = start(first, () => firstRequest.promise);

    const second = scoped(gate.open(), live());
    const secondRequest = deferred<number>();
    const secondRun = start(second, () => secondRequest.promise);
    secondRequest.resolve(4);

    await expect(firstRun.done).resolves.toBe('ignored');
    await expect(secondRun.done).resolves.toBe('external');
    expect(firstRun.play).not.toHaveBeenCalled();
    expect(firstRun.chooseLocal).not.toHaveBeenCalled();
    expect(firstRun.onExternalFailure).not.toHaveBeenCalled();
    expect(secondRun.play).toHaveBeenCalledTimes(1);
    expect(secondRun.play).toHaveBeenCalledWith(4);
    expect(secondRun.chooseLocal).not.toHaveBeenCalled();
  });

  it('local-only (no external request) still plays local once on the current turn', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const run = start(scope, async () => -1);
    await expect(run.done).resolves.toBe('local');
    expect(run.onExternalFailure).not.toHaveBeenCalled();
    expect(run.chooseLocal).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledTimes(1);
    expect(run.play).toHaveBeenCalledWith(7);
  });

  it('cancellation while still marked current does not fall back or warn via onExternalFailure', async () => {
    const gate = createAiTurnGate();
    const raw = gate.open();
    const run = start(raw, () => Promise.reject(new AiPlayRequestError('cancelled')));
    await expect(run.done).resolves.toBe('ignored');
    expect(run.chooseLocal).not.toHaveBeenCalled();
    expect(run.play).not.toHaveBeenCalled();
    expect(run.onExternalFailure).not.toHaveBeenCalled();
  });

  it('a rejected current-turn play still tries the first legal card once', async () => {
    const gate = createAiTurnGate();
    const scope = scoped(gate.open(), live());
    const run = start(scope, async () => 3, () => false);
    run.playFirstLegal.mockReturnValue(2);
    await expect(run.done).resolves.toBe('first-legal');
    expect(run.onPlayRejected).toHaveBeenCalledTimes(1);
    expect(run.playFirstLegal).toHaveBeenCalledTimes(1);
    expect(run.chooseLocal).not.toHaveBeenCalled();
  });
});
