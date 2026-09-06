/**
 * Maps TableRenderModel → props shaped for the current React/DOM table widgets.
 * Keeps DOM components unchanged while establishing the C5 boundary.
 */

import type { GameState } from '../types/game';
import type { SpadesVariantState } from '../models/games/SpadesGame';
import type { TableRenderModel } from './tableRenderModel';

export interface DomTableSurfacePropsFromModel {
  gameState: GameState;
  variant: TableRenderModel['variant'];
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showTeamLabels: boolean;
  showAuctionBadges: boolean;
  auctionActions: TableRenderModel['variantUi']['auctionActions'];
  auctionLocale: 'pt' | 'en';
  compactSeats: boolean;
  spadesBidPhase: boolean;
  spadesState: SpadesVariantState | undefined;
}

export interface DomLocalDockPropsFromModel {
  gameState: GameState;
  variant: TableRenderModel['variant'];
  localPlayerIndex: number;
  usTeam: 1 | 2;
  showTeamLabels: boolean;
  compactSeats: boolean;
  spadesBidPhase: boolean;
  spadesState: SpadesVariantState | undefined;
  showAuctionBadges: boolean;
  auctionActions: TableRenderModel['variantUi']['auctionActions'];
  auctionLocale: 'pt' | 'en';
}

export interface DomPlayerHandPropsFromModel {
  readOnly: boolean;
  selectedPassIndices: number[] | undefined;
}

/**
 * @param spadesStateFull Full Spades variant state for DOM widgets that need
 * more than the slim variantUi slice (bags, broken, etc. live elsewhere).
 */
export function mapTableModelToDomSurfaceProps(
  model: TableRenderModel,
  gameState: GameState,
  spadesStateFull?: SpadesVariantState | null
): DomTableSurfacePropsFromModel {
  return {
    gameState,
    variant: model.variant,
    localPlayerIndex: model.localPlayerIndex,
    usTeam: model.usTeam,
    showTeamLabels: model.chrome.showTeamLabels,
    showAuctionBadges: model.chrome.showAuctionBadges,
    auctionActions: model.variantUi.auctionActions,
    auctionLocale: model.chrome.auctionLocale,
    compactSeats: model.chrome.compactSeats,
    spadesBidPhase: model.chrome.spadesBidPhase,
    spadesState: spadesStateFull ?? undefined
  };
}

export function mapTableModelToDomDockProps(
  model: TableRenderModel,
  gameState: GameState,
  spadesStateFull?: SpadesVariantState | null
): DomLocalDockPropsFromModel {
  return {
    gameState,
    variant: model.variant,
    localPlayerIndex: model.localPlayerIndex,
    usTeam: model.usTeam,
    showTeamLabels: model.chrome.showTeamLabels,
    compactSeats: model.chrome.compactSeats,
    spadesBidPhase: model.chrome.spadesBidPhase,
    spadesState: spadesStateFull ?? undefined,
    showAuctionBadges: model.chrome.showAuctionBadges,
    auctionActions: model.variantUi.auctionActions,
    auctionLocale: model.chrome.auctionLocale
  };
}

export function mapTableModelToDomHandProps(
  model: TableRenderModel
): DomPlayerHandPropsFromModel {
  return {
    readOnly: model.chrome.handReadOnly,
    selectedPassIndices: model.variantUi.heartsPassIndices
  };
}
