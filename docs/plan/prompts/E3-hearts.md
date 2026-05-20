# Prompt E3 — Hearts jogável

## Contexto

E2 entregou Spades. `HeartsGame` tem regras parciais de lead/copas; falta passagem, scoring individual, shoot the moon.

## Objetivo

Hearts jogável: 4 jogadores, evitar copas/Q♠, 100 pontos para fim.

## Ficheiros permitidos

- `frontend/src/models/games/HeartsGame.ts`
- `frontend/src/models/games/trickUtils.ts`
- `frontend/src/types/game.ts`
- `frontend/src/constants/gameMetadata.ts`
- `frontend/src/models/games/HeartsGame.test.ts`

## Ficheiros proibidos

- `GameBoard.css` (mesa)

## Tarefas

1. Passagem: 3 cartas (MVP: skip UI — pass automática aleatória ou fixa à esquerda).
2. `heartsBroken` quando copa jogada; proibir lead copas até broken.
3. Primeira vaza: regras 2♣ / sem copas+Q♠ no primeiro trick se possível.
4. Scoring por jogador em `variantState.hearts.playerScores`; vaza: 1 pt/copa, 13 Q♠.
5. Shoot the moon MVP: 26 ou 0 para todos se um jogador leva todas copas+Q♠.
6. `finishTrick` / fim de ronda / novo deal até alguém >= 100.
7. Testes: cannot lead hearts, scoring trick.

## Critérios de aceitação

- [ ] 1 ronda Hearts jogável.
- [ ] Testes Hearts verdes.
- [ ] `hearts` → `active`.

## Não fazer

- CSS mesa.
- Passagem UI elaborada (pode ser fase seguinte).
