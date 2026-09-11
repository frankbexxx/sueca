/**
 * Sueca / Spades Phaser table scene — visual consumer of TableRenderModel only.
 * No engine imports.
 */

import Phaser from 'phaser';
import type { Card } from '../../types/game';
import type { TableRenderModel } from '../../table/tableRenderModel';
import { CARD_BACK_PATH, getPublicAssetPath } from '../../constants/cardAssets';
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
import { PREMIUM_TABLE } from './phaserPremiumLayout';

function colorIntFromCss(raw: string, fallback = 0xffd700): number {
  const s = (raw || '').trim();
  if (s.startsWith('#') && s.length >= 7) {
    return parseInt(s.slice(1, 7), 16);
  }
  return fallback;
}

export const SUECA_TABLE_SCENE_KEY = 'SuecaTableScene';

export type SuecaPhaserCardUrlResolver = (card: Card) => string;

export interface SuecaTableSceneHost {
  onLocalCardClick?: (cardIndex: number) => void;
  getCardImage: SuecaPhaserCardUrlResolver;
  getTeamName?: (team: 1 | 2) => string;
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
  private seatLabels = new Map<number, Phaser.GameObjects.Text>();
  private seatPanels = new Map<number, Phaser.GameObjects.Graphics>();
  private seatRings = new Map<number, Phaser.GameObjects.Ellipse>();
  private trumpText: Phaser.GameObjects.Text | null = null;
  private trumpBadge: Phaser.GameObjects.Text | null = null;
  /** True after premium surface graphics exist (replaces flat felt rect). */
  private tableReady = false;
  private exteriorGfx: Phaser.GameObjects.Graphics | null = null;
  private feltGfx: Phaser.GameObjects.Graphics | null = null;
  private vignetteGfx: Phaser.GameObjects.Graphics | null = null;
  private winnerRings = new Map<string, Phaser.GameObjects.Ellipse>();
  private cardShadows: Phaser.GameObjects.Ellipse[] = [];
  private animatingClear = false;
  private backKey = 'card-back';
  /** Public texture key for QA — must stay `card-back` (CARD_BACK_PATH). */
  static readonly CARD_BACK_TEXTURE_KEY = 'card-back';
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
      if (this.trumpBadge) this.trumpBadge.setColor(theme.active);
      if (this.latestModel) this.syncFromModel(true);
    }
  }

  applyModel(model: TableRenderModel): void {
    this.latestModel = model;
    if (!this.tableReady) return;
    this.syncFromModel(false);
  }

  preload(): void {
    const backUrl = getPublicAssetPath(CARD_BACK_PATH);
    if (!this.textures.exists(this.backKey)) {
      this.load.image(this.backKey, backUrl);
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
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: this.theme.text
      })
      .setDepth(PREMIUM_TABLE.depthHud);
    this.trumpBadge = this.add
      .text(12, 30, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '22px',
        color: this.theme.active
      })
      .setDepth(PREMIUM_TABLE.depthHud);

    this.scale.on('resize', this.handleResize, this);
    if (this.latestModel) this.syncFromModel(true);
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
    if (this.trumpText) {
      this.trumpText.setText(nextView.trumpLabel);
      this.trumpText.setVisible(Boolean(nextView.trumpLabel));
    }
    if (this.trumpBadge) {
      const showGlyph = nextView.showTrumpSymbol && Boolean(nextView.trumpSuit);
      this.trumpBadge.setText(showGlyph ? nextView.trumpSymbol : '');
      this.trumpBadge.setVisible(showGlyph);
      this.trumpBadge.setColor(
        nextView.bannerAccent ? this.theme.accent : this.theme.active
      );
      // When label is hidden, pin glyph to the corner without stacking height.
      this.trumpBadge.setPosition(12, nextView.trumpLabel ? 30 : 10);
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
    this.cardShadows.forEach((s) => s.destroy());
    this.cardShadows = [];
    const { opponentCardWidth, opponentCardHeight } = view.layout;
    const hasBack = this.textures.exists(this.backKey);
    view.opponents.forEach((opp) => {
      opp.backPositions.forEach((pos) => {
        const shadow = this.add
          .ellipse(
            pos.x + 1,
            pos.y + Math.max(3, opponentCardHeight * 0.08),
            opponentCardWidth * 0.9,
            opponentCardHeight * 0.22,
            PREMIUM_TABLE.shadow,
            0.28
          )
          .setDepth(PREMIUM_TABLE.depthOpponentCards - 1);
        this.cardShadows.push(shadow);
        if (hasBack) {
          const img = this.add
            .image(pos.x, pos.y, this.backKey)
            .setDisplaySize(opponentCardWidth, opponentCardHeight)
            .setDepth(PREMIUM_TABLE.depthOpponentCards);
          if (opp.compass === 'west' || opp.compass === 'east') img.setAngle(90);
          this.opponentBacks.push(img);
        } else {
          const rect = this.add
            .rectangle(
              pos.x,
              pos.y,
              opponentCardWidth,
              opponentCardHeight,
              PREMIUM_TABLE.feltEdge
            )
            .setStrokeStyle(1, this.theme.brass, 0.35)
            .setDepth(PREMIUM_TABLE.depthOpponentCards);
          this.opponentBacks.push(rect);
        }
      });
    });
  }

  private redrawSeatChrome(view: PhaserTableViewModel): void {
    const keep = new Set<number>();
    view.seats.forEach((seat) => {
      keep.add(seat.seatIndex);
      const text = seat.labelText;
      const compactSide =
        view.layout.compactSideSeats &&
        (seat.compass === 'west' || seat.compass === 'east');
      const fontSize =
        view.layout.aspect === 'landscape' ? '11px' : compactSide ? '10px' : '12px';
      let label = this.seatLabels.get(seat.seatIndex);
      if (!label) {
        label = this.add
          .text(seat.labelPosition.x, seat.labelPosition.y, text, {
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            fontSize,
            color: this.theme.text,
            padding: { x: compactSide ? 4 : 8, y: compactSide ? 2 : 4 }
          })
          .setOrigin(0.5)
          .setDepth(PREMIUM_TABLE.depthSeats + 2);
        this.seatLabels.set(seat.seatIndex, label);
      } else {
        label.setText(text);
        label.setPosition(seat.labelPosition.x, seat.labelPosition.y);
        label.setFontSize(fontSize);
      }
      label.setColor(this.theme.text);
      label.setBackgroundColor('rgba(0,0,0,0)');

      const bounds = label.getBounds();
      const padX = compactSide ? 5 : 10;
      const padY = compactSide ? 3 : 5;
      let panel = this.seatPanels.get(seat.seatIndex);
      if (!panel) {
        panel = this.add.graphics().setDepth(PREMIUM_TABLE.depthSeats);
        this.seatPanels.set(seat.seatIndex, panel);
      }
      panel.clear();
      const pw = bounds.width + padX * 2;
      const ph = bounds.height + padY * 2;
      const px = seat.labelPosition.x - pw / 2;
      const py = seat.labelPosition.y - ph / 2;
      const radius = compactSide ? 6 : 8;
      panel.fillStyle(PREMIUM_TABLE.shadow, 0.35);
      panel.fillRoundedRect(px + 1, py + 2, pw, ph, radius);
      panel.fillStyle(this.theme.seatPanel, 0.94);
      panel.fillRoundedRect(px, py, pw, ph, radius);
      panel.lineStyle(1, this.theme.brass, seat.isDealer ? 0.55 : 0.28);
      panel.strokeRoundedRect(px, py, pw, ph, radius);

      let ring = this.seatRings.get(seat.seatIndex);
      const ringW = Math.max(
        compactSide ? 36 : 52,
        (seat.isLocal ? view.layout.cardWidth : view.layout.opponentCardWidth) *
          (compactSide ? 1.35 : 1.7)
      );
      const ringH = Math.max(compactSide ? 18 : 26, ringW * 0.32);
      if (!ring) {
        ring = this.add
          .ellipse(seat.labelPosition.x, seat.labelPosition.y + 16, ringW, ringH)
          .setStrokeStyle(2, this.theme.brass, 0.55)
          .setFillStyle(0x000000, 0)
          .setDepth(PREMIUM_TABLE.depthSeats + 1);
        this.seatRings.set(seat.seatIndex, ring);
      }
      ring.setPosition(seat.labelPosition.x, seat.labelPosition.y + 14);
      ring.setSize(ringW, ringH);
      ring.setVisible(seat.showActiveHighlight);
      ring.setStrokeStyle(2, colorIntFromCss(this.theme.active, this.theme.brass), 0.7);
    });

    Array.from(this.seatLabels.keys()).forEach((idx) => {
      if (!keep.has(idx)) {
        this.seatLabels.get(idx)?.destroy();
        this.seatLabels.delete(idx);
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
      this.tweens.add({
        targets: sprite,
        y: entity.position.y + visual.yOffset,
        displayWidth: (this.view?.layout.cardWidth ?? sprite.displayWidth) * visual.scale,
        displayHeight: (this.view?.layout.cardHeight ?? sprite.displayHeight) * visual.scale,
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
      this.tweens.add({
        targets: sprite,
        y: entity.position.y + visual.yOffset,
        displayWidth: this.view.layout.cardWidth * visual.scale,
        displayHeight: this.view.layout.cardHeight * visual.scale,
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
    if (sprite) sprite.setDepth(80);

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
    this.tweens.add({
      targets: sprite,
      x: entity.position.x,
      y: entity.position.y + visual.yOffset,
      displayWidth: this.view.layout.cardWidth * visual.scale,
      displayHeight: this.view.layout.cardHeight * visual.scale,
      duration: 140,
      ease: 'Cubic.easeOut',
      onComplete: () => {
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
    const { cardWidth, cardHeight } = view.layout;

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
      const targetX = entity.position.x;
      const targetY = entity.position.y + visual.yOffset;

      if (!sprite) {
        sprite = this.add
          .image(targetX, targetY, entity.textureKey)
          .setDisplaySize(cardWidth, cardHeight)
          .setDepth(entity.position.depth)
          .setAngle(entity.position.rotationDeg);
        this.bindHandInteraction(sprite, id);
        this.handSprites.set(id, sprite);
      } else if (sprite.texture.key !== entity.textureKey) {
        sprite.setTexture(entity.textureKey);
      }

      this.applyHandVisual(sprite, entity, view, visual);
      sprite.setDisplaySize(cardWidth * visual.scale, cardHeight * visual.scale);

      if (this.dragCardId === id) return;

      if (instant) {
        this.tweens.killTweensOf(sprite);
        sprite.setPosition(targetX, targetY);
        sprite.setAngle(entity.position.rotationDeg);
        sprite.setDepth(entity.position.depth);
        sprite.setDisplaySize(cardWidth * visual.scale, cardHeight * visual.scale);
      } else {
        this.tweens.add({
          targets: sprite,
          x: targetX,
          y: targetY,
          angle: entity.position.rotationDeg,
          displayWidth: cardWidth * visual.scale,
          displayHeight: cardHeight * visual.scale,
          duration: 130,
          ease: 'Sine.easeOut'
        });
        sprite.setDepth(entity.position.depth);
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

    view.trick.forEach((entity) => {
      const id = entity.card.id;
      keep.add(id);
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
          .setDepth(PREMIUM_TABLE.depthTrick)
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
            duration: entity.playerIndex === this.latestModel?.localPlayerIndex ? 300 : 340,
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
        sprite.setDepth(PREMIUM_TABLE.depthTrick);
      }

      let ring = this.winnerRings.get(id);
      if (entity.isWinner) {
        if (!ring) {
          ring = this.add
            .ellipse(
              entity.position.x,
              entity.position.y,
              cardWidth * 1.15,
              cardHeight * 1.12
            )
            .setStrokeStyle(2, this.theme.brass, 0.75)
            .setFillStyle(this.theme.brass, 0.06)
            .setDepth(PREMIUM_TABLE.depthTrick - 1);
          this.winnerRings.set(id, ring);
          this.tweens.add({
            targets: ring,
            alpha: { from: 0.35, to: 1 },
            duration: 180,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
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
