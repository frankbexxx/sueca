import { deriveMoonThreatLevel, countHeartsByPlayer } from '../encoder/heartsMoonThreat';
import { C } from '../fixtures/cards';
import {
  deriveOpponentSpadesPressure,
  highestRankInHand,
  isOpponentHighBidThreat,
} from './tierBHelpers';
import { encodeDecisionState } from '../encoder/encodeDecisionState';
import { buildFixtureEvent } from '../fixtures';

describe('tierBHelpers', () => {
  it('highestRankInHand picks strongest rank', () => {
    expect(highestRankInHand([C.c2, C.cA, C.c5]).rank).toBe('A');
  });

  it('deriveMoonThreatLevel returns none for sparse history', () => {
    const history = [
      {
        roundIndex: 0,
        trickIndex: 0,
        turnIndex: 0,
        playerIndex: 1,
        card: C.h3,
      },
    ];
    expect(deriveMoonThreatLevel(true, history)).toBe('none');
  });

  it('countHeartsByPlayer accumulates hearts and Q♠ points', () => {
    const stats = countHeartsByPlayer([
      {
        roundIndex: 0,
        trickIndex: 0,
        turnIndex: 0,
        playerIndex: 2,
        card: C.h4,
      },
      {
        roundIndex: 0,
        trickIndex: 1,
        turnIndex: 0,
        playerIndex: 2,
        card: C.sQ,
      },
    ]);
    expect(stats.get(2)).toEqual({ heartsCount: 1, points: 14 });
  });

  it('isOpponentHighBidThreat respects Q2 rule', () => {
    expect(
      isOpponentHighBidThreat({
        myTeamBid: 6,
        opponentTeamBid: 8,
        opponentTeamTricks: 6,
        opponentNeedTricks: 2,
      })
    ).toBe(true);
    expect(
      isOpponentHighBidThreat({
        myTeamBid: 6,
        opponentTeamBid: 5,
        opponentTeamTricks: 4,
        opponentNeedTricks: 1,
      })
    ).toBe(false);
  });

  it('deriveOpponentSpadesPressure reads snapshot raw', () => {
    const event = buildFixtureEvent({
      variant: 'spades',
      playerIndex: 0,
      turnIndex: 0,
      handBefore: [C.sA],
      legalMoves: [C.sA],
      chosenCard: C.sA,
      trickBefore: [],
      trickAfter: [C.sA],
      variantFields: { playerBid: 4, teamBid: 6, spadesBroken: true },
      scoreBefore: {
        raw: {
          variantState: {
            spades: {
              team1Bid: 6,
              team2Bid: 8,
              team1Tricks: 5,
              team2Tricks: 6,
            },
          },
        },
      },
    });
    const encoded = encodeDecisionState({ event });
    const pressure = deriveOpponentSpadesPressure({
      state: encoded,
      chosenCard: event.chosenCard,
      legalMoves: event.legalMoves,
      metricContext: encoded.metricContext,
      evaluatorMode: 'strict',
    });
    expect(pressure?.opponentNeedTricks).toBe(2);
  });
});
