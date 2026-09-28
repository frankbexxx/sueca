# SUECÂO — Sueca e variantes (React + Android)

**Branch activa:** `v2-main` · **Estado:** [docs/STATUS.md](docs/STATUS.md) · **Índice docs:** [docs/INDEX.md](docs/INDEX.md)

## O que é

Jogo de cartas português **Sueca** (40 cartas) + variantes **Spades, Hearts, King** na mesma app. IA local, UI web e destino **Google Play (AAB)** via Capacitor.

## Prioridades agora

1. **Play Store AAB** — assets comerciais (packs itch.io) + assinatura Android  
2. **Backend P5** (multiplayer) — deploy preferencial **Render**  
3. **Web** — produção em Vercel hoje; migração Render opcional → [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)  
4. **Adiado:** monetização (P6), IA externa Python

## Documentação (núcleo)

| Doc | Para quê |
|-----|----------|
| [docs/STATUS.md](docs/STATUS.md) | Estado e próximos passos |
| [docs/plan/PLAN_GLOBAL.md](docs/plan/PLAN_GLOBAL.md) | Plano mestre |
| [docs/ASSET_PACK_RESEARCH.md](docs/ASSET_PACK_RESEARCH.md) | Comprar packs cartas/UX |
| [docs/RELEASE_CHECK.md](docs/RELEASE_CHECK.md) | Checklist release |
| [docs/plan/prompts/implementation-prompts.md](docs/plan/prompts/implementation-prompts.md) | Tarefas P0–P8 |

Histórico: [docs/_archives/](docs/_archives/)

## Dev rápido

```bash
cd frontend
npm ci
npm start          # http://localhost:3000
npm test -- --watchAll=false
```

**Android:**

```bash
cd frontend
npx cap add android    # primeira vez
npm run release:android
npm run cap:open:android
```

Ver [docs/ANDROID_SIGNING.md](docs/ANDROID_SIGNING.md).

## Deploy web

- **Actual:** [frontend-mu-five-18.vercel.app](https://frontend-mu-five-18.vercel.app) — Vercel Root Directory = `frontend`  
- **Guia:** [docs/DEPLOY.md](docs/DEPLOY.md) · [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)

```bash
cd ~/projects/sueca
vercel --prod    # ou migrar para Render Static Site
```

## Estrutura

```
sueca/
├── README.md           # Este hub
├── docs/               # Documentação activa + _archives/
├── frontend/           # CRA + Capacitor
├── backend/            # API multiplayer (P5)
├── tools/              # map-card-pack.mjs, placeholders
└── sueca-ai/           # IA Python (congelada)
```

## Regras Sueca (resumo)

4 jogadores · 40 cartas · 61/120 pontos · trunfo · equipas. Detalhe: [docs/rules/sueca.md](docs/rules/sueca.md).

## Branding

**Suecão** is the product. **OXS — Oeiras Xtreme Software** is the parent / personal brand of Francisco Bexiga.

## License

This project is released under the **OXS Non-Commercial Source License v1.0**.

**Source Available — Non-Commercial Use Only.**

Source code is available for personal, educational, research, evaluation and other non-commercial use subject to the terms of the licence.

Commercial use, commercial redistribution, SaaS use, incorporation into commercial products, or substantial use in business operations requires prior written permission from the copyright holder.

Copyright © 2026 Francisco Bexiga
Suecão by OXS — Oeiras Xtreme Software

See [LICENSE](LICENSE) for the full terms, [NOTICE](NOTICE) for attribution and third-party notices, and [TRADEMARKS.md](TRADEMARKS.md) for brand usage policy.
