# Fase 0 — Avaliação (Maio 2026)

## Estado verificado

| Item | Resultado |
|------|-----------|
| Git `v2-main` | Sincronizado com `origin` |
| CI | Run #8 `success` em `464cc35` |
| Cartas | 52 SVG placeholders em `frontend/public/assets/cards2/` (~1.4 MB) |
| Build web | ~9.5 MB (CRA production) |
| Pasta `android/` | Não gerada no repo (`frontend/.gitignore` — criada com `cap sync`) |
| SUECÂO jogável | Aceite para já — sem alterar regras |

## Decisões registadas (plano UI + Android)

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Design tool | **Figma, Penpot ou pack** (todos documentados) | Flexibilidade; ver [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md) |
| Refactor build | **B1 — CRA + Capacitor** | CI verde, menor risco; Vite adiado |
| Refactor UI | **Dividir mesa** (`TableSurface`, `PlayerSeats`, `ScoreStrip`) | `GameBoard` ~940 linhas |
| Prazo | **Equilíbrio** | Scripts Android + handoff; AAB manual no Android Studio |

## Próximo passo manual (tu)

1. Exportar assets (Figma/Penpot ou pack comprado) → `map-card-pack.mjs`
2. `npm run release:android` → assinar AAB ([ANDROID_SIGNING.md](ANDROID_SIGNING.md))
3. Smoke 360×800 no dispositivo ([MOBILE_AUDIT.md](MOBILE_AUDIT.md))
