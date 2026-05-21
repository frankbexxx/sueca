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
| Sueca | Completo |
| Spades / Hearts / King | MVP + selector |
| UI mesa | `table/*` + `GameBoard.css` (refactor com propósito) |
| Deploy web | Vercel; migrar Render opcional — [DEPLOY_RENDER.md](../DEPLOY_RENDER.md) |
| Android | Capacitor 6, `npm run release:android` |

## Execução — ordem dos prompts

Ver [prompts/implementation-prompts.md](prompts/implementation-prompts.md).

| Fase | Prompt | Notas |
|------|--------|-------|
| Assets | **P0** | Pack itch.io — [ASSET_PACK_RESEARCH.md](../ASSET_PACK_RESEARCH.md) |
| Jogos | P1, P2 | Regras variantes (MVP) |
| Mobile UX | P3 | Menus, safe area, touch 48px |
| Android | **P4** | AAB, signing |
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

1. Tu: pesquisa packs ([ASSET_PACK_RESEARCH.md](../ASSET_PACK_RESEARCH.md))
2. Integrar assets + smoke dispositivo
3. Deploy P5 (Render) + ligar cliente WS
4. AAB internal track
5. Decidir migração front Vercel → Render

## Documentação histórica

- Prompts E1–E5 (concluídos): `_archives/plan-prompts-e/`
- Snapshots antigos: `_archives/snapshots/`
