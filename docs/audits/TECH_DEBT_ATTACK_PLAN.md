# TECH_DEBT_ATTACK_PLAN

Auditoria técnica conservadora do repo Sueca — limpeza, bugs silenciosos e riscos de runtime, **sem** alterar regras de jogo, bots ou UX.

## 1. Resumo

Objectivo: encontrar problemas demonstráveis (código morto, tipagem fraca perigosa, mutações, promises não tratadas, erros build/lint/type) com evidência por ficheiro/linha. Corrigir apenas diffs pequenos e reversíveis. Gameplay, regras e estratégia de bots ficam intocáveis salvo prova clara.

Análise: frontend CRA (TypeScript/React), motores de jogo, AI/bots, Card Intelligence, testes, backend WS MVP, config CI/lint/build.

## 2. Escopo

**Incluir:** frontend, TypeScript/React, motores (`models/games/*`, `Game.ts`), AI (`ai/`), Card Intelligence (`cardIntelligence/`), testes, `backend/`, `.github/workflows/ci.yml`, scripts build.

**Excluir:** refactor visual, UX, regras de jogo, optimizações prematuras, reescritas grandes, `sueca-ai/` Python (fora do path CI principal).

## 3. Ferramentas/comandos

| Comando | Existe? | Onde |
|---------|---------|------|
| `cd frontend && npm run build` | ✅ | `frontend/package.json` |
| `cd frontend && npm test -- --watchAll=false` | ✅ | idem |
| `cd frontend && npx tsc --noEmit` | ✅ (não script npm) | CI + `docs/RELEASE_CHECK.md` |
| `cd frontend && npm run lint` | ❌ INEXISTENTE | ESLint só via `react-app` no build |
| `cd frontend && npm run typecheck` | ❌ INEXISTENTE | usar `npx tsc --noEmit` |
| `cd backend && npm test` | ✅ | `backend/package.json` |
| `cd backend && node --check src/server.js` | ✅ (CI) | `.github/workflows/ci.yml` |
| Grep por padrões (`any`, `@ts-ignore`, `==`, timers, etc.) | ✅ | ripgrep manual |

**Nota:** `frontend/tsconfig.json` exclui `*.test.ts(x)` — typecheck CI não cobre ficheiros de teste.

## 4. Categorias de procura

### Código morto / fantasma

- [ ] Exports públicos sem consumidores (`cardIntelligence/index.ts`)
- [ ] Re-exports `@deprecated` (`cardIntelligence/debugConsole.ts`)
- [ ] Ficheiros legacy em `docs/_archives/`

### Imports / variáveis não usadas

- [ ] ESLint `no-unused-vars` (só no build, sem script dedicado)
- [ ] Parâmetros órfãos em handlers

### Tipagem fraca

- [ ] `any` explícito (`useLanguage.ts`)
- [ ] `as any` — grep: **0 ocorrências** em `frontend/src`
- [ ] `@ts-ignore` / `@ts-expect-error` — 1 em teste

### Bugs de lógica

- [ ] `==` / `!=` soltos — grep: só `!= null` (OK)
- [ ] `indexOf(Math.min/max(...))` em empates (stats UI)
- [ ] off-by-one em motores — coberto por testes existentes

### Mutação acidental

- [ ] `.sort()` em arrays derivados de eventos (`spadesEncoder.ts`)
- [ ] `applyHandSortToState` — mutação intencional de `GameState`
- [ ] `queryMemory` — `.sort()` in-place no array devolvido pelo store

### Runtime

- [ ] Promises sem `.catch()` (`GameBoard`, `OnlineScreen`)
- [ ] Timers/listeners — verificar cleanup em `useEffect`
- [ ] Card Intelligence: falhas de log silenciosas em produção

### React

- [ ] `eslint-disable-next-line react-hooks/exhaustive-deps` (2 ficheiros — rever intencional)
- [ ] State update após unmount — baixo risco com cleanup existente

### Card Intelligence

- [ ] Debug console só com `CARD_INTELLIGENCE_DEBUG` ✅
- [ ] LLM advisory default OFF ✅
- [ ] Memory ingest só offline/debug — **não** live em jogadas ✅
- [ ] Evaluator só em debug/export — **não** no hot path ✅
- [ ] `recordLogFailure` — warn só em dev

## 5. Matriz de severidade

| Nível | Critério |
|-------|----------|
| P0 | Crash/corrupção de estado em produção |
| P1 | Bug provável ou inconsistência perigosa |
| P2 | Limpeza segura / hardening defensivo |
| P3 | Melhoria opcional / dívida aceite |
| WONTFIX | Conhecido, documentado, fora de escopo |

## 6. Ordem de ataque

1. build / typecheck / testes (baseline verde)
2. runtime / uncaught promises / null guards óbvios
3. mutações defensivas em encoders/queries
4. dead exports / unused imports
5. tipagem fraca localizada
6. cleanup menor + documentação

## 7. Regras Fase B

- Listar achados com ID antes de corrigir
- Agrupar por P0→P3; um tema por commit
- Diffs mínimos; testes + tsc após cada grupo
- Ambíguo → documentar, pedir validação humana

## 8. Output Fase A

- Documento: `docs/audits/TECH_DEBT_ATTACK_PLAN.md` (este ficheiro)
- Comandos mapeados acima
- Pronto para Fase B após aprovação / Agent mode
