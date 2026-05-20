# SUECÂO Global Expansion Plan

## Visão geral

Este plano define a evolução da base atual de SUECA para um framework modular chamado SUECÂO. O objetivo é suportar o jogo original e adicionar três jogos extras (Spades, Hearts e King placeholder) mantendo um núcleo reutilizável para decks, regras e IA.

**Estado real (Maio 2026):**

| Área | Estado |
|------|--------|
| Sueca (40 cartas) | Funcional e em produção |
| Deploy Vercel | Ativo — ver [DEPLOY.md](../DEPLOY.md) e [RELEASE_CHECK.md](../RELEASE_CHECK.md) |
| Spades / Hearts / King | MVP jogável via `GameAdapter`; expostos no selector |
| Sessão unificada | `GameBoard` → `adapter.initialize()` (E1) |
| Testes frontend | `Game.test.ts`, `GameSession.test.ts`, `SpadesGame.test.ts` |
| IA externa / multiplayer | Dev-only por defeito (localhost) |

## Fases principais

1. Arquitetura modular de jogo — **feito** (`GameAdapter`, `GameFactory`, sessão unificada)
2. Implementação dos jogos — **Sueca completo**; Spades/Hearts/King em MVP
3. UI e multiplayer genéricos — **parcial** (4 jogos no selector; multiplayer prod pendente)
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

- Seleção de jogo: **Sueca, Spades, Hearts, King** (`getAvailableGames()`).
- `GameBoard` usa apenas `GameAdapter` + `getCurrentState()`.
- Multiplayer WebSocket: cliente pronto; servidor de produção não configurado.

## 4. IA e personalidades

- IA local em `Game.chooseAICard`.
- Serviço Python em `sueca-ai/` com testes pytest; deploy e `REACT_APP_AI_SERVICE_URL` pendentes.

## 5. Documentação e entrega

- Plano global: `docs/plan/PLAN_GLOBAL.md`
- Prompts: `docs/plan/prompts/implementation-prompts.md`
- Release checklist: `docs/RELEASE_CHECK.md`

## Próximo passo recomendado

1. Smoke manual das 4 variantes + deploy Vercel (ver [RELEASE_CHECK.md](../RELEASE_CHECK.md))
2. E6 backlog: IA personas, multiplayer por variante, bidding UI Spades

## Estrutura de documentação

- `docs/plan/PLAN_GLOBAL.md`
- `docs/plan/prompts/implementation-prompts.md`
- `docs/RELEASE_CHECK.md`
