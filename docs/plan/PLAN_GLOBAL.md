# SUECÂO — Plano global

**Estado:** [STATUS.md](../STATUS.md) · **Índice:** [INDEX.md](../INDEX.md)

## Norte (2026)

1. **Play Store AAB** — Android primeiro; web é suporte e partilha
2. **Assets comerciais** — packs cartas + UX (itch.io); não depende de Figma
3. **P5 Backend + multiplayer** — obrigatório para release com MP
4. **P6 Monetização** — adiado pós-lançamento inicial
5. **IA externa** — congelada até Android ([_archives/parallel-ai/](../_archives/parallel-ai/))

## Produto (Maio 2026)

| Área | Estado |
|------|--------|
| Sueca | Core completo; fechar carry 60-60 + testes |
| Spades / Hearts / King | Regras clássicas em curso (P1/P2) |
| **App shell** | **P3b** — 4 tabs, dashboard — [PRODUCT_ESSENTIALS.md](PRODUCT_ESSENTIALS.md) |
| UI mesa | `table/*` + `GameBoard.css` |
| Deploy web | Vercel — [DEPLOY_RENDER.md](../DEPLOY_RENDER.md) |
| Android | **Gate:** essentials → P4 AAB |

**Backlog inventário:** [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md)

## Execução — ordem dos prompts

Ver [prompts/implementation-prompts.md](prompts/implementation-prompts.md).

| Fase | Prompt | Notas |
|------|--------|-------|
| Assets | **P0** | Pack itch.io — [ASSET_PACK_RESEARCH.md](../ASSET_PACK_RESEARCH.md) |
| Jogos | P1, P2 | Regras clássicas + testes |
| Mobile UX | P3 | Menus, safe area, touch 48px |
| **App shell** | **P3b** | Dashboard + bottom nav — [PRODUCT_ESSENTIALS.md](PRODUCT_ESSENTIALS.md) |
| Android | **P4** | AAB **após** essentials gate |
| Backend | **P5** | **Obrigatório** |
| Monetização | ~~P6~~ | Adiado |
| Play | P7 | Legal, listing |
| QA | P8 | CI, Maestro, internal track |

## Mobile / UX (ex-ROADMAP M0–M3)

Fundido aqui — não usar `ROADMAP.md` (arquivado).

- **M1:** 360×800 sem corte na mão Sul; toque ≥48px — [MOBILE_AUDIT.md](../MOBILE_AUDIT.md)
- **M2:** Tokens + packs UI em menus/modais
- **M3:** Feedback / error boundary (backlog leve)

## Design → código

- Packs PNG → `map-card-pack.mjs` → `public/assets/cards2/`
- Tokens: `design-tokens.css` + JSON opcional
- Guia: [DESIGN_HANDOFF.md](../DESIGN_HANDOFF.md)

## Próximos passos

1. P3b app shell + dashboard
2. P1/P2 regras completas + testes
3. Smoke 360×800 — [MOBILE_AUDIT.md](../MOBILE_AUDIT.md)
4. P4 AAB internal track (gate: [PRODUCT_ESSENTIALS.md](PRODUCT_ESSENTIALS.md))
5. P5 Render + multiplayer

## Documentação histórica

- Prompts E1–E5 (concluídos): `_archives/plan-prompts-e/`
- Snapshots antigos: `_archives/snapshots/`
