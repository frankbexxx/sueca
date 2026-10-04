# SUECÂO — Estado actual

**Última actualização:** 2026-10-04 · Branch `v2-main`

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

## Sueca portrait geometry (V3) — baseline actual

| Item | Estado |
|------|--------|
| **Sueca portrait V3** canonical geometry | **Implementado** (Phaser / canonical path only) |
| Runtime validation @ ~390×844 | **Concluída** — [sueca-table-audit/runtime-v3-validation/](sueca-table-audit/runtime-v3-validation/) |
| Baseline | V3 aceite como geometria portrait actual da Sueca SOLO Phaser |
| Multiplayer / DOM Sueca | Continua em geometria **DEFAULT** (sem V3) |
| Landscape | **DEFAULT** / inalterado |
| Outros jogos (Hearts / Spades / King) | **DEFAULT** (sem regressão de layout) |

Audit packages: [sueca-table-audit/](sueca-table-audit/) (CURRENT diagrams + proposed-comparison V1/V2/V3 + runtime screenshots).

### Bugs visuais conhecidos (adiados — pós-deploy smoke)

Não corrigidos neste slice; smoke em produção depois:

1. **Continue CTA** — aparece na zona visual errada / overlap com HUD em vez da action/status band.
2. **HUD top-right crowding** — `ELES` + Pausa auto + pause/pin/ellipsis apertados.

## Próximos passos (ordem)

1. Deploy / smoke produção Sueca portrait (registar CTA + HUD crowding)
2. Follow-up visual: Continue CTA placement + top-right HUD chrome
3. Shell + dashboard + PlaySetup (sem scroll monolítico)
4. Fechar regras + testes por jogo (Sueca → Hearts → Spades → King)
5. Stats locais + continuar partida
6. `npm run release:android` + internal track
7. P5 Render + multiplayer

## Histórico

Snapshots: `docs/_archives/snapshots/`
