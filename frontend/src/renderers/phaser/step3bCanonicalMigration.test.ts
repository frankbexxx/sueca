/**
 * Step 3B validation — canonical SceneGeometry drives Phaser felt/seats/trick/hand
 * for Sueca / King / Hearts / Spades on portrait + tablet landscape.
 */

import { describe, expect, it } from 'vitest';
import { calculateSceneGeometry } from '../../scene/calculateSceneGeometry';
import { normalizeViewport } from '../../scene/normalizeViewport';
import type { SceneGeometry } from '../../scene/sceneGeometry';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import type { Card, GameState } from '../../types/game';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import { buildCanonicalPhaserLayout } from './buildCanonicalPhaserLayout';
import { mapTableModelToPhaserView } from './mapTableModelToPhaserView';
import { layoutTrickSlot } from './phaserTableLayout';

function geometryAt(width: number, height: number): SceneGeometry {
  const normalized = normalizeViewport({
    width,
    height,
    safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  if (!normalized.ok) throw new Error(normalized.reason);
  const result = calculateSceneGeometry(normalized.input);
  expect(result.supported).toBe(true);
  if (!result.supported) throw new Error(result.reason);
  return result.geometry;
}

function card(suit: Card['suit'], rank: Card['rank'], id: string): Card {
  return { suit, rank, id };
}

function hand13(prefix: string): Card[] {
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
  return ranks.map((rank, i) => card('clubs', rank, `${prefix}-${i}`));
}

function basePlayers(handSize: number) {
  const mk = (id: string, name: string, team: 1 | 2, type: 'human' | 'ai') => ({
    id,
    name,
    hand: Array.from({ length: handSize }, (_, i) =>
      card('clubs', '2', `${id}-${i}`)
    ),
    team,
    type
  });
  return [
    mk('1', 'P1', 1, 'human'),
    mk('2', 'P2', 2, 'ai'),
    mk('3', 'P3', 1, 'ai'),
    mk('4', 'P4', 2, 'ai')
  ];
}

function suecaState(): GameState {
  return {
    players: basePlayers(10),
    currentPlayerIndex: 0,
    dealerIndex: 1,
    trumpSuit: 'spades',
    trumpCard: null,
    currentTrick: [card('clubs', '7', 'c7')],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    completedPentes: [],
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: false,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium',
    partnerSignals: []
  };
}

function heartsState(): GameState {
  const hand = hand13('h');
  return {
    ...suecaState(),
    players: [
      { id: '1', name: 'P1', hand: [...hand], team: 1, type: 'human' },
      { id: '2', name: 'P2', hand: hand13('p2'), team: 2, type: 'ai' },
      { id: '3', name: 'P3', hand: hand13('p3'), team: 1, type: 'ai' },
      { id: '4', name: 'P4', hand: hand13('p4'), team: 2, type: 'ai' }
    ],
    trumpSuit: null,
    currentTrick: [],
    variantState: {
      hearts: {
        heartsBroken: false,
        playerScores: [0, 0, 0, 0],
        roundPoints: [0, 0, 0, 0],
        lastRoundDeltas: [0, 0, 0, 0],
        waitingForPass: false,
        passDirection: 'left',
        humanPassIndices: [],
        passComplete: true
      }
    }
  };
}

function spadesState(): GameState {
  return {
    ...suecaState(),
    trumpSuit: 'spades',
    variantState: {
      spades: {
        bids: [3, 3, 3, 4],
        bags: [0, 0],
        nilFlags: [false, false, false, false],
        blindNilFlags: [false, false, false, false],
        tricksWon: [0, 0, 0, 0],
        spadesBroken: false,
        waitingForBids: false,
        currentBidder: null
      }
    }
  };
}

function kingState(): GameState {
  return {
    ...suecaState(),
    trumpSuit: null,
    variantState: {
      king: {
        phase: 'play',
        contract: null,
        chooserIndex: 0,
        waitingForChoice: false,
        festaSheetActive: false,
        festaSheetChrome: null,
        roundPoints: [0, 0, 0, 0]
      }
    }
  };
}

const portraitShells = [[390, 844]] as const;
const landscapeShells = [
  [1024, 600],
  [1280, 800],
  [1366, 768]
] as const;
const unsupportedLandscape = [
  [844, 390],
  [915, 412],
  [700, 320]
] as const;

const variants = [
  { name: 'sueca', variant: 'sueca' as const, state: suecaState },
  { name: 'king', variant: 'king' as const, state: kingState },
  { name: 'hearts', variant: 'hearts' as const, state: heartsState },
  { name: 'spades', variant: 'spades' as const, state: spadesState }
];

describe('Step 3B canonical Phaser migration', () => {
  it('rejects phone-landscape shells (tablet gate)', () => {
    for (const [w, h] of unsupportedLandscape) {
      const normalized = normalizeViewport({
        width: w,
        height: h,
        safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      expect(normalized.ok).toBe(true);
      if (!normalized.ok) continue;
      const result = calculateSceneGeometry(normalized.input);
      expect(result.supported).toBe(false);
      if (!result.supported) {
        expect(result.reason).toBe('viewport_too_small');
      }
    }
  });

  it.each(variants)(
    '$name: portrait + tablet landscape use canonical zones (no bottomChrome)',
    ({ variant, state }) => {
      for (const [w, h] of [...portraitShells, ...landscapeShells]) {
        const geometry = geometryAt(w, h);
        const gameState = state();
        const boardFlow = resolveGameBoardFlow({ variant, gameState });
        const model = buildTableRenderModel({
          variant,
          gameState,
          localPlayerIndex: 0,
          boardFlow
        });
        const view = mapTableModelToPhaserView({
          model,
          width: geometry.sceneFrame.width,
          height: geometry.sceneFrame.height,
          sceneGeometry: geometry
        });
        const expected = buildCanonicalPhaserLayout(geometry);

        expect(view.layout.bottomChromePx).toBe(0);
        expect(view.layout.zones.felt).toEqual(expected.zones.felt);
        expect(view.layout.zones.trick).toEqual(expected.zones.trick);
        expect(view.layout.zones.hand).toEqual(expected.zones.hand);
        expect(view.layout.center).toEqual(expected.center);
        expect(view.layout.seatAnchor).toEqual(expected.seatAnchor);
        expect(view.layout.cardWidth).toBe(expected.cardWidth);
        expect(view.layout.trickCardWidth).toBe(expected.trickCardWidth);
        expect(view.layout.handY).toBe(expected.handY);

        // Trick cross fits trickRect.
        const halfW = view.layout.trickCardWidth / 2;
        const halfH = view.layout.trickCardHeight / 2;
        for (const compass of ['north', 'east', 'south', 'west'] as const) {
          const p = layoutTrickSlot(compass, view.layout);
          expect(p.x - halfW).toBeGreaterThanOrEqual(geometry.trickRect.x - 1e-6);
          expect(p.x + halfW).toBeLessThanOrEqual(
            geometry.trickRect.x + geometry.trickRect.width + 1e-6
          );
          expect(p.y - halfH).toBeGreaterThanOrEqual(geometry.trickRect.y - 1e-6);
          expect(p.y + halfH).toBeLessThanOrEqual(
            geometry.trickRect.y + geometry.trickRect.height + 1e-6
          );
        }
      }
    }
  );

  it('canonical path ignores orientationReference / sheet chrome dual-write', () => {
    const geometry = geometryAt(1024, 600);
    const gameState = suecaState();
    const boardFlow = resolveGameBoardFlow({ variant: 'sueca', gameState });
    const model = buildTableRenderModel({
      variant: 'sueca',
      gameState,
      localPlayerIndex: 0,
      boardFlow
    });
    const withNoise = mapTableModelToPhaserView({
      model,
      width: geometry.sceneFrame.width,
      height: geometry.sceneFrame.height,
      sceneGeometry: geometry,
      orientationReference: { width: 390, height: 844 }
    });
    const clean = mapTableModelToPhaserView({
      model,
      width: geometry.sceneFrame.width,
      height: geometry.sceneFrame.height,
      sceneGeometry: geometry
    });
    expect(withNoise.layout).toEqual(clean.layout);
    expect(withNoise.layout.bottomChromePx).toBe(0);
  });
});
