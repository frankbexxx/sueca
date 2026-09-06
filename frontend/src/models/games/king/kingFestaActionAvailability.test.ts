import {
  fourByThreeDisabledReason,
  resolveFallbackActionsAvailability,
  resolveKingFestaUiView,
  resolveNegotiationOwnerActionsAvailability,
  setupShowsNegotiationActions,
  KingFestaUiState
} from './kingFestaActionAvailability';
import { KingBid } from './kingContracts';

function baseKing(overrides: Partial<KingFestaUiState> = {}): KingFestaUiState {
  return {
    festaPhase: 'negotiation',
    festaOwnerIndex: 0,
    benefitOwnerIndex: 0,
    auctionOrder: [1, 2, 3],
    auctionTurnIndex: 0,
    bestBid: { bidderIndex: 1, bidType: 'positive', amount: 3 },
    requestedBid: null,
    eightOrNullsPending: false,
    eightOrNullsTarget: null,
    waitingForFallback: false,
    waitingForFestaSetup: false,
    ...overrides
  };
}

const weakBid: KingBid = { bidderIndex: 1, bidType: 'positive', amount: 3 };
const strongBid: KingBid = { bidderIndex: 1, bidType: 'positive', amount: 5 };

describe('kingFestaActionAvailability', () => {
  describe('resolveKingFestaUiView', () => {
    it('negotiation normal → owner sees negotiation actions', () => {
      expect(resolveKingFestaUiView(baseKing(), 0)).toBe('negotiation_owner');
      expect(resolveKingFestaUiView(baseKing(), 2)).toBe('spectator_waiting');
    });

    it('eight-or-nulls pending: owner waits, target responds', () => {
      const pending = baseKing({
        eightOrNullsPending: true,
        eightOrNullsTarget: 1
      });
      expect(resolveKingFestaUiView(pending, 0)).toBe('eight_waiting');
      expect(resolveKingFestaUiView(pending, 1)).toBe('eight_respond');
      expect(resolveKingFestaUiView(pending, 2)).toBe('eight_waiting');
    });

    it('fallback owner view', () => {
      expect(
        resolveKingFestaUiView(
          baseKing({
            festaPhase: 'fallback',
            waitingForFallback: true,
            bestBid: strongBid
          }),
          0
        )
      ).toBe('fallback_owner');
    });

    it('setup owner — no negotiation sheet', () => {
      const setup = baseKing({
        festaPhase: 'setup',
        waitingForFestaSetup: true,
        bestBid: null
      });
      expect(resolveKingFestaUiView(setup, 0)).toBe('setup_owner');
      expect(setupShowsNegotiationActions(resolveKingFestaUiView(setup, 0))).toBe(false);
    });

    it('auction turn vs waiting', () => {
      const auction = baseKing({
        festaPhase: 'auction',
        bestBid: null
      });
      expect(resolveKingFestaUiView(auction, 1)).toBe('auction_turn');
      expect(resolveKingFestaUiView(auction, 0)).toBe('auction_waiting');
    });
  });

  describe('fallback 4×3×3', () => {
    it('enabled when bid is weak / missing', () => {
      const weak = resolveFallbackActionsAvailability(weakBid, 'pt');
      expect(weak.fourByThree.enabled).toBe(true);
      expect(weak.fourByThree.disabledReason).toBeUndefined();
      expect(resolveFallbackActionsAvailability(null, 'pt').fourByThree.enabled).toBe(true);
    });

    it('disabled with reason when bid is not weak', () => {
      const strong = resolveFallbackActionsAvailability(strongBid, 'pt');
      expect(strong.fourByThree.enabled).toBe(false);
      expect(strong.fourByThree.disabledReason).toBe(fourByThreeDisabledReason('pt'));
      expect(strong.trump.enabled).toBe(true);
      expect(strong.nulos.enabled).toBe(true);
    });
  });

  describe('negotiation owner while eight pending', () => {
    it('disables accept/reject/ask/eight', () => {
      const blocked = resolveNegotiationOwnerActionsAvailability(true);
      expect(blocked.accept.enabled).toBe(false);
      expect(blocked.eightOrNulls.enabled).toBe(false);
      expect(blocked.accept.disabledReason).toBeTruthy();

      const open = resolveNegotiationOwnerActionsAvailability(false);
      expect(open.accept.enabled).toBe(true);
      expect(open.eightOrNulls.enabled).toBe(true);
    });
  });
});
