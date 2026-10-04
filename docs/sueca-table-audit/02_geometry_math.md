# Sueca table geometry / mathematics

All constants below marked **PROVISIONAL** come from  
[`provisionalSceneGeometryConstants.ts`](../../frontend/src/scene/provisionalSceneGeometryConstants.ts).  
They are not product-approved final visual design.

Reference computation: portrait design frame **390 × 844**, `sceneScale = 1`, zero insets.  
Numeric dump: [`_computed_portrait_390x844.json`](./_computed_portrait_390x844.json).

---

## 1. Viewport → sceneFrame

```
safeW = width - insets.left - insets.right
safeH = height - insets.top - insets.bottom
orientation = safeW >= safeH ? landscape : portrait   // normalizeViewport

# landscape shell gate (measured shell, not only safe):
if orientation == landscape AND (width < 1024 OR height < 600):
  unsupported: viewport_too_small

profile = compact if safe side below thresholds else standard
designFrame = PROVISIONAL_DESIGN_FRAMES[profile]
  portrait*: 390 × 844
  landscape*: 844 × 390

sceneScale = min(safeW / designW, safeH / designH)
if sceneScale < 0.45: unsupported

sceneW = designW * sceneScale
sceneH = designH * sceneScale
sceneFrame = centered in safeRect
```

**Thresholds (PROVISIONAL):**

| Name | Value |
|------|-------|
| portraitCompactMaxWidth / Height | 370 / 700 |
| landscapeCompactMaxWidth / Height | 760 / 360 |
| LANDSCAPE_MIN_SHELL | 1024 × 600 |
| minSceneWidth/Height/Scale | 280 / 320 / 0.45 |

---

## 2. Vertical bands (portrait) — PROVISIONAL

`PROVISIONAL_PORTRAIT_BANDS` (sum = 1):

| Band | Fraction | y0 @ 844 | height @ 844 |
|------|----------|----------|--------------|
| hud | 0.14 | 0 | 118.16 |
| felt | 0.46 | 118.16 | 388.24 |
| southSeat | 0.10 | 506.40 | 84.40 |
| hand | 0.20 | 590.80 | 168.80 |
| actionStatus | 0.10 | 759.60 | 84.40 |

Landscape bands (not drawn in this package’s SVGs): hud 0.20, felt 0.555, south 0.03, hand 0.16, action 0.055.

---

## 3. Internal zones (scene-local)

From `buildInternalZones` in `calculateSceneGeometry.ts`:

### hudRect / feltRect / handRect / actionStatusRect
```
hudRect  = (0, 0, sceneW, sceneH * hud)
feltRect = (0, hudH, sceneW, sceneH * felt)
southSeat = ((sceneW - southW)/2, hudH+feltH, sceneW*0.42, sceneH*southSeat)
handRect = (0, southBottom, sceneW, sceneH*hand)
actionStatusRect = (0, handBottom, sceneW, sceneH*actionStatus)
```

### Seats inside felt (PROVISIONAL_FELT_LAYOUT)
```
north: width = sceneW*0.4, height = feltH*0.22, top of felt, centered
west/east: w = feltW*0.22, h = feltH*0.36
  y = felt.y + feltH*0.48 - h/2
  insetX = feltW*0.02
decisionRect: w = feltW*0.56, h = feltH*0.22, bottom of felt, centered
trickSize = min(feltW,feltH)*0.5
trickY = center between north.bottom and decision.top
trickRect = square trickSize centered horizontally
```

### handInteractionRect
```
padX = handW * 0.04
padY = handH * 0.12
handInteractionRect expands handRect by pad; clamped to scene
```

### decisionSheetRect (Step 3C)
```
decisionSheetRect = (0, hudBottom, sceneW, handInteraction.y - hudBottom)
# Must NOT intersect hudRect or handInteractionRect
# May overlay felt / seats / trick / decisionRect
```

### Computed portrait 390×844 (sceneScale=1)

| Zone | x | y | w | h |
|------|---|---|---|---|
| hudRect | 0 | 0 | 390 | 118.16 |
| feltRect | 0 | 118.16 | 390 | 388.24 |
| seatN | 117 | 118.16 | 156 | 85.41 |
| seatW | 7.80 | 234.63 | 85.80 | 139.77 |
| seatE | 296.40 | 234.63 | 85.80 | 139.77 |
| seatS | 113.10 | 506.40 | 163.80 | 84.40 |
| trickRect | 97.94 | 215.22 | 194.12 | 194.12 |
| decisionRect | 85.80 | 420.99 | 218.40 | 85.41 |
| decisionSheetRect | 0 | 118.16 | 390 | 452.38 |
| handRect | 0 | 590.80 | 390 | 168.80 |
| handInteractionRect | 15.60 | 570.54 | 358.80 | 209.31 |
| actionStatusRect | 0 | 759.60 | 390 | 84.40 |

**Gap decision→hand:** `84.40` px (≥ `minDecisionToHandGapPx` = 8).

---

## 4. Sueca ritual zone pick

```
SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX = 86

resolveSuecaRitualCanonicalZone(geometry, kind):
  if kind != 'status': return 'decisionSheetRect'
  return decisionRect.height >= 86 ? 'decisionRect' : 'decisionSheetRect'
```

At portrait design scale:

```
decisionRect.height = 388.24 * 0.22 = 85.4128  <  86
⇒ status also uses decisionSheetRect
```

**This is a coded fact, not a wish.** Ritual status plaques therefore use the large sheet envelope (HUD bottom → hand interaction top), which is why the dealing UI can dominate the felt and leave the south/hand bands visually empty.

---

## 5. Card metrics (C2)

From `computeCanonicalCardMetrics` + `PROVISIONAL_CARD_METRICS`:

```
aspect = 1.4
baseCardW = 48 * sceneScale
baseCardH = round(48 * 1.4) * sceneScale = 67 * sceneScale

nominalHandDisplayH = baseCardH * 1.22
handDisplayH = min(nominalHandDisplayH, handInteractionH - selectedLiftPad)
handDisplayW = handDisplayH / aspect
cardW = handDisplayW / 1.22
cardH = handDisplayH / 1.22

trickCardW = min(baseCardW * 1.11, maxTrickWidthForCross(trickRect))
trick offsets: dx = round(trickW * 0.8), dy = round(trickH * 0.55)
opponent = card * 0.78
selectedLiftPad = 26  // must match HUMAN_HAND_LAYOUT.selectedLift
```

@ sceneScale=1 (computed):

| Metric | px |
|--------|-----|
| handDisplayW / H | 58.39 / 81.74 |
| layout cardW / H | 47.86 / 67.00 |
| trickCardW / H | 53.28 / 74.59 |
| opponentW / H | 37.33 / 52.26 |
| trick dx / dy | 43 / 41 |

### Local hand spacing (`localHandLayout.ts`)

```
expose(count) = ease-out between 0.38 (@13) and 0.92 (@2)
spacing = cardDisplayW * expose, clamped to availableWidth
selectedLift = 26px upward
```

### Trick placement

- Phaser: `premiumTrickOffset(compass)` around `trickCenter`
- DOM: `TrickArea` compass classes `trick-from-{south,west,north,east}`

---

## 6. Shell placement

```
shell(sceneLocal) = sceneFrame.origin + sceneLocal
hudRectShellStyle → zIndex 1100, overflow visible
sceneFrameHostStyle → zIndex 1, overflow hidden
decisionSheetRectShellStyle / decisionRectShellStyle → zIndex 2100
```

---

## 7. Presentation gates (do not change geometry)

```
hideHands  = waitingForRoundStart OR postDealHandsHidden(phase)
hideTrump  = waitingForRoundStart OR postDealTrumpHudHidden(phase)
playLocked = waitingForRoundStart OR postDealPlayLocked(phase) OR !tableReady …
suecaPlayReady = !waitingForRoundStart && phase==null && tableReady && !debugHold
```

---

## 8. Error / overlap report

### Intended overlaps

| Overlap | Intent |
|---------|--------|
| `decisionSheetRect` over felt / seats / trick / decisionRect | Step 3C large decision envelope |
| Modal overlay over entire scene | Round-end / game-over |
| `handInteractionRect` overlapping upward into south band | Selected-card lift pad |
| Trick cards within `trickRect` | Cross layout |

### Accidental / problematic (as coded today)

| Issue | Evidence |
|-------|----------|
| Ritual **status** falls to `decisionSheetRect` on portrait design frame | `decisionH ≈ 85.41 < 86` |
| Sheet height ≈ **452px** (~54% of scene) during ritual | Computed `decisionSheetRect` |
| South + hand bands remain in geometry but often empty during ritual | `hideHands` + sheet covers felt; dock/hand may look “orphaned” below sheet |
| Geometry constants are **PROVISIONAL** | File header + report requirement |
| Unit tests do not validate painted card art / aspect | Visual regressions (blue boxes / squash) are outside this geometry calculator |

### Zones that are mathematically tight

| Zone | Note |
|------|------|
| `decisionRect` height | 0.59px under clean status threshold |
| Landscape southSeat band | 0.03 of scene height — south label not enforced in minimums |
| Compact phone portrait | Same 390×844 frame scaled down; card metrics shrink with `sceneScale` |

### States that cannot be considered visually final

1. Pre-deal / post-deal ritual composition using `decisionSheetRect` on portrait (large empty lower shell relative to felt content).
2. Any state relying on PROVISIONAL band fractions pending product approval.
3. Card **asset** rendering defects (face-card art) — **not produced by zone math**; geometry audit cannot certify art correctness.

### Geometry invariants (enforced)

- All primary bands contained in scene.
- `trickRect` / `decisionRect` / N/W/E seats contained in felt; south contained in scene.
- `decisionSheetRect` does not intersect `hudRect` or `handInteractionRect`.
- `decisionRect` does not intersect hand or N/W/E exclusion labels.
- Minimums: decision ≥ 36px, hand height ≥ 50px, N/W/E labels ≥ 40×14, decision–hand gap ≥ 8.

---

## 9. Regenerating numbers

```bash
node docs/sueca-table-audit/_gen_diagrams.mjs
```

This script duplicates the calculator formulas for offline SVG generation (no Vite import needed). If calculator constants change, regenerate and re-check `_computed_portrait_390x844.json`.
