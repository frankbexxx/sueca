/**
 * Phaser helpers for REL-DECK-SIZE-02 contained card art inside a 5:7 frame.
 */

import Phaser from 'phaser';
import {
  CARD_FACE_PLATE_COLOR,
  containDisplaySize,
  containedFrameHitArea
} from '../../constants/cardDisplayContract';

export function texturePixelSize(image: Phaser.GameObjects.Image): {
  width: number;
  height: number;
} {
  const frame = image.frame;
  return {
    width: Math.max(1, frame.realWidth || frame.width || 1),
    height: Math.max(1, frame.realHeight || frame.height || 1)
  };
}

/** Size + place art with contain; returns art display size. */
export function setContainedCardArt(
  image: Phaser.GameObjects.Image,
  frameWidth: number,
  frameHeight: number
): { width: number; height: number } {
  const tex = texturePixelSize(image);
  const art = containDisplaySize(frameWidth, frameHeight, tex.width, tex.height);
  image.setDisplaySize(art.width, art.height);
  return art;
}

/**
 * Interactive hit covering the full outer frame (texture-local coords).
 * Prefer this over default-frame when art is letterboxed inside the plate.
 */
export function setContainedCardHitArea(
  image: Phaser.GameObjects.Image,
  frameWidth: number,
  frameHeight: number,
  artWidth: number,
  artHeight: number,
  enabled: boolean
): void {
  if (!enabled) {
    image.disableInteractive();
    return;
  }
  const tex = texturePixelSize(image);
  const hit = containedFrameHitArea(
    frameWidth,
    frameHeight,
    tex.width,
    tex.height,
    artWidth,
    artHeight
  );
  image.setInteractive(
    new Phaser.Geom.Rectangle(hit.x, hit.y, hit.width, hit.height),
    Phaser.Geom.Rectangle.Contains
  );
  if (image.input) {
    image.input.cursor = 'pointer';
  }
}

/** Opaque ivory plate matching the outer 5:7 silhouette. */
export function createCardFacePlate(
  scene: Phaser.Scene,
  x: number,
  y: number,
  frameWidth: number,
  frameHeight: number,
  depth: number,
  angleDeg = 0
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(x, y, frameWidth, frameHeight, CARD_FACE_PLATE_COLOR, 1)
    .setDepth(depth)
    .setAngle(angleDeg);
}
