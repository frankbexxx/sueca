# Card Intelligence — documentação AI

Índice da documentação em `docs/ai/`. Ver também [INVENTORY_REPORT.md](INVENTORY_REPORT.md) para classificação dos ficheiros.

## Entrada rápida

| Documento | Descrição |
|-----------|-----------|
| [active/ROADMAP_AI.md](active/ROADMAP_AI.md) | Visão e fases 0–7 |
| [active/IMPLEMENTATION_PLAN_AI.md](active/IMPLEMENTATION_PLAN_AI.md) | Plano operacional e ordem de implementação |
| [active/CARD_INTELLIGENCE_STATUS_REPORT.md](active/CARD_INTELLIGENCE_STATUS_REPORT.md) | Estado consolidado do sistema |

## Estrutura

```
docs/ai/
├── active/          # Documentação activa (entrada Repomix lean)
│   ├── design/      # Fase 0 + desenhos Fases 3–7
│   ├── specs/       # Métricas, prioridades, fixtures
│   └── current-work/ # Relatórios em curso (Impl 11, 13, 15, 16)
├── archive/         # Prompts executadas, relatórios históricos, reviews
└── repo-review/     # Fluxo Repomix + Gemini/Ollama (packs gerados gitignored)
```

## Regra de implementação

```
1. prompt em archive/implementation-prompts/   (antes de código)
2. implementação
3. relatório em archive/implementation-reports/ ou active/current-work/
```

## Repomix

Pack lean para revisão externa:

```bash
npx repomix --config repomix.config.json
```

Output: `docs/ai/repo-review/packs/generated/ai-decisions-context.md` (não versionado).
