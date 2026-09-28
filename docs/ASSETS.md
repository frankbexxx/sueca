# SUECÂO — Assets (cartas e UX)

**Pesquisa packs:** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md) · **Legal ledgers:** [legal/assets/](legal/assets/)
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório (REL-DECK-01C Batch 2)

| Pack | Path | Estado |
|------|------|--------|
| Faces default | `frontend/public/assets/cards-cardmeister/` | **CardMeister** (52 PNG) — default |
| Faces | `cards/pd-ornate/` | AustinGabriel CC0 ornate |
| Faces | `cards/woodcut/` | SONDLecT woodcut CC0 (352×493) |
| Faces | `cards/jumbo-2/` | Saul Vertical2 public domain (352×528) |
| Faces | `cards/fourcolour/` | Saul Vertical4 |
| Faces | `cards/accessible/` | Saul Accessible Vertical |
| Backs (14) | `card-backs/` | suecao-navy + sylly×6 + woodcut-01 + saul blue/red + ornate×4 |
| Legal | `docs/legal/assets/{cardmeister,pd-ornate,sylly,woodcut,saul-svgcards}/` | PROVENANCE + licence |

**Removido (Batch 1):** `cards3/` Casino + hazmat-red. Themes keep Sylly/Suecão mappings (Batch 2 does not reassign themes).

### Registry

Código: `cardDeckRegistry.ts` + `themeCardVisuals.ts` + `cardAssets.ts` + `cardSkinPreferences.ts`

| Id | Tipo | Path / notas |
|----|------|----------------|
| `cardmeister` | deck (**default**) | `/assets/cards-cardmeister` |
| `pd-ornate` | deck | `/assets/cards/pd-ornate` |
| `woodcut` | deck | `/assets/cards/woodcut` |
| `jumbo-2` | deck | `/assets/cards/jumbo-2` |
| `fourcolour` | deck | `/assets/cards/fourcolour` |
| `accessible` | deck | `/assets/cards/accessible` |
| `suecao-navy` | back (**fallback**) | `/assets/card-backs/suecao-navy` |
| `sylly-01`…`06` | back | `/assets/card-backs/sylly-0N` |
| `woodcut-01` | back | woodcut `back.svg` |
| `saul-blue-01` / `saul-red-01` | back | Saul Vertical2 (shared across Saul decks) |
| `ornate-blue/red-01/02` | back | AustinGabriel card backs |

**API por tema:** `backId` activo (30 temas); `deckId` opcional → default `cardmeister`. Faces/backs independentes.

### Back por tema (Batch 1 mapping retained)

| Tema | backId |
|------|--------|
| `classic` | `suecao-navy` |
| `forest` | `sylly-05` |
| `midnight` | `sylly-03` |
| `thule` | `sylly-05` |
| `hyperborea` | `sylly-02` |
| `skara-brae` | `sylly-02` |
| `avalon` | `sylly-01` |
| `knossos` | `sylly-05` |
| `thebes` | `sylly-01` |
| `cartago` | `sylly-01` |
| `atlantida` | `sylly-05` |
| `babylon` | `sylly-05` |
| `ur` | `sylly-02` |
| `petra` | `sylly-01` |
| `persepolis` | `sylly-02` |
| `axum` | `sylly-01` |
| `meroe` | `sylly-05` |
| `great-zimbabwe` | `suecao-navy` |
| `xanadu` | `suecao-navy` |
| `shambhala` | `sylly-01` |
| `mohenjo-daro` | `sylly-02` |
| `yamatai` | `sylly-03` |
| `angkor` | `suecao-navy` |
| `tikal` | `sylly-05` |
| `teotihuacan` | `sylly-03` |
| `tiwanaku` | `sylly-01` |
| `caral` | `suecao-navy` |
| `el-dorado` | `sylly-05` |
| `rapanui` | `sylly-02` |
| `nanmadol` | `sylly-03` |

### Legacy migration

| Legacy ID | Replacement |
|-----------|-------------|
| `casino` (front) | `cardmeister` |
| `casino-05` | `sylly-05` |
| `casino-06` | `sylly-03` |
| `casino-07` | `sylly-01` |
| `casino-08` | `sylly-02` |
| `hazmat-red` | `suecao-navy` |

### Planned later batches

- Batch 3: Kenney · Webisso · optional hayeah · Suecão colourways; theme back polish; Credits polish
- Optional: sharper Sylly vector re-export

## Critérios para pack de cartas (compra / import)

- PNG transparente **ou** SVG; nomes `{Rank}_of_{Suit}.png`
- Baralho **52** + subset **40** Sueca
- Resolução ≥ ~350px largura; include **card back** separado
- Licença comercial clara; ledger em `docs/legal/assets/<id>/`

## Integrar pack (novo baralho)

1. Fonte: `_temp/` (gitignored) ou download auditado
2. Normalizar para `frontend/public/assets/cards/<deck-id>/`
3. Registar em `CARD_DECKS`; ledger + LICENSE
4. `npm test` + smoke visual

## Checklist

- [x] Batch 1: CardMeister + pd-ornate + Sylly + Casino removal
- [x] Batch 2: woodcut + jumbo-2 + fourcolour + accessible + backs → 14
- [ ] Credits UI polish (deferred)

## SFX (runtime)

Path: `frontend/public/assets/sfx/`. Catalog: `frontend/src/constants/sfxAssets.ts`. Playback: `audioService` only.

### Bundled on disk (wired)

| Ficheiro | Origem (docs attribution) | Uso |
|----------|---------------------------|-----|
| `card-play-1.ogg` | Kenney Casino Audio · card-place-2 (CC0 claimed in Credits) | Jogar carta (variação) |
| `card-play-2.ogg` | Kenney Casino Audio · card-place-1 | Variação |
| `card-play-3.ogg` | Kenney Casino Audio · card-slide-3 | Variação |
| `card-shuffle.ogg` | Freesound BMacZero 96130 (CC0) | Baralhar (após mãos) |
| `deal-1.ogg` | Freesound el_boss 571576 (CC0) | Deal / entrada de mão |
| `trick-collect.ogg` | Freesound KevinHilt 196541 crop (CC0) | Vaza completa |
| `round-start.ogg` | Suecão NumPy synth + FFmpeg (original) | Início de ronda |
| `round-end.ogg` | Suecão NumPy synth + FFmpeg (original) | Fim de ronda intermédia |
| `game-win.ogg` | Suecão NumPy synth + FFmpeg (original) | Vitória final |
| `game-lose.ogg` | Suecão NumPy synth + FFmpeg (original) | Derrota final |
| `error.ogg` | Kenney Interface Sounds · error_001 | Jogada ilegal (visual is primary) |
| `ui-click.ogg` | Kenney Interface Sounds · click_002 | Cliques UI (`.sueca-btn`, `.lang-btn`) |

**Licensing note:** Kenney / Freesound attributions follow historical project Credits. Formal commercial licence review remains under `REL-LEGAL-01` — do not treat this table as legal clearance.

## Música de ambiente (core v1 — híbrido)

Arquitectura: **D — HYBRID** — 6 core bundled + **23 remote R2**; Android cache-first; web stream-direct.

### 6 faixas core (bundled)

| id | família | licença (resumo) |
|----|---------|------------------|
| `casino-jazz` | Casino Jazz / Lounge | Pixabay Content License |
| `nordic-kalte` | Nordic / Dark / Forest fallback | Pixabay Content License |
| `maghreb-oud` | Maghreb / Med / Africa fallback | Pixabay Content License |
| `yamatai-shizima` | Japanese / Asia fallback | PeriTune Konohana (comercial OK; crédito opcional) |
| `meso-aztec-relic` | Mesoamerican | StockTune PD/commercial |
| `andes-peruvian` | Andes / Mythic gold | Pixabay Content License |

## Licenças (cartas shipping)

| Asset | Licença | Notas |
|-------|---------|-------|
| CardMeister faces | Unlicense | `docs/legal/assets/cardmeister/` |
| pd-ornate faces + ornate backs | CC0 1.0 | AustinGabriel — `docs/legal/assets/pd-ornate/` |
| woodcut faces + woodcut-01 | CC0 1.0 | `docs/legal/assets/woodcut/` |
| jumbo-2 / fourcolour / accessible + saul backs | Public domain (author dedication) | `docs/legal/assets/saul-svgcards/` |
| Suecão navy back | Suecão / produto | Original |
| Sylly backs 01–06 | CC0 | `docs/legal/assets/sylly/` |
| Casino Normal (`cards3`) | **REMOVED from shipping** | |
| Hazmat faces / hazmat-red | **REMOVED from shipping** | |
