/**
 * REL-DECK-SIZE-03 — Kenney face assets normalized to canonical 5:7 canvas.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public'
);
const KENNEY_DIR = path.join(PUBLIC, 'assets/cards/kenney');
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'] as const;
const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades'] as const;
const SAMPLES = [
  'Ace_of_Spades.png',
  '10_of_Hearts.png',
  'Jack_of_Clubs.png',
  'Queen_of_Diamonds.png',
  'King_of_Spades.png'
] as const;

/** Read PNG IHDR width/height without external deps. */
function readPngSize(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
    true
  );
  // IHDR length(4) + type(4) + then width/height
  const type = buf.toString('ascii', 12, 16);
  expect(type).toBe('IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('REL-DECK-SIZE-03 Kenney face assets', () => {
  it('has exactly 52 face PNGs, uniform 336×480 (~5:7), non-corrupt', () => {
    const files = fs
      .readdirSync(KENNEY_DIR)
      .filter((f) => f.endsWith('.png') && f.includes('_of_'));
    expect(files).toHaveLength(52);

    for (const rank of RANKS) {
      for (const suit of SUITS) {
        const name = `${rank}_of_${suit}.png`;
        expect(files).toContain(name);
        const full = path.join(KENNEY_DIR, name);
        expect(fs.statSync(full).size).toBeGreaterThan(500);
        const { width, height } = readPngSize(full);
        expect(width).toBe(336);
        expect(height).toBe(480);
        // Native Kenney card body is 7:10 (0.7); ~2.9% taller than exact poker 5:7 (0.714).
        expect(width / height).toBeCloseTo(0.7, 5);
        expect(Math.abs(width / height - 5 / 7)).toBeLessThan(0.02);
      }
    }
  });

  it('representative cards decode with expected IHDR', () => {
    for (const name of SAMPLES) {
      const { width, height } = readPngSize(path.join(KENNEY_DIR, name));
      expect({ name, width, height }).toEqual({ name, width: 336, height: 480 });
    }
  });
});
