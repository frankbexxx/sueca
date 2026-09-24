/**
 * Sueca / Spades Phaser table scene — visual consumer of TableRenderModel only.
 * No engine imports.
 */

import Phaser from 'phaser';
import type { Card } from '../../types/game';
import type { TableRenderModel } from '../../table/tableRenderModel';
import { getCardBackPath, getPublicAssetPath } from '../../constants/cardAssets';
import { DEFAULT_CARD_BACK_ID } from '../../constants/cardDeckRegistry';
import {
  mapTableModelToPhaserView,
  PhaserHandCardEntity,
  PhaserTableViewModel
} from './mapTableModelToPhaserView';
import {
  getHandCardVisualPresentation
} from './phaserHandVisual';
import { resolveHandHitAreaMode } from './phaserHandInput';
import {
  DEFAULT_THEME,
  PhaserThemeView,
  resolvePhaserThemeFromDom,
  themesEqual
} from './phaserTheme';
import {
  isStaleGeneration,
  nextSyncGeneration,
  PLAY_CLICK_LOCK_MS
} from './phaserSyncGuards';
import { resolveOrientationReference } from './phaserPremiumLayout';
import { pointInDropZone } from './phaserTableLayout';
import { PREMIUM_TABLE, premiumTrickDepth } from './phaserPremiumLayout';

export const SUECA_TABLE_SCENE_KEY = 'SuecaTableScene';

export type SuecaPhaserCardUrlResolver = (card: Card) => string;

export interface SuecaTableSceneHost {
  onLocalCardClick?: (cardIndex: number) => void;
  getCardImage: SuecaPhaserCardUrlResolver;
  getTeamName?: (team: 1 | 2) => string;
  /** Localized active-turn cue (GLOBAL-UI-03). */
  getActiveTurnLabel?: () => string;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  getSelectedCardIndex?: () => number | null;
}

export class SuecaTableScene extends Phaser.Scene {
  private host: SuecaTableSceneHost;
  private latestModel: TableRenderModel | null = null;
  private view: PhaserTableViewModel | null = null;
  private theme: PhaserThemeView = { ...DEFAULT_THEME };
  private handSprites = new Map<string, Phaser.GameObjects.Image>();
  private trickSprites = new Map<string, Phaser.GameObjects.Image>();
  private opponentBacks: Phaser.GameObjects.GameObject[] = [];
  private opponentCountBadges: Phaser.GameObjects.GameObject[] = [];
  private seatLabels = new Map<number, Phaser.GameObjects.Text>();
  private seatTurnCues = new Map<number, Phaser.GameObjects.Text>();
  private seatTurnDots = new Map<number, Phaser.GameObjects.Graphics>();
  private seatMonograms = new Map<number, Phaser.GameObjects.Text>();
  private seatPanels = new Map<number, Phaser.GameObjects.Graphics>();
  private seatRings = new Map<number, Phaser.GameObjects.Ellipse>();
  private trumpText: Phaser.GameObjects.Text | null = null;
  private lastActiveSeat: number | null = null;
  /** True after premium surface graphics exist (replaces flat felt rect). */
  private tableReady = false;
  private exteriorGfx: Phaser.GameObjects.Graphics | null = null;
  private feltGfx: Phaser.GameObjects.Graphics | null = null;
  private vignetteGfx: Phaser.GameObjects.Graphics | null = null;
  private winnerRings = new Map<string, Phaser.GameObjects.Ellipse>();
  private cardShadows: Phaser.GameObjects.Ellipse[] = [];
  private handShadows: Phaser.GameObjects.Ellipse[] = [];
  private handEdges: Phaser.GameObjects.Rectangle[] = [];
  private trickExtras: Phaser.GameObjects.GameObject[] = [];
  private animatingClear = false;
  private backKey = 'card-back';
  /** Public texture key for QA — stable key; URL swaps with theme back. */
  static readonly CARD_BACK_TEXTURE_KEY = 'card-back';
  /** Currently loaded back id (avoids stale / duplicate textures). */
  private loadedBackId: string | null = null;
  private syncGeneration = 0;
  private clickLockUntil = 0;
  private dragCardId: string | null = null;
  private dragStart: { x: number; y: number } | null = null;
  private pointerMoveBound = false;

  constructor(host: SuecaTableSceneHost) {
    super(SUECA_TABLE_SCENE_KEY);
    this.host = host;
  }

  setHost(host: SuecaTableSceneHost): void {
    this.host = host;
  }

  setTheme(theme: PhaserThemeView): void {
    if (themesEqual(this.theme, theme)) return;
    this.theme = theme;
    // SuecaPhaserRenderer may call setTheme before Scene.create() boots cameras.
    if (this.cameras?.main) {
      this.cameras.main.setBackgroundColor(theme.exterior);
    }
    if (this.tableReady) {
      this.drawTableSurface(true);
      if (this.trumpText) this.trumpText.setColor(theme.text);
      this.ensureCardBackTexture(theme.cardBackId, theme.cardBackPath, () => {
        if (this.latestModel) this.syncFromModel(true);
      });
    }
  }

  applyModel(model: TableRenderModel): void {
    this.latestModel = model;
    if (!this.tableReady) return;
    this.syncFromModel(false);
  }

  preload(): void {
    const backId = this.theme.cardBackId || DEFAULT_CARD_BACK_ID;
    const backPath = this.theme.cardBackPath || getCardBackPath(backId);
    const backUrl = getPublicAssetPath(backPath);
    if (!this.textures.exists(this.backKey)) {
      this.load.image(this.backKey, backUrl);
      this.loadedBackId = backId;
    }
  }

  create(): void {
    this.theme = resolvePhaserThemeFromDom();
    this.cameras.main.setBackgroundColor(this.theme.exterior);
    this.exteriorGfx = this.add.graphics().setDepth(PREMIUM_TABLE.depthTable);
    this.feltGfx = this.add.graphics().setDepth(PREMIUM_TABLE.depthTable + 1);
    this.vignetteGfx = this.add.graphics().setDepth(PREMIUM_TABLE.depthTable + 2);
    this.drawTableSurface(false);
    this.tableReady = true;

    this.trumpText = this.add
      .text(12, 10, '', {
        fontFamily: PREMIUM_TABLE.fontFamily,
        fontSize: '13px',
        fontStyle: 'bold',
        color: this.theme.text
      })
      .setDepth(PREMIUM_TABLE.depthHud)
      .setVisible(false);

    this.scale.on('resize', this.handleResize, this);
    this.ensureCardBackTexture(this.theme.cardBackId, this.theme.cardBackPath, () => {
      if (this.latestModel) this.syncFromModel(true);
    });
  }

  /**
   * Swap opponent / face-down back texture when theme backId changes.
   * Keeps a stable texture key; removes + reloads source to avoid stale cache.
   */
  private ensureCardBackTexture(
    backId: string,
    backPath: string,
    onReady?: () => void
  ): void {
    const id = backId || DEFAULT_CARD_BACK_ID;
    const path = backPath || getCardBackPath(id);
    if (this.loadedBackId === id && this.textures.exists(this.backKey)) {
      onReady?.();
      return;
    }
    const url = getPublicAssetPath(path);
    if (this.textures.exists(this.backKey)) {
      this.textures.remove(this.backKey);
    }
    this.load.image(this.backKey, url);
    const finish = () => {
      this.load.off(Phaser.Loader.Events.COMPLETE, finish);
      this.loadedBackId = id;
      onReady?.();
    };
    this.load.once(Phaser.Loader.Events.COMPLETE, finish);
    if (!this.load.isLoading()) this.load.start();
  }

  private drawTableSurface(_force: boolean): void {
    if (!this.exteriorGfx || !this.feltGfx || !this.vignetteGfx) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const layout = this.view?.layout;
    const margin = layout?.tableMargin ?? PREMIUM_TABLE.tableMarginPortrait;
    const radius = layout?.tableRadius ?? PREMIUM_TABLE.tableRadiusPortrait;
    const feltX = layout?.zones.felt.x ?? margin;
    const feltY = layout?.zones.felt.y ?? margin;
    const feltW = layout?.zones.felt.width ?? Math.max(120, width - margin * 2);
    const feltH = layout?.zones.felt.height ?? Math.max(160, height - margin * 2);

    this.exteriorGfx.clear();
    this.feltGfx.clear();
    this.vignetteGfx.clear();

    // Exterior mate gradient (two stacked fills).
    this.exteriorGfx.fillStyle(this.theme.exterior, 1);
    this.exteriorGfx.fillRect(0, 0, width, height);
    this.exteriorGfx.fillStyle(PREMIUM_TABLE.exteriorTop, 0.35);
    this.exteriorGfx.fillRect(0, 0, width, height * 0.45);

    // Rounded felt with edge + soft center wash.
    const r = Math.min(radius, Math.floor(Math.min(feltW, feltH) / 4));
    this.feltGfx.fillStyle(this.theme.feltEdge, 1);
    this.feltGfx.fillRoundedRect(feltX, feltY, feltW, feltH, r);
    const inset = 3;
    this.feltGfx.fillStyle(this.theme.felt, 1);
    this.feltGfx.fillRoundedRect(
      feltX + inset,
      feltY + inset,
      feltW - inset * 2,
      feltH - inset * 2,
      Math.max(8, r - 4)
    );
    this.feltGfx.fillStyle(this.theme.feltCenter, 0.28);
    this.feltGfx.fillEllipse(
      feltX + feltW / 2,
      feltY + feltH * 0.42,
      feltW * 0.72,
      feltH * 0.55
    );

    // Inner highlight (top edge) — brass under 5% visual weight.
    this.feltGfx.lineStyle(1.25, this.theme.brass, 0.22);
    this.feltGfx.strokeRoundedRect(
      feltX + 5,
      feltY + 5,
      feltW - 10,
      feltH - 10,
      Math.max(6, r - 6)
    );

    // Soft vignette (edges only).
    this.vignetteGfx.fillStyle(PREMIUM_TABLE.shadow, 0.22);
    this.vignetteGfx.fillRect(feltX, feltY, feltW, 10);
    this.vignetteGfx.fillRect(feltX, feltY + feltH - 14, feltW, 14);
    this.vignetteGfx.fillRect(feltX, feltY, 10, feltH);
    this.vignetteGfx.fillRect(feltX + feltW - 10, feltY, 10, feltH);
  }

  private handleResize = (_gameSize: Phaser.Structs.Size): void => {
    this.drawTableSurface(true);
    if (this.latestModel) this.syncFromModel(true);
  };

  private syncFromModel(forceLayout: boolean): void {
    if (!this.latestModel) return;
    const selected = this.host.getSelectedCardIndex?.() ?? null;
    const nextView = mapTableModelToPhaserView({
      model: this.latestModel,
      width: this.scale.width,
      height: this.scale.height,
      selectedCardIndex: selected,
      isLocalCardPlayable: this.host.isLocalCardPlayable,
      getTeamName: this.host.getTeamName,
      activeTurnLabel: this.host.getActiveTurnLabel?.() ?? null,
      orientationReference: resolveOrientationReference(
        this.scale.width,
        this.scale.height
      )
    });

    const prevTrickIds = new Set((this.view?.trick ?? []).map((t) => t.card.id));
    const nextTrickIds = new Set(nextView.trick.map((t) => t.card.id));
    const trickCleared = prevTrickIds.size > 0 && nextTrickIds.size === 0;
    const addedTrick = nextView.trick.filter((t) => !prevTrickIds.has(t.card.id));
    const gen = nextSyncGeneration(this.syncGeneration);
    this.syncGeneration = gen;
    const animateIds = forceLayout ? [] : addedTrick.map((t) => t.card.id);

    if (forceLayout || this.dragCardId) {
      this.cancelDrag(true);
      this.tweens.killAll();
    }

    this.view = nextView;
    this.drawTableSurface(true);
    // Special-state banner only (festa / contract) — no trump glyph on felt.
    if (this.trumpText) {
      this.trumpText.setText(nextView.trumpLabel);
      this.trumpText.setVisible(Boolean(nextView.trumpLabel));
    }

    this.ensureTextures(nextView, () => {
      if (isStaleGeneration(gen, this.syncGeneration) || !this.view) return;
      const view = this.view;
      this.redrawOpponents(view);
      this.redrawSeatChrome(view);
      this.redrawHand(view, forceLayout);
      if (trickCleared && !forceLayout) {
        this.animateTrickClear(gen, () => {
          if (isStaleGeneration(gen, this.syncGeneration) || !this.view) return;
          this.redrawTrick(this.view, true, []);
        });
      } else {
        this.redrawTrick(view, forceLayout, animateIds);
      }
    });
  }

  private ensureTextures(view: PhaserTableViewModel, done: () => void): void {
    const missing: Array<{ key: string; url: string }> = [];
    const consider = (key: string, card: Card) => {
      if (!this.textures.exists(key)) {
        missing.push({ key, url: this.host.getCardImage(card) });
      }
    };
    view.localHand.forEach((c) => consider(c.textureKey, c.card));
    view.trick.forEach((c) => consider(c.textureKey, c.card));

    if (missing.length === 0) {
      done();
      return;
    }

    missing.forEach(({ key, url }) => {
      if (!this.textures.exists(key)) this.load.image(key, url);
    });

    const onComplete = () => {
      this.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
      done();
    };
    this.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    if (!this.load.isLoading()) this.load.start();
  }

  private redrawOpponents(view: PhaserTableViewModel): void {
    this.opponentBacks.forEach((s) => s.destroy());
    this.opponentBacks = [];
    this.opponentCountBadges.forEach((s) => s.destroy());
    this.opponentCountBadges = [];
    this.cardShadows.forEach((s) => s.destroy());
    this.cardShadows = [];
    const { opponentCardWidth, opponentCardHeight } = view.layout;
    const hasBack = this.textures.exists(this.backKey);
    const edgePad = PREMIUM_TABLE.opponentEdgePad;
    view.opponents.forEach((opp) => {
      const isSide = opp.compass === 'west' || opp.compass === 'east';
      opp.backPositions.forEach((pos, index) => {
        const shadow = this.add
          .ellipse(
            pos.x + 1.5,
            pos.y + Math.max(4, opponentCardHeight * 0.1),
            opponentCardWidth * 0.92,
            opponentCardHeight * 0.26,
            PREMIUM_TABLE.shadow,
            PREMIUM_TABLE.opponentShadowAlpha
          )
          .setDepth(PREMIUM_TABLE.depthOpponentCards - 1);
        this.cardShadows.push(shadow);
        if (hasBack) {
          // Dark hairline mat under the back (GLOBAL-CARDS-style separation).
          const mat = this.add
            .rectangle(
              pos.x,
              pos.y,
              opponentCardWidth + edgePad * 2,
              opponentCardHeight + edgePad * 2,
              PREMIUM_TABLE.handEdge,
              PREMIUM_TABLE.opponentEdgeMatAlpha
            )
            .setDepth(PREMIUM_TABLE.depthOpponentCards - 0.25);
          if (isSide) mat.setAngle(90);
          this.opponentBacks.push(mat);

          const img = this.add
            .image(pos.x, pos.y, this.backKey)
            .setDisplaySize(opponentCardWidth, opponentCardHeight)
            .setDepth(PREMIUM_TABLE.depthOpponentCards);
          if (isSide) img.setAngle(90);
          this.opponentBacks.push(img);
          // Soft ivory edge on top of the mat for Premium Classic read.
          const edge = this.add
            .rectangle(pos.x, pos.y, opponentCardWidth + 1, opponentCardHeight + 1)
            .setStrokeStyle(
              PREMIUM_TABLE.opponentIvoryStroke,
              PREMIUM_TABLE.ivory,
              PREMIUM_TABLE.opponentIvoryAlpha
            )
            .setFillStyle(0x000000, 0)
            .setDepth(PREMIUM_TABLE.depthOpponentCards + 0.5);
          if (isSide) edge.setAngle(90);
          this.opponentBacks.push(edge);

          // UX-CARDS-01B: dark seam on vertical stacks (break Casino-red merge).
          // After 90° rot, fan axis = card width; across = card height.
          if (isSide && index > 0) {
            const seam = this.add
              .rectangle(
                pos.x,
                pos.y - opponentCardWidth / 2,
                opponentCardHeight * 0.94,
                1.5,
                PREMIUM_TABLE.handEdge,
                PREMIUM_TABLE.opponentSideOverlapAlpha
              )
              .setDepth(PREMIUM_TABLE.depthOpponentCards + 0.75);
            this.opponentBacks.push(seam);
          }
        } else {
          const rect = this.add
            .rectangle(
              pos.x,
              pos.y,
              opponentCardWidth,
              opponentCardHeight,
              0x12203a
            )
            .setStrokeStyle(1.25, this.theme.brass, 0.45)
            .setDepth(PREMIUM_TABLE.depthOpponentCards);
          this.opponentBacks.push(rect);
        }
      });

      // UX-CARDS-01: remaining-card count (not seat number); hide at 0.
      if (opp.countBadgePosition && opp.handCount > 0) {
        this.drawOpponentCountBadge(opp.countBadgePosition, opp.handCount);
      }
    });
  }

  /** KOH-inspired mini chip: compact dark pill, low visual weight. */
  private drawOpponentCountBadge(pos: { x: number; y: number }, count: number): void {
    const label = this.add
      .text(pos.x, pos.y, String(count), {
        fontFamily: PREMIUM_TABLE.fontFamily,
        fontSize: `${PREMIUM_TABLE.opponentCountFontPx}px`,
        color: '#ffffff',
        fontStyle: '600'
      })
      .setOrigin(0.5)
      .setDepth(PREMIUM_TABLE.depthOpponentCards + 2);
    const tw = label.width + PREMIUM_TABLE.opponentCountPadX * 2;
    const th = Math.max(
      PREMIUM_TABLE.opponentCountFontPx + PREMIUM_TABLE.opponentCountPadY * 2,
      label.height + PREMIUM_TABLE.opponentCountPadY * 2
    );
    const bg = this.add
      .graphics()
      .setDepth(PREMIUM_TABLE.depthOpponentCards + 1.5);
    bg.fillStyle(0x000000, PREMIUM_TABLE.opponentCountBgAlpha);
    bg.fillRoundedRect(
      pos.x - tw / 2,
      pos.y - th / 2,
      tw,
      th,
      PREMIUM_TABLE.opponentCountRadius
    );
    this.opponentCountBadges.push(bg, label);
  }

  private redrawSeatChrome(view: PhaserTableViewModel): void {
    const keep = new Set<number>();
    let activeSeatIndex: number | null = null;
    const turnColor = this.theme.activeHex;
    const turnColorCss = this.theme.active;
    view.seats.forEach((seat) => {
      keep.add(seat.seatIndex);
      const text = seat.labelText;
      const compactSide =
        view.layout.compactSideSeats &&
        (seat.compass === 'west' || seat.compass === 'east');
      const fontSize =
        view.layout.aspect === 'landscape'
          ? '11px'
          : compactSide
            ? '11px'
            : '12px';
      const cueText = seat.turnCueLabel;
      const showCue = Boolean(cueText);

      let label = this.seatLabels.get(seat.seatIndex);
      if (!label) {
        label = this.add
          .text(0, 0, text, {
            fontFamily: PREMIUM_TABLE.fontFamily,
            fontSize,
            color: this.theme.text,
            padding: { x: 0, y: 0 }
          })
          .setOrigin(0.5, 0.5)
          .setDepth(PREMIUM_TABLE.depthSeats + 2);
        this.seatLabels.set(seat.seatIndex, label);
      } else {
        label.setText(text);
        label.setFontSize(fontSize);
        label.setFontFamily(PREMIUM_TABLE.fontFamily);
        label.setOrigin(0.5, 0.5);
      }
      label.setColor(this.theme.text);
      label.setBackgroundColor('rgba(0,0,0,0)');

      let cueLabel = this.seatTurnCues.get(seat.seatIndex);
      if (showCue) {
        if (!cueLabel) {
          cueLabel = this.add
            .text(0, 0, cueText!, {
              fontFamily: PREMIUM_TABLE.fontFamily,
              fontSize: compactSide ? '9px' : '10px',
              color: turnColorCss,
              fontStyle: '600'
            })
            .setOrigin(0, 0.5)
            .setDepth(PREMIUM_TABLE.depthSeats + 2);
          this.seatTurnCues.set(seat.seatIndex, cueLabel);
        } else {
          cueLabel.setText(cueText!);
          cueLabel.setFontSize(compactSide ? '9px' : '10px');
          cueLabel.setColor(turnColorCss);
          cueLabel.setVisible(true);
        }
      } else if (cueLabel) {
        cueLabel.setVisible(false);
      }

      let cueDot = this.seatTurnDots.get(seat.seatIndex);
      if (showCue) {
        if (!cueDot) {
          cueDot = this.add.graphics().setDepth(PREMIUM_TABLE.depthSeats + 2);
          this.seatTurnDots.set(seat.seatIndex, cueDot);
        }
        cueDot.clear();
        cueDot.fillStyle(turnColor, 1);
        cueDot.setVisible(true);
      } else if (cueDot) {
        cueDot.clear();
        cueDot.setVisible(false);
      }

      // Seat-number monograms removed (annotated screenshots) — hide any leftovers.
      const mono = this.seatMonograms.get(seat.seatIndex);
      if (mono) mono.setVisible(false);

      const padX = compactSide ? 7 : 9;
      const padY = compactSide ? 4 : 5;
      const cueGap = 3;
      const cueRowH = showCue ? (compactSide ? 11 : 12) : 0;
      const nameW = label.width;
      const cueW = showCue && cueLabel ? 6 + 4 + cueLabel.width : 0;
      const contentW = Math.max(nameW, cueW);
      const pw = contentW + padX * 2;
      const ph = Math.max(22, label.height + (showCue ? cueGap + cueRowH : 0) + padY * 2);
      const px = seat.labelPosition.x - pw / 2;
      const py = seat.labelPosition.y - ph / 2;
      const radius = 8;
      const active = seat.showActiveHighlight;
      if (active) activeSeatIndex = seat.seatIndex;

      const nameY = showCue
        ? py + padY + label.height / 2
        : seat.labelPosition.y;
      label.setPosition(seat.labelPosition.x, nameY);

      if (showCue && cueLabel && cueDot) {
        const cueY = py + ph - padY - cueRowH / 2;
        const rowStartX = seat.labelPosition.x - cueW / 2;
        cueDot.clear();
        cueDot.fillStyle(turnColor, 1);
        cueDot.fillCircle(rowStartX + 3, cueY, 3);
        cueLabel.setPosition(rowStartX + 6 + 4, cueY);
      }

      let panel = this.seatPanels.get(seat.seatIndex);
      if (!panel) {
        panel = this.add.graphics().setDepth(PREMIUM_TABLE.depthSeats);
        this.seatPanels.set(seat.seatIndex, panel);
      }
      panel.clear();
      panel.fillStyle(PREMIUM_TABLE.shadow, 0.18);
      panel.fillRoundedRect(px + 1, py + 1.5, pw, ph, radius);
      if (active) {
        panel.fillStyle(turnColor, 0.1);
        panel.fillRoundedRect(px, py, pw, ph, radius);
      }
      panel.fillStyle(this.theme.seatPanel, active ? 0.82 : 0.68);
      panel.fillRoundedRect(px, py, pw, ph, radius);
      panel.lineStyle(
        active ? 1.5 : 1,
        active ? turnColor : this.theme.brass,
        active ? 0.9 : seat.isDealer ? 0.38 : 0.2
      );
      panel.strokeRoundedRect(px, py, pw, ph, radius);

      const legacy = this.seatRings.get(seat.seatIndex);
      if (legacy) {
        legacy.destroy();
        this.seatRings.delete(seat.seatIndex);
      }
    });

    if (
      activeSeatIndex != null &&
      activeSeatIndex !== this.lastActiveSeat &&
      this.seatPanels.has(activeSeatIndex)
    ) {
      const panel = this.seatPanels.get(activeSeatIndex)!;
      panel.setAlpha(0.7);
      this.tweens.add({
        targets: panel,
        alpha: 1,
        duration: 150,
        ease: 'Sine.easeOut'
      });
    }
    this.lastActiveSeat = activeSeatIndex;

    Array.from(this.seatLabels.keys()).forEach((idx) => {
      if (!keep.has(idx)) {
        this.seatLabels.get(idx)?.destroy();
        this.seatLabels.delete(idx);
        this.seatTurnCues.get(idx)?.destroy();
        this.seatTurnCues.delete(idx);
        this.seatTurnDots.get(idx)?.destroy();
        this.seatTurnDots.delete(idx);
        this.seatMonograms.get(idx)?.destroy();
        this.seatMonograms.delete(idx);
        this.seatPanels.get(idx)?.destroy();
        this.seatPanels.delete(idx);
        this.seatRings.get(idx)?.destroy();
        this.seatRings.delete(idx);
      }
    });
  }

  private bindHandInteraction(sprite: Phaser.GameObjects.Image, cardId: string): void {
    sprite.removeAllListeners('pointerdown');
    sprite.removeAllListeners('pointerover');
    sprite.removeAllListeners('pointerout');
    const displaySize = (scale: number) => {
      const presence = PREMIUM_TABLE.handPresenceScale;
      const cw = this.view?.layout.cardWidth ?? sprite.displayWidth;
      const ch = this.view?.layout.cardHeight ?? sprite.displayHeight;
      return { w: cw * scale * presence, h: ch * scale * presence };
    };
    sprite.on('pointerover', () => {
      if (this.dragCardId) return;
      const entity = this.view?.localHand.find((h) => h.card.id === cardId);
      if (!entity || !this.view || entity.visualState !== 'legal') return;
      const visual = getHandCardVisualPresentation({
        visualState: entity.visualState,
        selected: entity.selected,
        canDrag: entity.canDrag,
        passSelectionEnabled: this.view.passSelectionEnabled,
        interactionEnabled: this.view.interactionEnabled,
        hovered: true
      });
      const size = displaySize(visual.scale);
      this.tweens.add({
        targets: sprite,
        y: entity.position.y + visual.yOffset,
        displayWidth: size.w,
        displayHeight: size.h,
        duration: 140,
        ease: 'Sine.easeOut'
      });
    });
    sprite.on('pointerout', () => {
      if (this.dragCardId === cardId) return;
      const entity = this.view?.localHand.find((h) => h.card.id === cardId);
      if (!entity || !this.view) return;
      const visual = getHandCardVisualPresentation({
        visualState: entity.visualState,
        selected: entity.selected,
        canDrag: entity.canDrag,
        passSelectionEnabled: this.view.passSelectionEnabled,
        interactionEnabled: this.view.interactionEnabled,
        hovered: false
      });
      const size = displaySize(visual.scale);
      this.tweens.add({
        targets: sprite,
        y: entity.position.y + visual.yOffset,
        displayWidth: size.w,
        displayHeight: size.h,
        duration: 140,
        ease: 'Sine.easeOut'
      });
    });
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onHandPointerDown(cardId, pointer);
    });
  }

  private onHandPointerDown(cardId: string, pointer: Phaser.Input.Pointer): void {
    if (!this.view) return;
    if (Date.now() < this.clickLockUntil) return;
    const entity = this.view.localHand.find((h) => h.card.id === cardId);
    if (!entity) return;

    // Hearts pass: tap toggles selection via shell — no trick drag.
    if (this.view.passSelectionEnabled) {
      this.emitPlay(entity.cardIndex);
      return;
    }

    if (!this.view.interactionEnabled) return;

    if (!entity.canDrag) {
      if (entity.visualState === 'illegal') return;
      return;
    }

    this.dragCardId = cardId;
    this.dragStart = { x: pointer.x, y: pointer.y };
    const sprite = this.handSprites.get(cardId);
    if (sprite) sprite.setDepth(PREMIUM_TABLE.depthSelected);

    if (!this.pointerMoveBound) {
      this.input.on('pointermove', this.onPointerMove, this);
      this.input.on('pointerup', this.onPointerUp, this);
      this.pointerMoveBound = true;
    }
  }

  private onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragCardId) return;
    const sprite = this.handSprites.get(this.dragCardId);
    if (!sprite) return;
    sprite.setPosition(pointer.x, pointer.y);
  };

  private onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragCardId || !this.view) {
      this.cancelDrag(false);
      return;
    }
    const cardId = this.dragCardId;
    const entity = this.view.localHand.find((h) => h.card.id === cardId);
    const sprite = this.handSprites.get(cardId);
    const start = this.dragStart;
    const moved =
      start &&
      (Math.abs(pointer.x - start.x) > 10 || Math.abs(pointer.y - start.y) > 10);

    this.dragCardId = null;
    this.dragStart = null;

    if (!entity || !sprite) return;

    if (moved && entity.canDrag && pointInDropZone(pointer.x, pointer.y, this.view.layout)) {
      this.emitPlay(entity.cardIndex);
      return;
    }

    if (!moved && entity.canDrag) {
      this.emitPlay(entity.cardIndex);
      return;
    }

    const visual = getHandCardVisualPresentation({
      visualState: entity.visualState,
      selected: entity.selected,
      canDrag: entity.canDrag,
      passSelectionEnabled: this.view.passSelectionEnabled,
      interactionEnabled: this.view.interactionEnabled,
      hovered: false
    });
    const presence = PREMIUM_TABLE.handPresenceScale;
    this.tweens.add({
      targets: sprite,
      x: entity.position.x,
      y: entity.position.y + visual.yOffset,
      displayWidth: this.view.layout.cardWidth * visual.scale * presence,
      displayHeight: this.view.layout.cardHeight * visual.scale * presence,
      duration: 140,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Restore fan stacking — never leave selected at foreground depth.
        sprite.setDepth(entity.position.depth);
      }
    });
  };

  private cancelDrag(snapBack: boolean): void {
    const id = this.dragCardId;
    this.dragCardId = null;
    this.dragStart = null;
    if (snapBack && id && this.view) {
      const entity = this.view.localHand.find((h) => h.card.id === id);
      const sprite = this.handSprites.get(id);
      if (entity && sprite) {
        sprite.setPosition(entity.position.x, entity.position.y);
        sprite.setDepth(entity.position.depth);
      }
    }
  }

  private emitPlay(cardIndex: number): void {
    if (Date.now() < this.clickLockUntil) return;
    this.clickLockUntil = Date.now() + PLAY_CLICK_LOCK_MS;
    this.host.onLocalCardClick?.(cardIndex);
  }

  private redrawHand(view: PhaserTableViewModel, instant: boolean): void {
    const keep = new Set<string>();
    const presence = PREMIUM_TABLE.handPresenceScale;
    const { cardWidth, cardHeight } = view.layout;
    this.handShadows.forEach((s) => s.destroy());
    this.handShadows = [];
    this.handEdges.forEach((e) => e.destroy());
    this.handEdges = [];

    view.localHand.forEach((entity) => {
      const id = entity.card.id;
      keep.add(id);
      let sprite = this.handSprites.get(id);
      const visual = getHandCardVisualPresentation({
        visualState: entity.visualState,
        selected: entity.selected,
        canDrag: entity.canDrag,
        passSelectionEnabled: view.passSelectionEnabled,
        interactionEnabled: view.interactionEnabled,
        hovered: false
      });
      const displayScale = visual.scale * presence;
      const dw = cardWidth * displayScale;
      const dh = cardHeight * displayScale;
      const targetX = entity.position.x;
      const targetY = entity.position.y + visual.yOffset;
      // GLOBAL-CARDS-01 — selected cards lift on Y only; keep fan depth by index.
      const cardDepth = entity.position.depth;

      const shadow = this.add
        .ellipse(
          targetX + 1,
          targetY + Math.max(4, dh * 0.12),
          dw * 0.92,
          dh * 0.24,
          PREMIUM_TABLE.shadow,
          entity.selected ? 0.4 : 0.32
        )
        .setDepth(Math.max(PREMIUM_TABLE.depthHand - 1, cardDepth - 1));
      this.handShadows.push(shadow);

      // Dark mat behind face — peeks as a thin lateral rim under overlap
      // (GLOBAL-CARDS-01). Clarifies card boundaries without changing fan (S6).
      const pad = PREMIUM_TABLE.handEdgePad;
      const edge = this.add
        .rectangle(targetX, targetY, dw + pad * 2, dh + pad * 2, PREMIUM_TABLE.handEdge, PREMIUM_TABLE.handEdgeAlpha)
        .setAngle(entity.position.rotationDeg)
        .setDepth(cardDepth - 0.15);
      this.handEdges.push(edge);

      if (!sprite) {
        sprite = this.add
          .image(targetX, targetY, entity.textureKey)
          .setDisplaySize(dw, dh)
          .setDepth(cardDepth)
          .setAngle(entity.position.rotationDeg);
        this.bindHandInteraction(sprite, id);
        this.handSprites.set(id, sprite);
      } else if (sprite.texture.key !== entity.textureKey) {
        sprite.setTexture(entity.textureKey);
      }

      this.applyHandVisual(sprite, entity, view, visual);
      sprite.setDisplaySize(dw, dh);

      if (this.dragCardId === id) return;

      if (instant) {
        this.tweens.killTweensOf(sprite);
        sprite.setPosition(targetX, targetY);
        sprite.setAngle(entity.position.rotationDeg);
        sprite.setDepth(cardDepth);
        sprite.setDisplaySize(dw, dh);
      } else {
        this.tweens.add({
          targets: sprite,
          x: targetX,
          y: targetY,
          angle: entity.position.rotationDeg,
          displayWidth: dw,
          displayHeight: dh,
          duration: 130,
          ease: 'Sine.easeOut'
        });
        sprite.setDepth(cardDepth);
      }
    });

    Array.from(this.handSprites.keys()).forEach((id) => {
      if (!keep.has(id)) {
        this.tweens.killTweensOf(this.handSprites.get(id)!);
        this.handSprites.get(id)?.destroy();
        this.handSprites.delete(id);
      }
    });
  }

  private applyHandVisual(
    sprite: Phaser.GameObjects.Image,
    entity: PhaserHandCardEntity,
    view: PhaserTableViewModel,
    visual = getHandCardVisualPresentation({
      visualState: entity.visualState,
      selected: entity.selected,
      canDrag: entity.canDrag,
      passSelectionEnabled: view.passSelectionEnabled,
      interactionEnabled: view.interactionEnabled
    })
  ): void {
    sprite.setAlpha(visual.alpha);
    sprite.setTint(visual.tint);
    const hitMode = resolveHandHitAreaMode(visual.interactive);
    if (hitMode === 'default-frame') {
      // Default frame hit area — scales with displaySize. Never use layout.cardWidth
      // as a Geom.Rectangle (that is display-space; textures are ~533x764 → tiny world hit).
      sprite.setInteractive({ useHandCursor: true });
    } else {
      sprite.disableInteractive();
    }
  }

  private redrawTrick(
    view: PhaserTableViewModel,
    instant: boolean,
    animateIds: string[]
  ): void {
    const keep = new Set<string>();
    const cardWidth = view.layout.trickCardWidth ?? view.layout.cardWidth;
    const cardHeight = view.layout.trickCardHeight ?? view.layout.cardHeight;
    const animate = new Set(animateIds);
    this.trickExtras.forEach((s) => s.destroy());
    this.trickExtras = [];

    view.trick.forEach((entity) => {
      const id = entity.card.id;
      keep.add(id);
      const trickDepth = premiumTrickDepth(entity.compass);
      let sprite = this.trickSprites.get(id);
      if (!sprite) {
        const handSprite = this.handSprites.get(id);
        const shouldAnimate = !instant && animate.has(id);
        const startX = handSprite?.x ?? entity.origin.x;
        const startY = handSprite?.y ?? entity.origin.y;
        sprite = this.add
          .image(
            shouldAnimate ? startX : entity.position.x,
            shouldAnimate ? startY : entity.position.y,
            entity.textureKey
          )
          .setDisplaySize(cardWidth, cardHeight)
          .setDepth(trickDepth)
          .setAngle(0);
        this.trickSprites.set(id, sprite);
        if (handSprite) {
          this.tweens.killTweensOf(handSprite);
          handSprite.destroy();
          this.handSprites.delete(id);
        }
        if (shouldAnimate) {
          this.tweens.add({
            targets: sprite,
            x: entity.position.x,
            y: entity.position.y,
            duration: entity.playerIndex === this.latestModel?.localPlayerIndex ? 280 : 320,
            ease: 'Cubic.easeOut'
          });
        }
      } else {
        if (sprite.texture.key !== entity.textureKey) sprite.setTexture(entity.textureKey);
        if (instant) {
          this.tweens.killTweensOf(sprite);
          sprite.setPosition(entity.position.x, entity.position.y);
        }
        sprite.setDisplaySize(cardWidth, cardHeight);
        sprite.setDepth(trickDepth);
      }

      const shadow = this.add
        .ellipse(
          entity.position.x + 1.5,
          entity.position.y + Math.max(5, cardHeight * 0.14),
          cardWidth * 0.94,
          cardHeight * 0.28,
          PREMIUM_TABLE.shadow,
          0.4
        )
        .setDepth(trickDepth - 2);
      this.trickExtras.push(shadow);

      // Soft ivory edge for material separation on felt.
      const edge = this.add
        .rectangle(entity.position.x, entity.position.y, cardWidth + 2, cardHeight + 2)
        .setStrokeStyle(1.1, PREMIUM_TABLE.ivory, 0.28)
        .setFillStyle(0x000000, 0)
        .setDepth(trickDepth + 0.5);
      this.trickExtras.push(edge);

      let ring = this.winnerRings.get(id);
      if (entity.isWinner) {
        if (!ring) {
          ring = this.add
            .ellipse(
              entity.position.x,
              entity.position.y,
              cardWidth * 1.08,
              cardHeight * 1.06
            )
            .setStrokeStyle(1.75, this.theme.brass, 0.82)
            .setFillStyle(this.theme.brass, 0.04)
            .setDepth(trickDepth - 1);
          this.winnerRings.set(id, ring);
          this.tweens.add({
            targets: ring,
            alpha: { from: 0.4, to: 1 },
            duration: 160,
            yoyo: true,
            repeat: 0,
            ease: 'Sine.easeOut'
          });
        } else {
          ring.setPosition(entity.position.x, entity.position.y);
          ring.setVisible(true);
        }
      } else if (ring) {
        ring.destroy();
        this.winnerRings.delete(id);
      }
    });

    Array.from(this.trickSprites.keys()).forEach((id) => {
      if (!keep.has(id)) {
        this.tweens.killTweensOf(this.trickSprites.get(id)!);
        this.trickSprites.get(id)?.destroy();
        this.trickSprites.delete(id);
        this.winnerRings.get(id)?.destroy();
        this.winnerRings.delete(id);
      }
    });
  }

  private animateTrickClear(gen: number, onDone: () => void): void {
    if (this.animatingClear) {
      onDone();
      return;
    }
    const sprites = Array.from(this.trickSprites.values());
    if (sprites.length === 0) {
      onDone();
      return;
    }
    this.animatingClear = true;
    this.winnerRings.forEach((r) => r.destroy());
    this.winnerRings.clear();
    const toward = this.view?.layout.center ?? { x: this.scale.width / 2, y: this.scale.height / 2 };
    let remaining = sprites.length;
    sprites.forEach((sprite) => {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        x: toward.x,
        y: toward.y - 20,
        scale: 0.85,
        duration: 420,
        ease: 'Quad.easeIn',
        onComplete: () => {
          sprite.destroy();
          remaining -= 1;
          if (remaining <= 0) {
            this.trickSprites.clear();
            this.animatingClear = false;
            if (!isStaleGeneration(gen, this.syncGeneration)) onDone();
          }
        }
      });
    });
  }
  /** Dev helper: play local hand card by index (or toggle pass selection). */
  debugTapCardIndex(cardIndex: number): boolean {
    if (!this.view) return false;
    if (this.view.passSelectionEnabled) {
      this.emitPlay(cardIndex);
      return true;
    }
    if (!this.view.localIsActive) return false;
    const entity = this.view.localHand.find((h) => h.cardIndex === cardIndex);
    if (!entity?.canDrag) return false;
    this.emitPlay(cardIndex);
    return true;
  }

  debugSnapshot(): {
    hand: number;
    trick: number;
    interactionEnabled: boolean;
    localIsActive: boolean;
    trumpLabel: string;
    aspect: string;
    spadesBidPhase?: boolean;
    spadesBroken?: boolean;
    heartsPassPhase?: boolean;
    heartsBroken?: boolean;
    passSelectionEnabled?: boolean;
    kingFestaPhase?: boolean;
    kingWaitingForChoice?: boolean;
  } | null {
    if (!this.view) return null;
    return {
      hand: this.view.localHand.length,
      trick: this.view.trick.length,
      interactionEnabled: this.view.interactionEnabled,
      localIsActive: this.view.localIsActive,
      trumpLabel: this.view.trumpLabel,
      aspect: this.view.layout.aspect,
      spadesBidPhase: this.view.spadesBidPhase,
      spadesBroken: this.view.spadesBroken,
      heartsPassPhase: this.view.heartsPassPhase,
      heartsBroken: this.view.heartsBroken,
      passSelectionEnabled: this.view.passSelectionEnabled,
      kingFestaPhase: this.view.kingFestaPhase,
      kingWaitingForChoice: this.view.kingWaitingForChoice
    };
  }
}

export type { PhaserCompass } from './phaserTableLayout';
