# Kenney Playing Cards Pack — provenance

| Field | Value |
|-------|--------|
| Pack id | `kenney` (faces) · `kenney-01` (back) |
| Runtime faces | `frontend/public/assets/cards/kenney/` (52 PNG) |
| Runtime back | `frontend/public/assets/card-backs/kenney-01.png` |
| Source | [Kenney Playing Cards Pack](https://kenney.nl/assets/playing-cards-pack) |
| Author | Kenney (www.kenney.nl) |
| Licence | **CC0 1.0** — verified in pack `License.txt` (not site policy alone) |
| Creation date (pack) | 01-12-2020 |
| Retrieval date | 2026-09-28 (REL-DECK-01D Batch 3) |
| Download | `kenney_playing-cards-pack.zip` (asset page media) |
| Source set used | `PNG/Cards (large)/` — 64×64 pixel art |

## Conversion

1. `card_{suit}_{rank}.png` → `{Rank}_of_{Suit}.png` (e.g. `card_spades_A.png` → `Ace_of_Spades.png`).
2. Upscaled **6×** with **nearest-neighbour** (384×384) to preserve crisp pixels.
3. Single traditional back: `card_back.png` → `kenney-01.png` (same scale).
4. Medium/small sizes, Uno-style `color_*` cards, jokers, and dice not imported.
5. No SVG conversion (source is PNG).

Staging script: `_temp/deck-batch3/import-batch3.py`.

## Attribution

CC0 — not mandatory. Courtesy: Kenney (www.kenney.nl).

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
