#!/usr/bin/env node
/** Generates minimal SVG placeholders for standard 52-card naming. */
import fs from 'fs';
import path from 'path';

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
const suitColor = { Clubs: '#1a1a1a', Spades: '#1a1a1a', Hearts: '#c0392b', Diamonds: '#c0392b' };
const outDir = path.join(process.cwd(), 'frontend/public/assets/cards2');

fs.mkdirSync(outDir, { recursive: true });

for (const suit of suits) {
  for (const rank of ranks) {
    const name = `${rank}_of_${suit}.svg`;
    const label = rank === '10' ? '10' : rank[0];
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="200" viewBox="0 0 140 200">
  <rect width="140" height="200" rx="8" fill="#faf8f5" stroke="#333" stroke-width="2"/>
  <text x="70" y="100" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="${suitColor[suit]}">${label}</text>
  <text x="70" y="130" text-anchor="middle" font-size="14" fill="#666">${suit}</text>
</svg>`;
    fs.writeFileSync(path.join(outDir, name), svg);
  }
}

const back = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="200" viewBox="0 0 140 200">
  <rect width="140" height="200" rx="8" fill="#1e4d3a" stroke="#0d2818" stroke-width="2"/>
  <text x="70" y="105" text-anchor="middle" font-family="system-ui" font-size="18" fill="#c9e4d4">SUECÂO</text>
</svg>`;
fs.writeFileSync(path.join(outDir, 'card_back.svg'), back);
console.log(`Wrote ${ranks.length * suits.length + 1} SVGs to ${outDir}`);
