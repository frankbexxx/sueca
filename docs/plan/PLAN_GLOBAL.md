# SUECÂO Global Expansion Plan

## Visão geral

Este plano define a evolução da base atual de SUECA para um framework modular chamado SUECÂO. O objetivo é suportar o jogo original e adicionar três jogos extras (Spades, Hearts e King placeholder) mantendo um núcleo reutilizável para decks, regras e IA.

**Estado real (Maio 2026):**

| Área | Estado |
|------|--------|
| Sueca (40 cartas) | Funcional e em produção |
| Deploy Vercel | Ativo — ver [DEPLOY.md](../DEPLOY.md) e [RELEASE_CHECK.md](../RELEASE_CHECK.md) |
| Spades / Hearts | Protótipo de adapter — **não exposto no selector** |
| King | Placeholder — **não exposto no selector** |
| Testes frontend | Suíte mínima em `Game.test.ts` |
| IA externa / multiplayer | Dev-only por defeito (localhost) |

## Fases principais

1. Arquitetura modular de jogo — **parcial** (adapters existem; UI ainda usa `Game` diretamente para Sueca)
2. Implementação dos jogos — **Sueca completo**; Spades/Hearts/King incompletos
3. UI e multiplayer genéricos — **parcial** (selector e adapters; fluxo unificado pendente)
4. IA e personalidades — **planeado**
5. Documentação e entrega — **em curso**

## 1. Arquitetura modular de jogo

- Definir um modelo de cartas e baralho reutilizável para 52 cartas.
- Criar interfaces de jogo genéricas: `GameAdapter`, `GameFactory`.
- Refatorar o motor atual de Sueca para esta arquitetura (Sueca ainda corre via `Game.ts` + `SuecaGame` adapter).
- Garantir que o core não dependa de frontend ou de regras específicas de um jogo.

## 2. Implementação dos jogos

- **Sueca:** completo (regras, scoring, IA local, deploy).
- **Spades / Hearts:** protótipos com regras parciais; scoring e fluxo de ronda incompletos.
- **King:** placeholder com TODOs explícitos em `KingGame.ts`.

## 3. UI e multiplayer genéricos

- Seleção de jogo no frontend — apenas **Sueca** visível por defeito.
- `GameBoard` genérico existe mas mistura `Game` + `GameAdapter` (estabilizar antes de reativar variantes).
- Multiplayer WebSocket: cliente pronto; servidor de produção não configurado.

## 4. IA e personalidades

- IA local em `Game.chooseAICard`.
- Serviço Python em `sueca-ai/` com testes pytest; deploy e `REACT_APP_AI_SERVICE_URL` pendentes.

## 5. Documentação e entrega

- Plano global: `docs/plan/PLAN_GLOBAL.md`
- Prompts: `docs/plan/prompts/implementation-prompts.md`
- Release checklist: `docs/RELEASE_CHECK.md`

## Próximo passo recomendado

1. Estabilizar Sueca (mobile, testes, assets, deploy docs) — **prioridade**
2. Corrigir fluxo `GameBoard` → `adapter.initialize()` **ou** manter variantes escondidas
3. Só depois reativar Spades/Hearts no selector com `REACT_APP_SHOW_EXPERIMENTAL_GAMES=true`

## Estrutura de documentação

- `docs/plan/PLAN_GLOBAL.md`
- `docs/plan/prompts/implementation-prompts.md`
- `docs/RELEASE_CHECK.md`
