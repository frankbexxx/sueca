# Prompt P0 — Asset packs (cartas + UX)

## Contexto
Cartas em `public/assets/cards2/` (SVG placeholder). Pack comercial pendente.

## Objetivo
Integrar pack comprado + documentar licenças.

## Tarefas
1. Comprar pack 52+back; copiar para `cards-pack-import/`.
2. `node tools/map-card-pack.mjs --input ... --output frontend/public/assets/cards2`
3. `REACT_APP_CARD_EXT=png` se PNG.
4. Atualizar `docs/ASSETS.md` com licença.

## Critérios
- [ ] 52 cartas visíveis; build sem 404.
- [ ] `npm test` verde.

## Proibido
- `GameBoard.css` mesa.
