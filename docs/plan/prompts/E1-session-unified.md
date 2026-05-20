# Prompt E1 — Sessão unificada SUECÂO

## Contexto

O `GameBoard` cria sempre `new Game()` e ignora `adapter.initialize()`. O selector de jogo não altera o motor real. Sueca funciona; Spades/Hearts/King não estão ligados à UI.

## Objetivo

Uma única fonte de estado por variante via `GameAdapter`, sem alterar CSS da mesa.

## Ficheiros permitidos

- `frontend/src/models/games/GameAdapter.ts`
- `frontend/src/models/games/SuecaGame.ts`
- `frontend/src/models/games/GameFactory.ts`
- `frontend/src/components/GameBoard.tsx`
- `frontend/src/models/games/*.test.ts` (novos)
- `frontend/src/types/game.ts` (apenas se necessário `variantState`)

## Ficheiros proibidos

- `frontend/src/components/GameBoard.css` (mesa: `table-layout`, `table-surface`, `trick-cards-cross`, `player-seat`, `seats-layer`)
- `PlayerHand.tsx` / mobile CSS (fora de âmbito)

## Tarefas

1. Estender `GameAdapter` com: `getCurrentState()`, `finishTrick()`, `continueToNextRound()`, `startRound()`, `chooseAICard()`, `pauseGame()`, `resumeGame()`, `quitGame()`, `updatePlayerNames()`.
2. `SuecaGame`: `initialize` usa `dealingMethod`, `aiDifficulty`, `localPlayerIndex` das options; delega lifecycle ao `Game` interno.
3. `GameBoard`: remover dependência de `game: Game`; usar `gameAdapter` + `syncState()` após cada ação.
4. `handleStartGame`: `adapter.initialize(...)` → `setGameState` com `variant` correto.
5. IA: `chooseAICard` no adapter (Sueca via `Game`; outros jogos: primeira carta válida).
6. Multiplayer: sincronizar `gameState` do adapter, não `game.getState()`.

## Critérios de aceitação

- [ ] Sueca: jogo completo igual ao anterior (testes 10/10 passam).
- [ ] `initialize('spades', ...)` distribui 52 cartas (13×4) — teste unitário.
- [ ] Selector ainda pode mostrar só Sueca (E5 expõe o resto).
- [ ] Zero alterações em `GameBoard.css` da mesa.

## Testes

- `SuecaGame.test.ts` ou extensão `Game.test.ts`
- `GameSession.test.ts`: spades initialize 13 cards per player

## Não fazer

- Implementar regras completas Spades/Hearts/King (E2–E4).
- Mexer na mesa ou responsividade.
