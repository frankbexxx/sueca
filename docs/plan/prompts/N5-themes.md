# Prompt N5 — Temas

## Objetivo
ThemesScreen + aplicar `data-theme` no shell via billingService.

## Ficheiros
- `frontend/src/components/screens/ThemesScreen.tsx` + CSS
- `frontend/src/services/billingService.ts`
- `frontend/src/styles/design-tokens.css` ou `app-shell.css`
- `frontend/src/constants/themeCardVisuals.ts` — `cardVisuals.backId` opcional por tema
- `frontend/src/constants/cardDeckRegistry.ts` — `resolveCardBackForTheme`

## Critérios
- [x] classic / forest / midnight seleccionáveis
- [x] Persistência localStorage
- [x] Preview visual na tab
- [x] Back por tema (piloto THEME-CARD-BACK-01): classic→suecao-navy, thebes→casino-05, midnight→casino-06, thule→casino-07; resto→fallback
- [x] Back por tema (THEME-CARD-BACK-02): 30 temas built-in com `backId` explícito; thebes→casino-07, thule→casino-05 (contraste felt); fallback suecao-navy para custom/ausente

## Fora de âmbito
- IAP real, alterar mesa profundamente
- Selector manual de deck/back no menu
- `theme → deckId` (faces) — fase futura
