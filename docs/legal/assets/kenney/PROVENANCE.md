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

## Conversion (Batch 3)

1. `card_{suit}_{rank}.png` → `{Rank}_of_{Suit}.png` (e.g. `card_spades_A.png` → `Ace_of_Spades.png`).
2. Upscaled **6×** with **nearest-neighbour** (384×384) to preserve crisp pixels.
3. Single traditional back: `card_back.png` → `kenney-01.png` (same scale). **Back not changed in SIZE-03.**
4. Medium/small sizes, Uno-style `color_*` cards, jokers, and dice not imported.
5. No SVG conversion (source is PNG).

Staging script: `_temp/deck-batch3/import-batch3.py`.

## REL-DECK-SIZE-03 — face canvas normalization (2026-09-29)

**Problem:** Batch 3 faces were square **384×384** with large horizontal transparent pad. Measured on all 52 files (identical structure):

| | Value |
|--|--|
| Canvas | 384×384 |
| Visible alpha bbox | (66,12)–(318,372) → **252×360** |
| Occupancy | W **0.656**, H **0.937** |
| Margins T/B/L/R | 12 / 12 / 66 / 66 |

The 252×360 content region is already exact **5:7** (poker). Square canvas + pad made Kenney look much smaller under the SIZE-02 contain/frame contract.

**Process (faces only, all 52):**

1. Crop to meaningful alpha bounds `(66,12,318,372)` → 252×360 (no further content trim; borders retained).
2. Nearest-neighbour resize **4/3** → **336×480** (exact 5:7; equivalent to **8×** the original 42×60 source region inside the 64×64 Kenney large PNG).
3. No LANCZOS / bicubic (avoids blur on pixel art).
4. No stretch; no meaningful-content crop; centered by construction (crop = full card art).
5. Output occupancy after convert: **1.0 × 1.0** (edge-to-edge opaque card).

**Final runtime face size:** **336×480** (uniform 52/52). Ratio **0.7** (7:10) — the Kenney card body aspect after pad removal; ≈2.9% taller than exact poker 5:7 (0.714). Under the SIZE-02 contain frame this fills height and ~98% width (parity with pd-ornate / woodcut).

**Unchanged:** licence evidence, deck id `kenney`, preference migration, card back `kenney-01.png` (still 384×384).

## Attribution

CC0 — not mandatory. Courtesy: Kenney (www.kenney.nl).

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
