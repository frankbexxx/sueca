import { createTestLogEvent, encodeDecisionState } from './encodeDecisionState';
import { SpadesEncoding } from './types';

describe('spadesEncoder', () => {
  it('includes bid needTricks and bidMet from variantState', () => {
    const event = createTestLogEvent({
      variant: 'spades',
      playerIndex: 0,
      variantFields: { playerBid: 3, teamBid: 5, spadesBroken: true },
      scoreBefore: {
        raw: {
          variantState: {
            spades: {
              playerBids: [3, 4, 2, 3],
              playerTricks: [2, 1, 0, 1],
              team1Bid: 5,
              team2Bid: 6,
              team1Tricks: 3,
              team2Tricks: 2,
              team1Bags: 0,
              team2Bags: 1,
              spadesBroken: true,
            },
          },
        },
      },
    });
    const enc = encodeDecisionState({ event }).variantEncoding as SpadesEncoding;
    expect(enc.playerBid).toBe(3);
    expect(enc.teamBid).toBe(5);
    expect(enc.teamTricks).toBe(3);
    expect(enc.needTricks).toBe(2);
    expect(enc.bidMet).toBe(false);
    expect(enc.spadesBroken).toBe(true);
  });
});
