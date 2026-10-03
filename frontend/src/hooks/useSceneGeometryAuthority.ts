/**
 * Authoritative runtime owner for SceneGeometryResult.
 *
 * Lifecycle:
 *   shell / visualViewport / orientation / resize event
 *   → measureGameplayShell
 *   → computeAuthoritativeSceneGeometry
 *   → publish only when result key changes
 *
 * Does not accept game phase / variant / HUD content as inputs.
 * Does not resize the Phaser host (Step 2 = snapshot plumbing only).
 */

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { SceneGeometryResult } from '../scene/sceneGeometry';
import { computeAuthoritativeSceneGeometry } from '../runtime/computeAuthoritativeSceneGeometry';
import { measureGameplayShell } from '../runtime/measureGameplayShell';

export function useSceneGeometryAuthority(
  shellRef: RefObject<HTMLElement | null>
): SceneGeometryResult | null {
  const [snapshot, setSnapshot] = useState<SceneGeometryResult | null>(null);
  const publishedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof window === 'undefined') return;

    let cancelled = false;
    let raf = 0;

    const publish = () => {
      if (cancelled) return;
      const measured = measureGameplayShell(shell);
      const computed = computeAuthoritativeSceneGeometry(measured);
      if (!computed.ok) {
        // Invalid raw measure — keep last good snapshot; never crash.
        return;
      }
      if (computed.key === publishedKeyRef.current) return;
      publishedKeyRef.current = computed.key;
      setSnapshot(computed.result);
    };

    /** Coalesce bursty resize/VV/orientation notifications into one measure. */
    const schedulePublish = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        publish();
      });
    };

    publish();

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(schedulePublish);
      ro.observe(shell);
      observers.push(ro);
    }

    const vv = window.visualViewport;
    vv?.addEventListener('resize', schedulePublish);
    vv?.addEventListener('scroll', schedulePublish);
    window.addEventListener('resize', schedulePublish);
    window.addEventListener('orientationchange', schedulePublish);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      for (const ro of observers) ro.disconnect();
      vv?.removeEventListener('resize', schedulePublish);
      vv?.removeEventListener('scroll', schedulePublish);
      window.removeEventListener('resize', schedulePublish);
      window.removeEventListener('orientationchange', schedulePublish);
    };
  }, [shellRef]);

  return snapshot;
}
