import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Phaser audio policy', () => {
  it('keeps Phaser configured with noAudio: true', () => {
    const src = readFileSync(
      resolve(__dirname, 'SuecaPhaserRenderer.tsx'),
      'utf8'
    );
    expect(src).toMatch(/audio:\s*\{\s*noAudio:\s*true\s*\}/);
  });
});
