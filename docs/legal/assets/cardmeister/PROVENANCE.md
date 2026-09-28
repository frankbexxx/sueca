# CardMeister — provenance

| Field | Value |
|-------|--------|
| Pack id | `cardmeister` |
| Runtime path | `frontend/public/assets/cards-cardmeister/` (52 PNG faces) |
| Source project | [cardmeister/cardmeister.github.io](https://github.com/cardmeister/cardmeister.github.io) |
| Author | Danny Engelman |
| Licence | **Unlicense** (public domain dedication) — see `UNLICENSE.txt` |
| Licence URL | https://choosealicense.com/licenses/unlicense/ · http://unlicense.org |
| Upstream site | https://cardmeister.github.io |
| Retrieval / local source | `_temp/cardmeister-src/` (gitignored staging; `elements.cardmeister.full.js` + README) |
| Retrieval date (documented) | 2026-09-28 (REL-DECK-01B) |
| First shipped in git | `0d78226` (2026-09-14) |

## Derivation

Runtime faces are **PNG rasters** of CardMeister `<playing-card>` SVG output:

- Script: `_temp/cardmeister-sample/export-full-deck.mjs`
- Source JS: `elements.cardmeister.full.js`
- Output size: 352×512 PNG
- Registry UI label: “Classic Vector” (Suecão naming only — not a separate product)

Byte check (REL-LEGAL-01A): runtime `Ace_of_Spades.png` matches sample `default_A_Spades.png`.

## Notes

- Upstream README states Unlicense; a local `package.json` copy also labels `CC0` — both are permissive / public-domain style. Tracked copy is Unlicense per README.
- Attribution is **not required** under Unlicense. Courtesy credit welcome: “Card faces derived from CardMeister by Danny Engelman.”
- Visuals unchanged in REL-DECK-01B (documentation only).

## Disclaimer

This ledger records local provenance for release hygiene. It does not replace counsel review.
