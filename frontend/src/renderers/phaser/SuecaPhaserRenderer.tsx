/**
 * React host for the Sueca Phaser table (E2 production candidate).
 * Consumes TableRenderModel + TableRendererEvents (C5 boundary).
 */

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Card } from '../../types/game';
import type {
  TableRenderModel,
  TableRendererEvents
} from '../../table/tableRenderModel';
import { SuecaTableScene, SUECA_TABLE_SCENE_KEY } from './SuecaTableScene';
import { resolvePhaserThemeFromDom } from './phaserTheme';
import './SuecaPhaserRenderer.css';

export interface SuecaPhaserRendererProps {
  model: TableRenderModel;
  events?: TableRendererEvents;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  selectedCardIndex?: number | null;
}

export const SuecaPhaserRenderer: React.FC<SuecaPhaserRendererProps> = ({
  model,
  events,
  getCardImage,
  getTeamName,
  isLocalCardPlayable,
  selectedCardIndex = null
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SuecaTableScene | null>(null);
  const eventsRef = useRef(events);
  const playableRef = useRef(isLocalCardPlayable);
  const selectedRef = useRef(selectedCardIndex);
  const getCardImageRef = useRef(getCardImage);
  const getTeamNameRef = useRef(getTeamName);

  eventsRef.current = events;
  playableRef.current = isLocalCardPlayable;
  selectedRef.current = selectedCardIndex;
  getCardImageRef.current = getCardImage;
  getTeamNameRef.current = getTeamName;

  const buildHost = () => ({
    onLocalCardClick: (cardIndex: number) => {
      eventsRef.current?.onLocalCardClick?.(cardIndex);
    },
    getCardImage: (card: Card) => getCardImageRef.current(card),
    getTeamName: (team: 1 | 2) => getTeamNameRef.current(team),
    isLocalCardPlayable: (cardIndex: number) =>
      playableRef.current ? playableRef.current(cardIndex) : true,
    getSelectedCardIndex: () => selectedRef.current ?? null
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || gameRef.current) return;

    const theme = resolvePhaserThemeFromDom();
    const scene = new SuecaTableScene(buildHost());
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: theme.feltDark,
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
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __suecaPhaserScene?: SuecaTableScene }).__suecaPhaserScene =
        scene;
    }

    const themeTimer = window.setInterval(() => {
      const next = resolvePhaserThemeFromDom();
      sceneRef.current?.setTheme(next);
    }, 800);

    return () => {
      window.clearInterval(themeTimer);
      if (process.env.NODE_ENV === 'development') {
        const w = window as unknown as { __suecaPhaserScene?: SuecaTableScene };
        if (w.__suecaPhaserScene === scene) delete w.__suecaPhaserScene;
      }
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setHost(buildHost());
    scene.applyModel(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, selectedCardIndex, isLocalCardPlayable, getTeamName]);

  return (
    <div className="sueca-phaser-root" data-testid="sueca-phaser-table">
      <div className="sueca-phaser-badge" aria-hidden>
        Phaser
      </div>
      <div ref={containerRef} className="sueca-phaser-canvas-host" />
    </div>
  );
};

export { SUECA_TABLE_SCENE_KEY };
