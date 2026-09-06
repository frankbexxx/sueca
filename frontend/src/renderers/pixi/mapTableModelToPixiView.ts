/**
 * Pure mapping: TableRenderModel → Pixi view entities (no Pixi runtime).
 */

import type { Card } from '../../types/game';
import type { TableRenderModel } from '../../table/tableRenderModel';
import {
  buildPixiTableLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass,
  PixiCompass,
  PixiPoint,
  PixiTableLayout
} from './pixiTableLayout';

export interface PixiHandCardEntity {
  cardIndex: number;
  card: Card;
  textureKey: string;
  position: PixiPoint;
  selected: boolean;
  playableHint: boolean;
}

export interface PixiOpponentEntity {
  seatIndex: number;
  compass: PixiCompass;
  name: string;
  isActive: boolean;
  isDealer: boolean;
  backPositions: PixiPoint[];
}

export interface PixiTrickCardEntity {
  card: Card;
  textureKey: string;
  playerIndex: number;
  compass: PixiCompass;
  position: PixiPoint;
  orderIndex: number;
}

export interface PixiTableViewModel {
  layout: PixiTableLayout;
  localHand: PixiHandCardEntity[];
  opponents: PixiOpponentEntity[];
  trick: PixiTrickCardEntity[];
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

export function mapTableModelToPixiView(options: {
  model: TableRenderModel;
  width: number;
  height: number;
  selectedCardIndex?: number | null;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
}): PixiTableViewModel {
  const { model, width, height, selectedCardIndex = null, isLocalCardPlayable } =
    options;
  const layout = buildPixiTableLayout(width, height);
  const local = model.localPlayerIndex;

  const handPositions = layoutLocalHandPositions(model.localHand.length, layout);
  const localHand: PixiHandCardEntity[] = model.localHand.map((card, cardIndex) => ({
    cardIndex,
    card,
    textureKey: cardTextureKey(card),
    position: handPositions[cardIndex] ?? { x: layout.width / 2, y: layout.handY },
    selected: selectedCardIndex === cardIndex,
    playableHint: isLocalCardPlayable ? Boolean(isLocalCardPlayable(cardIndex)) : true
  }));

  const opponents: PixiOpponentEntity[] = model.seats
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

  const trick: PixiTrickCardEntity[] = model.currentTrick.map((entry) => {
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
