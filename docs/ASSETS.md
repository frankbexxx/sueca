# SUECÃO — Assets (cartas e UX)

**Pesquisa packs:** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md) · **Legal ledgers:** [legal/assets/](legal/assets/) · **NOTICE:** [`../NOTICE`](../NOTICE)
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório (REL-DECK-01D Batch 3 — library complete)

| Pack | Path | Estado |
|------|------|--------|
| Faces default | `cards-cardmeister/` | CardMeister — **default** |
| Faces | `cards/pd-ornate/` | AustinGabriel CC0 |
| Faces | `cards/woodcut/` | SONDLecT CC0 |
| Faces | `cards/jumbo-2/` · `fourcolour/` · `accessible/` | Saul Spatz PD |
| Faces | `cards/kenney/` | Kenney CC0 pixel (384×384 NN×6) |
| Faces | `cards/webisso/` | Webisso MIT (352×512) |
| Backs (**19**) | `card-backs/` | suecao×5 · sylly×6 · woodcut · saul×2 · ornate×4 · kenney |
| Legal | `docs/legal/assets/{cardmeister,pd-ornate,sylly,woodcut,saul-svgcards,kenney,webisso,suecao-backs}/` | |
| Hayeah | — | **SKIPPED** (visual duplication) — see `hayeah-SKIPPED.md` |

**Removido (Batch 1):** Casino `cards3/` + hazmat-red. Theme back mappings unchanged since Batch 1.

### Registry

| Id | Tipo | Notas |
|----|------|-------|
| `cardmeister` | deck (**default**) | |
| `pd-ornate` · `woodcut` · `jumbo-2` · `fourcolour` · `accessible` · `kenney` · `webisso` | deck | |
| `suecao-navy` | back (**fallback**) | |
| `sylly-01`…`06` · `woodcut-01` · `saul-*` · `ornate-*` · `kenney-01` · `suecao-{burgundy,forest,charcoal,gold}` | back | |

### Credits / attribution (REL-LEGAL-01B)

Runtime Credits (modal + Profile) match shipping assets only:

- **No** Hazmat / DOBO / Casino pack lines in UI
- Grouped: Cartas · Versos · Som · Música · Agradecimentos
- Product line: `Suecão · 2026` (owner of record not established — soft wording)
- MIT Webisso copyright/licence text retained in root `NOTICE`
- CC0/PD sources get courtesy credit without implying mandatory attribution

### Planned later

- Optional theme back reassignment polish
- Optional sharper Sylly vector re-export
- Formal music store-clearance counsel pass

## Critérios / integração

Ver batches anteriores. Ledger obrigatório em `docs/legal/assets/<id>/`.

## Checklist

- [x] Batch 1: Casino out · CardMeister · pd-ornate · Sylly
- [x] Batch 2: woodcut · Saul×3 · ornate backs
- [x] Batch 3: kenney · webisso · Suecão colourways · Hayeah skipped
- [x] Credits UI / NOTICE polish (REL-LEGAL-01B) — Credits + NOTICE synced; Privacy/Terms/LICENSE still open under REL-LEGAL-01

## Licenças (cartas shipping)

| Asset | Licença | Ledger |
|-------|---------|--------|
| CardMeister | Unlicense | `cardmeister/` |
| pd-ornate + ornate backs | CC0 | `pd-ornate/` |
| woodcut | CC0 | `woodcut/` |
| Saul Spatz decks + backs | Public domain (author) | `saul-svgcards/` |
| Kenney | CC0 (License.txt) | `kenney/` |
| Webisso | MIT | `webisso/` |
| Suecão navy + colourways | Product original / derived | `suecao-backs/` |
| Sylly | CC0 | `sylly/` |
| Casino / Hazmat | **REMOVED** | |

## SFX / Música

### SFX (runtime)

Path: `frontend/public/assets/sfx/`. Catalog: `frontend/src/constants/sfxAssets.ts`. Playback: `audioService` only.

| File | Source (historical ASSETS) | Use |
|------|----------------------------|-----|
| `card-play-1.ogg` | Kenney Casino Audio · card-place-2 (CC0) | Card play variation |
| `card-play-2.ogg` | Kenney Casino Audio · card-place-1 | Variation |
| `card-play-3.ogg` | Kenney Casino Audio · card-slide-3 | Variation |
| `card-shuffle.ogg` | Freesound BMacZero 96130 (CC0 claimed) | Shuffle |
| `deal-1.ogg` | Freesound el_boss 571576 (CC0 claimed) | Deal |
| `trick-collect.ogg` | Freesound KevinHilt 196541 crop (CC0 claimed) | Trick collect |
| `round-start.ogg` / `round-end.ogg` / `game-win.ogg` / `game-lose.ogg` | Suecão NumPy synth + FFmpeg (original) | Round/game cues |
| `error.ogg` | Kenney Interface Sounds · error_001 | Illegal play |
| `ui-click.ogg` | Kenney Interface Sounds · click_002 | UI clicks |

Runtime Credits summarise Kenney.nl + Freesound authors + Suecão synth — **without** the pack marketing name “Casino Audio” (avoids confusion with the removed Casino card pack). Formal store redistribution review remains under REL-LEGAL-01.

### Music (core + remote)

| id | family | licence (historical summary) |
|----|--------|------------------------------|
| `casino-jazz` | Casino Jazz / Lounge | Pixabay Content License |
| `nordic-kalte` | Nordic / Arctic | Pixabay Content License |
| `maghreb-oud` | Maghreb / Middle Eastern | Pixabay Content License |
| `yamatai-shizima` | Japanese / Yamatai | PeriTune Konohana (commercial OK; credit optional) |
| `meso-aztec-relic` | Mesoamerican | StockTune PD/commercial |
| `andes-peruvian` | Andes / Latin | Pixabay Content License |

Remote catalog: 23 R2 beds under the same licence families when `VITE_MUSIC_REMOTE_BASE_URL` is set. **Formal counsel clearance for store redistribution remains open** — do not treat Credits/NOTICE as clearance.
