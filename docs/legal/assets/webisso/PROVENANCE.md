# Webisso playing-cards — provenance

| Field | Value |
|-------|--------|
| Pack id | `webisso` |
| Runtime faces | `frontend/public/assets/cards/webisso/` (52 PNG) |
| Source repository | [Webisso/playing-cards](https://github.com/Webisso/playing-cards) |
| Live demo | https://webisso.github.io/playing-cards/ |
| Author | Webisso LLC |
| Licence | **MIT** — see `LICENSE` (copyright notice must be preserved) |
| Upstream commit | `50a3f7be7d6b7248da5f5c56533e1c5414aefb40` |
| Retrieval date | 2026-09-28 (REL-DECK-01D Batch 3) |
| Source faces | `png/{ace,2…10,jack,queen,king}_of_{clubs,diamonds,hearts,spades}.png` |

## Conversion

1. Renamed to Title_Case: `ace_of_spades.png` → `Ace_of_Spades.png`.
2. Downscaled from **500×726** to **352×512** with LANCZOS (aspect preserved).
3. Jokers and alternate `*2.png` faces not imported.
4. No backs in upstream pack — none invented.

Staging script: `_temp/deck-batch3/import-batch3.py`.

## Attribution (MIT)

Copyright (c) 2026 Webisso LLC — licence text shipped at `docs/legal/assets/webisso/LICENSE`.

## Disclaimer

Local provenance for release hygiene; does not replace counsel review.
