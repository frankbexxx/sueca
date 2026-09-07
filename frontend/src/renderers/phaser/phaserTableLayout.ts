/**
 * Pure layout math for the Sueca Phaser table (no Phaser imports).
 * Aspect-aware: portrait / landscape / desktop.
 */

export type PhaserCompass = 'south' | 'west' | 'north' | 'east';

export type PhaserAspectMode = 'portrait' | 'landscape' | 'desktop';

export interface PhaserPoint {
  x: number;
  y: number;
}

export interface PhaserHandSlot extends PhaserPoint {
  rotationDeg: number;
  depth: number;
}

export interface PhaserTableLayout {
  width: number;
  height: number;
  aspect: PhaserAspectMode;
  center: PhaserPoint;
  seatAnchor: Record<PhaserCompass, PhaserPoint>;
  handY: number;
  cardWidth: number;
  cardHeight: number;
  opponentCardWidth: number;
  opponentCardHeight: number;
  /** Drop zone radius for optional drag-to-play. */
  dropRadius: number;
  handSpreadMax: number;
}

const COMPASS_FROM_OFFSET: PhaserCompass[] = ['south', 'west', 'north', 'east'];

export function playerIndexToCompass(
  playerIndex: number,
  localPlayerIndex: number
): PhaserCompass {
  const offset = (playerIndex - localPlayerIndex + 4) % 4;
  return COMPASS_FROM_OFFSET[offset] ?? 'south';
}

export function resolveAspectMode(width: number, height: number): PhaserAspectMode {
  const ratio = height / Math.max(1, width);
  if (ratio >= 1.15) return 'portrait';
  if (width / Math.max(1, height) >= 1.45 && height < 520) return 'landscape';
  return 'desktop';
}

export function buildPhaserTableLayout(
  width: number,
  height: number
): PhaserTableLayout {
  const w = Math.max(280, width);
  const h = Math.max(300, height);
  const aspect = resolveAspectMode(w, h);

  let cardWidth: number;
  if (aspect === 'portrait') {
    cardWidth = Math.min(64, Math.max(44, Math.floor(w * 0.12)));
  } else if (aspect === 'landscape') {
    cardWidth = Math.min(58, Math.max(40, Math.floor(h * 0.14)));
  } else {
    cardWidth = Math.min(76, Math.max(50, Math.floor(w * 0.085)));
  }
  const cardHeight = Math.round(cardWidth * 1.4);
  const opponentCardWidth = Math.round(cardWidth * (aspect === 'landscape' ? 0.48 : 0.55));
  const opponentCardHeight = Math.round(cardHeight * (aspect === 'landscape' ? 0.48 : 0.55));

  const marginX =
    aspect === 'landscape'
      ? Math.max(36, Math.floor(w * 0.05))
      : Math.max(44, Math.floor(w * 0.07));
  const marginY =
    aspect === 'portrait'
      ? Math.max(28, Math.floor(h * 0.05))
      : Math.max(32, Math.floor(h * 0.06));

  const handReserve =
    aspect === 'portrait'
      ? Math.max(cardHeight * 0.72, 70)
      : aspect === 'landscape'
        ? Math.max(cardHeight * 0.55, 52)
        : Math.max(cardHeight * 0.6, 60);
  const handY = h - handReserve;

  const centerY =
    aspect === 'portrait'
      ? h * 0.38
      : aspect === 'landscape'
        ? h * 0.4
        : h * 0.42;

  const handSpreadMax =
    aspect === 'portrait' ? w * 0.92 : aspect === 'landscape' ? w * 0.7 : w * 0.78;

  return {
    width: w,
    height: h,
    aspect,
    center: { x: w / 2, y: centerY },
    seatAnchor: {
      south: { x: w / 2, y: handY - cardHeight * 0.42 },
      west: { x: marginX, y: centerY },
      north: { x: w / 2, y: marginY + (aspect === 'landscape' ? 12 : 20) },
      east: { x: w - marginX, y: centerY }
    },
    handY,
    cardWidth,
    cardHeight,
    opponentCardWidth,
    opponentCardHeight,
    dropRadius: Math.max(cardWidth * 1.6, 72),
    handSpreadMax
  };
}

/** Fan positions with slight arc + rotation for local hand. */
export function layoutLocalHandPositions(
  count: number,
  layout: PhaserTableLayout
): PhaserHandSlot[] {
  if (count <= 0) return [];
  const { handY, cardWidth, handSpreadMax } = layout;
  const overlap = count > 7 ? 0.52 : count > 4 ? 0.62 : 0.7;
  const spacing = Math.min(cardWidth * overlap, handSpreadMax / Math.max(count, 1));
  const total = spacing * (count - 1);
  const startX = layout.width / 2 - total / 2;
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => {
    const t = i - mid;
    const arc = Math.abs(t) * (layout.aspect === 'portrait' ? 1.2 : 1.6);
    return {
      x: startX + i * spacing,
      y: handY + arc,
      rotationDeg: t * (layout.aspect === 'landscape' ? 1.4 : 2.2),
      depth: 20 + i
    };
  });
}

export function layoutOpponentBackPositions(
  count: number,
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint[] {
  const anchor = layout.seatAnchor[compass];
  const n = Math.min(count, 10);
  const gap = compass === 'north' || compass === 'south' ? 9 : 7;
  return Array.from({ length: n }, (_, i) => {
    const mid = (n - 1) / 2;
    if (compass === 'west' || compass === 'east') {
      return { x: anchor.x, y: anchor.y + (i - mid) * gap };
    }
    return { x: anchor.x + (i - mid) * gap, y: anchor.y };
  });
}

export function layoutTrickSlot(
  compass: PhaserCompass,
  layout: PhaserTableLayout
): PhaserPoint {
  const { center, cardWidth, cardHeight } = layout;
  const dx = cardWidth * 0.58;
  const dy = cardHeight * 0.42;
  switch (compass) {
    case 'south':
      return { x: center.x, y: center.y + dy };
    case 'north':
      return { x: center.x, y: center.y - dy };
    case 'west':
      return { x: center.x - dx, y: center.y };
    case 'east':
      return { x: center.x + dx, y: center.y };
    default:
      return center;
  }
}

export function pointInDropZone(
  x: number,
  y: number,
  layout: PhaserTableLayout
): boolean {
  const dx = x - layout.center.x;
  const dy = y - layout.center.y;
  return dx * dx + dy * dy <= layout.dropRadius * layout.dropRadius;
}
