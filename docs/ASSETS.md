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
| Ícones app | `image/ico/buga_ico_draw/` | Usado no Capacitor |

### Registry

Código: `frontend/src/constants/cardDeckRegistry.ts` + `themeCardVisuals.ts` + `cardAssets.ts`

| Id | Tipo | Path / notas |
|----|------|----------------|
| `casino` | deck (**único / global**) | `/assets/cards3` — 52 faces Normal |
| `suecao-navy` | back (**fallback**) | `/assets/cards3/card_back` |
| `casino-05` | back | red diamond |
| `casino-06` | back | black/white star (alto contraste) |
| `casino-07` | back | cyan wave |
| `casino-08` | back | cube gradient |
| `hazmat-red` | back (reservado) | `/assets/cards3/card_back_red` — IAP / tema futuro |

**Removido:** `cards1/` (unused), `cards2/` (legacy Hazmat faces), staging `cards-pack-import/hazmat/`.

**Faces** = deck global `casino`. **Backs** = configuráveis por tema (`cardVisuals.backId`).  
`theme → deckId` fica para fase futura.

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
3. Confirmar `ACTIVE_CARD_DECK_ID === 'casino'` e `facePath` → `/assets/cards3`
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

## SFX (Kenney CC0)

| Ficheiro | Origem | Uso |
|----------|--------|-----|
| `card-play-1.ogg` | Casino Audio · card-place-2 | Jogar carta |
| `card-play-2.ogg` | Casino Audio · card-place-1 | Variação |
| `card-play-3.ogg` | Casino Audio · card-slide-3 | Variação |
| `card-shuffle.ogg` | Casino Audio · card-shuffle | Baralhar / deal |
| `trick-win.ogg` | Interface Sounds · confirmation_001 | Vaza completa |
| `error.ogg` | Interface Sounds · error_001 | Jogada ilegal |
| `ui-click.ogg` | Interface Sounds · click_002 | Cliques UI |

Toggle: `localStorage` key `sueca-sound-enabled` (MoreScreen). Código: `frontend/src/services/audioService.ts`.

## Licenças

| Asset | Licença | Notas |
|-------|---------|-------|
| Casino Normal faces (`cards3`) | **Indeterminada** (pack sem LICENSE nos ficheiros) | Origem `_temp/Casino_1`; clarificar antes de distribuição comercial |
| Suecão navy card back | Suecão / produto | Mantido como back activo |
| Hazmat Hand Drawn Playing Cards | Comercial OK; no redistribute/resell | [itch.io](https://hazmat-game-studios.itch.io/hand-drawn-playing-cards) — **removido** do runtime (`cards2/` deleted); `hazmat-red` back reservado fica em `cards3/card_back_red.png` |
| DOBO Vector UI Pack | Comercial OK; no resell/redistribute | [dobo-ui.itch.io](https://dobo-ui.itch.io/vector-ui-pack) — crédito recomendado |
| Kenney Casino Audio + Interface Sounds | CC0 | [kenney.nl](https://kenney.nl) — crédito opcional |
| Placeholder SVG (removido) | — | Substituído por Hazmat PNG Maio 2026 |
