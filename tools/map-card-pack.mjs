#!/usr/bin/env node
/**
 * Maps imported card pack filenames to SUECÂO convention: Rank_of_Suit.png
 * Usage: node tools/map-card-pack.mjs --input ./import --output ./frontend/public/assets/cards2
 */
import fs from 'fs';
import path from 'path';

const RANK_ALIASES = {
  ace: 'Ace', a: 'Ace', '1': 'Ace',
  king: 'King', k: 'King',
  queen: 'Queen', q: 'Queen',
  jack: 'Jack', j: 'Jack',
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
};
const SUIT_ALIASES = {
  clubs: 'Clubs', club: 'Clubs', c: 'Clubs',
  diamonds: 'Diamonds', diamond: 'Diamonds', d: 'Diamonds',
  hearts: 'Hearts', heart: 'Hearts', h: 'Hearts',
  spades: 'Spades', spade: 'Spades', s: 'Spades'
};

function parseArgs() {
  const args = process.argv.slice(2);
  let input = 'frontend/public/assets/cards-pack-import';
  let output = 'frontend/public/assets/cards2';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') input = args[++i];
    else if (args[i] === '--output') output = args[++i];
  }
  return { input, output };
}

function normalizeName(filename) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  const parts = base.split(/[_\-\s]+/).filter(Boolean);
  let rank;
  let suit;
  for (const p of parts) {
    if (RANK_ALIASES[p]) rank = RANK_ALIASES[p];
    if (SUIT_ALIASES[p]) suit = SUIT_ALIASES[p];
  }
  if (parts.length >= 2 && !rank) {
    rank = RANK_ALIASES[parts[0]] || parts[0];
    suit = SUIT_ALIASES[parts[parts.length - 1]] || parts[parts.length - 1];
  }
  if (!rank || !suit) return null;
  const suitCap = SUIT_ALIASES[suit.toLowerCase()] || (suit.charAt(0).toUpperCase() + suit.slice(1));
  return `${rank}_of_${suitCap}${path.extname(filename) || '.png'}`;
}

function main() {
  const { input, output } = parseArgs();
  if (!fs.existsSync(input)) {
    console.error(`Input folder missing: ${input}`);
    process.exit(1);
  }
  fs.mkdirSync(output, { recursive: true });
  const files = fs.readdirSync(input).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  let mapped = 0;
  for (const f of files) {
    const target = normalizeName(f);
    if (!target) {
      console.warn(`Skip (unparsed): ${f}`);
      continue;
    }
    fs.copyFileSync(path.join(input, f), path.join(output, target));
    mapped++;
  }
  console.log(`Mapped ${mapped} files to ${output}`);
  const expected = 52;
  const outFiles = fs.readdirSync(output).filter((f) => f.includes('_of_'));
  console.log(`Cards in output: ${outFiles.length} (target ${expected} for standard deck)`);
  if (outFiles.length < 40) {
    console.warn('CHECKLIST: fewer than 40 card images — Sueca may show broken images.');
    process.exitCode = 1;
  }
}

main();
