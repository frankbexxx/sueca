# pd-ornate — provenance

| Field | Value |
|-------|--------|
| Pack id | `pd-ornate` |
| Runtime path | `frontend/public/assets/cards/pd-ornate/` (52 PNG faces) |
| Source repository | [AustinGabriel/Public-Domain-and-CC0-Playing-Cards](https://github.com/AustinGabriel/Public-Domain-and-CC0-Playing-Cards) |
| Author / project | AustinGabriel — Public Domain / CC0 Playing Cards |
| Licence | **CC0 1.0** — see `LICENSE` (copy from upstream) |
| Licence URL | https://creativecommons.org/publicdomain/zero/1.0/ |
| Upstream commit | `3765067c32fcef42a30e87022332db729658e7cd` (main @ 2026-09-17) |
| Retrieval date | 2026-09-28 (REL-DECK-01B faces; Batch 2 backs) |
| Source files used | `png cards/card fronts/{clubs,diamonds,hearts,spades}/*.png` (54-card pack; jokers not imported) |
| Runtime backs (Batch 2) | `ornate-blue-01`, `ornate-red-01`, `ornate-blue-02`, `ornate-red-02` under `frontend/public/assets/card-backs/` |

## Modifications

1. Renamed `ace of spades.png` → `Ace_of_Spades.png` (Title_Case `_of_` convention).
2. Downscaled faces from **1500×2100** to **366×512** with LANCZOS (exact 5:7 aspect preserved; no crop/distort).
3. Jokers and bonus face art not imported into runtime deck.
4. **Batch 2 backs:** downscaled main + bonus card backs to height **512** (LANCZOS); registered as `ornate-*` selectable backs (independent of `pd-ornate` faces).

## Disclaimer

This ledger records local provenance for release hygiene. It does not replace counsel review.
