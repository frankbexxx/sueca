# Relatório de Inventário — `docs/ai/*.md`

**Data do relatório:** 2026-06-09  
**Scope:** 52 ficheiros `.md` sob `docs/ai/` (pré-reestruturação)  
**Método:** leitura de cabeçalhos, cruzamento prompt↔relatório, `IMPLEMENTATION_PLAN_AI.md` v1.5, `CARD_INTELLIGENCE_STATUS_REPORT.md` v1.7  
**Acção subsequente:** reestruturação `active/` + `archive/` aplicada conforme §4

---

## Contexto detectado

- Pipeline Card Intelligence: **Impl 1–16 código concluído**; **H16-OK pendente** (smoke pós-hotfix 16.1).
- Existem **16 prompts** e **22 relatórios** (incl. sub-entregas 1.1, H2, 16.1).
- `repo-review/packs/generated/ai-decisions-context.md` é output Repomix (**46 388 linhas, ~1,7 MB**), **não versionado** (`.gitignore`).
- Pastas `repo-review/prompts/` e `repo-review/reports/` existem para saída do fluxo externo.

---

## Tabela de inventário (52 ficheiros)

### Raiz `docs/ai/` (14 ficheiros)

| Ficheiro | Tipo | Estado sugerido | Motivo curto | Risco se arquivar | Recomendação |
|----------|------|-----------------|--------------|-------------------|--------------|
| `ROADMAP_AI.md` | roadmap | keep-active | Visão e fases 0–7; referência mestre | Perda de norte estratégico | Manter como doc âncora |
| `IMPLEMENTATION_PLAN_AI.md` | roadmap | review-needed | Plano operacional v1.5; contradição interna H16 (cabeçalho vs §8) | Confusão sobre próximo passo | Manter activo; corrigir inconsistência H16 |
| `CARD_INTELLIGENCE_STATUS_REPORT.md` | status report | keep-active | Snapshot vivo v1.7; consolida estado Impl 1–16 | Perda de visão única do sistema | Manter como índice operacional |
| `PHASE0_INVENTORY.md` | architecture/design | keep-active | Inventário Fase 0; base de heurísticas existentes | Perda de rastreio código→métricas | Manter; referenciado por Fases 1–7 |
| `FASE_1_METRICAS.md` | rules/spec | keep-active | Catálogo de métricas validado (4 jogos) | Avaliador/bots perdem spec | Manter activo |
| `FASE_2A_PRIORIDADES_METRICAS.md` | rules/spec | keep-active | Prioridades P0–P3 para encoder/avaliador | Regressão de scope em novas impl | Manter activo |
| `FASE_2B_FIXTURES_METRICAS.md` | rules/spec | keep-active | 23 fixtures golden activos | CI/fixtures perdem fonte humana | Manter activo |
| `FASE_2B_ARQUIVO_FIXTURES.md` | rules/spec | archive-candidate | Corpus diferido (~40 fixtures); já rotulado «arquivo» | Fixtures futuros (v2) perdem exemplos | Mover para `archive/specs/` |
| `FASE_2_FIXTURES_METRICAS.md` | temporary/intermediate | duplicate/obsolete | Stub de redireccionamento para 2A/2B | Nenhum se links actualizados | Arquivar |
| `FASE_3_LOGGER_DESIGN.md` | architecture/design | keep-active | Spec de desenho logger (pré-código) | Desalinhamento implementação vs intenção | Manter activo |
| `FASE_4_ENCODER_DESIGN.md` | architecture/design | keep-active | Spec encoder Player View | Idem | Manter activo |
| `FASE_5_AVALIADOR_DESIGN.md` | architecture/design | keep-active | Spec avaliador + convenções classificação | Idem | Manter activo |
| `FASE_6_MEMORIA_APRENDIZAGEM_DESIGN.md` | architecture/design | keep-active | Spec memória/agregados | Idem | Manter activo |
| `FASE_7_MINI_LLM_DESIGN.md` | architecture/design | keep-active | Spec mini-LLM advisory | Idem | Manter activo |

### `docs/ai/reviews/` (2 ficheiros)

| Ficheiro | Tipo | Estado sugerido | Motivo curto | Risco se arquivar | Recomendação |
|----------|------|-----------------|--------------|-------------------|--------------|
| `reviews/ROADMAP_COMPLIANCE_REVIEW.md` | status report | archive-candidate | Auditoria pontual 2026-06-06 | Perda de trilha de auditoria processual | Arquivar; manter link desde status report |
| `reviews/TECHNICAL_INTEGRITY_REVIEW.md` | status report | archive-candidate | Snapshot tsc/test/build 2026-06-06 | Perda de evidência de integridade na data | Arquivar |

### `docs/ai/implementation-prompts/` (16 ficheiros)

Todos classificados como **implementation prompt** / **archive-candidate** — executadas; relatórios correspondentes em `archive/implementation-reports/`.

### `docs/ai/implementation-reports/` (22 ficheiros)

| Ficheiro | Estado sugerido | Nota |
|----------|-----------------|------|
| Impl 1–10, 12, 14 + hotfixes 1.1, H2 | archive-candidate | Histórico; resumidos no status report |
| Impl 11 Tier B | keep-active | Spec Tier B ainda relevante → `active/current-work/` |
| Impl 13 Sueca bot | keep-active | Base v2/S23 → `active/current-work/` |
| Impl 15 Hearts | review-needed | H15 parcial → `active/current-work/` |
| Impl 16 + 16.1 King | keep-active | H16-OK pendente → `active/current-work/` |

### `docs/ai/repo-review/` (1 ficheiro)

| Ficheiro | Tipo | Estado sugerido | Motivo curto |
|----------|------|-----------------|--------------|
| `repo-review/packs/generated/ai-decisions-context.md` | temporary/intermediate | duplicate/obsolete | Pack Repomix gerado; não versionar |

---

## 1. Resumo por contagem de estados

| Estado sugerido | Contagem | % |
|-----------------|----------|---|
| **keep-active** | 18 | 35% |
| **archive-candidate** | 31 | 60% |
| **review-needed** | 2 | 4% |
| **duplicate/obsolete** | 2 | 4% |
| **Total** | **52** | 100% |

---

## 2. Top 10 ficheiros que mais merecem arquivo

1. `repo-review/packs/generated/ai-decisions-context.md` — 1,7 MB gerado
2. `implementation-prompts/IMPLEMENTATION_8_MINI_LLM_ADVISORY_PROMPT.md`
3. `implementation-prompts/IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_PROMPT.md`
4. `implementation-prompts/IMPLEMENTATION_5_EVALUATOR_V0_PROMPT.md`
5. `implementation-prompts/IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_PROMPT.md`
6. `implementation-prompts/IMPLEMENTATION_1_LOGGER_V0_PROMPT.md`
7. `reviews/ROADMAP_COMPLIANCE_REVIEW.md`
8. `reviews/TECHNICAL_INTEGRITY_REVIEW.md`
9. `FASE_2B_ARQUIVO_FIXTURES.md`
10. `FASE_2_FIXTURES_METRICAS.md`

---

## 3. Top 10 ficheiros que devem ficar activos

1. `ROADMAP_AI.md`
2. `IMPLEMENTATION_PLAN_AI.md`
3. `CARD_INTELLIGENCE_STATUS_REPORT.md`
4. `FASE_1_METRICAS.md`
5. `FASE_2A_PRIORIDADES_METRICAS.md`
6. `FASE_2B_FIXTURES_METRICAS.md`
7. `FASE_5_AVALIADOR_DESIGN.md`
8. `IMPLEMENTATION_16_1_KING_NEGATIVE_CONTRACT_FIX_REPORT.md`
9. `IMPLEMENTATION_16_KING_BOT_METRICS_UPGRADE_REPORT.md`
10. `IMPLEMENTATION_11_EVALUATOR_V1_TIER_B_REPORT.md`

---

## 4. Estrutura aplicada

```
docs/ai/
├── README.md
├── INVENTORY_REPORT.md          ← este ficheiro
├── active/
│   ├── README.md
│   ├── ROADMAP_AI.md
│   ├── IMPLEMENTATION_PLAN_AI.md
│   ├── CARD_INTELLIGENCE_STATUS_REPORT.md
│   ├── design/                  # PHASE0 + FASE_3–7
│   ├── specs/                   # FASE_1, 2A, 2B fixtures
│   └── current-work/            # relatórios Impl 11, 13, 15, 16, 16.1
├── archive/
│   ├── implementation-prompts/
│   ├── implementation-reports/
│   ├── reviews/
│   └── specs/                   # FASE_2B_ARQUIVO + redirect obsoleto
└── repo-review/
    ├── packs/generated/         # gitignored
    ├── prompts/
    └── reports/
```

---

## 5. Comandos de manutenção

```bash
# Regenerar pack lean (após alterações em active/ ou cardIntelligence/)
npx repomix --config repomix.config.json

# Verificar links em docs activos
rg 'implementation-prompts/|implementation-reports/' docs/ai/active --glob '*.md'
```

---

*Relatório para revisão humana. Reestruturação aplicada em 2026-06-09.*
