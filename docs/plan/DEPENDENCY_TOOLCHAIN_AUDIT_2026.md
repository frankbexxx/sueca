# Dependency & Toolchain Audit · 2026

**Project:** Suecão (`E:\SUECAO`)  
**Date:** 2026-09-07  
**Mode:** READ-ONLY (no dependency upgrades applied)  
**Branch context:** `v2-main` @ `22c6f6e` (CI/Vercel green after lockfile + unused-vars fixes)

**Purpose:** Baseline for a future modernization phase. Do **not** treat this as an urgent rewrite plan for gameplay work.

---

## 1. Executive summary

| Question | Answer |
|----------|--------|
| Current CI/deploy blockers from deps? | **None** (as of audit date; prior `yaml@2.9.0` lock + ESLint unused-vars were fixed) |
| CRA debt relevant? | **Yes (P1)** — maintain short-term; plan migration |
| Security blocker for E2? | **No** — mostly transitive/build-time or backend MP surface |
| Continue **E2 Phaser** before modernization? | **SIM** |

**Biggest structural risk:** Create React App / `react-scripts@5.0.1` (last meaningful release **2022-04-12**) freezes TypeScript ~4.9, Webpack/Jest/ESLint toolchain, and forces most frontend security noise into transitive CRA packages that `npm audit fix` cannot cleanly resolve without leaving CRA.

**Biggest practical runtime risk outside CRA:** Capacitor **6 → 8** major gap when Android shipping resumes; backend `ws` advisory if multiplayer server is exposed without patching within `^8.18.0` range.

---

## 2. Environment snapshot (audit machine)

| Location | Node | npm | Notes |
|----------|------|-----|-------|
| Local (this audit) | **v24.11.1** | **11.6.3** | Diverges from CI |
| GitHub Actions CI | **20** (setup-node) | **10.8.x** (bundled with Node 20 images) | Source of prior lockfile strictness |
| Vercel | **NÃO VERIFICADO** exact Node (dashboard/project setting) | typically npm matching image | Frontend root via `frontend/vercel.json`; last known deploy green on `22c6f6e` |
| Validation Docker (prior CI fix) | **v20.20.2** | **10.8.2** | Matches CI intent |

**Repo engines field:** none declared in `frontend/package.json` or `backend/package.json`.

**Risk:** local npm 11 can accept lock states that npm 10 rejects (already observed). Prefer validating install/build with **Node 20 + npm 10** before claiming CI parity.

---

## 3. Inventory — direct dependencies

### 3.1 Frontend (`frontend/package.json`)

| Package | Declared | Installed (local) | Wanted (`npm outdated`) | Latest (registry) | Direct |
|---------|----------|-------------------|-------------------------|-------------------|--------|
| react | ^18.2.0 | 18.3.1 | 18.3.1 | 19.2.8 | yes |
| react-dom | ^18.2.0 | 18.3.1 | 18.3.1 | 19.2.8 | yes |
| react-scripts | 5.0.1 | 5.0.1 | 5.0.1 | **5.0.1** (line frozen) | yes |
| typescript | ^4.9.5 | 4.9.5 | 4.9.5 | 7.0.2 | yes |
| phaser | ^3.80.1 | 3.80.1 | 3.90.0 | **4.2.1** | yes |
| pixi.js | ^8.20.1 | 8.20.1 (lock) | — (not in outdated list) | 8.20.1 | yes |
| firebase | ^12.14.0 | 12.14.0 | 12.18.0 | 12.18.0 | yes |
| react-colorful | ^5.7.0 | 5.7.0 | 5.8.1 | 5.8.1 | yes |
| @capacitor/core | ^6.2.0 | 6.2.1 | 6.2.2 | **8.5.1** | yes |
| @capacitor/app | ^6.0.2 | 6.0.3 | 6.0.3 | 8.1.1 | yes |
| @capacitor/preferences | ^6.0.3 | 6.0.4 | 6.0.4 | 8.0.1 | yes |
| @capacitor/splash-screen | ^6.0.3 | 6.0.4 | 6.0.4 | 8.0.2 | yes |
| @capacitor/status-bar | ^6.0.2 | 6.0.3 | 6.0.3 | 8.0.3 | yes |
| @capacitor/android | ^6.2.0 | 6.2.1 | 6.2.2 | 8.5.1 | yes (dev) |
| @capacitor/cli | ^6.2.0 | 6.2.1 | 6.2.2 | 8.5.1 | yes (dev) |
| @types/react | ^18.2.0 | 18.3.27 | 18.3.31 | 19.x | yes (dev) |
| @types/react-dom | ^18.2.0 | 18.3.7 | 18.3.7 | 19.x | yes (dev) |

### 3.2 Backend (`backend/package.json`)

| Package | Declared | Latest (registry / outdated) | Direct |
|---------|----------|------------------------------|--------|
| express | ^4.21.2 | wanted 4.22.2 / latest line also **5.2.1** | yes |
| cors | ^2.8.5 | 2.8.6 | yes |
| jsonwebtoken | ^9.0.2 | 9.0.3 | yes |
| uuid | ^11.0.3 | wanted 11.1.1 / latest **14.0.2** | yes |
| ws | ^8.18.0 | 8.21.3 | yes |

Backend `node_modules` was **missing** on the audit machine; outdated/audit used registry + lockless resolution metadata from npm.

### 3.3 Key CRA-transitive toolchain (installed via `react-scripts`)

| Package | Version in tree | Role |
|---------|-----------------|------|
| webpack | 5.103.0 | bundler |
| babel-loader | 8.4.1 | transpile |
| jest | 27.5.1 | tests |
| eslint | 8.57.1 | lint (EOL line) |
| tailwindcss | 3.4.18 | pulled transitively (peer/yaml story) |

---

## 4. Classified findings

### Legend

- **Deprecated:** npm `deprecated` field and/or vendor EOL statements  
- **Vulnerability:** `npm audit` signal (contextualize exploitability)

---

### P0 — imediato

**None open at audit time.**

Prior P0-class CI issues (documented for history, already fixed):

| Item | Was | Fixed by |
|------|-----|----------|
| `npm ci` Missing `yaml@2.9.0` | lock out of sync under npm 10 | `2b9add1` lock sync |
| CRA `CI=true` unused vars in `GameBoard.tsx` | build fail | `22c6f6e` |

---

### P1 — curto prazo

#### P1-01 — Create React App / `react-scripts@5.0.1`

| Field | Value |
|-------|-------|
| Package | `react-scripts` |
| Current | **5.0.1** (direct; also **latest of CRA 5 line**) |
| Latest meaningful release | **2022-04-12** |
| Deprecated (npm field) | No explicit `deprecated` string on `react-scripts` (checked) |
| Vulnerability | Indirect — audit chains through CRA tooling (svgo, nth-check, etc.) |
| Origin | Direct dependency; entire FE build/test/start |
| Impacto actual | Works (CI/Vercel green); slow DX; ESLint-on-CI strictness |
| Impacto futuro | Blocks TS 5+, modern Jest, clean audits, React 19 toolchain |
| Risco de upgrade | High if migrating off CRA; low if staying |
| Resolve | Plan Vite (or similar) migration; keep CRA until then |
| Depende de | All FE scripts, Jest, Webpack, Babel, `eslint-config-react-app` |
| Prioridade | **P1** |

**CRA Q&A (explicit):**

1. **Is `react-scripts 5` relevant debt today?** **Yes.**  
2. **Keep temporarily or plan migration?** **Keep for E2**; schedule **M2 migration decision**.  
3. **What depends on it?** `start` / `build` / `build:android` / `test`, browserslist consumption, CRA ESLint extend, Jest runner, production asset pipeline used by Capacitor `webDir: build`.  
4. **Indirect warnings/deprecations?** ESLint 8 EOL; Jest 27 age; webpack/babel stack pinned; `npm audit` noise; install deprecation warnings for nested CRA packages (`svgo@1`, `abab`, `glob@9`, `tar@6`, etc.).  
5. **Likely future destination?** **Vite** (default recommendation for SPA+Capacitor), unless team prefers Rsbuild/Parcel — **not** “upgrade react-scripts” (no CRA 6 path).

---

#### P1-02 — TypeScript 4.9 + CRA-locked tsconfig

| Field | Value |
|-------|-------|
| Package / config | `typescript@4.9.5`; `tsconfig` `target: es5`, `moduleResolution: node` |
| Current | 4.9.5 / CRA defaults |
| Latest | TS **7.0.2** (registry at audit) |
| Direct | yes |
| Deprecated | TS 4.9 not npm-deprecated; **options** flagged by newer IDE language service as deprecated toward TS 7 (`target=ES5`, `moduleResolution=node10`) |
| Vulnerability | N/A |
| Origin | IDE TS ≥6 language service vs project TS 4.9; CRA template |
| Impacto actual | Editor red squiggles on `tsconfig.json` only; `tsc` project still OK |
| Impacto futuro | Cannot safely jump to TS 5/6/7 **while** on CRA 5 without friction |
| Risco de upgrade isolado | **Alto** — CRA 5 officially designed around TS 4.9; bumping TS alone often breaks `@typescript-eslint` / type-checking assumptions |
| Resolve | Keep 4.9 until build-system migration; then TS 5.x + modern `moduleResolution` (`bundler`) |
| Depende de | CRA / react-scripts |
| Prioridade | **P1** (debt) / not a runtime break |

---

#### P1-03 — Capacitor 6 vs current 8.x

| Field | Value |
|-------|-------|
| Packages | `@capacitor/core` + plugins + android/cli |
| Current | **6.2.x** |
| Latest | **8.5.1** (core/cli/android) |
| Direct | yes |
| Deprecated | No (6.x still installable) |
| Vulnerability | `tar` critical/high via **`@capacitor/cli`** (devDependency) — see security section |
| Origin | Direct mobile stack |
| Impacto actual | Fine for ongoing web/E2; Android native project **not present** in repo (`frontend/android` absent) — generated via `cap sync` when needed |
| Impacto futuro | Major upgrades (6→7→8) bring Gradle/Android Studio/JDK expectations; delaying increases jump cost |
| Risco de upgrade | **Alto** (native breaking changes) |
| Resolve | Dedicated Capacitor upgrade phase after web renderer stability |
| Depende de | Android Studio / JDK / Gradle (versions **NÃO VERIFICADO** in-repo — no checked-in `android/` tree) |
| Prioridade | **P1** for mobile roadmap; **P2** for pure web E2 |

Docs reference Android 8.0+ testing and AAB via Android Studio (`docs/ANDROID_*.md`) without pinning JDK/Gradle in source.

---

#### P1-04 — Backend `ws` DoS advisory (when MP server is public)

| Field | Value |
|-------|-------|
| Package | `ws` |
| Declared | ^8.18.0 |
| Audit | **High** — memory exhaustion via tiny fragments (GHSA-96hv-2xvq-fx4p); affected `<8.21.0` |
| Latest / fix | **8.21.3** (in-range for caret if lock refreshed) |
| Direct | yes |
| Deprecated | NÃO |
| Vulnerability | **SIM** (high) |
| Origin | `npm audit` on backend |
| Impacto actual | Only if backend WebSocket service is deployed/exposed; not E2 Phaser path |
| Impacto futuro | Unpatched public WS endpoint = DoS risk |
| Risco de upgrade | Baixo (minor within v8) |
| Resolve | Bump lock/`npm update ws` within v8; redeploy backend |
| Depende de | MP backend deployment |
| Prioridade | **P1** for hosted MP; else **P2** |

---

### P2 — médio prazo

#### P2-01 — ESLint 8 (via CRA) EOL

| Field | Value |
|-------|-------|
| Package | `eslint@8.57.1` |
| Latest line | ESLint 9.x |
| Direct | transitive via react-scripts |
| Deprecated | **SIM** — npm: “no longer supported” for eslint@8.* |
| Vulnerability | related transitive (`flatted`, etc.) |
| Impacto actual | Still runs; CI treats lint warnings as errors under `CI=true` |
| Impacto futuro | No security/support updates on ESLint 8 |
| Resolve | Leaves with CRA → Vite + ESLint 9 flat config |
| Prioridade | **P2** |

#### P2-02 — Jest 27 via CRA

| Field | Value |
|-------|-------|
| Package | `jest@27.5.1` |
| Current ecosystem | Jest 29/30 |
| Direct | transitive |
| Deprecated | Not strongly npm-deprecated; **aged** |
| Impacto | Tests work (709 on last green CI) |
| Resolve | Migrate test runner with build system |
| Prioridade | **P2** |

#### P2-03 — Node local 24 vs CI Node 20 / npm 10 vs 11

| Field | Value |
|-------|-------|
| Config | GHA `node-version: "20"`; no engines |
| Impacto actual | Lockfile footguns (already bitten) |
| Resolve | Document Node 20 for FE; optional `.nvmrc` / `engines` later |
| Prioridade | **P2** |

#### P2-04 — GitHub Actions Node 20 action runtime deprecation notices

| Field | Value |
|-------|-------|
| Origin | GHA logs: Node 20 deprecated on runners; `actions/checkout@v4` / `setup-node@v4` forced toward Node 24 |
| Impacto actual | Warning only |
| Resolve | Upgrade actions majors when stable |
| Prioridade | **P2** |

#### P2-05 — Phaser 3.80.1 behind 3.90; Phaser 4 major exists

| Field | Value |
|-------|-------|
| Current | 3.80.1 |
| Wanted | 3.90.0 |
| Latest | **4.2.1** |
| Deprecated | NÃO |
| Vulnerability | none flagged as direct concern in this audit |
| Impacto actual | E1 POC validated |
| Upgrade imediato? | **NÃO** for E2 |
| Resolve | Stay on Phaser 3.x for E2; consider 3.90 patch later; Phaser 4 = separate spike |
| Prioridade | **P2** (minor) / **P3** for v4 curiosity |

#### P2-06 — Firebase 12.14 → 12.18

| Field | Value |
|-------|-------|
| Direct | yes |
| Impacto | Minor/patch within v12 |
| Prioridade | **P2** |

#### P2-07 — Express 4.x advisories (backend) + Express 5 latest

| Field | Value |
|-------|-------|
| Current range | ^4.21.2 |
| Audit | moderate via `qs` / `body-parser` |
| Latest major | Express **5.2.1** |
| Exploitability | DoS-oriented, often needs crafted requests; patch within Express 4 when updating lock |
| Prioridade | **P2** |

#### P2-08 — CRA transitive `npm audit` volume (svgo, nth-check, webpack-dev-server chain, etc.)

| Field | Value |
|-------|-------|
| Frontend audit totals | **60** (critical 3, high 30, moderate 15, low 12) |
| Mostly | transitive **build/dev** tools |
| FixAvailable often | points at impossible `react-scripts@0.0.0` or Capacitor 8 major |
| Exploitability in Suecão | Low for production static hosting (Vercel serves built assets; attack surface ≠ bundler CVEs) |
| Prioridade | **P2** as debt signal; not E2 blocker |

#### P2-09 — `@capacitor/cli` → `tar` critical (devDependency)

| Field | Value |
|-------|-------|
| Vulnerability | **SIM** critical on `tar` (path traversal on extract) |
| Directness | cli is direct **devDependency**; tar transitive |
| Exploitability | Requires malicious tarball extraction during **dev/CI sync**, not player runtime |
| Fix | Capacitor 8.x major |
| Prioridade | **P2** (dev supply-chain) |

---

### P3 — informativo

| ID | Item | Notes | Priority |
|----|------|-------|----------|
| P3-01 | Pixi `8.20.1` | Archived POC; current patch line; keep dep until code removed | P3 |
| P3-02 | react-colorful 5.7 → 5.8 | Cosmetic patch | P3 |
| P3-03 | React 18 vs latest 19 | Do not jump until build system + types ready | P3 |
| P3-04 | `@types/react` 19.x on registry | Ignore until React 19 | P3 |
| P3-05 | uuid 11 → 14 latest | Backend major optional | P3 |
| P3-06 | browserslist production queries | Standard CRA; fine | P3 |
| P3-07 | Install deprecation spam (`abab`, `domexception`, `sourcemap-codec`, `workbox-*`, `q`, …) | CRA transitive noise | P3 |
| P3-08 | Backend `npm install` in CI (not `npm ci`) | Weaker reproducibility; optional harden later | P3 |

---

## 5. Security summary

### Frontend (`npm audit`)

| Severity | Count |
|----------|------:|
| critical | 3 |
| high | 30 |
| moderate | 15 |
| low | 12 |
| **total** | **60** |

**Critical names:** `shell-quote`, `tar` (via Capacitor CLI), `websocket-driver` — all **transitive**, primarily **tooling**.

**Interpretation for Suecão:**

- Production web = static CRA build on Vercel → **most CRA audit findings are not directly attacker-reachable** on the live card game UI.
- Treat CRA audit totals as **modernization pressure**, not “drop everything”.
- **Do not** run blind `npm audit fix --force` (breaks CRA).

### Backend (`npm audit`)

| Severity | Count |
|----------|------:|
| high | 1 (`ws`) |
| moderate | 3 (`express`/`qs`/`body-parser` chain) |
| critical | 0 |

**Hosted multiplayer:** patch `ws` (≥8.21) and refresh Express 4 lock when touching backend next — still not required to start E2 Phaser.

### Verdict

**Segurança: não blocker** for E2 Phaser / DOM gameplay work.

---

## 6. CI / Vercel / Capacitor impact

| Surface | State | Notes |
|---------|-------|-------|
| GitHub Actions | Green on `22c6f6e` | Node 20; `npm ci`; CRA build with `CI=true` |
| Vercel | Green on same commit | `frontend/vercel.json` → `npm run build` → `build/` |
| Android / Capacitor | Packages present; **no `android/` tree in repo** | `cap:sync:android` generates native project; JDK/Gradle pins NÃO VERIFICADO in source |
| Local vs CI Node | **Mismatch** (24/11 vs 20/10) | Process risk for lockfile |

---

## 7. Phaser / Pixi

| Renderer | Version | Upgrade now? | Notes |
|----------|---------|--------------|-------|
| Phaser | 3.80.1 | **NÃO** | E1 validated; chosen renderer; 3.90 optional later; v4 = new major |
| Pixi | 8.20.1 | **NÃO** | Archived (`?renderer=pixi-archive`); keep for reference |

No functional deprecation blocking either POC at audit time.

---

## 8. Matrix

| Área | Estado | Prioridade | Acção recomendada | Quando |
|------|--------|------------|--------------------|--------|
| CRA | Frozen 2022 toolchain, works | P1 | Keep; plan Vite migration | After E2 baseline / dedicated M2 |
| React | 18.3 stable | P3 | Stay on 18 until CRA exit | With M3 |
| TypeScript | 4.9 + IDE tsconfig warnings | P1 | Don’t bump alone; migrate with build system | M2→M3 |
| Node/npm | Local≠CI | P2 | Standardize on Node 20 for FE | M1 |
| Capacitor | 6.x vs 8.x | P1 | Upgrade major in mobile phase | M4 (not before E2 web) |
| Android toolchain | Not checked-in | P2 | Re-generate & document JDK/Gradle on next native ship | M4 |
| Phaser | 3.80.1 OK | P2/P3 | E2 on current; optional 3.90 later | E2 now |
| Pixi | Archived current | P3 | Leave until archive cleanup | Later |
| Backend deps | Small; `ws` high advisory | P1/P2 | Patch `ws` when touching MP deploy | Opportunistic / before public MP |
| CI/Vercel | Green | P2 | Watch Actions Node deprecations | M1/M2 |
| Security | High audit noise, low E2 exploitability | P2 | No force-audit; reduce via CRA exit | M2+ |

---

## 9. Modernization roadmap (proposal only — not scheduled)

### Fase M0 — Blockers
- Keep CI green; no open P0.
- Re-validate `npm ci` on Node 20 after any lock change.

### Fase M1 — Toolchain baseline
- Document / optionally enforce Node **20** for frontend.
- Align local with CI npm major when editing locks.
- Optional: backend `npm ci` + lockfile commit if missing.

### Fase M2 — Frontend build system
- Decide CRA → **Vite** (recommended) vs alternatives.
- Migrate scripts, env (`REACT_APP_*` → `VITE_*` or keep compat layer), Jest→Vitest (or keep Jest), ESLint 9.
- Re-measure Phaser/Pixi lazy chunks.

### Fase M3 — TypeScript / React
- TS 5.x + modern `moduleResolution`.
- React 18→19 only after build migration + types.

### Fase M4 — Capacitor / Android
- Cap 6 → 7 → 8 (or supported path).
- Check in or document generated `android/` + JDK/Gradle.
- Re-test Play AAB flow.

### Fase M5 — Remaining deps
- Firebase minor bumps; express/`ws` patches; remove Pixi archive if desired; Phaser 3.90.

---

## 10. Decision for gameplay work

### Podemos continuar E2 Phaser antes da modernização?

# **SIM**

**Justification:** CI/Vercel are green; Phaser POC is validated and selected; CRA/TS/Capacitor debt is real but **does not block** Sueca Phaser table evolution; security findings are predominantly transitive/tooling or out-of-path for solo renderer work. Prefer **not** to combine E2 gameplay with CRA migration.

**Optional before public MP backend expose:** patch backend `ws` (still not an E2 prerequisite).

---

## 11. Sources used

- `frontend/package.json`, `frontend/package-lock.json`, `frontend/tsconfig.json`, `frontend/vercel.json`, `frontend/capacitor.config.ts`
- `backend/package.json`
- `.github/workflows/ci.yml`
- `npm outdated`, `npm audit`, `npm view`, `npm ls` (frontend; backend audit without local `node_modules`)
- Prior CI failure/fix history (`yaml@2.9.0`, unused vars, green run on `22c6f6e`)
- IDE diagnostics on `tsconfig.json` (TS language service deprecations)

**Not verified in this audit:** exact Vercel Node version setting; live Android Studio JDK/Gradle on developer machines; production exploit attempts.

---

*End of audit.*
