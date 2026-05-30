import { Player } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';
import { KingBidType } from '../../../models/games/king/kingContracts';
import { minBidToBeat, canUseFourThreeThree } from '../../../models/games/king/kingAuction';

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
 * Call in a loop until it returns false (human decision required).
 *
 * Auction: 35% chance to pass if no bid yet, otherwise min-bid or pass.
 * Negotiation counter: 55% chance to accept if there is a requested bid.
 * Negotiation: AI owner always accepts contract.
 * Fallback: random among four_by_three (30%), nulos (40%), no_trump (30%).
 * Festa setup: AI owner always confirms immediately.
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
    if (Math.random() < 0.35 && !king.bestBid) {
      controller.submitAuctionPass(current);
    } else {
      const min = minBidToBeat(king.bestBid, king.auctionOrder, current);
      if (min) controller.submitAuctionBid(current, min.bidType, min.amount);
      else controller.submitAuctionPass(current);
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
      if (canUseFourThreeThree(king.bestBid) && Math.random() < 0.3) {
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
