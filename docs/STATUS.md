# SUECÂO — Estado actual

**Última actualização:** Maio 2026 · Branch `v2-main`

## Prioridade

| # | Objectivo | Estado |
|---|-----------|--------|
| 1 | **Play Store AAB** (Android) | Hazmat + DOBO integrados; falta AAB assinado + internal track |
| 2 | **P5 Backend + multiplayer** | Obrigatório antes de release MP; `backend/` no repo |
| 3 | **Assets** | **Hazmat cartas** + **DOBO UI** (trial activo) — [ASSETS.md](ASSETS.md) |
| 4 | **Deploy web** | Vercel; backend P5 no **Render** — [DEPLOY_RENDER.md](DEPLOY_RENDER.md) |

**Adiado:** P6 monetização · verso vermelho IAP · IA externa · iOS

## Produto

- **Cartas:** Hazmat PNG em `cards2/`; verso Blue na mesa (oponentes)
- **UI DOBO:** StartMenu, GameMenu settings, RulesSheet, Credits
- **Verso Red:** `card_back_red.png` guardado (IAP futuro)
- **IA:** só local no 1.º AAB

## Próximos passos (ordem)

1. Smoke 360×800 + dispositivo real → [MOBILE_AUDIT.md](MOBILE_AUDIT.md)
2. `npm run release:android` + internal track → [ANDROID_SIGNING.md](ANDROID_SIGNING.md)
3. P5 Render + `REACT_APP_MULTIPLAYER_URL` → [plan/prompts/P5-backend-mp.md](plan/prompts/P5-backend-mp.md)
4. Tema verso Red (sem billing ainda)

## Histórico

Snapshots: `docs/_archives/snapshots/`
