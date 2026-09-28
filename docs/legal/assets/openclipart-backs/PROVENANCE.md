# openclipart-backs — provenance

| Field | Value |
|-------|--------|
| Pack ids | `openclipart-01`, `openclipart-01-red`, `openclipart-02` … `openclipart-05` |
| Runtime path | `frontend/public/assets/card-backs/openclipart-*.png` |
| Source category | [OpenClipart playing card backs](https://commons.wikimedia.org/wiki/Category:OpenClipart_playing_card_backs) |
| Author | Nicu Buculei (Open Clip Art Library) |
| Licence | **CC0 1.0 / PD-OpenClipart** |
| Retrieval date | 2026-09-28 (REL-DECK-02B Batch 4) |

## Curation

Inspected **Back01–Back10**.

- Compared SHA-256 of rasterized PNGs against pre-existing shipping backs — **no exact hash duplicates**.
- Prefer **motif diversity** over importing every red/blue twin.
- **Exception (product review):** Back01/Back02 fanned-aces pair — both colours shipped (`openclipart-01` + `openclipart-01-red`) because blue/red variants give useful theme personality.
- Other colour twins (Back04/06/08/10) remain skipped.

## Source mapping

| Suecão ID | Original file | Licence | Notes |
|-----------|---------------|---------|-------|
| `openclipart-01` | Back01.svg | CC0 / PD-OpenClipart | Fanned-aces motif (blue) |
| `openclipart-01-red` | Back02.svg | CC0 / PD-OpenClipart | Same motif (red); pair partner of Back01 |
| `openclipart-02` | Back03.svg | CC0 / PD-OpenClipart | Motif curated |
| `openclipart-03` | Back05.svg | CC0 / PD-OpenClipart | Motif curated |
| `openclipart-04` | Back07.svg | CC0 / PD-OpenClipart | Motif curated |
| `openclipart-05` | Back09.svg | CC0 / PD-OpenClipart | Four-suit outline motif |

## Rejected

| Original | Reason |
|----------|--------|
| Back04.svg | Colour twin of Back03 |
| Back06.svg | Colour twin of Back05 |
| Back08.svg | Colour twin of Back07 |
| Back10.svg | Colour twin of Back09 |

## Registry strategy

- Kept existing `openclipart-01` id for Back01 (no migration churn).
- Added `openclipart-01-red` for Back02 (pair clarity without renaming).

## Conversion

Rasterize SVG `@resvg/resvg-js` width **366**; copy curated PNGs into `card-backs/`.

Staging script: `_temp/deck-batch4/import-batch4.mjs` (not shipped).

## Attribution

CC0 — attribution not required. Courtesy: Nicu Buculei / OpenClipart.

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
