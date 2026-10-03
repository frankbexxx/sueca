/**
 * Step 3A — CSS/source contracts for canonical host + HUD placement.
 * Does not mount the full GameBoard (heavy); placement math is covered in
 * runtime/canonicalScenePlacement.test.ts.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const boardCss = readFileSync(join(here, 'GameBoard.css'), 'utf8');
const boardTsx = readFileSync(join(here, 'GameBoard.tsx'), 'utf8');
const phaserTsx = readFileSync(
  join(here, '../renderers/phaser/SuecaPhaserRenderer.tsx'),
  'utf8'
);
const mapTs = readFileSync(
  join(here, '../renderers/phaser/mapTableModelToPhaserView.ts'),
  'utf8'
);
const sceneTs = readFileSync(
  join(here, '../renderers/phaser/SuecaTableScene.ts'),
  'utf8'
);

describe('GameBoard Step 3A canonical scene contracts', () => {
  it('applies canonical HUD + sceneFrame host styles from supported geometry', () => {
    expect(boardTsx).toContain('hudRectShellStyle');
    expect(boardTsx).toContain('sceneFrameHostStyle');
    expect(boardTsx).toContain('game-board--canonical-scene');
    expect(boardTsx).toContain('data-hud-rect="canonical"');
    expect(boardTsx).toContain('data-scene-frame="canonical"');
    expect(boardTsx).toContain('scene-geometry-unsupported');
  });

  it('neutralizes sheet-driven Phaser host sizing under canonical scene', () => {
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene\.game-board--hearts-pass \.sueca-phaser-root/
    );
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene\.game-board--festa-sheet \.sueca-phaser-root/
    );
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene\.game-board--spades-bid \.sueca-phaser-root/
    );
    // Step 3C: Spades dock is placed via decisionSheetRect, not shell bottom pin.
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene\.game-board--spades-bid \.spades-bid-dock/
    );
  });

  it('removes structural safe-area padding duplication on canonical HUD', () => {
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene \.in-game-hud-chrome[\s\S]*padding-top:\s*2px/
    );
  });

  it('allows HUD floating menus to escape the fixed hudRect band', () => {
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene \.in-game-hud-chrome[\s\S]*overflow:\s*visible/
    );
    expect(boardCss).toMatch(
      /\.game-board--canonical-scene \.in-game-hud-chrome__scores[\s\S]*overflow:\s*hidden/
    );
  });

  it('Step 3B wires canonical SceneGeometry into Phaser layout mapping', () => {
    expect(mapTs).toContain('buildCanonicalPhaserLayout');
    expect(mapTs).toContain('sceneGeometry');
    expect(sceneTs).toContain('setSceneGeometry');
    expect(sceneTs).toContain('latestSceneGeometry');
    expect(phaserTsx).toContain('setSceneGeometry');
  });
});

describe('GameBoard Step 4 canonical card actions', () => {
  it('routes Phaser and DOM physical activations through canonicalCardActions', () => {
    expect(boardTsx).toContain('handleDomCardPhysicalActivation');
    expect(boardTsx).toContain('handlePhaserCardPhysicalActivation');
    expect(boardTsx).toContain('canonicalCardActions');
    expect(boardTsx).toContain("buildCardActionContext('dom')");
    expect(boardTsx).toContain("buildCardActionContext('phaser')");
  });
});

describe('GameBoard Accessibility Step 1 semantic hand', () => {
  it('mounts AccessibleLocalHand on Phaser path via DOM/keyboard canonical route', () => {
    expect(boardTsx).toContain('AccessibleLocalHand');
    expect(boardTsx).toContain("from '../a11y/AccessibleLocalHand'");
    expect(boardTsx).toContain('onCardActivate={handleCardClick}');
  });

  it('does not mount AccessibleLocalHand in the visual DOM PlayerHand branch', () => {
    const phaserBranch = boardTsx.slice(
      boardTsx.indexOf('{usePhaserTable ? ('),
      boardTsx.indexOf(') : (', boardTsx.indexOf('{usePhaserTable ? ('))
    );
    const domBranchStart = boardTsx.indexOf(') : (', boardTsx.indexOf('{usePhaserTable ? ('));
    const domBranch = boardTsx.slice(domBranchStart, domBranchStart + 1200);
    expect(phaserBranch).toContain('AccessibleLocalHand');
    expect(domBranch).not.toContain('AccessibleLocalHand');
    expect(domBranch).toContain('PlayerHand');
  });

  it('keeps semantic hand outside SuecaPhaserRenderer props (no geometry coupling)', () => {
    expect(boardTsx).toContain('<AccessibleLocalHand');
    expect(boardTsx).not.toMatch(/SuecaPhaserRenderer[\s\S]{0,400}AccessibleLocalHand/);
  });
});

describe('GameBoard Accessibility Step 2 semantic status', () => {
  it('mounts AccessibleGameStatus on Phaser path from tableModel fields', () => {
    expect(boardTsx).toContain('AccessibleGameStatus');
    expect(boardTsx).toContain("from '../a11y/AccessibleGameStatus'");
    expect(boardTsx).toContain('seats={tableModel.seats}');
    expect(boardTsx).toContain('currentTrick={tableModel.currentTrick}');
    expect(boardTsx).toContain('lastTrickWinner={tableModel.lastTrickWinner}');
  });

  it('does not mount AccessibleGameStatus in the DOM PlayerHand branch', () => {
    const phaserBranch = boardTsx.slice(
      boardTsx.indexOf('{usePhaserTable ? ('),
      boardTsx.indexOf(') : (', boardTsx.indexOf('{usePhaserTable ? ('))
    );
    const domBranchStart = boardTsx.indexOf(') : (', boardTsx.indexOf('{usePhaserTable ? ('));
    const domBranch = boardTsx.slice(domBranchStart, domBranchStart + 1400);
    expect(phaserBranch).toContain('AccessibleGameStatus');
    expect(domBranch).not.toContain('AccessibleGameStatus');
  });
});
