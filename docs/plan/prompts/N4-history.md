# Prompt N4 — Histórico

## Objetivo
Continuar (4 slots) + fixar + últimas 3 terminadas na tab HISTORICO.

## Ficheiros
- `frontend/src/services/gameHistoryStorage.ts`
- `frontend/src/components/screens/HistoryScreen.tsx` + CSS
- `frontend/src/components/GameBoard.tsx` (record finished, pin action)

## Critérios
- [ ] `sueca-pinned-sessions-v1`, `sueca-finished-games-v1` (FIFO 3)
- [ ] HistoryScreen: secções Continuar, Fixadas, Últimas
- [ ] Fixar copia sessão actual para pinned
- [ ] Testes storage

## Fora de âmbito
- Cloud sync
