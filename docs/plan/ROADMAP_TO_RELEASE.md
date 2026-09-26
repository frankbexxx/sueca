# SUECÃO — ROADMAP TO RELEASE

**Canonical release-tracking document.**  
Supersedes `ROADMAP_REBASE_SEPTEMBER_2026.md` for **delivery tracking** (that file remains historical).

**Cross-checked against:** code on `v2-main`, Theme Architecture Stage 14, King Synthetic product docs, Android/web env, prior delivery-gap audit.  
**Rule:** code/runtime wins over stale docs (`STATUS.md`, `PRODUCT_ESSENTIALS.md`, parts of the September rebase).

### Printable snapshot

| Role | Path |
|------|------|
| **Canonical live roadmap** | this file (`ROADMAP_TO_RELEASE.md`) |
| **Current printable snapshot** | [`roadmap-snapshots/ROADMAP_SUECAO_VERSAO_1.pdf`](./roadmap-snapshots/ROADMAP_SUECAO_VERSAO_1.pdf) |
| Previous (historical) | [`roadmap-snapshots/ROADMAP_SUECAO_VERSAO_0.pdf`](./roadmap-snapshots/ROADMAP_SUECAO_VERSAO_0.pdf) |

Snapshot index/rules: [`roadmap-snapshots/README.md`](./roadmap-snapshots/README.md).

---

## Estado geral

| Field | Value |
|-------|--------|
| Branch | `v2-main` |
| Commit | `f84201a` (`feat: promote king synthetic to product mode`) |
| Release target | First public release — solo-first product (web + Android) |
| Consolidation date | 2026-09-24 |

**Overall:** Solo engines and Theme Architecture are strong. Release is **yellow** until legal/ship gate and product decisions close.

---

## Regras de prioridade

| Priority | Meaning |
|----------|---------|
| **P0** | Blocks first public release |
| **P1** | Should finish before delivery |
| **P2** | Desirable polish; may defer |
| **FUTURE** | Explicit post-release / extra scope |

**Item workflow states:** `TODO` · `READY FOR DESIGN` · `READY FOR IMPLEMENTATION` · `IN PROGRESS` · `BLOCKED` · `READY FOR TEST` · `DONE` · `DEFERRED` · `SUPERSEDED`

---

## CURRENT RELEASE BLOCKERS

1. **Casino deck commercial licence** — redistribute rights unresolved (`docs/ASSETS.md`: indeterminada).
2. **Repo legal baseline** — no root `LICENSE` / `NOTICE` / `TRADEMARKS`; privacy/terms contact still placeholder.
3. **Credits wrong** — UI still attributes **Hazmat**; runtime deck is **Casino**.
4. **Multiplayer production posture** — `.env.production` has `VITE_MULTIPLAYER_ENABLED=true` while Android is solo-off; Online tab always visible → **DECISION REQUIRED**.
5. **Play Store gate** — listing, Data Safety, legal URLs, screenshots incomplete.
6. **QA release gate** — `docs/RELEASE_CHECK.md` major items still unchecked (4 games + King Sintético + Android + web).
7. **Durable local data safety (`REL-DATA-01`)** — **DONE** (envelopes · backup · quarantine · OPPO `install -r` PASS). Next: `REL-DATA-02` real match history.

---

## RECENTLY CLOSED

Do **not** reopen without new evidence:

| Item | Notes |
|------|--------|
| Theme Architecture Foundation | Stages 0–9 + 11–14; Stage 14 **PASS** |
| GLOBAL-UI-02 | In-game top bar implemented — device smoke optional |
| GLOBAL-UI-03 | Active player cue implemented — device smoke optional |
| GLOBAL-CARDS-01 | Hand fan layout implemented — device smoke optional |
| King Density | Auction history / Ver tabela / hide unavailable actions |
| King legality hardening | Canonical PT legality |
| King Synthetic combined round | All negatives in one 13-trick round |
| King Synthetic **product** promotion | Preset `king-pt-synthetic` @ `f84201a` |
| **UX-FESTA-01** Festa responsive sheets | Viewport blocker fixed; Phaser integration polished — sheet density syncs table clearance (compact/standard/tall) |
| **UX-FESTA-02** Auction defaults + compact bid control | **DONE** — Positivas=3 / Nulos=1 defaults, compact − value +, legal floor respected |
| **UX-ROUND-01** Synthetic negatives end cue | **DONE** — restrained «Negativos sintéticos concluídos» (~1s) before score sheet |
| **UX-KING-SYN-CARDS** Synthetic special-card miniatures | **DONE** — reuse King normal HUD mosaics via `shouldShowKingPenaltyCards` synthetic gate |
| **UX-KING-CARD-PREVIEW-01** HUD mini press-to-enlarge | **DONE** — press-and-hold preview on penalty mosaics (King normal + Sintético) |
| **UX-SEAT-LABELS-02** Side seat label clipping | **DONE** — inward side anchors + panel clamp inside canvas |
| **UX-KING-01** Remove King Simplificado | Live product presets: `king-pt-normal` + `king-pt-synthetic` only |
| **UX-KING-02** King / Sintético select contrast | Native `<option>` readable on Firefox / Chromium / WebView |
| **UX-SEAT-01** Canonical player orientation | Phaser / DOM / KOH share S→W→N→E relative to local player |
| **UX-CARDS-01** Opponent hand readability | **DONE** — natural overlap + depth occlusion (Spades / Sueca / Hearts approved) |

**AI core (Sueca / Spades / Hearts / King):** DONE for solo finishability — polish only below.

**Normal King:** DONE. **King Sintético:** PRODUCT MODE DONE — do not reopen rules/scoring.

---

## OPEN PRODUCT DECISIONS

- [ ] **v1 Solo vs Multiplayer** (see Multiplayer block)
- [ ] **Personalisation UX / Stage 10** enters v1? (architecture DONE; UX incomplete — **PRODUCT DECISION PENDING**)
- [x] Difficulty on Home vs Setup only → **closed:** Setup only (`REL-DIFF-01` DONE)
- [x] Player names global vs per-setup; bot naming → **closed:** P1 global · P2–P4 per game (`REL-PLAYERS-01` DONE)
- [ ] Stats / continue / history keyed by `rulesPresetId` (King vs Sintético, Spades modes) → tracked under `REL-DATA-02`
- [x] King / King Sintético selector UX on Landing/Home → **closed:** Home King mode sheet (`REL-HOME-01` DONE)
- [ ] Spades variant selector UX (nil vs future COSPE/CPOES naming)
- [ ] COSPE / CPOES in v1 or Future
- [ ] OXS branding mandatory before first release
- [ ] Android portrait lock
- [ ] Optional Google account / cloud backup posture (`REL-AUTH-01` / `REL-SYNC-01`) — guest play remains mandatory; login never required

---

## MULTIPLAYER — DECISION REQUIRED

| Option | Consequence |
|--------|-------------|
| **A — v1 SOLO** | `VITE_MULTIPLAYER_ENABLED=false` in production web; hide Online tab; full MP → **FUTURE** |
| **B — v1 with multiplayer** | Multiplayer becomes a large **P0/P1** workstream (lobby, sync, reconnect, Sueca-only scope, backend) |

**Do not decide in this document.** Track as `REL-MP-01`.

Current facts:

- Android: MP already **off** (`.env.android`)
- Web prod: MP **on** (`.env.production`)
- Online tab always in `BottomNav` (not flag-gated)
- Firebase client exists; Node `backend/` / Python realtime largely unused by shipping FE

---

## PERSONALISATION vs THEME ARCHITECTURE

| Layer | Status |
|-------|--------|
| **Theme Architecture** (tokens, 30 themes, custom parity, shell/landing theming) | **DONE** |
| **Personalisation UX / Stage 10** (Theme · Deck · Card Back · Music · SFX · Follow theme · manual overrides · hub) | **PRODUCT DECISION PENDING** |

PDF marked the personalisation hub as `FUTURE*`. That is **not definitive**. If product wants the full redesign in v1, promote `REL-PERS-01` to **P1**. Until decided: keep as **DEFERRED / decision pending**, not as architecture debt.

---

## OXS integration

**Reference (do not copy in this task):**

- `E:\APPSHOPLIST\shopping_list` — `LICENSE`, `NOTICE`, `TRADEMARKS.md`, brand guide
- `E:\OXS_brand_review` — logo/mark inventory (2023 + 2026)

**Suecão gaps:** OXS mark/logo · `Suecão by OXS` · About · legal baseline alignment · NOTICE · TRADEMARKS · favicon · app icon alignment · README branding · links.

In-app OXS was previously **removed** (Landing/Credits). Re-adoption is product work (`REL-OXS-01`).

---

## TABELA PRINCIPAL

| ID | Área | Estado | Falta fazer | Prioridade | Decisão produto | Estado |
|----|------|--------|-------------|------------|-----------------|--------|
| REL-LEGAL-01 | Legal / licences | TODO | Root LICENSE + NOTICE + TRADEMARKS (OXS baseline); real privacy/terms + contact; fix Credits (Casino not Hazmat); confirm Casino commercial licence | P0 | YES (license model) | TODO |
| REL-MP-01 | Multiplayer posture | BLOCKED | Decide A solo vs B full MP; if A: MP false in web prod + hide Online; if B: scope MP as P0/P1 | P0 | **YES — REQUIRED** | BLOCKED |
| REL-PLAY-01 | Play Store | TODO | Listing, Data Safety, policies, screenshots, legal URLs | P0 | NO | TODO |
| REL-QA-01 | QA release gate | TODO | Close `RELEASE_CHECK`: 4 games + King Sintético + Android + web + save/resume + audio/themes | P0 | NO | TODO |
| REL-DATA-01 | Durable local data safety | DONE | Versioned envelopes · backup-before-migrate · quarantine/recovery · migration idempotence · King played=160 fixture · corruption + quarantine/backup write-failure protection · full tests/build · OPPO `adb install -r` update PASS (prefs/stats/sessions preserved). Closed on device validation | P0 | NO | DONE |
| REL-DATA-02 | Real match history | READY FOR IMPLEMENTATION | Per-match history records (id · game · rulesPresetId · timestamp · result · scores · difficulty · schemaVersion · build); explicit retention; no silent career truncation; migrate from aggregate stats + 3-summary finished list; user history ≠ technical replay; backup/export. **Unblocked by `REL-DATA-01` DONE** | P0 | YES (retention UX) | READY FOR IMPLEMENTATION |
| REL-HOME-01 | Landing / Home | DONE | Production Home approved: Continue strip · Jogar 2×2 Material Classic · King mode sheet · 4-tab nav (Home · Actividade · Personalizar · Mais); legacy remapped via hubs. Setup redesign closed. Remaining product UX: `REL-PERS-01` | P1 | YES | DONE |
| REL-PLAYERS-01 | Player names | DONE | P1 global profile identity · P2–P4 per-game bots (editable, always `IA`) · migration from `sueca-player-names` · Setup + Profile share P1. Closed: focused tests + OPPO Reno13 Setup smoke PASS (`010882f`) | P1 | YES | DONE |
| REL-DIFF-01 | Difficulty UX | DONE | Per-game Easy/Medium/Hard segmented control in Setup · migration from `sueca-ai-difficulty` · Home has no difficulty. Closed: focused tests + OPPO Reno13 Setup smoke PASS (`010882f`) | P1 | YES | DONE |
| REL-KING-01 | King Sintético / Festa smoke | DONE | Full Synthetic smoke + follow-ups closed on OPPO: live Festa HUD · auction ceilings · final sheet until Concluir. Later debt: `AI-KING-FESTA-PLAY-01` (Festa positive card-play strategy review) | P1 | NO | DONE |
| REL-HIST-01 | History / Stats / Persistence | SUPERSEDED | Career history + preset-keyed records absorbed by `REL-DATA-02`. Do not implement separately. | P1 | — | SUPERSEDED |
| REL-REPLAY-01 | Diagnostic match logs / replay foundation | READY FOR IMPLEMENTATION | Technical export (debug / AI analysis / regression), separate from user history: mode · difficulty · build · hands · ordered actions · bids/auction/Festa · scores; investigate seeded RNG (`Math.random` today). **Unblocked by `REL-DATA-01` DONE**; can parallel Auth/Sync | P1 | NO | READY FOR IMPLEMENTATION |
| REL-AUTH-01 | Optional account / Google sign-in | READY FOR DESIGN | Login **not** mandatory; local guest play; optional Google link preserving local progress; Google proves identity → backend validates → Suecão session/JWT (not Google ID token as app session); separate Web/Android Google clients. TVDE handoff for patterns only — no TVDE roles/phone/onboarding copy | P1 | YES | READY FOR DESIGN |
| REL-SYNC-01 | Cloud backup and sync | BLOCKED | Sync history · stats · profile/P1 · per-game names · difficulty · selected prefs; local-first; safe guest→account adoption; never destructive auto-merge; append-only matches by stable id. **No** music cache / sessionStorage / ads counters. Mid-game sync out of v1 unless promoted. **Depends on `REL-AUTH-01` + `REL-DATA-02`** | P1 | YES | BLOCKED |
| REL-OXS-01 | OXS branding | TODO | Apply MarketFlow baseline: mark, Suecão by OXS, About, links, favicon/app-icon | P1 | YES | TODO |
| REL-ANDROID-01 | Android | TODO | Portrait policy; validate release/signing; legal URLs; Capacitor project strategy (gitignored tree) | P1 | YES (portrait) | TODO |
| REL-WEB-01 | Web / Vercel | TODO | Coherent MP flag; favicon/meta; production smoke; remote music on web? | P1 | NO (music optional) | TODO |
| REL-DOCS-01 | Docs / cleanup | TODO | Refresh STATUS / Essentials / README; hide incomplete UX; stale copy | P1 | NO | TODO |
| REL-PERS-01 | Themes / Personalisation UX | DEFERRED | Stage 10 hub: Theme ↔ Deck ↔ Back ↔ Music ↔ SFX / Follow theme / overrides. Architecture already DONE | P2 or P1* | **YES — PENDING** | DEFERRED |
| REL-DECK-01 | Deck / Card Back | TODO | CardMeister theme assignment; licence attribution for exposed decks | P2 | YES | TODO |
| REL-AUDIO-01 | Music / SFX | TODO | Web prod remote optional; offline/fallback validation; CDN domain later | P2 | NO | TODO |
| REL-AI-01 | AI polish | TODO | Spades nil-aware play; King auction difficulty; Sueca signals/docs; Hearts optional | P2 | YES (nil marketing) | TODO |
| REL-A11Y-01 | Accessibility | TODO | Minimal audit: contrast, focus, labels, touch, keyboard where applicable | P2 | NO | TODO |
| REL-SPADES-01 | Spades COSPE / CPOES | DEFERRED | Spec rules, presets, UI, AI, stats, persistence | FUTURE | YES | DEFERRED |
| REL-MP-FULL-01 | Multiplayer complete | DEFERRED | Lobby/invite/reconnect/sync/authoritative — if not in v1 | FUTURE | Tied to REL-MP-01 | DEFERRED |
| REL-CAP7-01 | Cap 7 / extras | DEFERRED | Capacitor 7, R2 custom domain, monetisation, other extras | FUTURE | NO | DEFERRED |

\*If Personalisation redesign is required for first delivery, promote `REL-PERS-01` to **P1**.

**Already DONE (not reopened as work rows):** Theme Architecture · GLOBAL-UI-02/03 · GLOBAL-CARDS-01 · King Density · King legality · King Synthetic product · Core Game AI · Normal King · Phaser default · Casino runtime deck pipeline · Music hybrid v1 (Android).

---

## PHASE A — LEGAL & SHIP GATE

| ID | Summary | Priority |
|----|---------|----------|
| REL-LEGAL-01 | Casino licence · LICENSE/NOTICE/TRADEMARKS · privacy/terms · Credits | P0 |
| REL-MP-01 | Solo vs MP decision + env/UI consistency | P0 |
| REL-PLAY-01 | Play Store listing / Data Safety | P0 |
| REL-QA-01 | RELEASE_CHECK gate | P0 |
| REL-DATA-01 | Durable local data safety (schemas · parse recovery · migration backups) | P0 · DONE |
| REL-DATA-02 | Real match history | P0 · READY FOR IMPLEMENTATION |

**Exit criteria:** legal pack shippable; MP posture explicit; Play policies path clear; smoke checklist green for declared v1 scope; durable local data safety in place before cloud/history expansion.

---

## DATA / AUTH / SYNC / REPLAY

**Product sequence (current):**

1. `REL-DATA-01` — harden local durable storage  
2. `REL-DATA-02` — real match history  
3. `REL-REPLAY-01` and/or `REL-AUTH-01` as appropriate (replay after DATA-01; auth design can start in parallel)  
4. `REL-SYNC-01` — cloud backup after AUTH + DATA-02  
5. Personalisation redesign (`REL-PERS-01`) resumes afterwards unless priorities change  

**Dependency order:**

```
REL-DATA-01
  → REL-DATA-02 → REL-SYNC-01
  → REL-REPLAY-01 (parallel with Auth/Sync after DATA-01)
REL-AUTH-01 → REL-SYNC-01
```

| ID | Summary | Priority | Status |
|----|---------|----------|--------|
| REL-DATA-01 | Durable local data safety | P0 | DONE |
| REL-DATA-02 | Real match history | P0 | READY FOR IMPLEMENTATION |
| REL-REPLAY-01 | Diagnostic match logs / replay foundation | P1 | READY FOR IMPLEMENTATION |
| REL-AUTH-01 | Optional Google / Suecão account | P1 | READY FOR DESIGN |
| REL-SYNC-01 | Cloud backup and sync | P1 | BLOCKED by AUTH-01 + DATA-02 |

### Persistence audit findings (2026-09-26)

Do **not** overstate the tester “~160 King games lost” report as proven app wipe-on-update.

| Finding | Note |
|---------|------|
| Storage surface | Almost all durable user data is WebView **localStorage**; no cloud history backup today |
| Career counters | `sueca-local-stats` is the main long-term career store (**now versioned envelope under `REL-DATA-01`**) |
| Finished list | `sueca-finished-games-v1` retains only **3** summaries (`MAX_FINISHED`) — never a career archive (**envelope hardened; cap unchanged**) |
| ~160 matches | App never stored ~160 individual King match records; a high King count is only plausible as **stats** (`byVariant.king.played`) |
| Parse failure | Corrupt JSON is **quarantined** (raw preserved); runtime uses safe fallback without overwriting unquarantined originals |
| Update wipe | No evidence of intentional stats wipe on normal `install -r` / same-package update |
| Clear data | Uninstall / Android “Clear storage” / site-data clear **does** remove local data |
| Replay | Production shuffle uses `Math.random()`; deterministic replay capability is incomplete |

**`REL-DATA-01` evidence:** durable envelopes · backup registry `sueca-durable-backup-v1` · quarantine ledger `sueca-durable-quarantine-v1` · King `played=160` migration fixture · write-failure safety · focused + full frontend tests · **OPPO `adb install -r` PASS** — **DONE**.

### Data safety rules (release)

1. Never delete old/unknown durable data before successful migration.  
2. Backup raw payload before destructive migration.  
3. Durable schemas must have explicit `schemaVersion`.  
4. Parse failure must preserve recoverable raw data.  
5. Career history must have explicit retention policy.  
6. No silent reset-to-zero for recoverable user data.  
7. Migration tests must cover old/corrupt representative fixtures.  
8. User history and technical replay logs are **separate** concepts.

### Auth / sync product notes

- Login is **optional**; guest play always works.  
- Google link must **preserve** local progress (no destructive duplicate account).  
- Google proves identity; app issues its own session — do not persist Google ID token as app session.  
- Sync candidates: match history · stats · P1/profile · per-game names · difficulty · selected prefs.  
- Do **not** sync: music binaries/cache · sessionStorage · ads counters · disposable caches.  
- Mid-game resume sync stays out of v1 unless explicitly promoted.  
- `AI-KING-FESTA-PLAY-01` remains later AI quality work (can consume diagnostic exports from `REL-REPLAY-01`).

---

## PHASE B — SOLO PRODUCT

| ID | Summary | Priority |
|----|---------|----------|
| REL-HOME-01 | Landing redesign + mode selectors | P1 · DONE |
| REL-PLAYERS-01 | Names UX | P1 · DONE |
| REL-DIFF-01 | Difficulty UX | P1 · DONE |
| REL-KING-01 | King Sintético / Festa device smoke | P1 · DONE |
| REL-HIST-01 | History / stats / persistence by preset | SUPERSEDED → `REL-DATA-02` |
| REL-OXS-01 | OXS branding | P1 |
| REL-ANDROID-01 | Android release posture | P1 |
| REL-WEB-01 | Web/Vercel production polish | P1 |
| REL-DOCS-01 | Docs cleanup | P1 |

**King notes:**

- Normal King: **DONE**
- King Sintético: **PRODUCT MODE DONE** (`king-pt-synthetic`)
- Full Synthetic smoke (Jogo 1/5 → 5/5) + follow-ups: **REL-KING-01 DONE**
- Later AI debt (not blocking release close): **AI-KING-FESTA-PLAY-01** — Festa positive card-play strategy needs broader review after restyle/app completion (auction ceilings already fixed)

### King smoke findings (REL-KING-01) — baseline `c58675b` → closed

Full King Sintético smoke through **Jogo 5/5** recorded and follow-ups validated on OPPO.

#### Confirmed PASS

- King Synthetic progresses `1/5` → `5/5`
- Synthetic negatives complete correctly
- Intermediate synthetic completion cue works
- Special-card miniatures work
- Mini-card press preview works on phone
- Four Festa rounds start in sequence
- Festa auction state resets correctly between rounds
- Positivas / Nulos legal floors work
- Auction history survives long sequences
- Intermediate score sheets populate the correct Festa row
- Accumulated scores are correct
- No sixth game starts after `5/5`
- Match reaches final result
- Festa live HUD round scores update during play; Total stays at round-start accumulation
- Auction AI no longer mechanically ratchets to 8
- Final 5/5 sheet stays until explicit **Concluir**

#### Follow-ups (closed)

| ID | Finding | Status | Notes |
|----|---------|--------|-------|
| **UX-KING-SCORE-LIVE-01** | Festa HUD round scores stuck at 0 mid-play | **DONE** | Provisional settle into `lastRoundDeltas`; HUD Total = `roundStartScores` |
| **AI-KING-AUCTION-01** | AI escalates too often to 8 positivas | **DONE** | Hand-strength ceilings + pass when over |
| **UX-KING-FINAL-01** | Final sheet auto-dismissed to Home | **DONE** | No King auto-exit; **Concluir** |

#### Later debt

| ID | Notes | Status |
|----|-------|--------|
| **AI-KING-FESTA-PLAY-01** | Festa positive card-play strategy quality review (post restyle/app) | OPEN / later |

**Spades modes architecture (v1):** existing `spades-pt-normal` + `spades-pt-nil` via setup; Home tile → Setup (mode via Setup). COSPE/CPOES remain Phase D unless product promotes them.

**Home notes (`REL-HOME-01`):** **DONE** — compact Suecão header · active-session Continue · 2×2 game grid · King contextual mode sheet · quiet Última actividade line · 4-tab bottom nav.

**Setup redesign:** **DONE** — Compact Confirm + “Preparar a mesa”; King mode read-only after Home; Sueca distribution copy; Spades Normal/Nil in Setup; sticky Começar; bottom nav hidden in Setup. Personalizar hub label: `Mão e Cartas`. Evidence: focused Setup/nav tests + OPPO Reno13 real-device smoke PASS (`010882f`).

**REL-PLAYERS-01 / REL-DIFF-01:** **DONE** — P1 global · TU/IA badges · P2–P4 per game · per-game difficulty · legacy migrations. Evidence: automated prefs/Setup tests + OPPO Reno13 Setup smoke PASS (P1 global, per-game bots/difficulty, start config). Remaining product UX: Personalisation redesign (`REL-PERS-01`) after Data/Auth/Sync sequence unless priorities change.

---

## PHASE C — POLISH

| ID | Summary | Priority |
|----|---------|----------|
| REL-PERS-01 | Personalisation UX / Stage 10 | DECISION → P2 or P1 (resume after Data/Auth/Sync unless promoted earlier) |
| REL-DECK-01 | Deck / card back curation | P2 |
| REL-AUDIO-01 | Music/SFX web + CDN | P2 |
| REL-AI-01 | AI polish (not core) | P2 |
| REL-A11Y-01 | Accessibility minimum | P2 |

**AI separation (do not mark core AI as pending):**

| Layer | Status |
|-------|--------|
| Core Game AI (legal moves, fallback, difficulty adapters, four games) | **DONE** |
| Polish | Spades nil-aware play · King auction difficulty · Sueca minor signals/docs · Hearts optional |
| Research / Card Intelligence productization | Not required for v1 ship |

Optional device smoke for GLOBAL-UI-02/03 / CARDS / King density may ride with `REL-QA-01` / `REL-KING-01` — implementation already closed.

---

## PHASE D — FUTURE

| ID | Summary |
|----|---------|
| REL-SPADES-01 | COSPE / CPOES |
| REL-MP-FULL-01 | Full multiplayer (if Option A) |
| REL-CAP7-01 | Capacitor 7, R2 custom domain, monetisation, extras |

---

## Counts (tracking rows)

| Priority | Count |
|----------|-------|
| **P0** | 6 (`REL-LEGAL-01`, `REL-MP-01`, `REL-PLAY-01`, `REL-QA-01`, `REL-DATA-01`, `REL-DATA-02`) |
| **P1** | 12 open+done tracking rows (`REL-HOME/PLAYERS/DIFF/KING` DONE · `REL-HIST` SUPERSEDED · `REL-REPLAY/AUTH/SYNC` new · `REL-OXS/ANDROID/WEB/DOCS` open) |
| **P2** | 4 (+ `REL-PERS-01` if kept deferred as P2-class) |
| **FUTURE** | 3 |
| **Product decisions** | open checkboxes reduced (players/difficulty/King Home selector closed); MP + Personalisation + Auth/Sync posture still pending |

Open Data–Sync set: `REL-DATA-01` DONE · `REL-DATA-02`/`REL-REPLAY-01` READY FOR IMPLEMENTATION · `REL-SYNC-01` BLOCKED · `REL-AUTH-01` READY FOR DESIGN.

**`REL-DATA-01` closed evidence:** durable envelopes · `sueca-durable-backup-v1` · `sueca-durable-quarantine-v1` · King `played=160` fixture · quarantine/backup write-failure protection · full frontend tests · OPPO Reno13 `adb install -r` (prefs · stats · sessions preserved; Continue resume OK; reopen idempotent).

---

## Related docs

| Doc | Role |
|-----|------|
| [`roadmap-snapshots/ROADMAP_SUECAO_VERSAO_1.pdf`](./roadmap-snapshots/ROADMAP_SUECAO_VERSAO_1.pdf) | Current printable wall snapshot |
| [`roadmap-snapshots/README.md`](./roadmap-snapshots/README.md) | Snapshot history / rules |
| [`KING_SYNTHETIC_DEV_MODE.md`](./KING_SYNTHETIC_DEV_MODE.md) | King Sintético product mode |
| [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md) | Theme architecture (DONE) |
| [`THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md`](./THEME_ARCHITECTURE_STAGE_14_RELEASE_GATE.md) | Architecture gate PASS |
| [`POST_ARCHITECTURE_UX_DIRECTION.md`](./POST_ARCHITECTURE_UX_DIRECTION.md) | Post-arch UX directions |
| [`ROADMAP_REBASE_SEPTEMBER_2026.md`](./ROADMAP_REBASE_SEPTEMBER_2026.md) | Historical September rebase — **superseded for release tracking** |
| [`../RELEASE_CHECK.md`](../RELEASE_CHECK.md) | Smoke checklist |
| [`../ASSETS.md`](../ASSETS.md) | Casino licence status |
| [`../ANDROID_SIGNING.md`](../ANDROID_SIGNING.md) | AAB signing |

---

*Consolidated 2026-09-24 from PDF wall checklist + repo audit. Data/Auth/Sync/Replay items added 2026-09-26 from persistence audit. Update this file as items move; keep IDs stable.*
