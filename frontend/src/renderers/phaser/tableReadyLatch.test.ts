import { describe, expect, it, vi } from 'vitest';
import { createTableReadyLatch } from './tableReadyLatch';

describe('UX-SUECA-04 tableReadyLatch deadlock fix', () => {
  it('does not fire until both surface and seats are ready', () => {
    const onReady = vi.fn();
    const latch = createTableReadyLatch(onReady);
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: false })).toBe(false);
    expect(latch.tryNotify({ surfaceReady: false, seatsReady: true })).toBe(false);
    expect(onReady).not.toHaveBeenCalled();
  });

  it('fires when surface becomes ready after seats (Phaser create after model apply)', () => {
    const onReady = vi.fn();
    const latch = createTableReadyLatch(onReady);
    // Model apply happened first — seats ok, surface not yet.
    expect(latch.tryNotify({ surfaceReady: false, seatsReady: true })).toBe(false);
    // Scene.create later — surface ready; latch must still fire.
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: true })).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('fires when seats become ready after surface (callback installed late)', () => {
    const onReady = vi.fn();
    const latch = createTableReadyLatch(onReady);
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: false })).toBe(false);
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: true })).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('latches: subsequent notifies do not re-fire (single ritual start)', () => {
    const onReady = vi.fn();
    const latch = createTableReadyLatch(onReady);
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: true })).toBe(true);
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: true })).toBe(true);
    expect(latch.tryNotify({ surfaceReady: true, seatsReady: true })).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(latch.hasFired()).toBe(true);
  });
});
