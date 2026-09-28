# minicards — provenance

| Field | Value |
|-------|--------|
| Pack id | `minicards` |
| Runtime path | `frontend/public/assets/cards/minicards/` (52 PNG faces) |
| Source category | [SVG playing cards 5](https://commons.wikimedia.org/wiki/Category:SVG_playing_cards_5) |
| Author | ToasterCoder |
| Licence | **CC0 1.0** (per-file Commons metadata) |
| Retrieval date | 2026-09-28 (REL-DECK-02B Batch 4) |
| Native SVG size | ~57×88 |
| Extras excluded | Rank **11**, special **u** suit/rank variants, jokers |

## Representative file pages (licence checked via Commons API)

| File | LicenceShortName |
|------|------------------|
| File:Minicard AS.svg | CC0 |
| File:Minicard 10H.svg | CC0 |
| File:Minicard JC.svg | CC0 |

All 52 standard face files resolved via Commons `imageinfo` + `extmetadata` and asserted CC0 before download.

## Conversion

1. Download SVG from Commons (vector source — not bitmap upscale of 57×88 raster).
2. Rasterize with `@resvg/resvg-js`, `fitTo` width **384**, transparent background (aspect preserved → **384×593**).
3. Rename `Minicard {A\|2–10\|J\|Q\|K}{C\|D\|H\|S}.svg` → `{Rank}_of_{Suit}.png`.

Staging script: `_temp/deck-batch4/import-batch4.mjs` (not shipped).

## Attribution

CC0 — attribution not required. Courtesy: ToasterCoder / Wikimedia Commons SVG playing cards 5.

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
