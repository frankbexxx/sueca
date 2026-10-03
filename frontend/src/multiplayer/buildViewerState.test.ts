import { describe, expect, it } from 'vitest';
import type { Card, GameState } from '../types/game';
import { buildViewerState } from './buildViewerState';
import {
  isMultiplayerViewerState,
  MULTIPLAYER_VIEWER_SCHEMA,
  type AssertViewerNotGameState,
  type MultiplayerViewerState
} from './viewerState';

/** Compile-time: GameState must not be a MultiplayerViewerState. */
const _viewerNotGameState: AssertViewerNotGameState = true;
void _viewerNotGameState;

function card(suit: Card['suit'], rank: Card['rank'], id: string): Card {
  return { suit, rank, id };
}

/**
 * Fixture: each seat holds unique private cards never present in public trick/history.
 * Public trick uses a disjoint set of card ids.
 */
function secureFixtureState(): GameState {
  const publicTrick = [
    card('clubs', '2', 'public-trick-0'),
    card('clubs', '3', 'public-trick-1')
  ];
  const played = [card('diamonds', '2', 'public-played-0')];

  return {
    players: [
      {
        id: 'p0',
        name: 'Host',
        team: 1,
        type: 'human',
        hand: [
          card('hearts', 'A', 'hidden-s0-a'),
          card('hearts', 'K', 'hidden-s0-b')
        ]
      },
      {
        id: 'p1',
        name: 'Guest',
        team: 2,
        type: 'remote',
        hand: [
          card('spades', 'A', 'hidden-s1-a'),
          card('spades', '7', 'hidden-s1-b'),
          card('spades', '5', 'hidden-s1-c')
        ]
      },
      {
        id: 'p2',
        name: 'Bot1',
        team: 1,
        type: 'ai',
        hand: [card('diamonds', 'A', 'hidden-s2-a')]
      },
      {
        id: 'p3',
        name: 'Bot2',
        team: 2,
        type: 'ai',
        hand: [
          card('clubs', 'A', 'hidden-s3-a'),
          card('clubs', 'K', 'hidden-s3-b'),
          card('clubs', '7', 'hidden-s3-c'),
          card('clubs', '5', 'hidden-s3-d')
        ]
      }
    ],
    currentPlayerIndex: 1,
    dealerIndex: 0,
    trumpSuit: 'hearts',
    trumpCard: card('hearts', '2', 'trump-face'),
    currentTrick: publicTrick,
    trickLeader: 0,
    scores: { team1: 40, team2: 20 },
    gameScore: { team1: 1, team2: 0 },
    completedPentes: [{ team1: 120, team2: 80 }],
    round: 2,
    isGameOver: false,
    winner: null,
    lastTrickWinner: 2,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: false,
    playDirection: 'right',
    dealAlignment: 'same',
    schemaVersion: 2,
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: played,
    isPaused: false,
    playerName: 'Host',
    aiDifficulty: 'medium',
    partnerSignals: [{ playerIndex: 0, signal: 'high', trick: 1 }],
    pendingRoundMultiplier: 2,
    variant: 'sueca'
  };
}

/** Collect every card-like object (has suit+rank+id) from a serialized tree. */
function collectCardIds(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (value == null) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectCardIds(item, out);
    return out;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (
      typeof obj.suit === 'string' &&
      typeof obj.rank === 'string' &&
      typeof obj.id === 'string'
    ) {
      out.add(obj.id);
    }
    for (const v of Object.values(obj)) {
      collectCardIds(v, out);
    }
  }
  return out;
}

function hiddenIdsForSeat(state: GameState, seat: number): string[] {
  return state.players[seat].hand.map((c) => c.id);
}

describe('buildViewerState', () => {
  it('A: viewer receives exact own hand identities and handCount', () => {
    const full = secureFixtureState();
    const view = buildViewerState(full, 1);
    expect(view.viewerSeat).toBe(1);
    expect(view.players[1].handCount).toBe(3);
    expect(view.players[1].hand).toEqual([
      card('spades', 'A', 'hidden-s1-a'),
      card('spades', '7', 'hidden-s1-b'),
      card('spades', '5', 'hidden-s1-c')
    ]);
  });

  it('B: opponents expose handCount only — no hand property', () => {
    const full = secureFixtureState();
    const view = buildViewerState(full, 0);
    expect(view.players[1].handCount).toBe(3);
    expect(view.players[2].handCount).toBe(1);
    expect(view.players[3].handCount).toBe(4);
    for (const seat of [1, 2, 3]) {
      expect(view.players[seat]).not.toHaveProperty('hand');
    }
  });

  it('C: each seat view exposes only that viewer held cards', () => {
    const full = secureFixtureState();
    for (const seat of [0, 1, 2, 3] as const) {
      const view = buildViewerState(full, seat);
      expect(view.viewerSeat).toBe(seat);
      expect(view.players[seat].hand?.map((c) => c.id)).toEqual(hiddenIdsForSeat(full, seat));
      for (let other = 0; other < 4; other++) {
        if (other === seat) continue;
        expect(view.players[other]).not.toHaveProperty('hand');
        expect(view.players[other].handCount).toBe(full.players[other].hand.length);
      }
    }
  });

  it('D: public turn/trick/trump/scores/phase fields preserved', () => {
    const full = secureFixtureState();
    const view = buildViewerState(full, 2);
    expect(view.schema).toBe(MULTIPLAYER_VIEWER_SCHEMA);
    expect(view.variant).toBe('sueca');
    expect(view.currentPlayerIndex).toBe(1);
    expect(view.dealerIndex).toBe(0);
    expect(view.trickLeader).toBe(0);
    expect(view.trumpSuit).toBe('hearts');
    expect(view.trumpCard).toEqual(card('hearts', '2', 'trump-face'));
    expect(view.currentTrick).toEqual([
      card('clubs', '2', 'public-trick-0'),
      card('clubs', '3', 'public-trick-1')
    ]);
    expect(view.lastTrickWinner).toBe(2);
    expect(view.scores).toEqual({ team1: 40, team2: 20 });
    expect(view.gameScore).toEqual({ team1: 1, team2: 0 });
    expect(view.round).toBe(2);
    expect(view.waitingForTrickEnd).toBe(false);
    expect(view.waitingForRoundStart).toBe(false);
    expect(view.waitingForRoundEnd).toBe(false);
    expect(view.waitingForGameStart).toBe(false);
    expect(view.isFirstTrick).toBe(false);
    expect(view.isPaused).toBe(false);
    expect(view.playDirection).toBe('right');
    expect(view.dealAlignment).toBe('same');
    expect(view.schemaVersion).toBe(2);
    expect(view.playedCards).toEqual([card('diamonds', '2', 'public-played-0')]);
    expect(view.partnerSignals).toEqual([{ playerIndex: 0, signal: 'high', trick: 1 }]);
    expect(view.pendingRoundMultiplier).toBe(2);
    expect(view.completedPentes).toEqual([{ team1: 120, team2: 80 }]);
  });

  it('E: recursive leak proof — opponent held cards absent from serialized view', () => {
    const full = secureFixtureState();
    const publicIds = new Set([
      'public-trick-0',
      'public-trick-1',
      'public-played-0',
      'trump-face'
    ]);

    for (const seat of [0, 1, 2, 3] as const) {
      const view = buildViewerState(full, seat);
      const json = JSON.stringify(view);
      const ids = collectCardIds(JSON.parse(json));

      const ownHidden = new Set(hiddenIdsForSeat(full, seat));
      for (const id of ownHidden) {
        expect(ids.has(id)).toBe(true);
      }

      for (let other = 0; other < 4; other++) {
        if (other === seat) continue;
        for (const id of hiddenIdsForSeat(full, other)) {
          expect(ids.has(id)).toBe(false);
          expect(json.includes(id)).toBe(false);
        }
      }

      for (const id of publicIds) {
        expect(ids.has(id)).toBe(true);
      }
    }
  });

  it('F: mutating viewer output does not mutate fullState', () => {
    const full = secureFixtureState();
    const originalHand0 = full.players[0].hand.map((c) => ({ ...c }));
    const originalTrick = full.currentTrick.map((c) => ({ ...c }));
    const originalName1 = full.players[1].name;

    const view = buildViewerState(full, 0);
    view.players[0].hand![0].rank = '2';
    view.players[0].hand!.push(card('hearts', '3', 'mutated-extra'));
    view.currentTrick.pop();
    view.currentTrick[0].id = 'mutated-trick';
    view.players[1].name = 'Hacked';
    view.scores.team1 = 999;
    view.playedCards.push(card('hearts', '4', 'mutated-played'));

    expect(full.players[0].hand).toEqual(originalHand0);
    expect(full.currentTrick).toEqual(originalTrick);
    expect(full.players[1].name).toBe(originalName1);
    expect(full.scores.team1).toBe(40);
    expect(full.playedCards).toHaveLength(1);
  });

  it('G: invalid viewerSeat throws project-consistent error', () => {
    const full = secureFixtureState();
    expect(() => buildViewerState(full, -1)).toThrow(/invalid_viewer_seat/);
    expect(() => buildViewerState(full, 4)).toThrow(/invalid_viewer_seat/);
    expect(() => buildViewerState(full, 1.5)).toThrow(/invalid_viewer_seat/);
    expect(() => buildViewerState(full, Number.NaN)).toThrow(/invalid_viewer_seat/);
  });

  it('rejects non-sueca variant', () => {
    const full = { ...secureFixtureState(), variant: 'hearts' as const };
    expect(() => buildViewerState(full, 0)).toThrow(/invalid_viewer_variant/);
  });

  it('type boundary: viewer DTO is not GameState-shaped', () => {
    const view = buildViewerState(secureFixtureState(), 1);
    expect(isMultiplayerViewerState(view)).toBe(true);

    // GameState always has aiDifficulty + hand on every player.
    expect(view).not.toHaveProperty('aiDifficulty');
    expect(view).not.toHaveProperty('playerName');
    for (const seat of [0, 2, 3]) {
      expect(view.players[seat]).not.toHaveProperty('hand');
    }

    // A GameState-shaped object fails the viewer guard.
    const asGameShaped = {
      ...view,
      aiDifficulty: 'medium',
      players: view.players.map((p, i) => ({
        ...p,
        hand: i === 1 ? p.hand : []
      }))
    };
    expect(isMultiplayerViewerState(asGameShaped)).toBe(false);
  });

  it('allow-list: host-only / private fields are not copied', () => {
    const full = secureFixtureState() as GameState & {
      secretHostScratch?: { plan: string };
    };
    full.secretHostScratch = { plan: 'peek-hands' };
    // Attach a decoy private field that must never appear via allow-list builder.
    (full as { localPlayerIndex?: number }).localPlayerIndex = 0;
    (full as { sessionId?: string }).sessionId = 'ROOM1';
    (full as { isMultiplayer?: boolean }).isMultiplayer = true;

    const view = buildViewerState(full, 0) as MultiplayerViewerState & Record<string, unknown>;
    expect(view).not.toHaveProperty('secretHostScratch');
    expect(view).not.toHaveProperty('localPlayerIndex');
    expect(view).not.toHaveProperty('sessionId');
    expect(view).not.toHaveProperty('isMultiplayer');
    expect(view).not.toHaveProperty('aiDifficulty');
    expect(view).not.toHaveProperty('playerName');
    expect(JSON.stringify(view)).not.toContain('peek-hands');
  });
});
