# SUECÂO — Assets (cartas e UX)

## Estado no repositório

| Pack | Path | Estado |
|------|------|--------|
| Cartas (dev placeholder) | `frontend/public/assets/cards2/*.svg` | Gerado por `tools/generate-card-placeholders.mjs` |
| Cartas (comercial) | Copiar para `frontend/public/assets/cards2/` | **Tu compras** — ver critérios abaixo |
| UX chrome | `frontend/src/styles/design-tokens.css` + packs futuros | Tokens base; kit UI opcional |
| Ícones app | `image/ico/buga_ico_draw/` | Usado no Capacitor |
| SFX | `frontend/public/assets/sfx/` | Opcional — licença documentada ao adicionar |

## Critérios para pack de cartas (compra)

- PNG transparente **ou** SVG; nomes mapeáveis para `{Rank}_of_{Suit}.png`
- Baralho **52** (Spades/Hearts/King) + compatível com subset **40** Sueca
- Resolução ≥ 512px largura; incluir **card back**
- Licença comercial; créditos em `CreditsModal` se exigido

**Fontes sugeridas:** itch.io, Kenney, Craftpix, GraphicRiver.

## Integrar pack comprado

1. Extrair ficheiros para `frontend/public/assets/cards-pack-import/`
2. Correr: `node tools/map-card-pack.mjs --input frontend/public/assets/cards-pack-import --output frontend/public/assets/cards2`
3. Ver checklist em `tools/map-card-pack.mjs` (final)
4. `npm test` + smoke visual no browser

## Critérios pack UX

- Botões, modais, fundos de menu (não substituir `GameBoard.css` mesa sem issue)
- Dark mode compatível com `--color-*` em `design-tokens.css`

## Checklist “pack integrado”

- [ ] 52 (ou 40+52) cartas visíveis na mão e na vaza
- [ ] Card back na mesa (oponentes)
- [ ] `npm run build` sem 404 de assets
- [ ] Licença registada neste ficheiro (secção abaixo)

## Licenças

| Asset | Licença | Notas |
|-------|---------|-------|
| Placeholder SVG (gerado) | Projeto SUECÂO | Substituir por pack comercial |
| (preencher ao comprar pack) | | |
