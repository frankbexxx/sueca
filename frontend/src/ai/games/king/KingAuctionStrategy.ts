import { AIDifficulty, Player } from '../../../types/game';
import { KingPtVariantState } from '../../../models/games/KingPtGame';
import { KingBidType } from '../../../models/games/king/kingContracts';
import { canUseFourThreeThree } from '../../../models/games/king/kingAuction';
import { decideAiAuctionBid } from './kingAuctionHandEval';

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
 * AI-KING-AUCTION-01: bid ceiling from hand strength (not always escalate to 8).
 */
export function runOneAiFestaStep(
  king: KingPtVariantState,
  players: Player[],
  controller: KingAuctionController,
  difficulty: AIDifficulty = 'medium'
): boolean {
  if (king.festaPhase === 'auction') {
    const current = controller.getCurrentAuctionPlayer(king);
    if (current === null) return false;
    if (players[current]?.type !== 'ai') return false;
    if (!king.activeBidders.includes(current)) return false;

    const standing = king.standingBid ?? king.bestBid ?? null;
    const hand = players[current]?.hand ?? [];
    const decision = decideAiAuctionBid({
      hand,
      standing,
      auctionOrder: king.auctionOrder,
      seat: current,
      difficulty
    });

    if (decision.action === 'pass') {
      controller.submitAuctionPass(current);
    } else {
      controller.submitAuctionBid(current, decision.bidType, decision.amount);
    }
    return true;
  }

  if (king.festaPhase === 'negotiation_counter') {
    const bidder = king.bestBid?.bidderIndex;
    if (bidder === undefined) return false;
    if (players[bidder]?.type !== 'ai') return false;
    // Slightly less eager on easy; still can accept.
    const acceptRate = difficulty === 'easy' ? 0.35 : difficulty === 'hard' ? 0.55 : 0.45;
    if (king.requestedBid && Math.random() < acceptRate) {
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
        const acceptEight =
          difficulty === 'hard' ? Math.random() < 0.2 : Math.random() < 0.12;
        controller.respondEightOrNulls(target, acceptEight);
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
