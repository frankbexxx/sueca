# King Sintético — DEV mode

**Status:** S1 + S2 implemented  
**Branch:** `v2-main`  
**Scope:** DEV-only smoke foundation (no progression loop / Festa handoff yet)

---

## Purpose

Accelerate smoke-testing of all six King PT negative contracts while reusing the **canonical** engine:

- `KingPtGame.canPlayCard` / `playCard`
- scoring helpers unchanged
- no parallel legality code
- not `KingSimplifiedGame`
- not cardIntelligence `syntheticMode`

---

## Entry

```
?devKingSynthetic=1
?devKingSynthetic=1&synthContract=no_hearts
```

| Query | Behaviour |
|-------|-----------|
| `devKingSynthetic=1` | Solo King PT + KOH reveal; after KOH confirm, loads first fixture (`no_tricks`) |
| `+ synthContract=<id>` | Skips KOH; loads that contract fixture immediately |
| Invalid `synthContract` | Synthetic still enables; falls back to first contract |
| Production | Parser returns `null` — inert |

Badge: `DEV · KING SINTÉTICO` (± contract label).  
DEV control: **Seguinte** loads the next fixture (no fake scoring).

---

## Fixtures (S2)

| Contract | Beat | Intent |
|----------|------|--------|
| `no_tricks` | default | Legal lead / complete a trick |
| `no_hearts` | default | Cannot lead ♥ while holding non-♥ |
| `no_queens` | default | Must follow with Q♣ |
| `no_men` | default | Must follow with K♠ |
| `no_king_hearts` | `koh_follow_precedence` | K♥ illegal while can follow |
| `no_king_hearts` | `koh_obligation_void` | Void → must play K♥ |
| `no_last_two` | default | `trickNumber = 11` (next finish = late) |

Cards are still played only through the real engine.

---

## Production / persistence

- Double-gated by `NODE_ENV === 'development'`
- Pin control hidden/blocked while synthetic active
- Synthetic flag lives in DEV controller module — not serialized into canonical game state
- App clears king session when opening via synthetic query

---

## Not yet implemented (S3 / S4)

- Automatic trick / contract progression
- Synthetic score accumulation loop
- Auto result continuation
- Festa handoff
