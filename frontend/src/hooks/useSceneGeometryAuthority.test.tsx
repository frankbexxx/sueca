import React, { useRef } from 'react';
import { act, render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSceneGeometryAuthority } from './useSceneGeometryAuthority';
import { sceneGeometryResultKey } from '../scene/sceneGeometryEquality';
import * as measureMod from '../runtime/measureGameplayShell';

type RoCallback = ResizeObserverCallback;

let roCallback: RoCallback | null = null;
let roInstance: MockResizeObserver | null = null;

class MockResizeObserver {
  readonly callback: RoCallback;
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn(() => {
    if (roInstance === this) {
      roCallback = null;
      roInstance = null;
    }
  });

  constructor(cb: RoCallback) {
    this.callback = cb;
    roCallback = cb;
    roInstance = this;
  }
}

type Listener = EventListenerOrEventListenerObject;

function listenerSet() {
  return new Map<string, Set<Listener>>();
}

function addTo(map: Map<string, Set<Listener>>, type: string, fn: Listener) {
  let set = map.get(type);
  if (!set) {
    set = new Set();
    map.set(type, set);
  }
  set.add(fn);
}

function removeFrom(map: Map<string, Set<Listener>>, type: string, fn: Listener) {
  map.get(type)?.delete(fn);
}

function fire(map: Map<string, Set<Listener>>, type: string) {
  for (const fn of map.get(type) ?? []) {
    if (typeof fn === 'function') fn(new Event(type));
    else fn.handleEvent(new Event(type));
  }
}

function Harness({
  width,
  height,
  sizeRef,
  onSnap
}: {
  width: number;
  height: number;
  /** Mutable size box shared with tests (updated in place before event flush). */
  sizeRef?: { width: number; height: number };
  onSnap: (snap: ReturnType<typeof useSceneGeometryAuthority>, key: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const snap = useSceneGeometryAuthority(ref);
  React.useEffect(() => {
    onSnap(snap, snap ? sceneGeometryResultKey(snap) : null);
  }, [snap, onSnap]);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (el) {
          const readW = () => sizeRef?.width ?? width;
          const readH = () => sizeRef?.height ?? height;
          Object.defineProperty(el, 'clientWidth', {
            configurable: true,
            get: readW
          });
          Object.defineProperty(el, 'clientHeight', {
            configurable: true,
            get: readH
          });
        }
      }}
    />
  );
}

describe('useSceneGeometryAuthority', () => {
  let windowListeners: Map<string, Set<Listener>>;
  let vvListeners: Map<string, Set<Listener>>;
  let rafEntries: Array<{ id: number; cb: FrameRequestCallback }>;
  let nextRafId: number;
  let cancelCount: number;
  let realAdd: typeof window.addEventListener;
  let realRemove: typeof window.removeEventListener;

  beforeEach(() => {
    windowListeners = listenerSet();
    vvListeners = listenerSet();
    rafEntries = [];
    nextRafId = 1;
    cancelCount = 0;
    roCallback = null;
    roInstance = null;

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
      paddingLeft: '0px'
    } as CSSStyleDeclaration);

    // Controllable RAF: cancel removes the pending callback (browser-like).
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextRafId++;
      rafEntries.push({ id, cb });
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      const idx = rafEntries.findIndex((e) => e.id === id);
      if (idx >= 0) {
        rafEntries.splice(idx, 1);
        cancelCount += 1;
      }
    });

    realAdd = window.addEventListener.bind(window);
    realRemove = window.removeEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn, options) => {
      if (typeof type === 'string' && fn) addTo(windowListeners, type, fn as Listener);
      else realAdd(type, fn as never, options as never);
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation((type, fn, options) => {
      if (typeof type === 'string' && fn) removeFrom(windowListeners, type, fn as Listener);
      else realRemove(type, fn as never, options as never);
    });

    const vv = {
      width: 390,
      height: 844,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      scale: 1,
      onresize: null,
      onscroll: null,
      addEventListener: vi.fn((type: string, fn: Listener) => {
        addTo(vvListeners, type, fn);
      }),
      removeEventListener: vi.fn((type: string, fn: Listener) => {
        removeFrom(vvListeners, type, fn);
      }),
      dispatchEvent: () => false
    };
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      writable: true,
      value: vv
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    roCallback = null;
    roInstance = null;
  });

  async function flushRaf() {
    await act(async () => {
      const queued = rafEntries.splice(0, rafEntries.length);
      for (const entry of queued) entry.cb(performance.now());
    });
  }

  async function settleInitial() {
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('publishes initial geometry from the shell element', async () => {
    const keys: Array<string | null> = [];
    render(
      <Harness
        width={390}
        height={844}
        onSnap={(_snap, key) => {
          keys.push(key);
        }}
      />
    );
    await settleInitial();
    const published = keys.filter((k) => k != null);
    expect(published.length).toBeGreaterThanOrEqual(1);
    expect(published[published.length - 1]).toMatch(/^v1::/);
  });

  it('publishes unsupported snapshots without crashing', async () => {
    let supported: boolean | null = null;
    render(
      <Harness
        width={200}
        height={280}
        onSnap={(snap) => {
          supported = snap ? snap.supported : null;
        }}
      />
    );
    await settleInitial();
    expect(supported).toBe(false);
  });

  describe('event sources schedule remeasurement', () => {
    async function mountAt(size: { width: number; height: number }) {
      const keys: string[] = [];
      const snaps: Array<ReturnType<typeof useSceneGeometryAuthority>> = [];
      const measureSpy = vi.spyOn(measureMod, 'measureGameplayShell');
      render(
        <Harness
          width={size.width}
          height={size.height}
          sizeRef={size}
          onSnap={(snap, key) => {
            snaps.push(snap);
            if (key) keys.push(key);
          }}
        />
      );
      await settleInitial();
      const afterInitMeasures = measureSpy.mock.calls.length;
      const afterInitKeys = keys.length;
      expect(afterInitKeys).toBeGreaterThanOrEqual(1);
      return { keys, snaps, measureSpy, afterInitMeasures, afterInitKeys, size };
    }

    async function assertSourceRemeasures(
      fireSource: () => void,
      size: { width: number; height: number },
      next: { width: number; height: number },
      ctx: Awaited<ReturnType<typeof mountAt>>
    ) {
      const { keys, measureSpy, afterInitMeasures, afterInitKeys } = ctx;
      // Same effective geometry → schedules measure, no new publication.
      fireSource();
      expect(rafEntries.length).toBe(1);
      await flushRaf();
      expect(measureSpy.mock.calls.length).toBeGreaterThan(afterInitMeasures);
      expect(keys.length).toBe(afterInitKeys);

      const measuresBeforeChange = measureSpy.mock.calls.length;
      size.width = next.width;
      size.height = next.height;
      fireSource();
      expect(rafEntries.length).toBe(1);
      await flushRaf();
      expect(measureSpy.mock.calls.length).toBeGreaterThan(measuresBeforeChange);
      expect(keys.length).toBeGreaterThan(afterInitKeys);
      expect(keys[keys.length - 1]).not.toBe(keys[afterInitKeys - 1]);
    }

    it('window resize', async () => {
      const size = { width: 390, height: 844 };
      const ctx = await mountAt(size);
      await assertSourceRemeasures(
        () => fire(windowListeners, 'resize'),
        size,
        { width: 420, height: 844 },
        ctx
      );
    });

    it('visualViewport resize', async () => {
      const size = { width: 390, height: 844 };
      const ctx = await mountAt(size);
      await assertSourceRemeasures(
        () => fire(vvListeners, 'resize'),
        size,
        { width: 400, height: 844 },
        ctx
      );
    });

    it('visualViewport scroll', async () => {
      const size = { width: 390, height: 844 };
      const ctx = await mountAt(size);
      await assertSourceRemeasures(
        () => fire(vvListeners, 'scroll'),
        size,
        { width: 410, height: 844 },
        ctx
      );
    });

    it('orientationchange', async () => {
      const size = { width: 390, height: 700 };
      const ctx = await mountAt(size);
      await assertSourceRemeasures(
        () => fire(windowListeners, 'orientationchange'),
        size,
        { width: 1024, height: 600 },
        ctx
      );
    });

    it('ResizeObserver callback', async () => {
      const size = { width: 390, height: 844 };
      const ctx = await mountAt(size);
      expect(roCallback).toBeTypeOf('function');
      await assertSourceRemeasures(
        () => roCallback?.([] as unknown as ResizeObserverEntry[], {} as ResizeObserver),
        size,
        { width: 430, height: 844 },
        ctx
      );
    });
  });

  describe('burst deduplication', () => {
    it('coalesces RO + window resize + VV resize + orientationchange into one measure/publish', async () => {
      const size = { width: 390, height: 844 };
      const keys: string[] = [];
      const measureSpy = vi.spyOn(measureMod, 'measureGameplayShell');

      render(
        <Harness
          width={size.width}
          height={size.height}
          sizeRef={size}
          onSnap={(_snap, key) => {
            if (key) keys.push(key);
          }}
        />
      );
      await settleInitial();
      const afterInitKeys = keys.length;
      const afterInitMeasures = measureSpy.mock.calls.length;
      const firstKey = keys[afterInitKeys - 1];

      size.width = 450;
      size.height = 844;

      // Burst before any RAF runs — each schedule cancels the prior frame id.
      roCallback?.([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      fire(windowListeners, 'resize');
      fire(vvListeners, 'resize');
      fire(windowListeners, 'orientationchange');

      expect(rafEntries.length).toBe(1);
      expect(cancelCount).toBeGreaterThanOrEqual(3);

      await flushRaf();

      // One measurement from the coalesced frame.
      const measuresFromBurst = measureSpy.mock.calls.length - afterInitMeasures;
      expect(measuresFromBurst).toBe(1);
      expect(keys.length).toBe(afterInitKeys + 1);
      expect(keys[keys.length - 1]).not.toBe(firstKey);

      // Identical effective geometry burst → measure once, no new publication.
      const keysBeforeSame = keys.length;
      const measuresBeforeSame = measureSpy.mock.calls.length;
      fire(windowListeners, 'resize');
      fire(vvListeners, 'scroll');
      roCallback?.([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      expect(rafEntries.length).toBe(1);
      await flushRaf();
      expect(measureSpy.mock.calls.length - measuresBeforeSame).toBe(1);
      expect(keys.length).toBe(keysBeforeSame);
    });
  });

  describe('cleanup / unmount', () => {
    it('disconnects observer, removes listeners, cancels pending RAF, and ignores later events', async () => {
      const size = { width: 390, height: 844 };
      const keys: string[] = [];
      const measureSpy = vi.spyOn(measureMod, 'measureGameplayShell');

      const { unmount } = render(
        <Harness
          width={size.width}
          height={size.height}
          sizeRef={size}
          onSnap={(_snap, key) => {
            if (key) keys.push(key);
          }}
        />
      );
      await settleInitial();
      expect(roInstance).not.toBeNull();
      const disconnect = roInstance!.disconnect;
      expect(windowListeners.get('resize')?.size).toBe(1);
      expect(windowListeners.get('orientationchange')?.size).toBe(1);
      expect(vvListeners.get('resize')?.size).toBe(1);
      expect(vvListeners.get('scroll')?.size).toBe(1);

      // Schedule a pending frame, then unmount before it runs.
      fire(windowListeners, 'resize');
      expect(rafEntries.length).toBe(1);

      const measuresAtUnmount = measureSpy.mock.calls.length;
      const keysAtUnmount = keys.length;
      const capturedRo = roCallback;
      const capturedWindowResize = [...(windowListeners.get('resize') ?? [])];
      const capturedOrientation = [...(windowListeners.get('orientationchange') ?? [])];
      const capturedVvResize = [...(vvListeners.get('resize') ?? [])];
      const capturedVvScroll = [...(vvListeners.get('scroll') ?? [])];

      unmount();

      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(windowListeners.get('resize')?.size ?? 0).toBe(0);
      expect(windowListeners.get('orientationchange')?.size ?? 0).toBe(0);
      expect(vvListeners.get('resize')?.size ?? 0).toBe(0);
      expect(vvListeners.get('scroll')?.size ?? 0).toBe(0);
      expect(cancelCount).toBeGreaterThanOrEqual(1);
      expect(rafEntries.length).toBe(0);

      // Flush any leftover RAF entries — cancelled ids must not publish.
      await flushRaf();
      expect(measureSpy.mock.calls.length).toBe(measuresAtUnmount);
      expect(keys.length).toBe(keysAtUnmount);

      // Former sources must not publish after unmount.
      size.width = 500;
      capturedRo?.([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      for (const fn of capturedWindowResize) {
        if (typeof fn === 'function') fn(new Event('resize'));
      }
      for (const fn of capturedOrientation) {
        if (typeof fn === 'function') fn(new Event('orientationchange'));
      }
      for (const fn of capturedVvResize) {
        if (typeof fn === 'function') fn(new Event('resize'));
      }
      for (const fn of capturedVvScroll) {
        if (typeof fn === 'function') fn(new Event('scroll'));
      }
      await flushRaf();
      expect(measureSpy.mock.calls.length).toBe(measuresAtUnmount);
      expect(keys.length).toBe(keysAtUnmount);
    });
  });
});
