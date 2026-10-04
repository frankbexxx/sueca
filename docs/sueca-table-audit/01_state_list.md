# Sueca table states (derived from code)

Geometry zones (`hudRect`, `feltRect`, seats, `trickRect`, `handRect`, …) are **phase-independent**.  
`calculateSceneGeometry` takes only viewport input — no game/phase/variant.

What changes visually for Sueca is **composition on top of those fixed zones**: presentation gates, ritual/decision surfaces, trick cards, hand selection, and modals.

## Source signals

| Signal | Where |
|--------|--------|
| `waitingForRoundStart` | engine / viewer |
| `SuecaRitualPhase` | `suecaHandRitual.ts` — shuffle / cut / dealer-decision / dealer-decision-result |
| `SuecaPostDealPhase` | deal-confirmed / distributing / hands-reveal / trump-reveal / first-player |
| `suecaPresentationGate` | `GameBoard` — `hideHands`, `hideTrump`, `playLocked` |
| `suecaPlayReady` | `suecaPresentationPlayReady(...)` |
| `currentPlayerIndex` vs local | turn cue + hand interactivity |
| `selectedCard` | hand lift |
| `currentTrick.length` | trick faces |
| `waitingForTrickEnd` | continue CTA (`continueFlowUi.ts`) |
| `waitingForRoundEnd` | `RoundEndModal` |
| SceneGeometry `supported` | measuring / unsupported gate |

## States drawn (grouped equivalents)

### 01 — Geometry shell
- Supported sceneFrame with empty zones labeled.
- No Sueca content yet (or content stripped for topology view).

### 02 — Pre-deal ritual
- Code: `shouldMountSuecaDealRitual` → `SuecaDealingModal` while `waitingForRoundStart`.
- Ritual phases (shuffle / cut / dealer-decision / result) share the same **table zone topology**; only plaque copy / focus seat changes.
- Hands hidden (`waitingForRoundStart` → `hideHands`).
- Overlay zone: `resolveSuecaRitualCanonicalZone` — `decision` / `human` always `decisionSheetRect`; `status` uses `decisionRect` only if height ≥ 86px.

### 03 — Post-deal distributing
- `SuecaPostDealPhase` ∈ {`deal-confirmed`, `distributing`}.
- `postDealHandsHidden` + `postDealTrumpHudHidden` + `postDealPlayLocked`.
- Plaque via `SuecaPostDealCard` → `CanonicalDecisionSurface`.

### 04 — Post-deal hands-reveal
- Hands shown; trump HUD still hidden; play still locked.
- Equivalent visual family for table topology (same zones).

### 05 — Post-deal trump-reveal / first-player
- Grouped: same sheet envelope; focus differs (`postDealFocusForPhase`).
- Play remains locked until `postDealPhase == null`.

### 06 — Ready play, not local turn
- `suecaPlayReady`; opponent turn cue on N/W/E; local hand inactive styling.

### 07 — Local turn, no selection
- Local seat active; `selectedCard == null`.

### 08 — Local turn, selected card
- Selected card lifts by `selectedLiftPad` (26px); must remain inside `handInteractionRect`.

### 09–12 — Trick progress (1…4 cards)
- Faces placed with `premiumTrickOffset` (Phaser) / compass classes (DOM `TrickArea`).
- Hand/opponent counts decrease as cards are played (diagram approximate).

### 13 — Trick continue
- `waitingForTrickEnd` → `GameActions` chrome in **`actionStatusRect`** band (not felt).

### 14 — Round end
- `RoundEndModal` full-viewport modal overlay (`modal-overlay`); table underneath still exists but is visually covered.
- Code does not remap zone rects for round-end.

### 15 — Unsupported viewport
- `sceneGeometry.supported === false` → “Viewport too small…” / measuring placeholder.
- No sceneFrame host styles applied.

## States intentionally not separated into extra drawings

| Code nuance | Why grouped |
|-------------|-------------|
| Ritual shuffle vs cut vs dealer-decision | Same zones + sheet; only copy/focus |
| `deal-confirmed` vs `distributing` | Same hideHands/hideTrump/playLocked |
| `trump-reveal` vs `first-player` | Same sheet; focus differs |
| Game-over modal | Same full overlay pattern as round-end (modal family) |
| Joiner “waiting for host” overlay | Shell overlay; not a distinct zone remap |

## Ambiguities (called out)

1. **DOM vs Phaser:** Solo Sueca may use Phaser; multiplayer forces DOM. Zone rects are shared; card placement math differs slightly (DOM CSS vs Phaser layout). Diagrams encode **canonical zone math** + approximate card placement from shared helpers.
2. **South seat vs local dock:** Geometry has `seatZones.south` + `handRect` below it. DOM also mounts `LocalPlayerDock` / `PlayerHand` as shell children — exact CSS stacking is presentation, not a second geometry calculator.
3. **Round-end / game-over:** Modal uses CSS overlay classes, not `decisionSheetRect` placement helpers.
