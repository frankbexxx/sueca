# SUECÂO — Estado actual

**Última actualização:** Maio 2026 · Branch `v2-main`

## Prioridade

| # | Objectivo | Estado |
|---|-----------|--------|
| 1 | **Play Store AAB** (Android) | Capacitor + scripts `release:android`; falta pack comercial + AAB assinado |
| 2 | **P5 Backend + multiplayer** | Obrigatório antes de release MP; `backend/` no repo |
| 3 | **Assets comerciais** (cartas + UX) | Placeholders SVG; pesquisa itch.io — [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md) |
| 4 | **Deploy web** | Produção Vercel hoje; **avaliar migração Render** — [DEPLOY_RENDER.md](DEPLOY_RENDER.md) |

**Adiado:** P6 monetização · IA externa (`docs/_archives/parallel-ai/`) · iOS

## Produto

- **Sueca:** completo, jogável, aceite para já
- **Spades / Hearts / King:** MVP via `GameAdapter` + selector
- **UI mesa:** `TableSurface`, `PlayerSeats`, `ScoreStrip` + `GameBoard.css` (mesa editável com propósito)
- **CI:** verde no último push; ver [RELEASE_CHECK.md](RELEASE_CHECK.md)

## Stack

- Frontend: CRA + React 18 + TypeScript
- Mobile: Capacitor 6 (`frontend/android/` local, gitignored)
- Backend v1: Node em `backend/` (P5)
- Produção web: `https://frontend-mu-five-18.vercel.app` (Vercel Root = `frontend`)

## Próximos passos (ordem)

1. Comprar e integrar pack cartas + chrome UX → [ASSETS.md](ASSETS.md) + [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)
2. Smoke 360×800 + dispositivo real → [MOBILE_AUDIT.md](MOBILE_AUDIT.md)
3. P5 deploy + `REACT_APP_MULTIPLAYER_URL` → [plan/prompts/P5-backend-mp.md](plan/prompts/P5-backend-mp.md)
4. `npm run release:android` + internal track → [ANDROID_SIGNING.md](ANDROID_SIGNING.md)
5. Decidir Vercel vs Render para web estática

## Histórico

Snapshots antigos: `docs/_archives/snapshots/` (incl. `PROJECT_STATUS.md`, `ROADMAP.md`, Jan 2025).
