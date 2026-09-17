import {
  formatSpadesBagsLine,
  formatSpadesTricksBidLine,
  getTeamBags,
  getTeamBid,
  getTeamTricks,
  isBagsNearPenalty,
  resolveSpadesBrokenVisual,
  SPADES_BAG_WARN_FROM
} from './spadesStatusDisplay';
import { SpadesVariantState } from '../models/games/SpadesGame';

function bagsState(overrides: Partial<SpadesVariantState> = {}): SpadesVariantState {
  return {
    playerBids: [null, null, null, null],
    playerBidTypes: ['normal', 'normal', 'normal', 'normal'],
    bidLeaderIndex: 0,
    currentBidderIndex: 0,
    team1Bid: 0,
    team2Bid: 0,
    team1Tricks: 0,
    team2Tricks: 0,
    playerTricks: [0, 0, 0, 0],
    team1Bags: 0,
    team2Bags: 0,
    waitingForBids: false,
    spadesBroken: false,
    nilEnabled: false,
    blindNilEnabled: false,
    ...overrides
  };
}

describe('spadesStatusDisplay', () => {
  it('reads team bags from engine fields (0 / 9 / remainder)', () => {
    expect(getTeamBags(bagsState({ team1Bags: 0, team2Bags: 0 }), 1)).toBe(0);
    expect(getTeamBags(bagsState({ team1Bags: 9, team2Bags: 3 }), 1)).toBe(9);
    expect(getTeamBags(bagsState({ team1Bags: 9, team2Bags: 3 }), 2)).toBe(3);
    expect(getTeamBags(bagsState({ team1Bags: 1, team2Bags: 4 }), 1)).toBe(1);
  });

  it(`warns from ${SPADES_BAG_WARN_FROM} bags without inventing scoring`, () => {
    expect(isBagsNearPenalty(0)).toBe(false);
    expect(isBagsNearPenalty(7)).toBe(false);
    expect(isBagsNearPenalty(8)).toBe(true);
    expect(isBagsNearPenalty(9)).toBe(true);
  });

  it('formats bags line for UI labels', () => {
    expect(formatSpadesBagsLine(0, 'bags')).toBe('0 bags');
    expect(formatSpadesBagsLine(9, 'bags')).toBe('9 bags');
  });

  it('formats compact tricks/bid line', () => {
    expect(formatSpadesTricksBidLine(0, 6)).toBe('0/6');
    expect(formatSpadesTricksBidLine(4, 6)).toBe('4/6');
    expect(formatSpadesTricksBidLine(3, 5)).toBe('3/5');
    expect(formatSpadesTricksBidLine(-1, NaN)).toBe('0/0');
  });

  it('reads team tricks and bids from engine fields', () => {
    const s = bagsState({ team1Tricks: 4, team2Tricks: 3, team1Bid: 6, team2Bid: 5 });
    expect(getTeamTricks(s, 1)).toBe(4);
    expect(getTeamTricks(s, 2)).toBe(3);
    expect(getTeamBid(s, 1)).toBe(6);
    expect(getTeamBid(s, 2)).toBe(5);
  });

  it('maps spadesBroken to closed/broken visual', () => {
    expect(resolveSpadesBrokenVisual(false)).toBe('closed');
    expect(resolveSpadesBrokenVisual(true)).toBe('broken');
  });
});
