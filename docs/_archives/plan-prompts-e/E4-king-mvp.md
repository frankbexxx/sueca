# Prompt E4 — King MVP

## Contexto

E3 entregou Hearts. `KingGame` é placeholder (primeira carta ganha sempre).

## Objetivo

King MVP jogável: 13 vazas, pelo menos 2 tipos de mão com scoring simples.

## Ficheiros permitidos

- `frontend/src/models/games/KingGame.ts`
- `frontend/src/models/games/trickUtils.ts`
- `frontend/src/types/game.ts`
- `frontend/src/constants/gameMetadata.ts`
- `frontend/src/models/games/KingGame.test.ts`

## Ficheiros proibidos

- `GameBoard.css` (mesa)

## Tarefas

1. Rotação de 8 mãos MVP (documentar em comentário): ex. negativas (evitar tricks) e positivas (ganhar tricks).
2. Trunfo: escolha fixa por mão (ex. última carta revelada ou naipe aleatório por ronda).
3. `calculateTrickWinner` real (naipe + trunfo).
4. Scoring: mão negativa = -pontos por vaza ganha; mão positiva = +pontos.
5. Fim: após 8 mãos ou 13 vazas × N — MVP 8 rondas curtas.
6. Testes: trick winner, scoring mão negativa.

## Critérios de aceitação

- [ ] King jogável sem placeholder winner.
- [ ] Testes King verdes.
- [ ] `king` → `active` ou `experimental` com nota em metadata.

## Não fazer

- Regras King completas PT-BR (leilão completo).
- CSS mesa.
