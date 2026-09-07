/**
 * Pure mapping: TableRenderModel → Phaser view entities (no Phaser runtime).
 * Shared by Sueca / Spades / Hearts Phaser tables.
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
  PhaserHandSlot,
  PhaserPoint,
  PhaserTableLayout
} from './phaserTableLayout';

export type PhaserCardVisualState = 'legal' | 'illegal' | 'inactive';

export interface PhaserHandCardEntity {
  cardIndex: number;
  card: Card;
  textureKey: string;
  position: PhaserHandSlot;
  selected: boolean;
  playableHint: boolean;
  visualState: PhaserCardVisualState;
  canDrag: boolean;
}

export interface PhaserSeatEntity {
  seatIndex: number;
  compass: PhaserCompass;
  name: string;
  teamLabel: string | null;
  /** Spades bid badge (Nil / Blind / N) or null. */
  bidLabel: string | null;
  handCount: number;
  isLocal: boolean;
  isActive: boolean;
  isDealer: boolean;
  showActiveHighlight: boolean;
  backPositions: PhaserPoint[];
  labelPosition: PhaserPoint;
}

export interface PhaserTrickCardEntity {
  card: Card;
  textureKey: string;
  playerIndex: number;
  compass: PhaserCompass;
  position: PhaserPoint;
  /** Where the card should appear to fly from (seat or hand). */
  origin: PhaserPoint;
  orderIndex: number;
}

export interface PhaserTableViewModel {
  layout: PhaserTableLayout;
  localHand: PhaserHandCardEntity[];
  seats: PhaserSeatEntity[];
  opponents: PhaserSeatEntity[];
  trick: PhaserTrickCardEntity[];
  activeSeat: number | null;
  dealerSeat: number;
  trumpSuit: string | null;
  trumpLabel: string;
  trumpSymbol: string;
  /** When true, trump badge uses accent (e.g. Spades/Hearts broken). */
  bannerAccent: boolean;
  waitingForTrickEnd: boolean;
  interactionEnabled: boolean;
  /** Hearts pass: tap toggles selection; no trick drag/play. */
  passSelectionEnabled: boolean;
  localIsActive: boolean;
  spadesBidPhase: boolean;
  spadesBroken: boolean;
  heartsPassPhase: boolean;
  heartsBroken: boolean;
}

export function cardTextureKey(card: Card): string {
  return `face:${card.rank}_${card.suit}`;
}

export function trumpSymbolForSuit(suit: string | null): string {
  if (suit === 'clubs') return '♣';
  if (suit === 'diamonds') return '♦';
  if (suit === 'hearts') return '♥';
  if (suit === 'spades') return '♠';
  return '—';
}

/** Pure Spades bid badge text for seat chrome. */
export function formatSpadesBidBadge(
  bid: number | null | undefined,
  bidType: string | undefined,
  waitingForBids: boolean
): string | null {
  if (bidType === 'nil') return 'Nil';
  if (bidType === 'blindNil') return 'Blind';
  if (bid == null || bid === undefined) {
    return waitingForBids ? '…' : null;
  }
  return String(bid);
}

function seatLabelPosition(
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint {
  const anchor = layout.seatAnchor[compass];
  if (compass === 'south') {
    return { x: anchor.x, y: anchor.y - layout.cardHeight * 0.55 };
  }
  if (compass === 'north') {
    return { x: anchor.x, y: Math.max(14, anchor.y - 22) };
  }
  return {
    x: anchor.x,
    y: anchor.y - layout.opponentCardHeight * 0.85
  };
}

export function mapTableModelToPhaserView(options: {
  model: TableRenderModel;
  width: number;
  height: number;
  selectedCardIndex?: number | null;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  getTeamName?: (team: 1 | 2) => string;
}): PhaserTableViewModel {
  const {
    model,
    width,
    height,
    selectedCardIndex = null,
    isLocalCardPlayable,
    getTeamName
  } = options;
  const layout = buildPhaserTableLayout(width, height);
  const local = model.localPlayerIndex;
  const spadesUi = model.variantUi.spades;
  const heartsUi = model.variantUi.hearts;
  const spadesBidPhase = model.status.spadesBidActive || model.chrome.spadesBidPhase;
  const heartsPassPhase = model.status.heartsPassActive;
  const spadesBroken = Boolean(spadesUi?.spadesBroken);
  const heartsBroken = Boolean(heartsUi?.heartsBroken);
  const passIndices = model.variantUi.heartsPassIndices ?? [];

  const passSelectionEnabled =
    heartsPassPhase &&
    !model.status.isPaused &&
    !model.status.isGameOver;

  const interactionEnabled =
    !model.status.isPaused &&
    !model.status.isGameOver &&
    !model.status.waitingForTrickEnd &&
    !model.status.waitingForRoundStart &&
    !model.status.waitingForRoundEnd &&
    !model.status.waitingForGameStart &&
    !model.status.waitingForEarlyEnd &&
    !model.chrome.handReadOnly &&
    !spadesBidPhase &&
    !heartsPassPhase;

  const localIsActive =
    interactionEnabled && model.activeSeat === model.localPlayerIndex;

  const handSlots = layoutLocalHandPositions(model.localHand.length, layout);
  const localHand: PhaserHandCardEntity[] = model.localHand.map((card, cardIndex) => {
    const playableHint = isLocalCardPlayable
      ? Boolean(isLocalCardPlayable(cardIndex))
      : true;
    let visualState: PhaserCardVisualState = 'inactive';
    let selected = false;
    if (passSelectionEnabled) {
      visualState = 'legal';
      selected = passIndices.includes(cardIndex);
    } else if (localIsActive) {
      visualState = playableHint ? 'legal' : 'illegal';
      selected = selectedCardIndex === cardIndex;
    } else {
      visualState = 'inactive';
    }
    return {
      cardIndex,
      card,
      textureKey: cardTextureKey(card),
      position: handSlots[cardIndex] ?? {
        x: layout.width / 2,
        y: layout.handY,
        rotationDeg: 0,
        depth: 20
      },
      selected,
      playableHint: passSelectionEnabled ? true : playableHint,
      visualState,
      canDrag: localIsActive && playableHint
    };
  });

  const showTeam = model.chrome.showTeamLabels;
  const seats: PhaserSeatEntity[] = model.seats.map((seat) => {
    const compass = playerIndexToCompass(seat.index, local);
    const showActiveHighlight =
      seat.isActive &&
      !model.status.isPaused &&
      !model.status.isGameOver &&
      !model.status.waitingForTrickEnd &&
      !heartsPassPhase &&
      (interactionEnabled || spadesBidPhase);

    let bidLabel: string | null = null;
    if (spadesUi && (spadesBidPhase || !spadesUi.waitingForBids)) {
      bidLabel = formatSpadesBidBadge(
        spadesUi.playerBids[seat.index],
        spadesUi.playerBidTypes[seat.index],
        spadesUi.waitingForBids
      );
    }

    return {
      seatIndex: seat.index,
      compass,
      name: seat.name,
      teamLabel: showTeam && getTeamName ? getTeamName(seat.team) : null,
      bidLabel,
      handCount: seat.handCount,
      isLocal: seat.isLocal,
      isActive: seat.isActive,
      isDealer: seat.isDealer,
      showActiveHighlight,
      backPositions: seat.isLocal
        ? []
        : layoutOpponentBackPositions(seat.handCount, compass, layout),
      labelPosition: seatLabelPosition(compass, layout)
    };
  });

  const opponents = seats.filter((s) => !s.isLocal);

  const trick: PhaserTrickCardEntity[] = model.currentTrick.map((entry) => {
    const compass = playerIndexToCompass(entry.playerIndex, local);
    const origin =
      entry.playerIndex === local
        ? { x: layout.width / 2, y: layout.handY }
        : { ...layout.seatAnchor[compass] };
    return {
      card: entry.card,
      textureKey: cardTextureKey(entry.card),
      playerIndex: entry.playerIndex,
      compass,
      position: layoutTrickSlot(compass, layout),
      origin,
      orderIndex: entry.orderIndex
    };
  });

  const trumpSuit = model.trumpSuit;
  const trumpSymbol = trumpSymbolForSuit(trumpSuit);
  let trumpLabel: string;
  let bannerAccent = false;
  if (model.variant === 'spades') {
    trumpLabel = spadesBroken ? '♠ Quebradas' : '♠ Fechadas';
    bannerAccent = spadesBroken;
  } else if (model.variant === 'hearts') {
    trumpLabel = heartsBroken ? '♥ Quebradas' : '♥ Fechadas';
    bannerAccent = heartsBroken;
  } else {
    trumpLabel = trumpSuit ? `Trunfo ${trumpSymbol}` : 'Trunfo —';
  }

  return {
    layout,
    localHand,
    seats,
    opponents,
    trick,
    activeSeat: model.activeSeat,
    dealerSeat: model.dealerSeat,
    trumpSuit,
    trumpLabel,
    trumpSymbol,
    bannerAccent,
    waitingForTrickEnd: model.status.waitingForTrickEnd,
    interactionEnabled,
    passSelectionEnabled,
    localIsActive,
    spadesBidPhase,
    spadesBroken,
    heartsPassPhase,
    heartsBroken
  };
}
