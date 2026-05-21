# Prompt P0 — Asset packs (cartas + UX)

## Contexto
Cartas em `public/assets/cards2/` (SVG placeholder). Pack comercial ou export Figma/Penpot pendente.

## Objetivo
Integrar assets + documentar licenças. Ver [DESIGN_HANDOFF.md](../../DESIGN_HANDOFF.md).

## Tarefas
1. Export Figma/Penpot **ou** pack comprado → `cards-pack-import/`.
2. `node tools/map-card-pack.mjs --input ... --output frontend/public/assets/cards2`
3. `npm run build:android` ou `REACT_APP_CARD_EXT=png npm run build`.
4. Atualizar `docs/ASSETS.md` com licença.

## Critérios
- [ ] 52 cartas visíveis; build sem 404.
- [ ] `npm test` verde.

## Referência compra
- [ASSET_PACK_RESEARCH.md](../../ASSET_PACK_RESEARCH.md) — critérios itch.io (qualidade).

## Mesa
- Preferir não redesenhar a vaza sem smoke mobile; alterações em `GameBoard.css` / `table/*` **com propósito** (legibilidade, pack UX).
