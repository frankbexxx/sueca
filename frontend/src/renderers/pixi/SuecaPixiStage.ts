/**
 * Sueca Pixi table stage — visual consumer of TableRenderModel only.
 * No engine imports; rules stay in React shell + adapters.
 */

import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture
} from 'pixi.js';
import type { Card } from '../../types/game';
import type { TableRenderModel } from '../../table/tableRenderModel';
import { getActiveThemeCardBackPath, getPublicAssetPath } from '../../constants/cardAssets';
import {
  mapTableModelToPixiView,
  PixiTableViewModel
} from './mapTableModelToPixiView';
import { playerIndexToCompass } from './pixiTableLayout';
import {
  easeInQuad,
  easeOutCubic,
  easeOutSine,
  PixiTweenRunner
} from './pixiTween';

export type SuecaPixiCardUrlResolver = (card: Card) => string;

export interface SuecaPixiStageHost {
  onLocalCardClick?: (cardIndex: number) => void;
  getCardImage: SuecaPixiCardUrlResolver;
  isLocalCardPlayable?: (cardIndex: number) => boolean;
  getSelectedCardIndex?: () => number | null;
}

const BACK_ALIAS = 'sueca-pixi-card-back';

export class SuecaPixiStage {
  private host: SuecaPixiStageHost;
  private app: Application | null = null;
  private root: Container | null = null;
  private felt: Graphics | null = null;
  private trumpText: Text | null = null;
  private latestModel: TableRenderModel | null = null;
  private view: PixiTableViewModel | null = null;
  private handSprites = new Map<string, Sprite>();
  private trickSprites = new Map<string, Sprite>();
  private opponentBacks: Sprite[] = [];
  private seatLabels = new Map<number, Text>();
  private textureCache = new Map<string, Texture>();
  private pendingLoads = new Map<string, Promise<void>>();
  private syncGeneration = 0;
  private animatingClear = false;
  private destroyed = false;
  private tweens = new PixiTweenRunner();
  private clickLockUntil = 0;
  private resizeObserver: ResizeObserver | null = null;
  private parent: HTMLElement | null = null;
  private onTick = (): void => {
    if (!this.app) return;
    this.tweens.update(this.app.ticker.deltaMS);
  };

  constructor(host: SuecaPixiStageHost) {
    this.host = host;
  }

  setHost(host: SuecaPixiStageHost): void {
    this.host = host;
  }

  async mount(parent: HTMLElement): Promise<void> {
    if (this.app || this.destroyed) return;
    this.parent = parent;
    const app = new Application();
    await app.init({
      background: '#1b5e3b',
      antialias: true,
      autoDensity: true,
      resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      width: Math.max(1, parent.clientWidth || 640),
      height: Math.max(1, parent.clientHeight || 480)
    });
    if (this.destroyed) {
      app.destroy(true, { children: true });
      return;
    }
    this.app = app;
    parent.appendChild(app.canvas);
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __suecaPixiStage?: SuecaPixiStage }).__suecaPixiStage = this;
    }

    const root = new Container();
    app.stage.addChild(root);
    this.root = root;

    this.felt = new Graphics();
    this.drawFelt(app.screen.width, app.screen.height);
    root.addChild(this.felt);

    this.trumpText = new Text({
      text: '',
      style: {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 14,
        fill: 0xf5f5f0
      }
    });
    this.trumpText.x = 12;
    this.trumpText.y = 10;
    this.trumpText.zIndex = 50;
    root.addChild(this.trumpText);
    root.sortableChildren = true;

    app.ticker.add(this.onTick);

    try {
      const backUrl = getPublicAssetPath(getActiveThemeCardBackPath());
      const tex = await Assets.load(backUrl);
      if (!this.destroyed) this.textureCache.set(BACK_ALIAS, tex);
    } catch {
      /* fallback rectangles for backs */
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(parent);
    this.handleResize();
    if (this.latestModel) this.syncFromModel(true);
  }

  applyModel(model: TableRenderModel): void {
    this.latestModel = model;
    if (!this.app || !this.root) return;
    this.syncFromModel(false);
  }

  destroy(): void {
    this.destroyed = true;
    this.tweens.clear();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (process.env.NODE_ENV === 'development') {
      const w = window as unknown as { __suecaPixiStage?: SuecaPixiStage };
      if (w.__suecaPixiStage === this) delete w.__suecaPixiStage;
    }
    if (this.app) {
      this.app.ticker.remove(this.onTick);
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.root = null;
    this.felt = null;
    this.trumpText = null;
    this.handSprites.clear();
    this.trickSprites.clear();
    this.opponentBacks = [];
    this.seatLabels.clear();
    this.textureCache.clear();
    this.parent = null;
  }

  /** Dev/test: tap local hand card by index (mirrors pointertap). */
  debugTapCardIndex(cardIndex: number): boolean {
    if (!this.view?.interactionEnabled) return false;
    const entity = this.view.localHand.find((h) => h.cardIndex === cardIndex);
    if (!entity) return false;
    this.handleHandTap(entity.card.id);
    return true;
  }

  debugSnapshot(): {
    hand: number;
    trick: number;
    interactionEnabled: boolean;
    trumpLabel: string;
  } | null {
    if (!this.view) return null;
    return {
      hand: this.view.localHand.length,
      trick: this.view.trick.length,
      interactionEnabled: this.view.interactionEnabled,
      trumpLabel: this.view.trumpLabel
    };
  }

  private handleResize(): void {
    if (!this.app || !this.parent) return;
    const w = Math.max(1, this.parent.clientWidth || 640);
    const h = Math.max(1, this.parent.clientHeight || 480);
    this.app.renderer.resize(w, h);
    this.drawFelt(w, h);
    if (this.latestModel) this.syncFromModel(true);
  }

  private drawFelt(width: number, height: number): void {
    if (!this.felt) return;
    this.felt.clear();
    this.felt.rect(0, 0, width, height);
    this.felt.fill({ color: 0x1b5e3b });
    this.felt.zIndex = 0;
  }

  private syncFromModel(forceLayout: boolean): void {
    if (!this.latestModel || !this.app || this.destroyed) return;
    const selected = this.host.getSelectedCardIndex?.() ?? null;
    const nextView = mapTableModelToPixiView({
      model: this.latestModel,
      width: this.app.screen.width,
      height: this.app.screen.height,
      selectedCardIndex: selected,
      isLocalCardPlayable: this.host.isLocalCardPlayable
    });

    const prevTrickIds = new Set((this.view?.trick ?? []).map((t) => t.card.id));
    const nextTrickIds = new Set(nextView.trick.map((t) => t.card.id));
    const trickCleared = prevTrickIds.size > 0 && nextTrickIds.size === 0;
    const addedTrick = nextView.trick.filter((t) => !prevTrickIds.has(t.card.id));
    const gen = ++this.syncGeneration;
    const animateIds = forceLayout ? [] : addedTrick.map((t) => t.card.id);

    this.view = nextView;
    if (this.trumpText) this.trumpText.text = nextView.trumpLabel;

    void this.ensureTextures(nextView).then(() => {
      if (this.destroyed || gen !== this.syncGeneration || !this.view) return;
      const view = this.view;
      this.redrawOpponents(view);
      this.redrawSeatLabels(view);
      this.redrawHand(view, forceLayout);
      if (trickCleared && !forceLayout) {
        this.animateTrickClear(() => {
          if (this.destroyed || gen !== this.syncGeneration || !this.view) return;
          this.redrawTrick(this.view, true, []);
        });
      } else {
        this.redrawTrick(view, forceLayout, animateIds);
      }
    });
  }

  private async ensureTextures(view: PixiTableViewModel): Promise<void> {
    const jobs: Array<Promise<void>> = [];
    const consider = (key: string, card: Card) => {
      if (this.textureCache.has(key)) return;
      const existing = this.pendingLoads.get(key);
      if (existing) {
        jobs.push(existing);
        return;
      }
      const url = this.host.getCardImage(card);
      const job = Assets.load(url)
        .then((tex: Texture) => {
          if (!this.destroyed) this.textureCache.set(key, tex);
        })
        .catch(() => {
          /* leave missing; sprite skipped until next sync */
        })
        .finally(() => {
          this.pendingLoads.delete(key);
        });
      this.pendingLoads.set(key, job);
      jobs.push(job);
    };
    view.localHand.forEach((c) => consider(c.textureKey, c.card));
    view.trick.forEach((c) => consider(c.textureKey, c.card));
    if (jobs.length) await Promise.all(jobs);
  }

  private textureFor(key: string): Texture | null {
    return this.textureCache.get(key) ?? null;
  }

  private redrawOpponents(view: PixiTableViewModel): void {
    if (!this.root) return;
    this.opponentBacks.forEach((s) => s.destroy());
    this.opponentBacks = [];
    const { opponentCardWidth, opponentCardHeight } = view.layout;
    const backTex = this.textureFor(BACK_ALIAS);

    view.opponents.forEach((opp) => {
      opp.backPositions.forEach((pos) => {
        let sprite: Sprite;
        if (backTex) {
          sprite = new Sprite(backTex);
        } else {
          sprite = Sprite.from(Texture.WHITE);
          sprite.tint = 0x1e3a8a;
        }
        sprite.anchor.set(0.5);
        sprite.width = opponentCardWidth;
        sprite.height = opponentCardHeight;
        sprite.x = pos.x;
        sprite.y = pos.y;
        sprite.zIndex = 5;
        if (opp.compass === 'west' || opp.compass === 'east') {
          sprite.rotation = Math.PI / 2;
        }
        this.root!.addChild(sprite);
        this.opponentBacks.push(sprite);
      });
    });
  }

  private redrawSeatLabels(view: PixiTableViewModel): void {
    const model = this.latestModel;
    if (!model || !this.root) return;
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
        label = new Text({
          text,
          style: {
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            fontSize: 13,
            fill: 0xffffff
          }
        });
        label.anchor.set(0.5);
        label.zIndex = 40;
        this.root!.addChild(label);
        this.seatLabels.set(seat.index, label);
      } else {
        label.text = text;
      }
      label.x = anchor.x;
      label.y = labelY;
      label.style.fill = seat.isActive ? 0xffe566 : 0xffffff;
    });

    Array.from(this.seatLabels.keys()).forEach((idx) => {
      if (!keep.has(idx)) {
        this.seatLabels.get(idx)?.destroy();
        this.seatLabels.delete(idx);
      }
    });
  }

  private redrawHand(view: PixiTableViewModel, instant: boolean): void {
    if (!this.root) return;
    const keep = new Set<string>();
    const { cardWidth, cardHeight } = view.layout;

    view.localHand.forEach((entity) => {
      const id = entity.card.id;
      keep.add(id);
      const tex = this.textureFor(entity.textureKey);
      if (!tex) return;

      let sprite = this.handSprites.get(id);
      const yLift = entity.selected ? -16 : 0;
      const targetX = entity.position.x;
      const targetY = entity.position.y + yLift;

      if (!sprite) {
        sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = targetX;
        sprite.y = targetY;
        sprite.zIndex = 20;
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.on('pointertap', () => this.handleHandTap(id));
        this.root!.addChild(sprite);
        this.handSprites.set(id, sprite);
      } else if (sprite.texture !== tex) {
        sprite.texture = tex;
      }

      sprite.width = cardWidth;
      sprite.height = cardHeight;
      sprite.alpha = entity.playableHint || !view.interactionEnabled ? 1 : 0.55;
      sprite.eventMode = view.interactionEnabled ? 'static' : 'none';
      sprite.cursor = view.interactionEnabled ? 'pointer' : 'default';

      if (instant) {
        sprite.x = targetX;
        sprite.y = targetY;
      } else {
        this.tweens.add({
          target: sprite,
          to: { x: targetX, y: targetY },
          durationMs: 120,
          ease: easeOutSine
        });
      }
    });

    Array.from(this.handSprites.keys()).forEach((id) => {
      if (!keep.has(id)) {
        this.handSprites.get(id)?.destroy();
        this.handSprites.delete(id);
      }
    });
  }

  private handleHandTap(cardId: string): void {
    if (!this.view?.interactionEnabled) return;
    if (Date.now() < this.clickLockUntil) return;
    const idx = this.view.localHand.find((h) => h.card.id === cardId)?.cardIndex;
    if (idx === undefined) return;
    this.clickLockUntil = Date.now() + 180;
    this.host.onLocalCardClick?.(idx);
  }

  private redrawTrick(
    view: PixiTableViewModel,
    instant: boolean,
    animateIds: string[]
  ): void {
    if (!this.root) return;
    const keep = new Set<string>();
    const { cardWidth, cardHeight } = view.layout;
    const animate = new Set(animateIds);

    view.trick.forEach((entity) => {
      const id = entity.card.id;
      keep.add(id);
      const tex = this.textureFor(entity.textureKey);
      if (!tex) return;

      let sprite = this.trickSprites.get(id);
      if (!sprite) {
        const handSprite = this.handSprites.get(id);
        const shouldAnimate = !instant && animate.has(id);
        const startX = handSprite?.x ?? entity.position.x;
        const startY = handSprite?.y ?? entity.position.y;
        sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = shouldAnimate ? startX : entity.position.x;
        sprite.y = shouldAnimate ? startY : entity.position.y;
        sprite.width = cardWidth;
        sprite.height = cardHeight;
        sprite.zIndex = 30;
        this.root!.addChild(sprite);
        this.trickSprites.set(id, sprite);
        if (handSprite) {
          handSprite.destroy();
          this.handSprites.delete(id);
        }
        if (shouldAnimate) {
          this.tweens.add({
            target: sprite,
            to: { x: entity.position.x, y: entity.position.y },
            durationMs: 220,
            ease: easeOutCubic
          });
        }
      } else {
        if (sprite.texture !== tex) sprite.texture = tex;
        if (instant) {
          sprite.x = entity.position.x;
          sprite.y = entity.position.y;
        }
        sprite.width = cardWidth;
        sprite.height = cardHeight;
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
        target: sprite,
        to: { alpha: 0, y: sprite.y - 36 },
        durationMs: 200,
        ease: easeInQuad,
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
