# SUECÂO — Assets (cartas e UX)

**Pesquisa packs (itch.io):** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md)  
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório

| Pack | Path | Estado |
|------|------|--------|
| Cartas (activo) | `frontend/public/assets/cards3/*.png` | **Casino Normal** faces (352×512) — **único deck runtime** |
| Costa (default) | `frontend/public/assets/cards3/card_back.png` | **Suecão navy** — fallback |
| Costa Casino | `card_back_casino_05`…`08.png` | Disponíveis via `backId` por tema |
| Costa reservada | `cards3/card_back_red.png` | `hazmat-red` (IAP / tema futuro) |
| Staging import | `frontend/public/assets/cards-pack-import/` | Vazio / tools only (Hazmat pack removido do tree) |
| UI StartMenu | `frontend/src/assets/ui/dobo/` | **DOBO** subset (bundled) |
| UX chrome | `frontend/src/styles/design-tokens.css` + packs futuros | Tokens base |
| SFX | `frontend/public/assets/sfx/*.ogg` | Kenney CC0 — ver secção abaixo |
| Música core | `frontend/public/assets/music/core/*.ogg` | 6 beds tema (híbrido v1) — ver secção abaixo |
| Ícones app | `image/ico/buga_ico_draw/` | Usado no Capacitor |

### Registry

Código: `frontend/src/constants/cardDeckRegistry.ts` + `themeCardVisuals.ts` + `cardAssets.ts`

| Id | Tipo | Path / notas |
|----|------|----------------|
| `casino` | deck (**default**) | `/assets/cards3` — 52 faces Normal |
| `cardmeister` | deck (opcional; `?deck=cardmeister`) | `/assets/cards-cardmeister` — Classic Vector PNG |
| `suecao-navy` | back (**fallback**) | `/assets/cards3/card_back` |
| `casino-05` | back | red diamond |
| `casino-06` | back | black/white star (alto contraste) |
| `casino-07` | back | cyan wave |
| `casino-08` | back | cube gradient |
| `hazmat-red` | back (reservado) | `/assets/cards3/card_back_red` — IAP / tema futuro |

**Removido:** `cards1/` (unused), `cards2/` (legacy Hazmat faces), staging `cards-pack-import/hazmat/`.

**API por tema** (`THEME_CARD_VISUALS.cardVisuals`):

| Campo | Estado | Notas |
|-------|--------|--------|
| `backId` | **activo** | 30 temas com valor explícito; inválido → `suecao-navy` |
| `deckId` | **preparado** | opcional; ausência / inválido → `casino`. Decks registados: `casino`, `cardmeister`. Nenhum tema define `deckId` ainda. Dev: `?deck=cardmeister` |

Resolvers (nunca crasham): `resolveCardDeckForTheme`, `resolveCardBackForTheme`.  
`deckId` e `backId` são **independentes** — futuros decks faces não obrigam a mudar backs.  
Novos decks registam-se em `CARD_DECKS` sem alterar esta API de tema.

### Back por tema (THEME-CARD-BACK-02)

Config: `THEME_CARD_VISUALS` em `themeCardVisuals.ts` — **todos os 30 temas built-in** têm `backId` explícito.  
Resolver: `resolveCardBackForTheme(themeId)` — nunca crasha; tema ausente / `backId` inválido → `suecao-navy`.  
`hazmat-red` permanece reservado (não atribuído).

Critério: contraste com felt/mesa > coerência cromática > variedade.

| Tema | backId |
|------|--------|
| `classic` | `suecao-navy` |
| `forest` | `casino-05` |
| `midnight` | `casino-06` |
| `thule` | `casino-05` |
| `hyperborea` | `casino-08` |
| `skara-brae` | `casino-08` |
| `avalon` | `casino-07` |
| `knossos` | `casino-05` |
| `thebes` | `casino-07` |
| `cartago` | `casino-07` |
| `atlantida` | `casino-05` |
| `babylon` | `casino-05` |
| `ur` | `casino-08` |
| `petra` | `casino-07` |
| `persepolis` | `casino-08` |
| `axum` | `casino-07` |
| `meroe` | `casino-05` |
| `great-zimbabwe` | `suecao-navy` |
| `xanadu` | `suecao-navy` |
| `shambhala` | `casino-07` |
| `mohenjo-daro` | `casino-08` |
| `yamatai` | `casino-06` |
| `angkor` | `suecao-navy` |
| `tikal` | `casino-05` |
| `teotihuacan` | `casino-06` |
| `tiwanaku` | `casino-07` |
| `caral` | `suecao-navy` |
| `el-dorado` | `casino-05` |
| `rapanui` | `casino-08` |
| `nanmadol` | `casino-06` |

Distribuição: `suecao-navy` 5 · `casino-05` 8 · `casino-06` 4 · `casino-07` 7 · `casino-08` 6.  
Piloto re-eval: `thebes`/`thule` trocados (cyan no felt quente; vermelho no felt azul). Phaser faz hot-swap do texture `card-back` ao mudar `data-theme`.

## Casino pack (CASINO-DECK-INTEGRATION-01)

| Item | Decisão |
|------|---------|
| Faces no jogo | **Casino Normal** (`Cards/` 352×512) em `cards3/` |
| SmallCards (66×96) | **Não** no gameplay Phaser — redesenhos jumbo; reservadas para UI compacta futura (históricos, mini-indicadores, logs de vazas) |
| Back default | **Suecão navy** (fallback) |
| Casino backs 05–08 | Integrados em `cards3/`; seleccionáveis por tema |
| Casino backs 01–04 | Catalogados em `_temp` — não no produto |
| SmallCards backs | **Não** integrados |
| Chips / Dice | `_temp/.../future/` — **não** integrados |
| Jokers | Não usados (Sueca/Spades/Hearts/King) |
| Origem | `_temp/Casino_1` → `_temp/casino-pack-normalized/` |
| Licença | **Não determinada** a partir dos ficheiros do pack — não redistribuir comercialmente até clarificar |

Staging de referência (gitignored `_temp/`):

- `faces/normal/` — integrado
- `faces/small/` — catalogado só
- `backs/normal|small/` — catalogado só
- `future/chips|dice/` — catalogado só

## Critérios para pack de cartas (compra)

- PNG transparente **ou** SVG; nomes mapeáveis para `{Rank}_of_{Suit}.png`
- Baralho **52** (Spades/Hearts/King) + compatível com subset **40** Sueca
- Resolução ≥ 512px largura; incluir **card back**
- Licença comercial; créditos em `CreditsModal` se exigido

**Fontes sugeridas:** itch.io, Kenney, Craftpix, GraphicRiver.

## Integrar pack (novo baralho)

1. Fonte local: `_temp/` (gitignored) ou `cards-pack-import/`
2. Mapear: `node tools/map-card-pack.mjs --input … --output frontend/public/assets/cards3`
3. Confirmar `DEFAULT_CARD_DECK_ID === 'casino'` / `resolveCardDeckForTheme(theme)` → `/assets/cards3`
4. `npm test` + smoke visual

> Nota: o pack Hazmat legado (`cards2/`) foi **removido** do runtime. Não reintroduzir sem decisão de produto explícita.

### Figma / Penpot

- Tokens: JSON → espelhar em `frontend/src/styles/design-tokens.css`
- Não gerar React automático para a mesa; só assets + tokens
- Ver [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Checklist “pack integrado”

- [x] 52 cartas PNG em `cards3/` (Casino Normal)
- [x] `card_back.png` Suecão navy + `card_back_red.png` (reservado)
- [x] Verso Suecão nos oponentes / face-down
- [x] DOBO: StartMenu, GameMenu, RulesSheet, Credits
- [ ] `npm run build` sem 404 de assets
- [x] Licença / origem registada neste ficheiro (Casino: indeterminada)

## SFX (runtime)

| Ficheiro | Origem | Uso |
|----------|--------|-----|
| `card-play-1.ogg` | Kenney Casino Audio · card-place-2 | Jogar carta |
| `card-play-2.ogg` | Kenney Casino Audio · card-place-1 | Variação |
| `card-play-3.ogg` | Kenney Casino Audio · card-slide-3 | Variação |
| `card-shuffle.ogg` | Freesound BMacZero 96130 (CC0) | Baralhar (após mãos) |
| `deal-1.ogg` | Freesound el_boss 571576 (CC0) | Deal / entrada de mão |
| `trick-collect.ogg` | Freesound KevinHilt 196541 crop (CC0) | Vaza completa |
| `round-start.ogg` | Suecão NumPy synth + FFmpeg (original) | Início de ronda |
| `round-end.ogg` | Suecão NumPy synth + FFmpeg (original) | Fim de ronda intermédia |
| `game-win.ogg` | Suecão NumPy synth + FFmpeg (original) | Vitória final |
| `game-lose.ogg` | Suecão NumPy synth + FFmpeg (original) | Derrota final |
| `error.ogg` | Kenney Interface Sounds · error_001 | Jogada ilegal |
| `ui-click.ogg` | Kenney Interface Sounds · click_002 | Cliques UI |

Toggle: `localStorage` key `sueca-sound-enabled` (MoreScreen / Settings). Código: `frontend/src/services/audioService.ts`.

## Música de ambiente (core v1 — híbrido)

Arquitectura: **D — HYBRID** (6 core bundled; catálogo remoto **mock**; cache Android Filesystem; **R2 ainda NÃO**; downloads **não** activos na UI).

| Item | Valor |
|------|--------|
| Path core | `frontend/public/assets/music/core/*.ogg` |
| Catálogo core | `frontend/src/constants/musicCatalog.ts` |
| Theme → core play | `frontend/src/constants/musicThemeMap.ts` (`resolveMusicTrackIdForTheme`) |
| Preferred + fallback | `THEME_PREFERRED_TRACK_ID` + `getThemeMusicPreference` |
| Catálogo remoto mock | `frontend/src/audio/remoteMusicCatalog.mock.ts` (23 ids; URLs `music.example.invalid` — **nunca fetch**) |
| Resolver híbrido | `frontend/src/audio/musicResolver.ts` (`resolveMusicTrack` / `resolveThemeMusic`) |
| Cache Android | `frontend/src/audio/musicCacheService.ts` — `Directory.Data/music/` + `manifest.json` |
| Plugin | `@capacitor/filesystem` (Capacitor 6) |
| Modos settings | **Theme default** / **Off** (`sueca-music-mode`) — sem UI remota / download |
| Volume | `0.28` (mesmo nível do antigo ambiance) |
| Legacy | `ambiance.ogg` **removido** do runtime |

### 6 faixas core (bundled)

| id | família | licença (resumo) |
|----|---------|------------------|
| `casino-jazz` | Casino Jazz / Lounge | Pixabay Content License |
| `nordic-kalte` | Nordic / Dark / Forest fallback | Pixabay Content License |
| `maghreb-oud` | Maghreb / Med / Africa fallback | Pixabay Content License |
| `yamatai-shizima` | Japanese / Asia fallback | PeriTune Konohana (comercial OK; crédito opcional) |
| `meso-aztec-relic` | Mesoamerican | StockTune PD/commercial |
| `andes-peruvian` | Andes / Mythic gold | Pixabay Content License |

### Catálogo remoto + cache (MUSIC-REMOTE-MOCK-01 / MUSIC-ANDROID-CACHE-01)

- **23** candidatas RELEASE OK (não-core) em memória; URLs mock **bloqueadas** para fetch.
- Cache nativo: `music/{trackId}/{version}/{trackId}.ogg` + verificação SHA-256; download atómico via `.part`.
- Disponibilidade: `AVAILABLE_LOCAL_CORE` \| `AVAILABLE_LOCAL_CACHE` \| `REMOTE_AVAILABLE` \| `UNAVAILABLE`.
- `resolveThemeMusic` pode devolver cache local (`readyForPlayback: true`) ou remote metadata (`readyForPlayback: false`).
- **Theme Default** continua a tocar só core via `resolveMusicTrackIdForTheme` (30/30 → uma das 6; desconhecido → `casino-jazz`).
- **Web:** sem Filesystem cache; remotes ficam `REMOTE_AVAILABLE`.
- **R2 / CDN real:** ainda não. Próxima fase: remote playback/fallback (ainda sem R2 se necessário).

Preparação / proveniência detalhada: staging `_temp/_musicas/` (gitignored) — `MUSIC_CORE_CATALOG.json`, `MUSIC_PROVENANCE.md`, `MUSIC_REMOTE_ARCHITECTURE.md`.

## Licenças

| Asset | Licença | Notas |
|-------|---------|-------|
| Casino Normal faces (`cards3`) | **Indeterminada** (pack sem LICENSE nos ficheiros) | Origem `_temp/Casino_1`; clarificar antes de distribuição comercial |
| Suecão navy card back | Suecão / produto | Mantido como back activo |
| Hazmat Hand Drawn Playing Cards | Comercial OK; no redistribute/resell | [itch.io](https://hazmat-game-studios.itch.io/hand-drawn-playing-cards) — **removido** do runtime (`cards2/` deleted); `hazmat-red` back reservado fica em `cards3/card_back_red.png` |
| DOBO Vector UI Pack | Comercial OK; no resell/redistribute | [dobo-ui.itch.io](https://dobo-ui.itch.io/vector-ui-pack) — crédito recomendado |
| Kenney Casino Audio + Interface Sounds | CC0 | [kenney.nl](https://kenney.nl) — crédito opcional |
| Round/game cues (`round-start`, `round-end`, `game-win`, `game-lose`) | Suecão original | Synth NumPy + FFmpeg; sem asset externo |
| Placeholder SVG (removido) | — | Substituído por Hazmat PNG Maio 2026 |
