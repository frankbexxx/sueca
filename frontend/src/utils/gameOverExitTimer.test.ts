import { createGameOverExitController } from './gameOverExitTimer';

describe('createGameOverExitController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Caso A: waiting — onExit fires once after delay', () => {
    const onExit = jest.fn();
    const ctrl = createGameOverExitController(onExit, 3000);
    ctrl.schedule();
    expect(ctrl.isPending()).toBe(true);
    jest.advanceTimersByTime(2999);
    expect(onExit).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(ctrl.isPending()).toBe(false);
  });

  it('Caso B: cancel before timeout — onExit never fires', () => {
    const onExit = jest.fn();
    const ctrl = createGameOverExitController(onExit, 3000);
    ctrl.schedule();
    ctrl.cancel();
    jest.advanceTimersByTime(5000);
    expect(onExit).not.toHaveBeenCalled();
    expect(ctrl.isPending()).toBe(false);
  });

  it('Caso C: manual exit path cancels pending auto-exit', () => {
    const onExit = jest.fn();
    const ctrl = createGameOverExitController(onExit, 3000);
    ctrl.schedule();
    ctrl.cancel();
    onExit(); // manual leave
    jest.advanceTimersByTime(5000);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('Caso D: cancel after unmount-equivalent — stale callback inert', () => {
    const onExit = jest.fn();
    const ctrl = createGameOverExitController(onExit, 3000);
    ctrl.schedule();
    ctrl.cancel();
    jest.runOnlyPendingTimers();
    expect(onExit).not.toHaveBeenCalled();
  });

  it('Caso E: schedule twice replaces timer — onExit once', () => {
    const onExit = jest.fn();
    const ctrl = createGameOverExitController(onExit, 3000);
    ctrl.schedule();
    ctrl.schedule();
    jest.advanceTimersByTime(3000);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('new game after schedule invalidates prior generation', () => {
    const onExit = jest.fn();
    const ctrl = createGameOverExitController(onExit, 3000);
    ctrl.schedule();
    jest.advanceTimersByTime(1500);
    ctrl.cancel(); // New Game
    ctrl.schedule(); // should not happen for new game, but proves cancel isolation
    ctrl.cancel();
    jest.advanceTimersByTime(10000);
    expect(onExit).not.toHaveBeenCalled();
  });
});
