/**
 * Sueca Phaser table scene — visual consumer of TableRenderModel only.
 * No engine imports; rules stay in React shell + adapters.
 */

import Phaser from 'phaser';
import type { Card } from '../../types/game';
import type { TableRenderModel } from '../../table/tableRenderModel';
import { CARD_BACK_PATH, getPublicAssetPath } from '../../constants/cardAssets';
import {
  mapTableModelToPhaserView,
  PhaserTableViewModel
} from './mapTableModelToPhaserView';
import { PhaserCompass, playerIndexToCompass } from './phaserTableLayout';

export const SUECA_TABLE_SCENE_KEY = 'SuecaTableScene';

export type SuecaPhaserCardUrlResolver = (card: Card) => string;

export interface SuecaTableSceneHost {
  onLocalCardClick?: (cardIndex: number) => void;
  getCardImage: SuecaPhaserCardUrlResolver;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  getSelectedCardIndex?: () => number | null;
}

export class SuecaTableScene extends Phaser.Scene {
  private host: SuecaTableSceneHost;
  private latestModel: TableRenderModel | null = null;
  private view: PhaserTableViewModel | null = null;
  /** Keyed by card.id */
  private handSprites = new Map<string, Phaser.GameObjects.Image>();
  private trickSprites = new Map<string, Phaser.GameObjects.Image>();
  private opponentBacks: Phaser.GameObjects.GameObject[] = [];
  private seatLabels = new Map<number, Phaser.GameObjects.Text>();
  private trumpText: Phaser.GameObjects.Text | null = null;
  private felt: Phaser.GameObjects.Rectangle | null = null;
  private animatingClear = false;
  private backKey = 'card-back';
  private loadingTextures = false;

  constructor(host: SuecaTableSceneHost) {
    super(SUECA_TABLE_SCENE_KEY);
    this.host = host;
  }

  setHost(host: SuecaTableSceneHost): void {
    this.host = host;
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
    const { width, height } = this.scale;
    this.felt = this.add
      .rectangle(width / 2, height / 2, width, height, 0x1b5e3b)
      .setDepth(0);
    this.trumpText = this.add
      .text(12, 10, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '14px',
        color: '#f5f5f0'
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
      isLocalCardPlayable: this.host.isLocalCardPlayable
    });

    const prevTrickIds = new Set((this.view?.trick ?? []).map((t) => t.card.id));
    const nextTrickIds = new Set(nextView.trick.map((t) => t.card.id));
    const trickCleared =
      prevTrickIds.size > 0 && nextTrickIds.size === 0;
    const addedTrick = nextView.trick.filter((t) => !prevTrickIds.has(t.card.id));

    this.view = nextView;
    if (this.trumpText) this.trumpText.setText(nextView.trumpLabel);

    this.ensureTextures(nextView, () => {
      this.redrawOpponents(nextView);
      this.redrawSeatLabels(nextView);
      this.redrawHand(nextView, forceLayout);
      if (trickCleared && !forceLayout) {
        this.animateTrickClear(() => this.redrawTrick(nextView, true, []));
      } else {
        this.redrawTrick(nextView, forceLayout, forceLayout ? [] : addedTrick.map((t) => t.card.id));
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
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    });

    const onComplete = () => {
      this.load.off(Phaser.Loader.Events.COMPLETE, onComplete);
      this.loadingTextures = false;
      done();
    };
    this.loadingTextures = true;
    this.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    if (!this.load.isLoading()) {
      this.load.start();
    }
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
          if (opp.compass === 'west' || opp.compass === 'east') {
            img.setAngle(90);
          }
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

  private redrawSeatLabels(view: PhaserTableViewModel): void {
    const model = this.latestModel;
    if (!model) return;
    const keep = new Set<number>();

    model.seats.forEach((seat) => {
      keep.add(seat.index);
      const compass = playerIndexToCompass(seat.index, model.localPlayerIndex);
      const anchor = view.layout.seatAnchor[compass];
      const labelY =
        compass === 'south'
          ? anchor.y - view.layout.cardHeight * 0.75
          : compass === 'north'
            ? anchor.y - 18
            : anchor.y - view.layout.opponentCardHeight * 0.9;

      const parts = [seat.name];
      if (seat.isDealer) parts.push('D');
      if (seat.isActive) parts.push('●');
      const text = parts.join(' · ');
      let label = this.seatLabels.get(seat.index);
      if (!label) {
        label = this.add
          .text(anchor.x, labelY, text, {
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 3 }
          })
          .setOrigin(0.5)
          .setDepth(40);
        this.seatLabels.set(seat.index, label);
      } else {
        label.setText(text);
        label.setPosition(anchor.x, labelY);
      }
      label.setColor(seat.isActive ? '#ffe566' : '#ffffff');
    });

    Array.from(this.seatLabels.keys()).forEach((idx) => {
      if (!keep.has(idx)) {
        this.seatLabels.get(idx)?.destroy();
        this.seatLabels.delete(idx);
      }
    });
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
      const cardIndex = entity.cardIndex;

      if (!sprite) {
        sprite = this.add
          .image(targetX, targetY, entity.textureKey)
          .setDisplaySize(cardWidth, cardHeight)
          .setDepth(20)
          .setInteractive({ useHandCursor: true });
        sprite.on('pointerdown', () => {
          if (!this.view?.interactionEnabled) return;
          const idx = this.view.localHand.find((h) => h.card.id === id)?.cardIndex;
          if (idx === undefined) return;
          this.host.onLocalCardClick?.(idx);
        });
        this.handSprites.set(id, sprite);
      } else if (sprite.texture.key !== entity.textureKey) {
        sprite.setTexture(entity.textureKey);
      }

      sprite.setData('cardIndex', cardIndex);
      sprite.setAlpha(entity.playableHint || !view.interactionEnabled ? 1 : 0.55);
      if (view.interactionEnabled) {
        sprite.setInteractive({ useHandCursor: true });
      } else {
        sprite.disableInteractive();
      }

      if (instant) {
        sprite.setPosition(targetX, targetY);
      } else {
        this.tweens.add({
          targets: sprite,
          x: targetX,
          y: targetY,
          duration: 120,
          ease: 'Sine.easeOut'
        });
      }
      sprite.setDisplaySize(cardWidth, cardHeight);
    });

    Array.from(this.handSprites.keys()).forEach((id) => {
      if (!keep.has(id)) {
        this.handSprites.get(id)?.destroy();
        this.handSprites.delete(id);
      }
    });
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
        const startX = handSprite?.x ?? entity.position.x;
        const startY = handSprite?.y ?? entity.position.y;
        const shouldAnimate = !instant && animate.has(id);
        sprite = this.add
          .image(
            shouldAnimate ? startX : entity.position.x,
            shouldAnimate ? startY : entity.position.y,
            entity.textureKey
          )
          .setDisplaySize(cardWidth, cardHeight)
          .setDepth(30);
        this.trickSprites.set(id, sprite);
        if (handSprite) {
          handSprite.destroy();
          this.handSprites.delete(id);
        }
        if (shouldAnimate) {
          this.tweens.add({
            targets: sprite,
            x: entity.position.x,
            y: entity.position.y,
            duration: 220,
            ease: 'Cubic.easeOut'
          });
        }
      } else {
        if (sprite.texture.key !== entity.textureKey) {
          sprite.setTexture(entity.textureKey);
        }
        if (instant) {
          sprite.setPosition(entity.position.x, entity.position.y);
        }
        sprite.setDisplaySize(cardWidth, cardHeight);
      }
    });

    Array.from(this.trickSprites.keys()).forEach((id) => {
      if (!keep.has(id)) {
        this.trickSprites.get(id)?.destroy();
        this.trickSprites.delete(id);
      }
    });
  }

  private animateTrickClear(onDone: () => void): void {
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
    let remaining = sprites.length;
    sprites.forEach((sprite) => {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        y: sprite.y - 36,
        duration: 200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          sprite.destroy();
          remaining -= 1;
          if (remaining <= 0) {
            this.trickSprites.clear();
            this.animatingClear = false;
            onDone();
          }
        }
      });
    });
  }
}

export type { PhaserCompass };
