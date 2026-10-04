# Sueca SOLO portrait V3 — runtime capture log

Capture date: 2026-10-04  
Method: agent-controlled browser + CDP `Emulation.setDeviceMetricsOverride(390×844, mobile)`  
Renderer path: Phaser / canonical  
**No PASS/FAIL verdict in this document — evidence only.**

Common runtime identity (confirmed during capture):

| Field | Value |
|-------|--------|
| Viewport (inner) | **391 × 844** |
| Shell (`clientWidth/Height`) | **391 × 844** |
| sceneFrame (computed style) | **≈ (0.5, 0, 390, 844)** |
| `data-table-renderer` | **phaser** |
| `window.__suecaRenderer` | **phaser** |
| Geometry key | `v1::portraitStandard::391\|844\|0\|0\|0\|0\|portrait::1::suecaPortraitV3` |
| `layoutProfile` (scene) | **suecaPortraitV3** |
| Live zones @ scale 1 | HUD h=76; felt (12,80,366,616); trick (108,284,174,200); hand (8,656,374,136); action (0,792,390,52); lift=18 |

Note: shell width **391** (1px over design 390) → height-capped `sceneScale=1` with ~0.5px letterbox. Not the Simple Browser landscape-gate failure mode.

Corresponding audit SVGs: `docs/sueca-table-audit/proposed-comparison-v3/*_current_vs_v3.svg` (RIGHT panel = V3).

---

## 01_shell.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844 @ x≈0.5  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Post-deal table with local hand visible; trump/meta in HUD (captured after deal completed; not a blank pre-deal felt-only shell).  
- **vs V3 SVG (`01_geometry_shell`):** HUD/felt/hand/action bands match approved numbers in live geometry. Shell shot includes full hand chrome (SVG is abstract zones).  

## 02_pre_deal.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Pre-deal / dealing ritual — status plaque **DISTRIBUIÇÃO** (“Player 3 vai distribuir pela direita”).  
- **vs V3 SVG (`02_pre_deal`):** Status plaque present over felt; compare plaque size/placement to V3 statusPlaque `(45,328,300,112)`.  

## 03_ready.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Hands dealt, empty trick, play-ready / post-deal table (same capture window as 01 in this run).  
- **vs V3 SVG (`03_ready_play`):** Composition matches large felt + attached hand; SVG has no live card art.  

## 04_local_turn.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Local turn (`Player 1 … current turn`), **no card selected**; trick already had **2 cards** (P3+P2) when frozen for capture.  
- **vs V3 SVG (`04_local_turn`):** Empty-trick local-turn SVG not matched exactly — runtime evidence is local-turn **with partial trick**. South dock + hand attachment still comparable.  

## 05_selected.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Intended “selected lift” evidence. **Fact:** Phaser Sueca activates on tap (`selectCard` is DOM-path); durable React `selectedCard` lift is not the Phaser default. Capture shows a **legal hand card raised by `selectedLiftPad=18`** via scene pointer/lift for visual geometry check.  
- **vs V3 SVG (`04` selected / lift 18):** Lift magnitude 18 matches V3 target; not a full product select→confirm UX freeze.  

## 06_trick_1.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Trick with **1** card on table (e.g. Ace of hearts); Vaza 2.  
- **vs V3 SVG (`05_trick_1`):** Single trick card in center cross; compare seating + trick envelope 174×200.  

## 07_trick_2.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Trick with **2** cards; local turn active (same bitmap as 04 in this session).  
- **vs V3 SVG (`06_trick_2`):** Two-card cross footprint vs V3 trick box.  

## 08_trick_3.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Trick with **3** cards (P3/P2/P1 hearts sequence on Vaza 2).  
- **vs V3 SVG (`07_trick_3`):** Three-card cross; check overlap/margin inside trick rect.  

## 09_trick_4.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Trick complete — **4** cards listed; “Vaza terminada”.  
- **vs V3 SVG (`08_trick_4`):** Full four-card cross + continue chrome entering action band.  

## 10_continue.png

- **viewport:** 391×844  
- **sceneFrame:** ≈390×844  
- **renderer:** phaser  
- **geometry key:** `…::suecaPortraitV3`  
- **game state:** Same frame as 09 with **Continuar** CTA visible (`Pausa auto` on so CTA remains). Action band h=52.  
- **vs V3 SVG (`09_trick_continue`):** CTA in action/status 52px band; compare crowding vs V3.  

---

## Capture caveats (not a verdict)

1. Viewport was **391×844**, not exact 390×844 (1px shell width).  
2. States 01/03 share one post-deal frame; 04/07 share one 2-card local-turn frame; 09/10 share the completed-trick+CTA frame.  
3. Empty-trick local-turn and pure geometry-only shell (no hand) were not held long enough in this session.  
4. Phaser path does not use durable `selectCard`; 05 is lift geometry evidence at 18px.  
5. Do **not** treat this folder as PASS until a human compares each PNG to the V3 SVG right panels.
