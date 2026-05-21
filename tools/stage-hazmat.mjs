#!/usr/bin/env node
/**
 * Flatten Hazmat "Hand Drawn Cards" pack into cards-pack-import/hazmat/
 * Usage: node tools/stage-hazmat.mjs [--input _temp/Hand Drawn Cards] [--output frontend/public/assets/cards-pack-import/hazmat]
 */
import fs from 'fs';
import path from 'path';

const SUIT_DIRS = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
const BACK_RENAMES = [
  ['Back Blue.png', 'Back_Blue.png'],
  ['Back Red.png', 'Back_Red.png']
];

function parseArgs() {
  const args = process.argv.slice(2);
  let input = '_temp/Hand Drawn Cards';
  let output = 'frontend/public/assets/cards-pack-import/hazmat';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') input = args[++i];
    else if (args[i] === '--output') output = args[++i];
  }
  return { input, output };
}

function main() {
  const { input, output } = parseArgs();
  if (!fs.existsSync(input)) {
    console.error(`Input folder missing: ${input}`);
    process.exit(1);
  }
  fs.mkdirSync(output, { recursive: true });
  let copied = 0;
  for (const dir of SUIT_DIRS) {
    const suitPath = path.join(input, dir);
    if (!fs.existsSync(suitPath)) {
      console.warn(`Missing suit folder: ${suitPath}`);
      continue;
    }
    for (const f of fs.readdirSync(suitPath)) {
      if (!/\.png$/i.test(f)) continue;
      fs.copyFileSync(path.join(suitPath, f), path.join(output, f));
      copied++;
    }
  }
  for (const [srcName, destName] of BACK_RENAMES) {
    const src = path.join(input, srcName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(output, destName));
      copied++;
    } else {
      console.warn(`Missing back: ${srcName}`);
    }
  }
  console.log(`Staged ${copied} files to ${output}`);
  const cards = fs.readdirSync(output).filter((f) => /\.png$/i.test(f) && !/^back_/i.test(f));
  console.log(`Face cards: ${cards.length} (expect 52)`);
}

main();
