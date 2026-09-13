/**
 * Table render boundary (C5)
 * --------------------------
 * Pure read model + props/events contract between game flows and any table
 * renderer (DOM or Phaser). Not engine state.
 */

import type { Card, GameVariant, Suit } from '../types/game';
import type { GameBoardFlowKind } from '../utils/gameFlowOrchestrator';
import type { KingBid } from '../models/games/king/kingContracts';

/** One seat around the table, relative to engine player indices. */
export interface TableSeatRenderModel {
  index: number;
  name: string;
  team: 1 | 2;
  isLocal: boolean;
  isActive: boolean;
  isDealer: boolean;
  isTrickLeader: boolean;
  handCount: number;
}

/** Card already played into the current trick. */
export interface TableTrickCardRenderModel {
  card: Card;
  playerIndex: number;
  /** Order in the trick (0 = led). */
  orderIndex: number;
}

export interface TableScoreRenderModel {
  roundPoints: { team1: number; team2: number };
  gamePoints: { team1: number; team2: number };
  round: number;
}

/** Presentation chrome flags for the table shell (not rules). */
export interface TableChromeRenderModel {
  showTeamLabels: boolean;
  isTeamTableLayout: boolean;
  compactSeats: boolean;
  spadesBidPhase: boolean;
  showAuctionBadges: boolean;
  auctionLocale: 'pt' | 'en';
  /** Local hand locked during festa (not during hearts pass). */
  handReadOnly: boolean;
  boardModifiers: string[];
}

export interface TableStatusRenderModel {
  flowKind: GameBoardFlowKind;
  isPaused: boolean;
  isGameOver: boolean;
  waitingForTrickEnd: boolean;
  waitingForRoundStart: boolean;
  waitingForRoundEnd: boolean;
  waitingForGameStart: boolean;
  /** Hearts / King early-end offer — React owns the modal. */
  waitingForEarlyEnd: boolean;
  heartsPassActive: boolean;
  spadesBidActive: boolean;
  festaSheetActive: boolean;
  flowOverlayActive: boolean;
  showTrickContinueCta: boolean;
  showTrickContinueChrome: boolean;
}

/**
 * Variant presentation slices still consumed by the current DOM table.
 * Kept explicit so a future renderer can map or ignore them.
 */
export interface TableVariantUiRenderModel {
  auctionActions?: Partial<Record<number, KingBid | 'pass'>>;
  /**
   * Spades presentation slice for table renderers.
   * Bags / race-to-500 stay on React HUD/modals — not duplicated here.
   */
  spades?: {
    currentBidderIndex: number;
    nilEnabled: boolean;
    blindNilEnabled: boolean;
    waitingForBids: boolean;
    spadesBroken: boolean;
    playerBids: (number | null)[];
    playerBidTypes: string[];
    team1Bid: number;
    team2Bid: number;
  } | null;
  /**
   * Hearts presentation slice for table renderers.
   * Pass confirm / early-end / moon / Round End stay on React modals.
   * Pass card indices use heartsPassIndices (selection chrome only).
   */
  hearts?: {
    heartsBroken: boolean;
    waitingForPass: boolean;
    passDirection: string;
    queenSpadesTaken: boolean;
  } | null;
  heartsPassIndices?: number[];
  /**
   * King presentation slice for table renderers.
   * Festa sheets / KOH reveal / score popup / Round End stay on React.
   * Auction seat badges still use auctionActions when showAuctionBadges.
   */
  king?: {
    phase: string;
    gameIndex: number;
    contract: string | null;
    festaMode: string | null;
    festaPhase: string | null;
    festaOwnerIndex: number;
    benefitOwnerIndex: number | null;
    bidderIndex: number | null;
    beneficiaryIndex: number | null;
    noTrump: boolean;
    eightOrNullsPending: boolean;
    waitingForChoice: boolean;
  } | null;
}

/**
 * Stable read model for drawing the table.
 * Built from engine snapshot + shared board flow — never mutated by renderers.
 */
export interface TableRenderModel {
  variant: GameVariant;
  rulesPresetId?: string;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  seats: TableSeatRenderModel[];
  localHand: Card[];
  currentTrick: TableTrickCardRenderModel[];
  /** Engine index of the seat that should show active highlight; null if none. */
  activeSeat: number | null;
  dealerSeat: number;
  leaderSeat: number;
  /** Winner of the completed trick while waiting for continue (presentation). */
  lastTrickWinner: number | null;
  trumpSuit: Suit | null;
  trumpCard: Card | null;
  scores: TableScoreRenderModel;
  status: TableStatusRenderModel;
  chrome: TableChromeRenderModel;
  variantUi: TableVariantUiRenderModel;
}

/**
 * Input events a table renderer may emit.
 * Shell / GameBoard owns side effects; renderers stay dumb.
 */
export interface TableRendererEvents {
  onLocalCardClick?: (cardIndex: number) => void;
  onContinueTrick?: () => void;
}

/**
 * Contract for any table renderer implementation (DOM today, canvas later).
 * Asset/label resolvers stay outside the model (locale / bundler specific).
 */
export interface TableRendererBoundaryProps {
  model: TableRenderModel;
  events?: TableRendererEvents;
  getCardImage: (card: Card) => string;
  getTeamName: (team: 1 | 2) => string;
  /** Shell-supplied playability hints for local hand (not engine methods). */
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  selectedCardIndex?: number | null;
}
