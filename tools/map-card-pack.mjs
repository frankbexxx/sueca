#!/usr/bin/env node
/**
 * Maps imported card pack filenames to SUECÂO convention: Rank_of_Suit.png
 * Usage: node tools/map-card-pack.mjs --input ./import --output ./frontend/public/assets/cards2 [--dry-run]
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

const COMPACT_SUIT = { s: 'Spades', h: 'Hearts', c: 'Clubs', d: 'Diamonds' };
const COMPACT_RANK = {
  '1': 'Ace', '11': 'Jack', '12': 'Queen', '13': 'King',
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
};

const BACK_ALIASES = new Set([
  'card_back', 'cardback', 'back', 'card-back', 'deck_back', 'deckback'
]);

function parseArgs() {
  const args = process.argv.slice(2);
  let input = 'frontend/public/assets/cards-pack-import';
  let output = 'frontend/public/assets/cards2';
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') input = args[++i];
    else if (args[i] === '--output') output = args[++i];
    else if (args[i] === '--dry-run') dryRun = true;
  }
  return { input, output, dryRun };
}

function rankFromToken(token) {
  const t = token.toLowerCase();
  return RANK_ALIASES[t] || (COMPACT_RANK[t] ?? null);
}

function suitFromToken(token) {
  const t = token.toLowerCase();
  return SUIT_ALIASES[t] || COMPACT_SUIT[t] || null;
}

function normalizeName(filename) {
  const ext = path.extname(filename) || '.png';
  const base = path.basename(filename, ext).toLowerCase();

  if (base === 'back_blue') return `card_back${ext}`;
  if (base === 'back_red') return `card_back_red${ext}`;

  if (BACK_ALIASES.has(base)) {
    return `card_back${ext}`;
  }

  const compact = base.match(/^(\d{1,2})([shdc])$/);
  if (compact) {
    const rank = COMPACT_RANK[compact[1]];
    const suit = COMPACT_SUIT[compact[2]];
    if (rank && suit) return `${rank}_of_${suit}${ext}`;
  }

  const parts = base.split(/[_\-\s]+/).filter(Boolean);
  let rank;
  let suit;

  for (const p of parts) {
    const r = rankFromToken(p);
    const s = suitFromToken(p);
    if (r) rank = r;
    if (s) suit = s;
  }

  const cardSpades = base.match(/^cardspades_(.+)$/);
  if (cardSpades) {
    rank = rankFromToken(cardSpades[1]) || rank;
    suit = 'Spades';
  }
  const cardHearts = base.match(/^cardhearts_(.+)$/);
  if (cardHearts) {
    rank = rankFromToken(cardHearts[1]) || rank;
    suit = 'Hearts';
  }
  const cardDiamonds = base.match(/^carddiamonds_(.+)$/);
  if (cardDiamonds) {
    rank = rankFromToken(cardDiamonds[1]) || rank;
    suit = 'Diamonds';
  }
  const cardClubs = base.match(/^cardclubs_(.+)$/);
  if (cardClubs) {
    rank = rankFromToken(cardClubs[1]) || rank;
    suit = 'Clubs';
  }

  if (parts.length >= 2 && !rank) {
    rank = rankFromToken(parts[0]) || RANK_ALIASES[parts[0]];
    suit = suitFromToken(parts[parts.length - 1]);
  }

  if (!rank || !suit) return null;
  const suitCap = SUIT_ALIASES[suit.toLowerCase()] || suit;
  return `${rank}_of_${suitCap}${ext}`;
}

function main() {
  const { input, output, dryRun } = parseArgs();
  if (!fs.existsSync(input)) {
    console.error(`Input folder missing: ${input}`);
    process.exit(1);
  }
  if (!dryRun) fs.mkdirSync(output, { recursive: true });
  const files = fs.readdirSync(input).filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  let mapped = 0;
  for (const f of files) {
    const target = normalizeName(f);
    if (!target) {
      console.warn(`Skip (unparsed): ${f}`);
      continue;
    }
    if (dryRun) {
      console.log(`${f} -> ${target}`);
    } else {
      fs.copyFileSync(path.join(input, f), path.join(output, target));
    }
    mapped++;
  }
  console.log(`${dryRun ? 'Would map' : 'Mapped'} ${mapped} files to ${output}`);
  if (dryRun) return;

  const outFiles = fs.readdirSync(output).filter((f) => f.includes('_of_'));
  const hasBack = fs.readdirSync(output).some((f) => /^card_back\./i.test(f));
  console.log(`Cards in output: ${outFiles.length} (target 52 for standard deck)`);
  console.log(`Card back: ${hasBack ? 'yes' : 'MISSING — add card_back.png to import folder'}`);
  if (outFiles.length < 40) {
    console.warn('CHECKLIST: fewer than 40 card images — Sueca may show broken images.');
    process.exitCode = 1;
  }
}

main();
