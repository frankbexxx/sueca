# Saul Spatz SVGCards — provenance

| Field | Value |
|-------|--------|
| Pack ids (faces) | `jumbo-2`, `fourcolour`, `accessible` |
| Pack ids (backs) | `saul-blue-01`, `saul-red-01` |
| Runtime faces | `frontend/public/assets/cards/{jumbo-2,fourcolour,accessible}/` (52 PNG each) |
| Runtime backs | `frontend/public/assets/card-backs/saul-{blue,red}-01.png` |
| Source repository | [saulspatz/SVGCards](https://github.com/saulspatz/SVGCards) |
| Author | Saul Spatz |
| Licence claim | **Public domain** — upstream README: “Everything in this repository has been placed by the author in the public domain.” |
| Upstream commit | `f8df28774736ea2545fc8e7fb693eb55ce031945` |
| Retrieval date | 2026-09-28 (REL-DECK-01C Batch 2) |

## Source folders used

| Suecão id | Upstream path |
|-----------|----------------|
| `jumbo-2` | `Decks/Vertical2/svgs/` |
| `fourcolour` | `Decks/Vertical4/svgs/` |
| `accessible` | `Decks/Accessible/Vertical/svgs/` |
| backs | `Decks/Vertical2/svgs/{blue,red}Back.svg` (identical bytes across Vertical2/4/Accessible) |

Horizontal variants were **not** imported in Batch 2.

## Upstream graphical sources (as stated by author)

README acknowledgements:

- Court / picture graphics: Byron Knoll playing-card set (Wikimedia; stated public domain)
- Backs: www.openclipart.org (stated public domain at retrieval by author)
- Jokers: Brian Knoll / Wikimedia (stated public domain)

Author states small non-consequential changes (incl. colours). This ledger does not independently re-audit each Wikimedia/Openclipart file beyond the README claim.

## Conversion

1. Filenames `spadeAce.svg` → `Ace_of_Spades.png`, `clubJack.svg` → `Jack_of_Clubs.png`, etc.
2. Rasterized with **@resvg/resvg-js** (`fitTo` width **352**, transparent background).
3. Output size **352×528** (SVG 210×315, aspect preserved).
4. Upstream PNG exports are 75×113 — **not** used (too small); SVGs preferred.
5. Jokers not imported.

Script (staging): `_temp/deck-batch2/import-batch2.mjs`.

## Attribution

Public-domain dedication — attribution not required. Courtesy: Saul Spatz SVGCards; Byron Knoll / Openclipart source art as noted upstream.

## Disclaimer

Local provenance for release hygiene; does not replace counsel review. Do not overstate beyond README + licence excerpt.
