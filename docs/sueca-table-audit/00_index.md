# Sueca table audit — index

**Branch:** `v2-main`  
**Scope:** Sueca table / board area only  
**Updated:** 2026-10-04  

## Status (portrait V3)

| Item | State |
|------|--------|
| Sueca Phaser portrait geometry | **V3 implemented** (`layoutProfile: suecaPortraitV3`) |
| Runtime validation | [runtime-v3-validation/](./runtime-v3-validation/) |
| Baseline | V3 accepted as current Sueca SOLO Phaser portrait baseline |
| Multiplayer / DOM Sueca | **DEFAULT** geometry (unchanged) |
| Landscape | **DEFAULT** (unchanged) |
| Deferred visual bugs | Continue CTA placement; top-right HUD/chrome crowding (post-deploy smoke) |

## Package layout

| File / folder | Purpose |
|---------------|---------|
| [01_state_list.md](./01_state_list.md) | Sueca table-visible states derived from code |
| [02_geometry_math.md](./02_geometry_math.md) | Formulas, computed rects, overlaps (pre-V3 CURRENT dump) |
| [diagrams/](./diagrams/) | Dual-panel SVGs of pre-proposal CURRENT coded geometry |
| [proposed-comparison/](./proposed-comparison/) | V1 CURRENT vs PROPOSED |
| [proposed-comparison-v2/](./proposed-comparison-v2/) | V2 CURRENT vs PROPOSED |
| [proposed-comparison-v3/](./proposed-comparison-v3/) | V3 CURRENT vs PROPOSED (**approved**) |
| [runtime-v3-validation/](./runtime-v3-validation/) | Phaser SOLO screenshots + capture log |
| `_gen_diagrams.mjs` | Regenerator for CURRENT diagrams |
| `_computed_portrait_390x844.json` | Numeric dump used by CURRENT diagrams |

## Reference viewport for drawings

All diagrams use the **PROVISIONAL** portrait design frame:

- `PROVISIONAL_DESIGN_FRAMES.portraitStandard` = **390 × 844**
- `sceneScale = 1` (zero safe insets)
- Orientation: portrait

Real devices scale this frame uniformly into the safe shell (`sceneFrame` letterboxed). Landscape phone is unsupported (`PROVISIONAL_LANDSCAPE_MIN_SHELL` = 1024 × 600).

## Diagram inventory

| # | File | State |
|---|------|--------|
| 01 | [sueca_state_01_geometry_shell.svg](./diagrams/sueca_state_01_geometry_shell.svg) | Empty canonical zones |
| 02 | [sueca_state_02_pre_deal_ritual.svg](./diagrams/sueca_state_02_pre_deal_ritual.svg) | Pre-deal ritual (`SuecaDealingModal`) |
| 03 | [sueca_state_03_post_deal_distributing.svg](./diagrams/sueca_state_03_post_deal_distributing.svg) | Post-deal distributing (hands hidden) |
| 04 | [sueca_state_04_post_deal_hands_reveal.svg](./diagrams/sueca_state_04_post_deal_hands_reveal.svg) | Hands reveal, trump still hidden |
| 05 | [sueca_state_05_post_deal_trump_first.svg](./diagrams/sueca_state_05_post_deal_trump_first.svg) | Trump / first-player plaques |
| 06 | [sueca_state_06_ready_play_idle.svg](./diagrams/sueca_state_06_ready_play_idle.svg) | Play ready, not local turn |
| 07 | [sueca_state_07_local_turn_no_select.svg](./diagrams/sueca_state_07_local_turn_no_select.svg) | Local turn, no selection |
| 08 | [sueca_state_08_local_turn_selected.svg](./diagrams/sueca_state_08_local_turn_selected.svg) | Local turn, selected lift |
| 09–12 | `sueca_state_09`…`12_trick_*.svg` | Trick with 1–4 cards |
| 13 | [sueca_state_13_trick_continue.svg](./diagrams/sueca_state_13_trick_continue.svg) | Continue CTA band |
| 14 | [sueca_state_14_round_end_modal.svg](./diagrams/sueca_state_14_round_end_modal.svg) | Round-end modal |
| 15 | [sueca_state_15_unsupported_viewport.svg](./diagrams/sueca_state_15_unsupported_viewport.svg) | Unsupported gate |

## How to regenerate

```bash
node docs/sueca-table-audit/_gen_diagrams.mjs
```

## Primary code sources

- [`frontend/src/scene/calculateSceneGeometry.ts`](../../frontend/src/scene/calculateSceneGeometry.ts)
- [`frontend/src/scene/provisionalSceneGeometryConstants.ts`](../../frontend/src/scene/provisionalSceneGeometryConstants.ts)
- [`frontend/src/scene/canonicalCardMetrics.ts`](../../frontend/src/scene/canonicalCardMetrics.ts)
- [`frontend/src/runtime/canonicalScenePlacement.ts`](../../frontend/src/runtime/canonicalScenePlacement.ts)
- [`frontend/src/models/games/suecaHandRitual.ts`](../../frontend/src/models/games/suecaHandRitual.ts)
- [`frontend/src/table/localHandLayout.ts`](../../frontend/src/table/localHandLayout.ts)
- [`frontend/src/renderers/phaser/phaserPremiumLayout.ts`](../../frontend/src/renderers/phaser/phaserPremiumLayout.ts) (`premiumTrickOffset`)
- [`frontend/src/components/GameBoard.tsx`](../../frontend/src/components/GameBoard.tsx) (presentation gates / mounts)
