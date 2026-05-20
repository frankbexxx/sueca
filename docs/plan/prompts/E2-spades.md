# Prompt E2 — Spades jogável

## Contexto

E1 ligou `GameBoard` aos adapters. `SpadesGame` tem deal e `canPlayCard` parcial; falta bidding, scoring, `finishTrick`, fim de ronda.

## Objetivo

Spades jogável em 4 jogadores (52 cartas), equipas 0+2 vs 1+3.

## Ficheiros permitidos

- `frontend/src/models/games/SpadesGame.ts`
- `frontend/src/models/games/trickUtils.ts` (novo, partilhado)
- `frontend/src/types/game.ts` (`variantState` se necessário)
- `frontend/src/constants/gameMetadata.ts` (`spades` → `active` quando OK)
- `frontend/src/models/games/SpadesGame.test.ts`
- `frontend/src/components/StartMenu.tsx` (bid UI mínima, sem CSS mesa)

## Ficheiros proibidos

- `GameBoard.css` (mesa)

## Tarefas

1. Fase bidding: guardar bids equipa em `variantState.spades`; UI mínima (input ou auto-bid 4 para MVP).
2. `finishTrick`: contar vazas por equipa; `waitingForTrickEnd` → líder próxima vaza.
3. Fim de 13 vazas: scoring contrato (+10 se >= bid, +1 overtrick, -10 se falhar); atualizar `gameScore`.
4. Meta: primeiro a 500 (ou 200 MVP); `isGameOver` quando atingido.
5. `chooseAICard`: heurística simples (seguir naipe, trump se ganha).
6. Testes: trick winner, follow spades rule, scoring.

## Critérios de aceitação

- [ ] 1 ronda Spades jogável do início ao fim (devtools).
- [ ] `npm test` inclui SpadesGame.test.ts verde.
- [ ] `gameMetadata.spades.status = 'active'`.

## Não fazer

- CSS da mesa.
- Multiplayer Spades.
