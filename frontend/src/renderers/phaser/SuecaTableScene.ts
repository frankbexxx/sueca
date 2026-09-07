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
import { pointInDropZone } from './phaserTableLayout';
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
  private seatRings = new Map<number, Phaser.GameObjects.Ellipse>();
  private trumpText: Phaser.GameObjects.Text | null = null;
  private trumpBadge: Phaser.GameObjects.Text | null = null;
  private felt: Phaser.GameObjects.Rectangle | null = null;
  private animatingClear = false;
  private backKey = 'card-back';
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
    if (this.felt) {
      this.felt.setFillStyle(theme.felt);
      this.cameras.main.setBackgroundColor(theme.feltDark);
    }
    if (this.trumpText) this.trumpText.setColor(theme.text);
    if (this.trumpBadge) this.trumpBadge.setColor(theme.active);
    if (this.latestModel) this.syncFromModel(true);
  }

  applyModel(model: TableRenderModel): void {
    this.latestModel = model;
    if (!this.felt) return;
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
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(this.theme.feltDark);
    this.felt = this.add
      .rectangle(width / 2, height / 2, width, height, this.theme.felt)
      .setDepth(0);
    this.trumpText = this.add
      .text(12, 10, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: this.theme.text
      })
      .setDepth(50);
    this.trumpBadge = this.add
      .text(12, 30, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '22px',
        color: this.theme.active
      })
      .setDepth(50);

    this.scale.on('resize', this.handleResize, this);
    if (this.latestModel) this.syncFromModel(true);
  }

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    if (this.felt) {
      this.felt.setPosition(gameSize.width / 2, gameSize.height / 2);
      this.felt.setSize(gameSize.width, gameSize.height);
    }
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
      getTeamName: this.host.getTeamName
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
    if (this.trumpText) this.trumpText.setText(nextView.trumpLabel);
    if (this.trumpBadge) {
      this.trumpBadge.setText(nextView.trumpSuit ? nextView.trumpSymbol : '');
      this.trumpBadge.setColor(
        nextView.bannerAccent ? this.theme.accent : this.theme.active
      );
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
    const { opponentCardWidth, opponentCardHeight } = view.layout;
    const hasBack = this.textures.exists(this.backKey);
    view.opponents.forEach((opp) => {
      opp.backPositions.forEach((pos) => {
        if (hasBack) {
          const img = this.add
            .image(pos.x, pos.y, this.backKey)
            .setDisplaySize(opponentCardWidth, opponentCardHeight)
            .setDepth(5);
          if (opp.compass === 'west' || opp.compass === 'east') img.setAngle(90);
          this.opponentBacks.push(img);
        } else {
          const rect = this.add
            .rectangle(pos.x, pos.y, opponentCardWidth, opponentCardHeight, 0x1e3a8a)
            .setStrokeStyle(1, 0xffffff)
            .setDepth(5);
          this.opponentBacks.push(rect);
        }
      });
    });
  }

  private redrawSeatChrome(view: PhaserTableViewModel): void {
    const keep = new Set<number>();
    view.seats.forEach((seat) => {
      keep.add(seat.seatIndex);
      const parts = [seat.name];
      if (seat.teamLabel) parts.push(seat.teamLabel);
      if (seat.bidLabel) parts.push(seat.bidLabel);
      if (!seat.isLocal) parts.push(String(seat.handCount));
      if (seat.isDealer) parts.push('D');
      const text = parts.join(' · ');
      let label = this.seatLabels.get(seat.seatIndex);
      if (!label) {
        label = this.add
          .text(seat.labelPosition.x, seat.labelPosition.y, text, {
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            fontSize: view.layout.aspect === 'landscape' ? '12px' : '13px',
            color: this.theme.text,
            backgroundColor: this.theme.seatBg,
            padding: { x: 7, y: 4 }
          })
          .setOrigin(0.5)
          .setDepth(40);
        this.seatLabels.set(seat.seatIndex, label);
      } else {
        label.setText(text);
        label.setPosition(seat.labelPosition.x, seat.labelPosition.y);
        label.setBackgroundColor(this.theme.seatBg);
      }
      label.setColor(seat.showActiveHighlight ? this.theme.active : this.theme.text);

      let ring = this.seatRings.get(seat.seatIndex);
      const ringW = Math.max(56, (seat.isLocal ? view.layout.cardWidth : view.layout.opponentCardWidth) * 1.8);
      const ringH = Math.max(28, ringW * 0.35);
      if (!ring) {
        ring = this.add
          .ellipse(seat.labelPosition.x, seat.labelPosition.y + 18, ringW, ringH)
          .setStrokeStyle(2, colorIntFromCss(this.theme.active), 0.9)
          .setFillStyle(0x000000, 0)
          .setDepth(39);
        this.seatRings.set(seat.seatIndex, ring);
      }
      ring.setPosition(seat.labelPosition.x, seat.labelPosition.y + 16);
      ring.setSize(ringW, ringH);
      ring.setVisible(seat.showActiveHighlight);
      ring.setStrokeStyle(2, colorIntFromCss(this.theme.active), 0.85);
    });

    Array.from(this.seatLabels.keys()).forEach((idx) => {
      if (!keep.has(idx)) {
        this.seatLabels.get(idx)?.destroy();
        this.seatLabels.delete(idx);
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
      if (!entity || entity.visualState !== 'legal') return;
      this.tweens.add({
        targets: sprite,
        y: entity.position.y + (entity.selected ? -18 : -10),
        duration: 90,
        ease: 'Sine.easeOut'
      });
    });
    sprite.on('pointerout', () => {
      if (this.dragCardId === cardId) return;
      const entity = this.view?.localHand.find((h) => h.card.id === cardId);
      if (!entity) return;
      const yLift = entity.selected ? -16 : 0;
      this.tweens.add({
        targets: sprite,
        y: entity.position.y + yLift,
        duration: 90,
        ease: 'Sine.easeOut'
      });
    });
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onHandPointerDown(cardId, pointer);
    });
  }

  private onHandPointerDown(cardId: string, pointer: Phaser.Input.Pointer): void {
    if (!this.view?.interactionEnabled) return;
    if (Date.now() < this.clickLockUntil) return;
    const entity = this.view.localHand.find((h) => h.card.id === cardId);
    if (!entity) return;

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

    const yLift = entity.selected ? -16 : 0;
    this.tweens.add({
      targets: sprite,
      x: entity.position.x,
      y: entity.position.y + yLift,
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
      const yLift = entity.selected ? -16 : 0;
      const targetX = entity.position.x;
      const targetY = entity.position.y + yLift;

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

      this.applyHandVisual(sprite, entity, view);
      sprite.setDisplaySize(cardWidth, cardHeight);

      if (this.dragCardId === id) return;

      if (instant) {
        this.tweens.killTweensOf(sprite);
        sprite.setPosition(targetX, targetY);
        sprite.setAngle(entity.position.rotationDeg);
        sprite.setDepth(entity.position.depth);
      } else {
        this.tweens.add({
          targets: sprite,
          x: targetX,
          y: targetY,
          angle: entity.position.rotationDeg,
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
    view: PhaserTableViewModel
  ): void {
    if (entity.visualState === 'illegal') {
      sprite.setAlpha(this.theme.illegalAlpha);
      sprite.disableInteractive();
    } else if (entity.visualState === 'inactive') {
      sprite.setAlpha(this.theme.inactiveAlpha);
      sprite.disableInteractive();
    } else {
      sprite.setAlpha(1);
      if (view.interactionEnabled && entity.canDrag) {
        sprite.setInteractive({ useHandCursor: true, draggable: false });
      } else {
        sprite.disableInteractive();
      }
    }
  }

  private redrawTrick(
    view: PhaserTableViewModel,
    instant: boolean,
    animateIds: string[]
  ): void {
    const keep = new Set<string>();
    const { cardWidth, cardHeight } = view.layout;
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
          .setDepth(30)
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
            duration: 240,
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
      }
    });

    Array.from(this.trickSprites.keys()).forEach((id) => {
      if (!keep.has(id)) {
        this.tweens.killTweensOf(this.trickSprites.get(id)!);
        this.trickSprites.get(id)?.destroy();
        this.trickSprites.delete(id);
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
    const toward = this.view?.layout.center ?? { x: this.scale.width / 2, y: this.scale.height / 2 };
    let remaining = sprites.length;
    sprites.forEach((sprite) => {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        x: toward.x,
        y: toward.y - 20,
        scale: 0.85,
        duration: 220,
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
  /** Dev helper: play local hand card by index. */
  debugTapCardIndex(cardIndex: number): boolean {
    if (!this.view?.localIsActive) return false;
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
      spadesBroken: this.view.spadesBroken
    };
  }
}

export type { PhaserCompass } from './phaserTableLayout';
