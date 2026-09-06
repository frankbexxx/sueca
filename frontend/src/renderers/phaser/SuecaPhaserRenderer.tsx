/**
 * React host for the Sueca Phaser table POC.
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

  eventsRef.current = events;
  playableRef.current = isLocalCardPlayable;
  selectedRef.current = selectedCardIndex;
  getCardImageRef.current = getCardImage;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || gameRef.current) return;

    const host = {
      onLocalCardClick: (cardIndex: number) => {
        eventsRef.current?.onLocalCardClick?.(cardIndex);
      },
      getCardImage: (card: Card) => getCardImageRef.current(card),
      isLocalCardPlayable: (cardIndex: number) =>
        playableRef.current ? playableRef.current(cardIndex) : true,
      getSelectedCardIndex: () => selectedRef.current ?? null
    };

    const scene = new SuecaTableScene(host);
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: '#1b5e3b',
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

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setHost({
      onLocalCardClick: (cardIndex: number) => {
        eventsRef.current?.onLocalCardClick?.(cardIndex);
      },
      getCardImage: (card: Card) => getCardImageRef.current(card),
      isLocalCardPlayable: (cardIndex: number) =>
        playableRef.current ? playableRef.current(cardIndex) : true,
      getSelectedCardIndex: () => selectedRef.current ?? null
    });
    scene.applyModel(model);
  }, [model, selectedCardIndex, isLocalCardPlayable]);

  return (
    <div className="sueca-phaser-root" data-testid="sueca-phaser-table">
      <div className="sueca-phaser-badge" aria-hidden>
        POC Phaser
      </div>
      <div ref={containerRef} className="sueca-phaser-canvas-host" />
    </div>
  );
};

export { SUECA_TABLE_SCENE_KEY };
