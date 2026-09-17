/**
 * H16-OK — deterministic full King PT match smoke (6 negatives + 4 festas).
 * All seats AI-driven; Continuar / festa pacing driven by harness.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KingPtGame, getKingPtState } from '../KingPtGame';
import { createSeededRng, normalizeSeed } from '../../../cardIntelligence/devLab/seededRandom';
import { KING_TOTAL_GAMES } from './kingContracts';

const NAMES = ['AI0', 'AI1', 'AI2', 'AI3'];
const SEED = normalizeSeed('KING-H16-OK-CLOSURE-01');

function forceAllAi(game: KingPtGame): void {
  const internal = game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> };
  if (!internal.state) return;
  internal.state.players.forEach((p) => {
    p.type = 'ai';
  });
}

function sumScores(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0);
}

describe('H16-OK King full match smoke', () => {
  let restoreRandom: (() => void) | undefined;

  beforeEach(() => {
    const rng = createSeededRng(SEED);
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => rng());
    restoreRandom = () => spy.mockRestore();
  });

  afterEach(() => {
    restoreRandom?.();
  });

  it('plays 10 rounds with AI, ends game_over, global sum 0, no stall', () => {
    const game = new KingPtGame();
    game.initialize(NAMES, { aiDifficulty: 'medium', localPlayerIndex: 0, kohPlayerIndex: 0 });
    forceAllAi(game);

    // Finish KOH reveal
    for (let i = 0; i < 8; i++) {
      const k = getKingPtState(game.getCurrentState());
      if (!k.kohReveal || k.kohReveal.step >= k.kohReveal.sequence.length - 1) break;
      game.advanceKohRevealStep();
    }
    game.confirmKohReveal();
    forceAllAi(game);

    const roundLog: Array<{
      gameIndex: number;
      contract: string | null;
      festaMode: string | null;
      deltas: number[];
      scores: number[];
    }> = [];
    let stalls = 0;
    let steps = 0;
    const MAX_STEPS = 25000;

    while (steps++ < MAX_STEPS) {
      const state = game.getCurrentState();
      const king = getKingPtState(state);
      forceAllAi(game);

      if (state.isGameOver || king.phase === 'game_over') {
        break;
      }

      // Early round end offer (negatives) — accept to keep match moving
      if (king.waitingForEarlyEnd) {
        game.acceptEarlyEnd();
        forceAllAi(game);
        continue;
      }

      // Round end → next
      if (state.waitingForRoundEnd) {
        roundLog.push({
          gameIndex: king.gameIndex,
          contract: king.contract,
          festaMode: king.festaMode,
          deltas: [...king.lastRoundDeltas],
          scores: [...king.playerScores]
        });
        game.continueToNextRound(state);
        forceAllAi(game);
        continue;
      }

      // Auction Continuar pacing
      if (king.waitingForAuctionContinue) {
        game.confirmAuctionContinue();
        forceAllAi(game);
        continue;
      }

      // Festa AI (auction one-step / negotiation / fallback / setup)
      if (
        king.phase === 'festa_setup' ||
        (king.festaPhase &&
          ['auction', 'negotiation', 'negotiation_counter', 'fallback', 'auction_result'].includes(
            king.festaPhase
          )) ||
        king.waitingForFallback ||
        king.waitingForFestaSetup
      ) {
        const before = JSON.stringify({
          fase: king.festaPhase,
          waitC: king.waitingForAuctionContinue,
          waitF: king.waitingForFallback,
          waitS: king.waitingForFestaSetup,
          ws: state.waitingForRoundStart
        });
        const acted = game.tickFestaAi();
        forceAllAi(game);
        const afterKing = getKingPtState(game.getCurrentState());
        const after = JSON.stringify({
          fase: afterKing.festaPhase,
          waitC: afterKing.waitingForAuctionContinue,
          waitF: afterKing.waitingForFallback,
          waitS: afterKing.waitingForFestaSetup,
          ws: game.getCurrentState().waitingForRoundStart
        });
        if (!acted && before === after && !afterKing.waitingForAuctionContinue) {
          // Try clearing round-start / setup if stuck waiting for host
          if (game.getCurrentState().waitingForRoundStart && !afterKing.festaPhase) {
            game.startRound(game.getCurrentState());
            forceAllAi(game);
            continue;
          }
          stalls += 1;
          if (stalls > 50) {
            throw new Error(
              `Festa stall at gameIndex=${afterKing.gameIndex} phase=${afterKing.phase} festa=${afterKing.festaPhase}`
            );
          }
        } else {
          stalls = 0;
        }
        continue;
      }

      if (state.waitingForRoundStart) {
        game.startRound(state);
        forceAllAi(game);
        continue;
      }

      if (state.waitingForTrickEnd) {
        game.finishTrick(state);
        forceAllAi(game);
        continue;
      }

      // Play one AI card against engine SoT (not a clone snapshot)
      const sot = (game as unknown as { state: ReturnType<KingPtGame['getCurrentState']> }).state!;
      if (sot.waitingForTrickEnd) {
        game.finishTrick(sot);
        forceAllAi(game);
        continue;
      }
      if (sot.waitingForRoundStart) {
        game.startRound(sot);
        forceAllAi(game);
        continue;
      }
      const pi = sot.currentPlayerIndex;
      const cardIndex = game.chooseAICard(sot, pi);
      let ok = game.playCard(sot, pi, cardIndex);
      if (!ok) {
        const hand = sot.players[pi].hand;
        for (let i = 0; i < hand.length; i++) {
          if (game.canPlayCard(sot, pi, i) && game.playCard(sot, pi, i)) {
            ok = true;
            break;
          }
        }
      }
      if (!ok) {
        stalls += 1;
        if (stalls > 20) {
          const k2 = getKingPtState(sot);
          throw new Error(
            `Play stall player=${pi} gameIndex=${k2.gameIndex} contract=${k2.contract} ` +
              `phase=${k2.phase} festa=${k2.festaPhase} waitStart=${sot.waitingForRoundStart} ` +
              `waitTrick=${sot.waitingForTrickEnd} hand=${sot.players[pi].hand.length} ` +
              `trick=${sot.currentTrick.length} early=${k2.waitingForEarlyEnd}`
          );
        }
      } else {
        stalls = 0;
      }
      forceAllAi(game);
    }

    expect(steps).toBeLessThan(MAX_STEPS);

    const final = game.getCurrentState();
    const finalKing = getKingPtState(final);
    expect(final.isGameOver || finalKing.phase === 'game_over').toBe(true);
    expect(finalKing.gameIndex).toBe(KING_TOTAL_GAMES - 1);
    expect(finalKing.gameHistory.length).toBe(KING_TOTAL_GAMES);
    expect(sumScores(finalKing.playerScores)).toBe(0);

    // 6 negatives + 4 festas in history
    const negatives = finalKing.gameHistory.filter((h) => h.gameIndex < 6);
    const festas = finalKing.gameHistory.filter((h) => h.gameIndex >= 6);
    expect(negatives).toHaveLength(6);
    expect(festas).toHaveLength(4);

    // No infinite festa skip: each festa recorded
    expect(festas.every((f) => f.gameIndex >= 6 && f.gameIndex <= 9)).toBe(true);
    expect(sumScores(finalKing.playerScores)).toBe(0);
  });
});
