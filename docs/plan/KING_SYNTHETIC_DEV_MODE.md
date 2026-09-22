# King Sintético — DEV mode

**Status:** Combined-negative pivot + UI label alignment  
**Branch:** `v2-main`  
**Scope:** DEV-only smoke — one full 13-trick round with all six negatives active → normal Festa

---

## Purpose

Accelerate smoke-testing of King PT **combined** negative legality and scoring while reusing the **canonical** engine:

- `KingPtGame.canPlayCard` / `playCard`
- `negativeTrickPenalty` composed (summed) — no new penalty values
- `heartsLeadForbidden` / `mustPlayKingOfHearts` widened by a DEV-only flag
- no parallel rules engine
- not `KingSimplifiedGame`
- not cardIntelligence `syntheticMode`
- normal King (non-synthetic) unchanged

---

## Entry

```
?devKingSynthetic=1
```

| Query | Behaviour |
|-------|-----------|
| `devKingSynthetic=1` | Solo King PT + KOH reveal; after KOH confirm, enables combined-all-negatives on the dealt 13-card round |
| `synthContract=` | **Removed** — ignored if present |
| Production | Parser returns `null` — inert |

Badge: `DEV · KING SINTÉTICO`

---

## Canonical user-facing naming

| Surface | Copy |
|---------|------|
| Product name (HUD / KOH) | `King Sintético` |
| HUD subtitle | `Todos os negativos` |
| History / score-sheet row | `Sintético · Todos os negativos` |
| End-of-negatives title | `Negativos sintéticos concluídos` |
| Totals section | `Total acumulado` |
| Continue CTA | `Avançar para festas` |

Do **not** show: `King simplificado`, English `negative`, internal contract IDs, or `/10` during a synthetic DEV session.

---

## 5-game display model

While `isKingSyntheticActive()` (or engine flag) marks a synthetic session:

| Engine gameIndex | Display |
|------------------|---------|
| 0 (combined negatives) | `Jogo 1/5` |
| 6 Festa 1 | `Jogo 2/5` |
| 7 Festa 2 | `Jogo 3/5` |
| 8 Festa 3 | `Jogo 4/5` |
| 9 Festa 4 | `Jogo 5/5` |

Normal King (no synthetic session) stays `Jogo 1/10` … `Jogo 10/10`.

---

## Model

1. Normal KOH + full 13-card deal (`gameIndex = 0`)
2. DEV flag `devSyntheticAllNegatives` (not a production `KingNegativeContract`)
3. Play **one** 13-trick round with:
   - follow-suit
   - no_hearts lead restriction
   - no_king_hearts K♥ obligation
   - scoring = sum of all six `negativeTrickPenalty` values per trick
4. Early-end **disabled** in synthetic (so tricks 12–13 always run)
5. One history row: `Sintético · Todos os negativos`
6. Continue (`Avançar para festas`) → `gameIndex = 6` (Festa) with scores preserved; synthetic **engine** flag cleared; DEV controller stays active for 5-game progress
7. Normal Festa engine thereafter

---

## Scoring source

HUD and result modals read **engine** fields only:

- `kingPt.playerScores`
- `kingPt.lastRoundDeltas`
- history row deltas from the combined round

They must **not** use `KingSimplifiedGame` (−5/+5) or fixture placeholders. Penalty **values** are unchanged (composed canonical negatives).

---

## AI

Uses real `getLegalIndices` / `canPlayCard`. Strategy is generic avoid-winning (no six-objective solver).

---

## Production / persistence

- Double-gated by `NODE_ENV === 'development'`
- Pin + session save blocked while synthetic active
- Flag stripped / false outside development (`getKingPtState`)
- Not intended to persist mid-round synthetic state

---

## Score sheet

Completed synthetic row uses history title; unused negative slots stay empty/zero; Festa rows continue normally. End-of-negatives sheet title/CTA use the canonical copy above. No fake duplicate negative rows.
