/**
 * Pure mapping: TableRenderModel → Phaser view entities (no Phaser runtime).
 */

import type { Card } from '../../types/game';
import type { TableRenderModel } from '../../table/tableRenderModel';
import {
  buildPhaserTableLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass,
  PhaserCompass,
  PhaserPoint,
  PhaserTableLayout
} from './phaserTableLayout';

export interface PhaserHandCardEntity {
  cardIndex: number;
  card: Card;
  textureKey: string;
  position: PhaserPoint;
  selected: boolean;
  playableHint: boolean;
}

export interface PhaserOpponentEntity {
  seatIndex: number;
  compass: PhaserCompass;
  name: string;
  isActive: boolean;
  isDealer: boolean;
  backPositions: PhaserPoint[];
}

export interface PhaserTrickCardEntity {
  card: Card;
  textureKey: string;
  playerIndex: number;
  compass: PhaserCompass;
  position: PhaserPoint;
  orderIndex: number;
}

export interface PhaserTableViewModel {
  layout: PhaserTableLayout;
  localHand: PhaserHandCardEntity[];
  opponents: PhaserOpponentEntity[];
  trick: PhaserTrickCardEntity[];
  activeSeat: number | null;
  dealerSeat: number;
  trumpSuit: string | null;
  trumpLabel: string;
  waitingForTrickEnd: boolean;
  interactionEnabled: boolean;
}

export function cardTextureKey(card: Card): string {
  return `face:${card.rank}_${card.suit}`;
}

export function mapTableModelToPhaserView(options: {
  model: TableRenderModel;
  width: number;
  height: number;
  selectedCardIndex?: number | null;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
}): PhaserTableViewModel {
  const { model, width, height, selectedCardIndex = null, isLocalCardPlayable } =
    options;
  const layout = buildPhaserTableLayout(width, height);
  const local = model.localPlayerIndex;

  const handPositions = layoutLocalHandPositions(model.localHand.length, layout);
  const localHand: PhaserHandCardEntity[] = model.localHand.map((card, cardIndex) => ({
    cardIndex,
    card,
    textureKey: cardTextureKey(card),
    position: handPositions[cardIndex] ?? { x: layout.width / 2, y: layout.handY },
    selected: selectedCardIndex === cardIndex,
    playableHint: isLocalCardPlayable ? Boolean(isLocalCardPlayable(cardIndex)) : true
  }));

  const opponents: PhaserOpponentEntity[] = model.seats
    .filter((seat) => !seat.isLocal)
    .map((seat) => {
      const compass = playerIndexToCompass(seat.index, local);
      return {
        seatIndex: seat.index,
        compass,
        name: seat.name,
        isActive: seat.isActive,
        isDealer: seat.isDealer,
        backPositions: layoutOpponentBackPositions(seat.handCount, compass, layout)
      };
    });

  const trick: PhaserTrickCardEntity[] = model.currentTrick.map((entry) => {
    const compass = playerIndexToCompass(entry.playerIndex, local);
    return {
      card: entry.card,
      textureKey: cardTextureKey(entry.card),
      playerIndex: entry.playerIndex,
      compass,
      position: layoutTrickSlot(compass, layout),
      orderIndex: entry.orderIndex
    };
  });

  const trumpSuit = model.trumpSuit;
  const trumpLabel = trumpSuit
    ? `Trunfo: ${trumpSuit === 'clubs' ? '♣' : trumpSuit === 'diamonds' ? '♦' : trumpSuit === 'hearts' ? '♥' : '♠'}`
    : 'Trunfo: —';

  const interactionEnabled =
    !model.status.isPaused &&
    !model.status.isGameOver &&
    !model.status.waitingForTrickEnd &&
    !model.status.waitingForRoundStart &&
    !model.status.waitingForRoundEnd &&
    !model.status.waitingForGameStart &&
    !model.chrome.handReadOnly;

  return {
    layout,
    localHand,
    opponents,
    trick,
    activeSeat: model.activeSeat,
    dealerSeat: model.dealerSeat,
    trumpSuit,
    trumpLabel,
    waitingForTrickEnd: model.status.waitingForTrickEnd,
    interactionEnabled
  };
}
