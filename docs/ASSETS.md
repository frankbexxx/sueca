# SUECÂO — Assets (cartas e UX)

**Pesquisa packs (itch.io):** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md)  
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório

| Pack | Path | Estado |
|------|------|--------|
| Cartas (activo) | `frontend/public/assets/cards2/*.png` | **Hazmat Hand Drawn** (trial) |
| Import Hazmat | `frontend/public/assets/cards-pack-import/hazmat/` | Flat staging; `node tools/stage-hazmat.mjs` |
| UI StartMenu | `frontend/src/assets/ui/dobo/` | **DOBO** subset (bundled) |
| UX chrome | `frontend/src/styles/design-tokens.css` + packs futuros | Tokens base |
| Ícones app | `image/ico/buga_ico_draw/` | Usado no Capacitor |
| SFX | `frontend/public/assets/sfx/` | Opcional — licença documentada ao adicionar |

## Critérios para pack de cartas (compra)

- PNG transparente **ou** SVG; nomes mapeáveis para `{Rank}_of_{Suit}.png`
- Baralho **52** (Spades/Hearts/King) + compatível com subset **40** Sueca
- Resolução ≥ 512px largura; incluir **card back**
- Licença comercial; créditos em `CreditsModal` se exigido

**Fontes sugeridas:** itch.io, Kenney, Craftpix, GraphicRiver.

## Integrar pack (Hazmat ou outro)

1. Fonte local: `_temp/` (gitignored)
2. Hazmat: `node tools/stage-hazmat.mjs`
3. Mapear: `node tools/map-card-pack.mjs --input frontend/public/assets/cards-pack-import/hazmat --output frontend/public/assets/cards2`
4. Build: `REACT_APP_CARD_EXT=png npm run build` (`.env.development` já define PNG em dev)
5. `npm test` + smoke visual no browser (360×800)

### Figma / Penpot

- Tokens: JSON → espelhar em `frontend/src/styles/design-tokens.css`
- Não gerar React automático para a mesa; só assets + tokens
- Ver [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Critérios pack UX

- Botões, modais, fundos de menu (não substituir `GameBoard.css` mesa sem issue)
- Dark mode compatível com `--color-*` em `design-tokens.css`

## Checklist “pack integrado”

- [x] 52 cartas PNG em `cards2/` (Hazmat)
- [x] `card_back.png` + `card_back_red.png` (Red reservado para IAP futuro)
- [x] Verso Hazmat nos contadores de mão dos oponentes
- [x] DOBO: StartMenu, GameMenu, RulesSheet, Credits
- [ ] `npm run build` sem 404 de assets
- [x] Licença registada neste ficheiro (secção abaixo)

## Licenças

| Asset | Licença | Notas |
|-------|---------|-------|
| Hazmat Hand Drawn Playing Cards | Comercial OK; no redistribute/resell | [itch.io](https://hazmat-game-studios.itch.io/hand-drawn-playing-cards) — crédito opcional |
| DOBO Vector UI Pack | Comercial OK; no resell/redistribute | [dobo-ui.itch.io](https://dobo-ui.itch.io/vector-ui-pack) — crédito recomendado |
| Placeholder SVG (removido) | — | Substituído por Hazmat PNG Maio 2026 |
