/**
 * REL-KING-01 fix-pass evidence dump → frontend/.tmp/
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KingPtGame, getKingPtState } from '../KingPtGame';
import {
  decideAiAuctionBid,
  estimateNullBidCeiling,
  estimatePositiveBidCeiling
} from '../../../ai/games/king/kingAuctionHandEval';
import { auctionBidderOrder } from './kingAuction';
import { shouldAutoExitAfterGameOver } from '../../../utils/gameOverExitTimer';
import { resolveKingNegativeHudScore } from './kingHudScoreDisplay';
import type { Card, Rank, Suit } from '../../../types/game';

const outDir = join(process.cwd(), '.tmp');
mkdirSync(outDir, { recursive: true });

const c = (rank: Rank, suit: Suit, id: string): Card => ({ rank, suit, id });

describe('REL-KING-01 fix smoke evidence', () => {
  it('writes live-score + auction diversity + final policy to .tmp', () => {
    const game = new KingPtGame();
    game.initialize(['A', 'B', 'C', 'D'], { localPlayerIndex: 0, kohPlayerIndex: 0 });
    game.confirmKohReveal();
    const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
    const state = internal.state;
    const king = getKingPtState(state);
    king.gameIndex = 6;
    king.festaMode = 'positive';
    king.festaPhase = null;
    king.phase = 'festa_play';
    king.waitingForFestaSetup = false;
    king.activeContract = {
      bidType: 'positive',
      amount: 5,
      bidderIndex: 1,
      beneficiaryIndex: 0
    };
    king.tricksWonThisGame = [0, 0, 0, 0];
    king.roundStartScores = [100, 200, 300, 400];
    king.playerScores = [100, 200, 300, 400];
    king.lastRoundDeltas = [0, 0, 0, 0];
    state.waitingForTrickEnd = true;
    state.nextTrickLeader = 2;
    state.currentTrick = [
      { id: '1', rank: '2', suit: 'clubs' },
      { id: '2', rank: '3', suit: 'clubs' },
      { id: '3', rank: '4', suit: 'clubs' },
      { id: '4', rank: '5', suit: 'clubs' }
    ];
    state.players.forEach((p) => {
      p.hand = [{ id: `${p.id}-x`, rank: 'A', suit: 'spades' }];
    });
    state.variantState = { ...state.variantState, kingPt: king };
    game.finishTrick(state);
    const after = getKingPtState(game.getCurrentState());
    const hud = resolveKingNegativeHudScore({
      gameIndex: after.gameIndex,
      phase: after.phase,
      lastRoundDeltas: after.lastRoundDeltas,
      playerScores: after.playerScores,
      roundStartScores: after.roundStartScores,
      playerIndex: 0
    });
    expect(after.lastRoundDeltas).toEqual([125, -125, 25, 0]);
    expect(hud.roundDelta).toBe(125);
    expect(hud.totalScore).toBe(100);

    const order = auctionBidderOrder(0);
    const fixtures: Record<string, Card[]> = {
      weak: [
        c('2', 'clubs', '1'),
        c('3', 'clubs', '2'),
        c('4', 'diamonds', '3'),
        c('5', 'diamonds', '4'),
        c('6', 'hearts', '5'),
        c('8', 'hearts', '6'),
        c('9', 'spades', '7'),
        c('10', 'spades', '8'),
        c('Q', 'clubs', '9'),
        c('Q', 'diamonds', '10'),
        c('2', 'hearts', '11'),
        c('3', 'spades', '12'),
        c('4', 'spades', '13')
      ],
      medium: [
        c('A', 'spades', '1'),
        c('7', 'spades', '2'),
        c('K', 'spades', '3'),
        c('J', 'spades', '4'),
        c('6', 'spades', '5'),
        c('5', 'spades', '6'),
        c('A', 'hearts', '7'),
        c('3', 'hearts', '8'),
        c('2', 'clubs', '9'),
        c('4', 'clubs', '10'),
        c('Q', 'diamonds', '11'),
        c('8', 'diamonds', '12'),
        c('9', 'diamonds', '13')
      ],
      exceptional: [
        c('A', 'hearts', '1'),
        c('7', 'hearts', '2'),
        c('K', 'hearts', '3'),
        c('J', 'hearts', '4'),
        c('Q', 'hearts', '5'),
        c('6', 'hearts', '6'),
        c('5', 'hearts', '7'),
        c('A', 'spades', '8'),
        c('7', 'spades', '9'),
        c('K', 'clubs', '10'),
        c('A', 'diamonds', '11'),
        c('7', 'diamonds', '12'),
        c('J', 'clubs', '13')
      ],
      nulos: [
        c('2', 'clubs', '1'),
        c('3', 'clubs', '2'),
        c('4', 'clubs', '3'),
        c('5', 'clubs', '4'),
        c('6', 'clubs', '5'),
        c('8', 'clubs', '6'),
        c('9', 'clubs', '7'),
        c('2', 'diamonds', '8'),
        c('3', 'diamonds', '9'),
        c('4', 'diamonds', '10'),
        c('2', 'hearts', '11'),
        c('3', 'hearts', '12'),
        c('4', 'hearts', '13')
      ]
    };

    const auction = Object.entries(fixtures).map(([name, hand]) => {
      const difficulty = name === 'exceptional' ? ('hard' as const) : ('medium' as const);
      return {
        name,
        posCeil: estimatePositiveBidCeiling(hand, difficulty),
        nullCeil: estimateNullBidCeiling(hand, difficulty),
        open: decideAiAuctionBid({
          hand,
          standing: null,
          auctionOrder: order,
          seat: 1,
          difficulty
        })
      };
    });

    expect(auction.find((a) => a.name === 'weak')?.open).toEqual({ action: 'pass' });
    expect(auction.find((a) => a.name === 'nulos')?.open).toMatchObject({
      action: 'bid',
      bidType: 'null'
    });
    expect(shouldAutoExitAfterGameOver('king')).toBe(false);

    writeFileSync(
      join(outDir, 'rel-king-01-fix-smoke.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          liveScore: {
            deltas: after.lastRoundDeltas,
            hudPrimary: hud.roundDelta,
            hudTotal: hud.totalScore
          },
          auction,
          finalScreen: { kingAutoExit: false },
          ok: true
        },
        null,
        2
      )
    );
  });
});
