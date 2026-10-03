/**
 * Step 3C — decision surfaces bind to canonical zones; geometry stays phase-stable.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SceneGeometryProvider } from '../hooks/SceneGeometryContext';
import { calculateSceneGeometry } from '../scene/calculateSceneGeometry';
import { normalizeViewport } from '../scene/normalizeViewport';
import type { SceneGeometry, SceneGeometryResult } from '../scene/sceneGeometry';
import {
  decisionSheetRectShellStyle,
  resolveSuecaRitualCanonicalZone
} from '../runtime/canonicalScenePlacement';
import { HeartsPassModal, HeartsPassReceipt } from './HeartsPassModal';
import { SpadesBidMinibox } from './SpadesBidMinibox';
import { SuecaDealingModal } from './SuecaDealingModal';
import { SuecaPostDealCard } from './SuecaPostDealCard';
import { KingFestaFlowModal } from './KingFestaFlowModal';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import type { GameState } from '../types/game';

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

function supportedResult(width: number, height: number): SceneGeometryResult {
  return { supported: true, geometry: geometryAt(width, height) };
}

function wrap(ui: React.ReactElement, result: SceneGeometryResult) {
  return render(<SceneGeometryProvider value={result}>{ui}</SceneGeometryProvider>);
}

describe('Step 3C decision surface migration', () => {
  it('keeps geometryKey / sceneFrame / felt stable across shells (phase-independent)', () => {
    for (const [w, h] of [
      [390, 844],
      [1024, 600]
    ] as const) {
      const a = geometryAt(w, h);
      const b = geometryAt(w, h);
      expect(a.geometryKey).toBe(b.geometryKey);
      expect(a.sceneFrame).toEqual(b.sceneFrame);
      expect(a.feltRect).toEqual(b.feltRect);
      expect(a.handRect).toEqual(b.handRect);
      expect(a.decisionSheetRect).toEqual(b.decisionSheetRect);
    }
  });

  it('phone landscape remains unsupported; portrait + tablet landscape supported', () => {
    for (const [w, h] of [
      [844, 390],
      [915, 412],
      [700, 320]
    ] as const) {
      const n = normalizeViewport({
        width: w,
        height: h,
        safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      expect(n.ok).toBe(true);
      if (!n.ok) continue;
      const r = calculateSceneGeometry(n.input);
      expect(r.supported).toBe(false);
    }
    expect(geometryAt(390, 844).orientation).toBe('portrait');
    expect(geometryAt(1024, 600).orientation).toBe('landscape');
  });

  it('Hearts pass / receipt use decisionSheetRect', () => {
    const result = supportedResult(390, 844);
    const expected = decisionSheetRectShellStyle(result.geometry);
    const { container, unmount } = wrap(
      <HeartsPassModal
        passDirection="left"
        playerNames={['A', 'B', 'C', 'D']}
        localPlayerIndex={0}
        selectedCount={3}
        onConfirm={() => undefined}
      />,
      result
    );
    const surface = container.querySelector('[data-canonical-zone="decisionSheetRect"]');
    expect(surface).not.toBeNull();
    expect((surface as HTMLElement).style.left).toBe(`${expected.left}px`);
    expect((surface as HTMLElement).style.top).toBe(`${expected.top}px`);
    expect((surface as HTMLElement).style.width).toBe(`${expected.width}px`);
    expect((surface as HTMLElement).style.height).toBe(`${expected.height}px`);
    expect(container.querySelector('[data-testid="hearts-pass-surface"]')).not.toBeNull();
    unmount();

    const receipt = wrap(<HeartsPassReceipt />, result);
    expect(
      receipt.container.querySelector('[data-canonical-zone="decisionSheetRect"]')
    ).not.toBeNull();
  });

  it('Spades bid uses decisionSheetRect', () => {
    const result = supportedResult(1024, 600);
    const expected = decisionSheetRectShellStyle(result.geometry);
    const { container } = wrap(
      <SpadesBidMinibox currentBidderName="Ana" nilEnabled onConfirm={() => undefined} />,
      result
    );
    const surface = container.querySelector('[data-canonical-zone="decisionSheetRect"]');
    expect(surface).not.toBeNull();
    expect((surface as HTMLElement).style.height).toBe(`${expected.height}px`);
    expect(container.querySelector('[data-testid="spades-bid-surface"]')).not.toBeNull();
  });

  it('Sueca distribution / ritual-decision uses decisionSheetRect on design portrait', () => {
    const result = supportedResult(390, 844);
    expect(resolveSuecaRitualCanonicalZone(result.geometry, 'status')).toBe(
      'decisionSheetRect'
    );
    expect(resolveSuecaRitualCanonicalZone(result.geometry, 'decision')).toBe(
      'decisionSheetRect'
    );
    const { container } = wrap(
      <SuecaDealingModal
        playDirection="left"
        dealerIndex={0}
        players={[
          { name: 'P1', type: 'human' },
          { name: 'P2', type: 'ai' },
          { name: 'P3', type: 'ai' },
          { name: 'P4', type: 'ai' }
        ]}
        onConfirm={() => undefined}
        timings={{
          shuffleMs: 60_000,
          cutMs: 60_000,
          dealerDecisionAiMs: 60_000,
          decisionResultMs: 60_000
        }}
      />,
      result
    );
    expect(
      container.querySelector('[data-canonical-zone="decisionSheetRect"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="sueca-ritual-overlay"]')).not.toBeNull();
  });

  it('Sueca post-deal trump uses decisionSheetRect', () => {
    const result = supportedResult(390, 844);
    const { container } = wrap(
      <SuecaPostDealCard
        phase="trump-reveal"
        dealerName="Ana"
        firstPlayerName="Bia"
        physicalDeal="left"
        trumpCard={{ suit: 'hearts', rank: 'A', id: 'hA' }}
      />,
      result
    );
    expect(
      container.querySelector('[data-canonical-zone="decisionSheetRect"]')
    ).not.toBeNull();
  });

  it('King Festa uses decisionSheetRect (no 48dvh structural shell)', () => {
    const result = supportedResult(390, 844);
    const expected = decisionSheetRectShellStyle(result.geometry);
    const game = new KingPtGame();
    const base = game.applyDevFestaFixture(
      ['Ana', 'Bruno', 'Carla', 'Diogo'],
      { festaGameNumber: 7, festaPhase: 'fallback' },
      { localPlayerIndex: 0 }
    ) as GameState;
    const king = { ...getKingPtState(base) };
    king.festaPhase = 'fallback';
    king.waitingForFallback = true;
    king.festaOwnerIndex = 0;
    king.bestBid = { bidderIndex: 1, bidType: 'positive', amount: 6 };
    king.highestEquivalentValue = 6;
    const state: GameState = {
      ...base,
      variantState: { ...base.variantState, kingPt: king }
    };
    const noop = () => undefined;
    const { container } = wrap(
      <KingFestaFlowModal
        gameState={state}
        localPlayerIndex={0}
        onAuctionPass={noop}
        onAuctionBid={noop}
        onAuctionContinue={noop}
        onAcceptContract={noop}
        onRejectContract={noop}
        onRequestHigherBid={noop}
        onRespondHigherBid={noop}
        onEightOrNulls={noop}
        onRespondEight={noop}
        onFallback={noop}
        onSetup={noop}
      />,
      result
    );
    const surface = container.querySelector('[data-canonical-zone="decisionSheetRect"]');
    expect(surface).not.toBeNull();
    expect((surface as HTMLElement).style.height).toBe(`${expected.height}px`);
    expect(container.querySelector('[data-testid="king-festa-sheet"]')).not.toBeNull();
    expect(container.querySelector('.variant-modal-overlay--king-festa')).toBeNull();
  });

  it('menu HUD / Sair overflow contract remains visible on hudRect shell', async () => {
    const { hudRectShellStyle } = await import('../runtime/canonicalScenePlacement');
    const g = geometryAt(390, 844);
    expect(hudRectShellStyle(g).overflow).toBe('visible');
  });
});
