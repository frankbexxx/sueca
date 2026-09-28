# Woodcut — provenance

| Field | Value |
|-------|--------|
| Pack id | `woodcut` (faces) · `woodcut-01` (back) |
| Runtime faces | `frontend/public/assets/cards/woodcut/` (52 PNG) |
| Runtime back | `frontend/public/assets/card-backs/woodcut-01.png` |
| Source repository | [SONDLecT/woodcut-cards](https://github.com/SONDLecT/woodcut-cards) |
| Licence | **CC0 1.0** — see `LICENSE` (copy from upstream) |
| Upstream commit | `29f062e550f0b8add3a9ba31f706cc610e370b39` |
| Retrieval date | 2026-09-28 (REL-DECK-01C Batch 2) |
| Source faces | `cards/*.svg` (pips/aces) + `colori/{J,Q,K}{C,D,H,S}.svg` (full-colour courts) |
| Source back | `cards/back.svg` |

## Conversion

1. Compact ids `AS.svg` … `KH.svg` → `Ace_of_Spades.png` … `King_of_Hearts.png`.
2. Rasterized with **@resvg/resvg-js** (`fitTo` width **352**, transparent background).
3. Output size **352×493** (source viewBox 250×350, aspect preserved).
4. Jokers / bonus cards not imported.
5. Courts prefer `colori/` (stencil colour); number cards and aces from `cards/`.

Script (staging, not shipped): `_temp/deck-batch2/import-batch2.mjs`.

## Attribution

CC0 — attribution not required. Courtesy: woodcut-cards by SONDLecT / Dicebox.

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
