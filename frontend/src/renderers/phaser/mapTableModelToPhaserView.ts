/**
 * Pure mapping: TableRenderModel → Phaser view entities (no Phaser runtime).
 * Shared by Sueca / Spades / Hearts / King Phaser tables.
 */

import type { Card } from '../../types/game';
import type { KingBid } from '../../models/games/king/kingContracts';
import { formatAuctionActionShort } from '../../models/games/king/kingAuction';
import type { TableRenderModel } from '../../table/tableRenderModel';
import { shouldShowTeamLabel } from '../../utils/playerSeatHelpers';
import {
  buildPhaserTableLayout,
  layoutLocalHandPositions,
  layoutOpponentBackPositions,
  layoutTrickSlot,
  playerIndexToCompass,
  resolveAspectMode,
  resolveBottomChromePx,
  PhaserCompass,
  PhaserHandSlot,
  PhaserPoint,
  PhaserTableLayout
} from './phaserTableLayout';
import { computeSeatPresentation } from './phaserSeatPresentation';
import {
  computeTableBannerPresentation,
  trumpSymbolForSuit
} from './phaserTableBanner';

export { formatKingTableBanner, trumpSymbolForSuit } from './phaserTableBanner';
export { computeSeatPresentation } from './phaserSeatPresentation';
export { computeTableBannerPresentation } from './phaserTableBanner';

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
  /** Spades bid / King auction or role badge. */
  bidLabel: string | null;
  /** Preformatted single-line chrome (shared across variants). */
  labelText: string;
  /** Single-letter presence mark. */
  monogram: string;
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
  /** Short winner pulse while waiting for continue. */
  isWinner: boolean;
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
  /** When false, hide the large suit glyph (React strip owns status). */
  showTrumpSymbol: boolean;
  /** When true, trump badge uses accent (e.g. Spades/Hearts broken). */
  bannerAccent: boolean;
  waitingForTrickEnd: boolean;
  /** Seat index that won the last completed trick (presentation). */
  lastTrickWinner: number | null;
  interactionEnabled: boolean;
  /** Hearts pass: tap toggles selection; no trick drag/play. */
  passSelectionEnabled: boolean;
  localIsActive: boolean;
  spadesBidPhase: boolean;
  spadesBroken: boolean;
  heartsPassPhase: boolean;
  heartsBroken: boolean;
  kingFestaPhase: boolean;
  kingWaitingForChoice: boolean;
}

export function cardTextureKey(card: Card): string {
  return `face:${card.rank}_${card.suit}`;
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
    // UX-P3.4b: more air between identity chrome and the opponent fan.
    return {
      x: anchor.x,
      y: Math.max(12, anchor.y - layout.opponentCardHeight * 1.12)
    };
  }
  // Side labels sit above the vertical stack so backs don't cover names.
  if (layout.compactSideSeats) {
    const inward = compass === 'west' ? 4 : -4;
    return {
      x: anchor.x + inward,
      y: anchor.y - layout.opponentCardHeight * 0.95
    };
  }
  return {
    x: anchor.x,
    y: anchor.y - layout.opponentCardHeight * 1.05
  };
}

export function mapTableModelToPhaserView(options: {
  model: TableRenderModel;
  width: number;
  height: number;
  selectedCardIndex?: number | null;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  getTeamName?: (team: 1 | 2) => string;
  /** Window/host size for aspect classification (sheet-safe). */
  orientationReference?: { width?: number; height?: number } | null;
}): PhaserTableViewModel {
  const {
    model,
    width,
    height,
    selectedCardIndex = null,
    isLocalCardPlayable,
    getTeamName,
    orientationReference = null
  } = options;
  const local = model.localPlayerIndex;
  const spadesUi = model.variantUi.spades;
  const heartsUi = model.variantUi.hearts;
  const kingUi = model.variantUi.king;
  const spadesBidPhase = model.status.spadesBidActive || model.chrome.spadesBidPhase;
  const heartsPassPhase = model.status.heartsPassActive;
  const kingFestaPhase = model.status.festaSheetActive;
  const aspect = resolveAspectMode(width, height, orientationReference);
  const bottomChromePx = resolveBottomChromePx(height, aspect, {
    sheetActive: heartsPassPhase || spadesBidPhase || kingFestaPhase
  });
  const layout = buildPhaserTableLayout(width, height, {
    bottomChromePx,
    orientationReference
  });
  const kingWaitingForChoice = Boolean(kingUi?.waitingForChoice);
  const spadesBroken = Boolean(spadesUi?.spadesBroken);
  const heartsBroken = Boolean(heartsUi?.heartsBroken);
  const passIndices = model.variantUi.heartsPassIndices ?? [];
  const auctionLocale = model.chrome.auctionLocale;
  const auctionActions = model.variantUi.auctionActions;

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
    !heartsPassPhase &&
    !kingFestaPhase;

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

  const showTeam = shouldShowTeamLabel(model.variant, model.chrome.showTeamLabels);
  const seats: PhaserSeatEntity[] = model.seats.map((seat) => {
    const compass = playerIndexToCompass(seat.index, local);
    const showActiveHighlight =
      seat.isActive &&
      !model.status.isPaused &&
      !model.status.isGameOver &&
      !model.status.waitingForTrickEnd &&
      !heartsPassPhase &&
      !kingFestaPhase &&
      (interactionEnabled || spadesBidPhase);

    let bidLabel: string | null = null;
    if (spadesUi && (spadesBidPhase || !spadesUi.waitingForBids)) {
      // During play, React score strip already shows team bids — keep seat bids
      // only while the auction is live to reduce duplicate chrome.
      if (spadesBidPhase) {
        bidLabel = formatSpadesBidBadge(
          spadesUi.playerBids[seat.index],
          spadesUi.playerBidTypes[seat.index],
          spadesUi.waitingForBids
        );
      }
    } else if (model.chrome.showAuctionBadges && auctionActions) {
      const action = auctionActions[seat.index] as KingBid | 'pass' | undefined;
      if (action) {
        bidLabel = formatAuctionActionShort(action, auctionLocale);
      }
    } else if (
      kingUi &&
      !kingWaitingForChoice &&
      (kingUi.festaMode || kingUi.phase === 'festa_play')
    ) {
      // One role token max — prefer bidder over beneficiary if same seat.
      if (kingUi.bidderIndex === seat.index) bidLabel = 'Lic';
      else if (kingUi.beneficiaryIndex === seat.index) bidLabel = 'Ben';
    }

    const teamLabel = showTeam && getTeamName ? getTeamName(seat.team) : null;
    const presentation = computeSeatPresentation({
      name: seat.name,
      handCount: seat.handCount,
      isLocal: seat.isLocal,
      isDealer: seat.isDealer,
      teamLabel,
      secondaryBadge: bidLabel,
      showActiveHighlight,
      aspect: layout.aspect,
      compactSide: layout.compactSideSeats && (compass === 'west' || compass === 'east'),
      // Top seat: identity only — team already in score strip for Sueca.
      omitTeam: compass === 'north'
    });

    return {
      seatIndex: seat.index,
      compass,
      name: seat.name,
      teamLabel,
      bidLabel,
      labelText: presentation.labelText,
      monogram: presentation.monogram,
      handCount: seat.handCount,
      isLocal: seat.isLocal,
      isActive: seat.isActive,
      isDealer: seat.isDealer,
      showActiveHighlight: presentation.showActiveRing,
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
      orderIndex: entry.orderIndex,
      isWinner:
        model.status.waitingForTrickEnd &&
        model.lastTrickWinner != null &&
        entry.playerIndex === model.lastTrickWinner
    };
  });

  const trumpSuit = model.trumpSuit;
  const trumpSymbol = trumpSymbolForSuit(trumpSuit);
  const banner = computeTableBannerPresentation({
    variant: model.variant,
    trumpSuit,
    heartsPassPhase,
    kingFestaPhase,
    kingUi,
    auctionLocale
  });
  const trumpLabel = banner.label;
  const bannerAccent = banner.accent;

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
    showTrumpSymbol: banner.showSymbol,
    bannerAccent,
    waitingForTrickEnd: model.status.waitingForTrickEnd,
    lastTrickWinner: model.lastTrickWinner,
    interactionEnabled,
    passSelectionEnabled,
    localIsActive,
    spadesBidPhase,
    spadesBroken,
    heartsPassPhase,
    heartsBroken,
    kingFestaPhase,
    kingWaitingForChoice
  };
}
