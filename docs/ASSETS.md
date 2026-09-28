# SUECÂO — Assets (cartas e UX)

**Pesquisa packs:** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md) · **Legal ledgers:** [legal/assets/](legal/assets/)
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório (REL-DECK-01B Batch 1)

| Pack | Path | Estado |
|------|------|--------|
| Faces default | `frontend/public/assets/cards-cardmeister/` | **CardMeister** (52 PNG 352×512) — default |
| Faces selectable | `frontend/public/assets/cards/pd-ornate/` | **AustinGabriel CC0** ornate (52 PNG 366×512) |
| Costa default | `frontend/public/assets/card-backs/suecao-navy.png` | Suecão navy (original) |
| Costas Sylly | `card-backs/sylly-01`…`06.png` | OGA Cards Pack / CC0 (Andrew Tidey) |
| Legal | `docs/legal/assets/{cardmeister,pd-ornate,sylly}/` | PROVENANCE + licence copies |
| SFX | `frontend/public/assets/sfx/*.ogg` | Kenney / Freesound / Suecão — ver secção abaixo |
| Música core | `frontend/public/assets/music/core/*.ogg` | 6 beds |
| Ícones app | `image/ico/buga_ico_draw/` | Capacitor |

**Removido do shipping (Batch 1):** `cards3/` Casino faces + Casino backs 05–08 + `hazmat-red`. Legacy prefs/themes migrate via `LEGACY_CARD_*_MIGRATION`.

### Registry

Código: `cardDeckRegistry.ts` + `themeCardVisuals.ts` + `cardAssets.ts` + `cardSkinPreferences.ts`

| Id | Tipo | Path / notas |
|----|------|----------------|
| `cardmeister` | deck (**default**) | `/assets/cards-cardmeister` |
| `pd-ornate` | deck | `/assets/cards/pd-ornate` |
| `suecao-navy` | back (**fallback**) | `/assets/card-backs/suecao-navy` |
| `sylly-01`…`06` | back | `/assets/card-backs/sylly-0N` |

**API por tema:** `backId` activo (30 temas); `deckId` opcional → default `cardmeister`. Faces/backs independentes.

### Back por tema (após migração Casino → Sylly)

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

- Batch 2: woodcut + Saul Spatz jumbo / four-colour / accessible (+ more backs)
- Batch 3: Kenney / Webisso polish; sharper Sylly vector re-export; Credits polish

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

## Checklist Batch 1

- [x] CardMeister documented under `docs/legal/assets/cardmeister/`
- [x] 52 `pd-ornate` faces + provenance
- [x] 6 Sylly backs + Suecão navy under `card-backs/`
- [x] Casino `cards3/` removed from shipping
- [x] Pref / theme migration
- [ ] Credits UI polish (deferred — still may mention Hazmat historically)

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
| pd-ornate faces | CC0 1.0 | AustinGabriel — `docs/legal/assets/pd-ornate/` |
| Suecão navy back | Suecão / produto | Original |
| Sylly backs 01–06 | CC0 | Pack License.txt (Andrew Tidey) — `docs/legal/assets/sylly/` |
| Casino Normal (`cards3`) | **REMOVED from shipping** | Licence was indeterminada; `_temp/Casino_1` forensic only |
| Hazmat faces / hazmat-red | **REMOVED from shipping** | Legacy / unresolved |
