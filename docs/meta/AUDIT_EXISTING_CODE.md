# AUDIT EXISTING CODE (Phase 0)

Date: 2026-04-24  
Author: Cursor Agent (for Frank)

## 1) Scope and method

- Audited repository state from local workspace and git refs.
- Compared `v2-main`, `origin/v1-maintenance`, and `origin/main`.
- Read core implementation files in `frontend/src/` and project docs.
- No gameplay code changes were made in this phase; only documentation outputs.

## 2) Branch reality check

## Finding

- `v2-main` and `origin/v1-maintenance` currently resolve to the same commit hash:
  - `28f52292488c777b2bb66b3784456a2e339ae1ae`
- `git diff origin/v1-maintenance...v2-main` returns no file differences.

## Implication

- There is no branch-level divergence to audit right now between those two refs.
- The "v2 broken imports/types" status reflects the current codebase state as checked out in `v2-main` (and effectively `v1-maintenance` remote ref at this moment).

## 3) Repository inventory

## Top-level structure (current)

- `frontend/` (single app, CRA-based)
- `docs/` (status notes)
- `assets/`
- root docs: `README.md`, `SETUP.md`, `QUICKSTART.md`, `PROJECT_STATUS.md`
- file `rules and so.txt` (rules draft/reference)

## App/file inventory

- Frontend source files found: 7
  - `frontend/src/App.tsx`
  - `frontend/src/index.tsx`
  - `frontend/src/models/Game.ts`
  - `frontend/src/models/Deck.ts`
  - `frontend/src/types/game.ts`
  - `frontend/src/components/GameBoard.tsx`
  - plus CSS files (`App.css`, `index.css`, `GameBoard.css`)

## Dependencies and scripts

From `frontend/package.json`:

- Stack:
  - React 18
  - TypeScript 4.9
  - `react-scripts` (Create React App)
- Scripts:
  - `start`, `build`, `test`, `eject` (CRA defaults)
- No monorepo tooling (`pnpm-workspace.yaml`, `turbo.json`) present.
- No engine packages, no AI packages, no server app.

## Tooling and CI status

- No `.github/workflows/ci.yml` found.
- No strict TS monorepo baseline (`tsconfig.base.json`) found.
- No Biome/ESLint+Prettier strategy at repo root for multi-package governance.
- Runtime/toolchain not validated in this VM via build because `npm` is unavailable in environment (`npm: command not found`).

## 4) Code health and architectural audit

## Positive observations

- Core Sueca rank hierarchy and card points are defined correctly in `types/game.ts`.
- Trick resolution logic in `Game.ts` models lead-suit/trump winner selection in expected order.
- Team scoring totals are aligned with 120-point deck assumptions.

## Critical issues

- **Documented API vs actual types drift:**
  - `GameBoard.tsx` imports and uses `DealingMethod`, `AIDifficulty`, `dealerIndex`, `trumpCard`, `waitingForRoundEnd`, `playedCards`, `isPaused`, etc.
  - `types/game.ts` does not export these members in current state.
- **Broken imports:**
  - `GameBoard.tsx` imports `./GameMenu` and `../hooks/useSound`, but those files do not exist in `frontend/src`.
- **Game class/UI contract mismatch:**
  - UI calls methods such as `chooseAICard`, `canPlayCard`, `pauseGame`, `resumeGame`, `quitGame`, `continueToNextRound`.
  - These methods are not present in the current `Game.ts`.
- **Architecture coupling:**
  - Game logic is a mutable class tightly coupled to UI expectations.
  - No isolated pure engine boundary; no deterministic seeded RNG.
- **Testing gap:**
  - No unit tests for rules/engine found.
  - No property-based tests.

## Verdict

- Current code cannot be trusted as a clean base for long-term multi-game platform goals without structured extraction/refactor.

## 5) "Middle AI" audit

## What exists now

- No clear standalone AI module/package exists.
- AI decision path appears expected in UI (`game.chooseAICard`) but is absent in the current checked-in `Game.ts`.
- Existing docs repeatedly claim improved AI and tracking features, but these claims are not reflected in available source files.

## Assessment

- The "middle AI" is **not auditable as a stable, self-contained component** in current tree.
- If a previous stronger heuristic existed, it is not present in the currently reachable source snapshot.

## Portability judgement

- Salvageable as concepts only (desired behavior), not as reusable implementation.
- Recommendation: re-implement as pure `HeuristicAI` in `packages/ai-sueca` against a pure engine API.

## 6) Rules compliance audit (implementation vs canonical Sueca)

This section compares what is implemented now against expected Portuguese Sueca rules baseline.

## Implemented or partially implemented

- 40-card deck (A,7,K,J,Q,6..2) and points (A11, 710, K4, J3, Q2) -> present.
- Follow-suit requirement -> present (`isValidCard` checks lead suit obligation).
- Trump beats non-trump in trick resolution -> present.
- Team point aggregation and game-victory accumulation model -> present.

## Missing/unclear/high-risk rule areas

- **Renúncia flow**: no enforceable detection/penalty lifecycle.
- **Canonical dealing/dealer procedure variants**: custom methods A/B exist, but canonical source of truth not formalized.
- **Tie progression semantics** (e.g., 60-60 carry/hand value): partially modeled but not documented against canonical wording.
- **Illegal move protocol** (UI/engine-level guarantees and error semantics) not robustly specified.
- **Table protocol details** (cutting, shuffle responsibilities, first lead exactness under all variants) not codified in tests/docs.
- **No test suite** validating invariants like 120 total points always, 10 cards each at hand start, etc.

## 7) Preserve / Port with Refactor / Discard

## Preserve (concepts / reference logic)

- Card model primitives: suit/rank domain and point hierarchy concepts.
- Trick winner comparison logic (lead suit + trump precedence).
- Basic scoring thresholds concept (61/91/120 and game race-to-4 framing), pending canonical confirmation.

## Port with refactor (target packages)

- `frontend/src/models/Deck.ts` -> port as pure deterministic deck generator into `packages/engine-core` with seeded RNG.
- `frontend/src/models/Game.ts` rule fragments -> split into pure ruleset functions in `packages/engine-sueca`.
- Any recoverable heuristic strategy ideas -> reframe under `packages/ai-common` + `packages/ai-sueca`.

## Discard

- Current CRA single-app architecture as project backbone.
- Tight UI <-> game class coupling.
- Non-existent/phantom module references and drifted status docs as implementation source.
- Any expectation of scaling this structure to multiplayer/multi-ruleset without re-architecture.

## 8) Top 5 technical risks to front-load in Phase 1/2

1. No pure engine boundary (blocks tests, AI benchmarking, multiplayer authority model).
2. API drift between types, UI, and game model (high regression risk).
3. Missing canonical rules document (ambiguous expected behavior).
4. No CI/test enforcement (quality debt compounds immediately).
5. Toolchain lock to CRA + mutable class design (poor fit for planned monorepo platform).

## 9) Recommendation for next checkpoint

- Accept this audit as baseline.
- Confirm/adjust canonical rules in `docs/rules/sueca.md`.
- Then start Phase 1 from clean monorepo scaffold rather than trying to salvage current app architecture.

