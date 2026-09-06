/**
 * Pure builder: GameState + board flow → TableRenderModel (C5).
 */

import type { GameState, GameVariant } from '../types/game';
import type { GameBoardFlowView } from '../utils/gameFlowOrchestrator';
import { isActiveTurnSeat } from '../utils/playerSeatHelpers';
import type { KingPtVariantState } from '../models/games/KingPtGame';
import type { SpadesVariantState } from '../models/games/SpadesGame';
import type {
  TableRenderModel,
  TableSeatRenderModel,
  TableTrickCardRenderModel
} from './tableRenderModel';

export interface BuildTableRenderModelInput {
  gameState: GameState;
  variant: GameVariant;
  rulesPresetId?: string;
  localPlayerIndex: number;
  usTeam: 1 | 2;
  themTeam: 1 | 2;
  boardFlow: GameBoardFlowView;
  auctionLocale?: 'pt' | 'en';
  /** King PT snapshot when applicable; otherwise null/undefined. */
  kingPt?: KingPtVariantState | null;
  spadesState?: SpadesVariantState | null;
  heartsPassIndices?: number[];
}

export function buildTableRenderModel(input: BuildTableRenderModelInput): TableRenderModel {
  const {
    gameState,
    variant,
    rulesPresetId,
    localPlayerIndex,
    usTeam,
    themTeam,
    boardFlow,
    auctionLocale = 'pt',
    kingPt = null,
    spadesState = null,
    heartsPassIndices
  } = input;

  const {
    heartsPassActive,
    spadesBidActive,
    festaSheetActive,
    flowOverlayActive,
    showTrickContinueCta,
    showTrickContinueChrome,
    kind: flowKind
  } = boardFlow;

  const showTeamLabels = variant === 'sueca' || variant === 'hearts';
  const isTeamTableLayout = variant === 'sueca' || variant === 'spades';
  const showAuctionBadges =
    variant === 'king' &&
    Boolean(kingPt) &&
    kingPt?.festaPhase === 'auction';

  const activeOpts = {
    spadesBidPhase: spadesBidActive,
    currentBidderIndex: spadesState?.currentBidderIndex ?? null,
    suppress: heartsPassActive
  };

  const seats: TableSeatRenderModel[] = gameState.players.map((player, index) => ({
    index,
    name: player.name,
    team: player.team,
    isLocal: index === localPlayerIndex,
    isActive: isActiveTurnSeat(gameState, index, activeOpts),
    isDealer: index === gameState.dealerIndex,
    isTrickLeader: index === gameState.trickLeader,
    handCount: player.hand.length
  }));

  const activeSeat = seats.find((s) => s.isActive)?.index ?? null;

  const currentTrick: TableTrickCardRenderModel[] = (gameState.currentTrick ?? []).map(
    (card, orderIndex) => ({
      card,
      playerIndex: (gameState.trickLeader + orderIndex) % 4,
      orderIndex
    })
  );

  const localPlayer = gameState.players[localPlayerIndex];
  const localHand = localPlayer ? [...localPlayer.hand] : [];

  const boardModifiers = [
    festaSheetActive ? 'game-board--festa-sheet' : '',
    isTeamTableLayout ? 'game-board--team-table' : '',
    heartsPassActive ? 'game-board--hearts-pass' : ''
  ].filter(Boolean);

  return {
    variant,
    rulesPresetId,
    localPlayerIndex,
    usTeam,
    themTeam,
    seats,
    localHand,
    currentTrick,
    activeSeat,
    dealerSeat: gameState.dealerIndex,
    leaderSeat: gameState.trickLeader,
    trumpSuit: gameState.trumpSuit,
    trumpCard: gameState.trumpCard,
    scores: {
      roundPoints: { ...gameState.scores },
      gamePoints: { ...gameState.gameScore },
      round: gameState.round
    },
    status: {
      flowKind,
      isPaused: gameState.isPaused,
      isGameOver: gameState.isGameOver,
      waitingForTrickEnd: gameState.waitingForTrickEnd,
      waitingForRoundStart: gameState.waitingForRoundStart,
      waitingForRoundEnd: gameState.waitingForRoundEnd,
      waitingForGameStart: gameState.waitingForGameStart,
      heartsPassActive,
      spadesBidActive,
      festaSheetActive,
      flowOverlayActive,
      showTrickContinueCta,
      showTrickContinueChrome
    },
    chrome: {
      showTeamLabels,
      isTeamTableLayout,
      compactSeats: heartsPassActive,
      spadesBidPhase: spadesBidActive,
      showAuctionBadges,
      auctionLocale,
      handReadOnly: festaSheetActive && !heartsPassActive,
      boardModifiers
    },
    variantUi: {
      auctionActions: kingPt?.auctionPlayerActions,
      spades: spadesState
        ? {
            currentBidderIndex: spadesState.currentBidderIndex,
            nilEnabled: spadesState.nilEnabled,
            blindNilEnabled: spadesState.blindNilEnabled,
            waitingForBids: spadesState.waitingForBids
          }
        : null,
      heartsPassIndices: heartsPassActive ? heartsPassIndices : undefined
    }
  };
}
