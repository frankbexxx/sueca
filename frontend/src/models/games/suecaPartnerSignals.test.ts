/**
 * Hard partner signals must live on Game state, not on the snapshot
 * GameBoard passes into chooseAICard.
 */

import { describe, expect, it } from 'vitest';
import { getPartnerSignal } from '../../ai/games/sueca/SuecaStrategy';
import { Card, GameState, AIDifficulty } from '../../types/game';
import { SuecaGame } from './SuecaGame';

function card(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit, id: `${suit}_${rank}` };
}

function load(adapter: SuecaGame, patch: (state: GameState) => void): GameState {
  const snapshot = adapter.getCurrentState();
  patch(snapshot);
  return adapter.restoreState(snapshot);
}

function adapterWith(difficulty: AIDifficulty): SuecaGame {
  const adapter = new SuecaGame();
  adapter.initialize(['South', 'West', 'North', 'East'], {
    aiDifficulty: difficulty,
    playDirection: 'right'
  });
  return adapter;
}

/** Seat 0 to lead, four trumps — Hard emits `leading_trumps` to seat 2. */
function primeTrumpLead(adapter: SuecaGame, difficulty: AIDifficulty): void {
  load(adapter, (state) => {
    state.aiDifficulty = difficulty;
    state.waitingForRoundStart = false;
    state.waitingForTrickEnd = false;
    state.waitingForRoundEnd = false;
    state.isGameOver = false;
    state.trumpSuit = 'clubs';
    state.trumpCard = card('A', 'clubs');
    state.dealerIndex = 1;
    state.trickLeader = 0;
    state.currentPlayerIndex = 0;
    state.currentTrick = [];
    state.playedCards = [];
    state.partnerSignals = [];
    state.round = 1;
    state.players[0].hand = [
      card('2', 'clubs'),
      card('3', 'clubs'),
      card('4', 'clubs'),
      card('5', 'clubs')
    ];
    state.players[1].hand = [card('6', 'hearts')];
    state.players[2].hand = [card('K', 'diamonds')];
    state.players[3].hand = [card('Q', 'spades')];
  });
}

describe('Sueca Hard partner signals — engine ownership', () => {
  it('keeps a Hard signal on engine state for the next decision to read', () => {
    const adapter = adapterWith('hard');
    primeTrumpLead(adapter, 'hard');

    const snapshot = adapter.getCurrentState();
    expect(snapshot.partnerSignals).toEqual([]);

    const index = adapter.chooseAICard(snapshot, 0);
    expect(snapshot.players[0].hand[index].suit).toBe('clubs');
    // The caller's snapshot is not the store.
    expect(snapshot.partnerSignals).toEqual([]);

    const afterTurn = adapter.getCurrentState();
    expect(afterTurn.partnerSignals).toEqual([
      expect.objectContaining({ playerIndex: 2, signal: 'leading_trumps' })
    ]);
    expect(getPartnerSignal(afterTurn, 2)).toBe('leading_trumps');

    // Next Hard turn: stale snapshot has no signals; engine still does.
    const partnerTurn = adapter.getCurrentState();
    partnerTurn.trickLeader = 0;
    partnerTurn.currentPlayerIndex = 2;
    partnerTurn.currentTrick = [card('4', 'hearts'), card('A', 'hearts')];
    partnerTurn.players[2].hand = [card('5', 'hearts'), card('K', 'hearts')];
    adapter.restoreState(partnerTurn);

    const staleSnapshot = adapter.getCurrentState();
    staleSnapshot.partnerSignals = [];
    const partnerIndex = adapter.chooseAICard(staleSnapshot, 2);
    expect(staleSnapshot.partnerSignals).toEqual([]);

    const afterPartner = adapter.getCurrentState();
    expect(getPartnerSignal(afterPartner, 2)).toBe('leading_trumps');
    expect(afterPartner.partnerSignals.filter((s) => s.signal === 'leading_trumps')).toHaveLength(1);
    expect(afterPartner.players[2].hand[partnerIndex].suit).toBe('hearts');
  });

  it('reads need_help from engine state, not from the passed snapshot', () => {
    const adapter = adapterWith('hard');
    load(adapter, (state) => {
      state.aiDifficulty = 'hard';
      state.waitingForRoundStart = false;
      state.trumpSuit = 'clubs';
      state.trumpCard = card('A', 'clubs');
      state.dealerIndex = 1;
      state.trickLeader = 0;
      state.currentPlayerIndex = 2;
      state.currentTrick = [card('4', 'hearts'), card('A', 'hearts')];
      state.playedCards = [...state.currentTrick];
      state.partnerSignals = [{ playerIndex: 2, signal: 'need_help', trick: 1 }];
      state.players[2].hand = [card('5', 'hearts'), card('K', 'hearts'), card('2', 'clubs')];
      state.players[0].hand = [card('3', 'diamonds')];
      state.players[1].hand = [card('6', 'spades')];
      state.players[3].hand = [card('Q', 'diamonds')];
    });

    const stale = adapter.getCurrentState();
    stale.partnerSignals = [];
    const index = adapter.chooseAICard(stale, 2);
    expect(stale.players[2].hand[index].rank).toBe('K');
    expect(adapter.getCurrentState().partnerSignals).toEqual([
      expect.objectContaining({ playerIndex: 2, signal: 'need_help' })
    ]);
  });

  it.each(['easy', 'medium'] as const)(
    '%s does not write partner signals',
    (difficulty) => {
      const adapter = adapterWith(difficulty);
      primeTrumpLead(adapter, difficulty);
      const snapshot = adapter.getCurrentState();
      const index = adapter.chooseAICard(snapshot, 0);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(adapter.getCurrentState().partnerSignals).toEqual([]);
    }
  );

  it('clears signals at startRound, the next-hand boundary', () => {
    const adapter = adapterWith('hard');
    primeTrumpLead(adapter, 'hard');
    adapter.chooseAICard(adapter.getCurrentState(), 0);
    expect(adapter.getCurrentState().partnerSignals).toHaveLength(1);

    load(adapter, (state) => {
      state.waitingForRoundStart = true;
    });
    adapter.startRound(adapter.getCurrentState());
    expect(adapter.getCurrentState().partnerSignals).toEqual([]);
    expect(adapter.getCurrentState().waitingForRoundStart).toBe(false);
  });

  it('does not append the same signal when the decision is repeated', () => {
    const adapter = adapterWith('hard');
    primeTrumpLead(adapter, 'hard');
    adapter.chooseAICard(adapter.getCurrentState(), 0);
    adapter.chooseAICard(adapter.getCurrentState(), 0);
    const signals = adapter.getCurrentState().partnerSignals;
    expect(signals).toHaveLength(1);
    expect(signals[0]).toEqual(
      expect.objectContaining({ playerIndex: 2, signal: 'leading_trumps' })
    );
  });

  it('still follows suit on Hard', () => {
    const adapter = adapterWith('hard');
    load(adapter, (state) => {
      state.aiDifficulty = 'hard';
      state.waitingForRoundStart = false;
      state.trumpSuit = 'clubs';
      state.trumpCard = card('A', 'clubs');
      state.trickLeader = 1;
      state.currentPlayerIndex = 0;
      state.currentTrick = [card('2', 'hearts')];
      state.playedCards = [card('2', 'hearts')];
      state.partnerSignals = [];
      state.players[0].hand = [card('K', 'spades'), card('5', 'hearts'), card('3', 'hearts')];
    });

    const snapshot = adapter.getCurrentState();
    expect(adapter.canPlayCard(snapshot, 0, 0)).toBe(false);
    const index = adapter.chooseAICard(snapshot, 0);
    expect(snapshot.players[0].hand[index].suit).toBe('hearts');
    expect(adapter.canPlayCard(adapter.getCurrentState(), 0, index)).toBe(true);
  });
});
