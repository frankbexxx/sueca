# Prompt N3 — Game setup per variant

## Objetivo
GameSetupScreen dedicado; ⚙ na home abre setup com Voltar; remover tab Play.

## Ficheiros
- `frontend/src/components/screens/GameSetupScreen.tsx` + CSS
- `frontend/src/navigation/ShellRouter.tsx`
- `frontend/src/App.tsx`

## Critérios
- [ ] ⚙ → `homeSubScreen.setup(variant)` com botão Voltar
- [ ] Iniciar Jogo → `startGame(config)`
- [ ] PlaySetup deprecado no router (pode re-export)

## Fora de âmbito
- Histórico, temas
