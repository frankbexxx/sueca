# GLOBAL-CARDS-01 — Adaptive human hand spacing

**Status:** IMPLEMENTED / VISUAL VALIDATION PENDING  
**Date:** 2026-09-21  
**Commit intent:** `feat: improve adaptive player hand spacing`

## Old behaviour

- Phaser: continuous expose curve (`0.33 @ 13` → `0.72 @ 2`) with **~2°** fan and noticeable arc
- DOM: fixed `CARD_SPACING` (18px) / scroll above 8 cards; selected card had outline only (pass used −8px lift)
- Two unrelated algorithms; opponents already separate

## New adaptive rule

Shared module: `frontend/src/table/localHandLayout.ts`

```
expose(count) = ease-out interpolate(13 → 2, 0.38 → 0.92)
spacing = min(cardDisplayWidth × expose, (availableWidth − cardDisplayWidth) / (count − 1))
```

Fits inside available width; continuous (no discrete tiers).

| Count | Intent |
|------:|--------|
| 13 | Compact, rank/suit readable (~38% expose) |
| 8–10 | More open than 13 |
| 4–6 | Comfortable separation |
| 1–3 | Near-natural |

## Selected lift

- Phaser: `HAND_VISUAL.selectedLift = 26` (Y-offset only)
- DOM: `translateY(-16px)` + accent outline
- **No** selected scale increase (`selectedScale = 1`)
- **No** selected depth / z-index promotion — fan stacking stays by card index

## Rotation

Near-zero (`portraitFanDeg = 0.35`); no theatrical semicircle.

## Paths

| Renderer | Entry |
|----------|--------|
| Phaser | `layoutLocalHandPositions` → `computeHumanHandLayout` |
| DOM | `PlayerHand` → `computeHandLayout` → `computeHumanHandSpacing` |
| Opponents | **unchanged** (`layoutOpponentBackPositions`) |

## Checks

- Portrait: 360 / 390 / 420
- Decks: Casino + CardMeister (geometry only; assets untouched)
- Games: Sueca 10, Spades/Hearts/King 13
- Table / HUD / GameBoard width: **not** modified
