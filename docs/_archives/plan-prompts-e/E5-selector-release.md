# Prompt E5 — Selector e release

## Contexto

E1–E4 entregaram 4 jogos. `getAvailableGames()` esconde `experimental`; localStorage pode ter variant inválida.

## Objetivo

Produção com 4 jogos no selector; docs alinhados.

## Ficheiros permitidos

- `frontend/src/constants/gameMetadata.ts`
- `frontend/src/components/StartMenu.tsx`
- `frontend/src/components/GameSelector.tsx`
- `docs/plan/PLAN_GLOBAL.md`
- `docs/RELEASE_CHECK.md`

## Ficheiros proibidos

- `GameBoard.css` (mesa)

## Tarefas

1. `getAvailableGames()`: devolver todos com `status` `active` (e `experimental` se flag env).
2. `StartMenu`: ao carregar variant do localStorage, reset para `sueca` se não estiver disponível.
3. Atualizar PLAN_GLOBAL e RELEASE_CHECK (smoke 4 jogos).
4. Remover dependência de `REACT_APP_SHOW_EXPERIMENTAL_GAMES` para jogos já `active`.

## Critérios de aceitação

- [ ] Selector mostra Sueca, Spades, Hearts, King.
- [ ] Clicar cada um inicia jogo dessa variante.
- [ ] Smoke: 1 ronda por jogo (manual checklist).

## Não fazer

- Alterar layout da mesa.
- Deploy automático (utilizador faz Sync Changes).
