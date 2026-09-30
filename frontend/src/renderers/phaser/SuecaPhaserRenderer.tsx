/**
 * React host for the Sueca Phaser table.
 * Consumes TableRenderModel + TableRendererEvents (C5 boundary).
 */

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Card } from '../../types/game';
import type {
  TableRenderModel,
  TableRendererEvents
} from '../../table/tableRenderModel';
import { useLanguage } from '../../i18n/useLanguage';
import { SuecaTableScene, SUECA_TABLE_SCENE_KEY } from './SuecaTableScene';
import { resolvePhaserThemeFromDom } from './phaserTheme';
import { createTableReadyLatch } from './tableReadyLatch';
import './SuecaPhaserRenderer.css';

export interface SuecaPhaserRendererProps {
  model: TableRenderModel;
  events?: TableRendererEvents;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  selectedCardIndex?: number | null;
  /** Called once if Phaser.Game construction fails (useEffect — not caught by error boundaries). */
  onInitError?: (error: Error) => void;
  /**
   * UX-SUECA-04 — fires once when scene has painted seats (table ready for ritual).
   * Safe if scene becomes ready before or after this prop is installed.
   */
  onTableReady?: () => void;
}

export const SuecaPhaserRenderer: React.FC<SuecaPhaserRendererProps> = ({
  model,
  events,
  getCardImage,
  getTeamName,
  isLocalCardPlayable,
  selectedCardIndex = null,
  onInitError,
  onTableReady
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SuecaTableScene | null>(null);
  const eventsRef = useRef(events);
  const playableRef = useRef(isLocalCardPlayable);
  const selectedRef = useRef(selectedCardIndex);
  const getCardImageRef = useRef(getCardImage);
  const getTeamNameRef = useRef(getTeamName);
  const activeTurnLabelRef = useRef(t.gameBoard.nowPlaying);
  const onInitErrorRef = useRef(onInitError);
  const onTableReadyRef = useRef(onTableReady);
  const seatsReadyRef = useRef(false);
  const readyLatchRef = useRef(
    createTableReadyLatch(() => {
      onTableReadyRef.current?.();
    })
  );

  eventsRef.current = events;
  playableRef.current = isLocalCardPlayable;
  selectedRef.current = selectedCardIndex;
  getCardImageRef.current = getCardImage;
  getTeamNameRef.current = getTeamName;
  activeTurnLabelRef.current = t.gameBoard.nowPlaying;
  onInitErrorRef.current = onInitError;
  onTableReadyRef.current = onTableReady;

  const emitReadyIfPossible = () => {
    const scene = sceneRef.current;
    readyLatchRef.current.tryNotify({
      surfaceReady: Boolean(scene?.isTableSurfaceReady()),
      seatsReady: seatsReadyRef.current
    });
  };

  const buildHost = () => ({
    onLocalCardClick: (cardIndex: number) => {
      eventsRef.current?.onLocalCardClick?.(cardIndex);
    },
    getCardImage: (card: Card) => getCardImageRef.current(card),
    getTeamName: (team: 1 | 2) => getTeamNameRef.current(team),
    getActiveTurnLabel: () => activeTurnLabelRef.current,
    isLocalCardPlayable: (cardIndex: number) =>
      playableRef.current ? playableRef.current(cardIndex) : true,
    getSelectedCardIndex: () => selectedRef.current ?? null,
    onTableSurfaceReady: () => {
      // Scene.create may finish after the first model apply — re-check latch.
      emitReadyIfPossible();
    }
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || gameRef.current) return;

    let themeTimer: number | undefined;
    let exposeScene = false;
    let scene: SuecaTableScene | null = null;
    let pollId = 0;
    let cancelled = false;

    try {
      const theme = resolvePhaserThemeFromDom();
      scene = new SuecaTableScene(buildHost());
      sceneRef.current = scene;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        backgroundColor: theme.exterior ?? theme.feltDark,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: parent.clientWidth || 640,
          height: parent.clientHeight || 480
        },
        scene: [scene],
        banner: false,
        audio: { noAudio: true }
      });
      gameRef.current = game;
      scene.setTheme(theme);

      // QA helper for Capacitor / CDP (Sueca Phaser mount only).
      exposeScene = true;
      (window as unknown as { __suecaPhaserScene?: SuecaTableScene }).__suecaPhaserScene =
        scene;

      // Secondary readiness poll — covers create() completing without another React render.
      // Primary path: onTableSurfaceReady + model apply both call emitReadyIfPossible.
      let polls = 0;
      const poll = () => {
        if (cancelled) return;
        emitReadyIfPossible();
        polls += 1;
        if (!readyLatchRef.current.hasFired() && polls < 120) {
          pollId = window.requestAnimationFrame(poll);
        }
      };
      pollId = window.requestAnimationFrame(poll);

      themeTimer = window.setInterval(() => {
        const next = resolvePhaserThemeFromDom();
        sceneRef.current?.setTheme(next);
      }, 800);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Phaser renderer failed, falling back to DOM', error);
      }
      onInitErrorRef.current?.(error);
      return;
    }

    return () => {
      cancelled = true;
      if (pollId) window.cancelAnimationFrame(pollId);
      if (themeTimer != null) window.clearInterval(themeTimer);
      if (exposeScene && scene) {
        const w = window as unknown as { __suecaPhaserScene?: SuecaTableScene };
        if (w.__suecaPhaserScene === scene) delete w.__suecaPhaserScene;
      }
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    seatsReadyRef.current = model.seats.length === 4;
    scene.setHost(buildHost());
    scene.applyModel(model);
    // Read current readiness (not only a one-shot edge) — latch is idempotent.
    emitReadyIfPossible();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, selectedCardIndex, isLocalCardPlayable, getTeamName, t.gameBoard.nowPlaying]);

  return (
    <div className="sueca-phaser-root" data-testid="sueca-phaser-table">
      <div ref={containerRef} className="sueca-phaser-canvas-host" />
    </div>
  );
};

export { SUECA_TABLE_SCENE_KEY };
