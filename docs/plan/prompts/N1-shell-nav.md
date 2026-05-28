# Prompt N1 — Shell navigation foundation

## Objetivo
7 tabs no bottom nav (só ícones + tooltip), ShellRouter, back stack no INICIO, remover tab «Jogar».

## Ficheiros permitidos
- `frontend/src/types/navigation.ts`
- `frontend/src/navigation/ShellRouter.tsx`
- `frontend/src/components/navigation/BottomNav.tsx` + CSS
- `frontend/src/App.tsx`
- `frontend/src/styles/app-shell.css`
- `frontend/src/i18n/translations.ts`

## Ficheiros proibidos
- `GameBoard.css` (mesa)
- Lógica de regras dos jogos

## Critérios
- [ ] `AppTab`: home, stats, history, themes, rules, settings, profile
- [ ] Bottom nav compacto (~44px), ícones only, `aria-label` + `title`
- [ ] Nav oculto em partida (`app-shell--game`)
- [ ] Tab change reseta `homeSubScreen` para list
- [ ] Placeholder screens ou re-use temporário para tabs novas

## Fora de âmbito
- Histórico storage, temas visuais, exit app
