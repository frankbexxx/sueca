# SUECÂO — Estado actual

**Última actualização:** Maio 2026 · Branch `v2-main`

## Prioridade

| # | Objectivo | Estado |
|---|-----------|--------|
| 1 | **App shell + regras completas** | Em curso — [PRODUCT_ESSENTIALS.md](plan/PRODUCT_ESSENTIALS.md) |
| 2 | **Play Store AAB** (Android) | **Gate:** essentials completos → [ANDROID_SIGNING.md](ANDROID_SIGNING.md) |
| 3 | **P5 Backend + multiplayer** | Após 1.º AAB offline; `backend/` no repo |
| 4 | **Assets** | Hazmat + DOBO integrados — [ASSETS.md](ASSETS.md) |
| 5 | **Deploy web** | Vercel — [DEPLOY_RENDER.md](DEPLOY_RENDER.md) |

**Adiado:** P6 monetização · verso vermelho IAP · IA externa · iOS · novos jogos

**Backlog completo:** [plan/PRODUCT_BACKLOG.md](plan/PRODUCT_BACKLOG.md)

## Produto

- **Jogos:** Sueca, Hearts, Spades, King (offline vs bots)
- **Navegação alvo:** 4 tabs — Início · Jogar · Regras · Mais
- **Cartas:** Hazmat PNG; verso Blue na mesa
- **UI DOBO:** menus e modais
- **IA:** só local no 1.º AAB

## Próximos passos (ordem)

1. Shell + dashboard + PlaySetup (sem scroll monolítico)
2. Fechar regras + testes por jogo (Sueca → Hearts → Spades → King)
3. Stats locais + continuar partida
4. Smoke 360×800 — [MOBILE_AUDIT.md](MOBILE_AUDIT.md)
5. `npm run release:android` + internal track
6. P5 Render + multiplayer

## Histórico

Snapshots: `docs/_archives/snapshots/`
