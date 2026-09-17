import { Player } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';
import { KingBidType } from '../../../models/games/king/kingContracts';
import {
  canBeatBid,
  canUseFourThreeThree,
  minBidToBeat
} from '../../../models/games/king/kingAuction';

/**
 * Minimal interface for auction mutations — implemented by KingPtGame.
 * Keeps the strategy decoupled from the concrete class.
 */
export interface KingAuctionController {
  getCurrentAuctionPlayer(king: KingPtVariantState): number | null;
  submitAuctionPass(playerIndex: number): void;
  submitAuctionBid(playerIndex: number, bidType: KingBidType, amount: number): void;
  respondToHigherBid(accept: boolean, bidType?: KingBidType, amount?: number): void;
  respondEightOrNulls(target: number, accept: boolean): void;
  acceptContract(): void;
  chooseFallback(type: string): void;
  confirmFestaSetup(): void;
}

/**
 * Runs a single AI festa step and returns true if the AI acted.
 *
 * Auction is multi-round: AI may bid on later cycles; pass removes them permanently.
 * Only legal improving (or preference-equalizing) bids are submitted.
 */
export function runOneAiFestaStep(
  king: KingPtVariantState,
  players: Player[],
  controller: KingAuctionController
): boolean {
  if (king.festaPhase === 'auction') {
    const current = controller.getCurrentAuctionPlayer(king);
    if (current === null) return false;
    if (players[current]?.type !== 'ai') return false;
    if (!king.activeBidders.includes(current)) return false;

    const standing = king.standingBid ?? king.bestBid;

    if (Math.random() < 0.35 && !standing) {
      controller.submitAuctionPass(current);
      return true;
    }

    const min = minBidToBeat(standing, king.auctionOrder, current);
    if (min && canBeatBid(standing, min, king.auctionOrder)) {
      controller.submitAuctionBid(current, min.bidType, min.amount);
    } else {
      controller.submitAuctionPass(current);
    }
    return true;
  }

  if (king.festaPhase === 'negotiation_counter') {
    const bidder = king.bestBid?.bidderIndex;
    if (bidder === undefined) return false;
    if (players[bidder]?.type !== 'ai') return false;
    if (king.requestedBid && Math.random() < 0.55) {
      controller.respondToHigherBid(true, king.requestedBid.bidType, king.requestedBid.amount);
    } else {
      controller.respondToHigherBid(false);
    }
    return true;
  }

  if (king.festaPhase === 'negotiation') {
    const owner = players[king.festaOwnerIndex];
    if (king.eightOrNullsPending) {
      const target = king.eightOrNullsTarget;
      if (target !== null && players[target]?.type === 'ai') {
        controller.respondEightOrNulls(target, Math.random() < 0.25);
        return true;
      }
      return false;
    }
    if (owner?.type === 'ai') {
      controller.acceptContract();
      return true;
    }
    return false;
  }

  if (king.waitingForFallback) {
    const owner = players[king.festaOwnerIndex];
    if (owner?.type === 'ai') {
      if (canUseFourThreeThree(king.bestBid, king.highestEquivalentValue) && Math.random() < 0.3) {
        controller.chooseFallback('four_by_three');
      } else if (Math.random() < 0.4) {
        controller.chooseFallback('nulos');
      } else {
        controller.chooseFallback('no_trump');
      }
      return true;
    }
    return false;
  }

  if (king.waitingForFestaSetup) {
    const ownerIdx = king.benefitOwnerIndex ?? king.festaOwnerIndex;
    const owner = players[ownerIdx];
    if (owner?.type === 'ai') {
      controller.confirmFestaSetup();
      return true;
    }
    return false;
  }

  return false;
}
