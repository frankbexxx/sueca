/**
 * React host for the Sueca Pixi table POC.
 * Consumes TableRenderModel + TableRendererEvents (C5 boundary).
 */

import React, { useEffect, useRef } from 'react';
import type { Card } from '../../types/game';
import type {
  TableRenderModel,
  TableRendererEvents
} from '../../table/tableRenderModel';
import { SuecaPixiStage } from './SuecaPixiStage';
import './SuecaPixiRenderer.css';

export interface SuecaPixiRendererProps {
  model: TableRenderModel;
  events?: TableRendererEvents;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  selectedCardIndex?: number | null;
}

export const SuecaPixiRenderer: React.FC<SuecaPixiRendererProps> = ({
  model,
  events,
  getCardImage,
  isLocalCardPlayable,
  selectedCardIndex = null
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<SuecaPixiStage | null>(null);
  const readyRef = useRef(false);
  const eventsRef = useRef(events);
  const playableRef = useRef(isLocalCardPlayable);
  const selectedRef = useRef(selectedCardIndex);
  const getCardImageRef = useRef(getCardImage);
  const modelRef = useRef(model);

  eventsRef.current = events;
  playableRef.current = isLocalCardPlayable;
  selectedRef.current = selectedCardIndex;
  getCardImageRef.current = getCardImage;
  modelRef.current = model;

  const buildHost = () => ({
    onLocalCardClick: (cardIndex: number) => {
      eventsRef.current?.onLocalCardClick?.(cardIndex);
    },
    getCardImage: (card: Card) => getCardImageRef.current(card),
    isLocalCardPlayable: (cardIndex: number) =>
      playableRef.current ? playableRef.current(cardIndex) : true,
    getSelectedCardIndex: () => selectedRef.current ?? null
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let cancelled = false;
    const stage = new SuecaPixiStage(buildHost());
    stageRef.current = stage;

    void stage.mount(parent).then(() => {
      if (cancelled) {
        stage.destroy();
        return;
      }
      readyRef.current = true;
      stage.setHost(buildHost());
      stage.applyModel(modelRef.current);
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      stage.destroy();
      stageRef.current = null;
    };
    // Mount once; model sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !readyRef.current) return;
    stage.setHost(buildHost());
    stage.applyModel(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, selectedCardIndex, isLocalCardPlayable]);

  return (
    <div className="sueca-pixi-root" data-testid="sueca-pixi-table">
      <div className="sueca-pixi-badge" aria-hidden>
        POC Pixi
      </div>
      <div ref={containerRef} className="sueca-pixi-canvas-host" />
    </div>
  );
};
