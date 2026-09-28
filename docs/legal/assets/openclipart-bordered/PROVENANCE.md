# openclipart-bordered — provenance

| Field | Value |
|-------|--------|
| Pack id | `openclipart-bordered` |
| Runtime path | `frontend/public/assets/cards/openclipart-bordered/` (52 PNG faces) |
| Source category | [OpenClipart bordered playing cards](https://commons.wikimedia.org/wiki/Category:OpenClipart_bordered_playing_cards) |
| Author | Nicu Buculei (Open Clip Art Library) |
| Licence | **CC0 1.0 / PD-OpenClipart** (per-file Commons metadata) |
| Retrieval date | 2026-09-28 (REL-DECK-02B Batch 4) |
| Jokers | Not imported (`Bordered jk b/r.svg` excluded) |

## Representative file pages (licence checked via Commons API)

| File | LicenceShortName |
|------|------------------|
| File:Bordered s a.svg | CC0 |
| File:Bordered h 10.svg | CC0 |
| File:Bordered c j.svg | CC0 |

All 52 standard face files resolved via Commons `imageinfo` + `extmetadata` and asserted CC0/public-domain before download.

## Conversion

1. Download SVG from Commons upload URLs.
2. Rasterize with `@resvg/resvg-js`, `fitTo` width **366**, transparent background (aspect 140×190 preserved → **366×497**).
3. Rename `Bordered {c\|d\|h\|s} {a\|2–10\|j\|q\|k}.svg` → `{Rank}_of_{Suit}.png`.

Staging script: `_temp/deck-batch4/import-batch4.mjs` (not shipped).

## Attribution

CC0 — attribution not required. Courtesy: Nicu Buculei / OpenClipart.

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
