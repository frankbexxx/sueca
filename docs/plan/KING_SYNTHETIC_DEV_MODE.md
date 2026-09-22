# King Sintético — product mode

**Status:** Production-selectable King preset  
**Branch:** `v2-main`  
**Preset id:** `king-pt-synthetic`

---

## Purpose

King Sintético is a **real King PT product mode**: one combined negatives round, then four Festas (5 games). Same canonical legality/scoring as King PT — not `KingSimplifiedGame`, not cardIntelligence `syntheticMode`.

---

## Mode identity

| | |
|--|--|
| User-facing | `King Sintético` |
| Preset | `king-pt-synthetic` |
| Engine | `KingPtGame` (same as `king-pt-normal`) |
| Not | `king-simplified` / KingSimplifiedGame |

---

## Entry

**Product:**

```ts
adapter.initialize(names, { rulesPresetId: 'king-pt-synthetic' })
```

Also selectable in solo setup when multiple King presets are listed (Landing redesign later).

**Optional DEV shortcut** (development only):

```
?devKingSynthetic=1
```

Routes into `king-pt-synthetic` — same rules path. No DEV badge in product play.

---

## Structure

| Display | Engine |
|---------|--------|
| `Jogo 1/5` | Combined all-negatives (`syntheticAllNegatives`) |
| `Jogo 2/5` … `5/5` | Festa gameIndex 6–9 |

HUD: `King Sintético` / `Todos os negativos` on game 1.  
End of negatives: `Negativos sintéticos concluídos` → `Avançar para festas`.  
History row: `Sintético · Todos os negativos`.

Normal King stays `1/10` … `10/10`.

---

## Rules / scoring

Unchanged combined implementation:

- 13-card deal after KOH
- all six negative scorers active
- follow-suit, Hearts lead ban, K♥ obligation
- cumulative composed penalties
- no early end on game 1
- Continue → `gameIndex = 6` (Festa); flag cleared; **preset retained**

---

## Persistence

Pin / autosave / leave-save / resume enabled.

- Config + state store `rulesPresetId: 'king-pt-synthetic'`
- Mid game-1: `syntheticAllNegatives` restored
- Mid Festa: preset alone keeps `2/5`…`5/5`
- No fallback to 10-game normal or King Simplified

---

## History / stats

Finished/pinned sessions keep `config.rulesPresetId`. Aggregate stats still key by `gameVariant` (`king`) — do not merge with Simplified identity; preset distinguishes modes when reading config.

---

## vs King Simplificado

| | Sintético | Simplificado |
|--|-----------|--------------|
| Preset | `king-pt-synthetic` | `king-simplified` |
| Engine | KingPtGame | KingSimplifiedGame |
| Scoring | PT composed penalties | ±5 / trick |
| Arc | 1+4 festas | 6 neg + 4 pos |
