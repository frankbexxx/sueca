# SUECÂO — Assets (cartas e UX)

**Pesquisa packs (itch.io):** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md)  
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório

| Pack | Path | Estado |
|------|------|--------|
| Cartas (activo) | `frontend/public/assets/cards3/*.png` | **Casino Normal** faces (352×512) |
| Costa (default) | `frontend/public/assets/cards3/card_back.png` | **Suecão navy** — fallback |
| Costa Casino | `card_back_casino_05`…`08.png` | Disponíveis via `backId` por tema |
| Legacy Hazmat | `frontend/public/assets/cards2/*.png` | Faces + backs anteriores (não activos) |
| Import Hazmat | `frontend/public/assets/cards-pack-import/hazmat/` | Flat staging; `node tools/stage-hazmat.mjs` |
| UI StartMenu | `frontend/src/assets/ui/dobo/` | **DOBO** subset (bundled) |
| UX chrome | `frontend/src/styles/design-tokens.css` + packs futuros | Tokens base |
| SFX | `frontend/public/assets/sfx/*.ogg` | Kenney CC0 — ver secção abaixo |
| Ícones app | `image/ico/buga_ico_draw/` | Usado no Capacitor |

### Registry

Código: `frontend/src/constants/cardDeckRegistry.ts` + `themeCardVisuals.ts` + `cardAssets.ts`

| Id | Tipo | Path / notas |
|----|------|----------------|
| `casino` | deck (**global fixo**) | `/assets/cards3` — 52 faces Normal |
| `hazmat` | deck (legacy) | `/assets/cards2` — não activo |
| `suecao-navy` | back (**fallback**) | `/assets/cards3/card_back` |
| `casino-05` | back | red diamond |
| `casino-06` | back | black/white star (alto contraste) |
| `casino-07` | back | cyan wave |
| `casino-08` | back | cube gradient |
| `hazmat-red` | back (reservado) | IAP / tema futuro |

**Faces** = deck global `casino`. **Backs** = configuráveis por tema (`cardVisuals.backId`).  
`theme → deckId` fica para fase futura.

### Back por tema (THEME-CARD-BACK-01)

Config: `THEME_CARD_VISUALS` em `themeCardVisuals.ts`.  
Resolver: `resolveCardBackForTheme(themeId)` — nunca crasha; inválido/ausente → `suecao-navy`.

Piloto (só estes têm override):

| Tema | backId |
|------|--------|
| `classic` | `suecao-navy` |
| `thebes` | `casino-05` |
| `midnight` | `casino-06` |
| `thule` | `casino-07` |

Restantes temas → fallback `suecao-navy`. Phaser faz hot-swap do texture `card-back` ao mudar `data-theme`.

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

## Integrar pack (legado Hazmat)

1. Fonte local: `_temp/` (gitignored)
2. Hazmat: `node tools/stage-hazmat.mjs`
3. Mapear: `node tools/map-card-pack.mjs --input frontend/public/assets/cards-pack-import/hazmat --output frontend/public/assets/cards2`
4. Activar via `cardDeckRegistry` (`ACTIVE_CARD_DECK_ID`) se necessário
5. `npm test` + smoke visual

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
| Hazmat Hand Drawn Playing Cards | Comercial OK; no redistribute/resell | [itch.io](https://hazmat-game-studios.itch.io/hand-drawn-playing-cards) — legado em `cards2/` |
| DOBO Vector UI Pack | Comercial OK; no resell/redistribute | [dobo-ui.itch.io](https://dobo-ui.itch.io/vector-ui-pack) — crédito recomendado |
| Kenney Casino Audio + Interface Sounds | CC0 | [kenney.nl](https://kenney.nl) — crédito opcional |
| Placeholder SVG (removido) | — | Substituído por Hazmat PNG Maio 2026 |
