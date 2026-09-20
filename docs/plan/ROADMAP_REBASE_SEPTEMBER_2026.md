# ROADMAP REBASE — Setembro 2026

**Modo:** DOCUMENTAÇÃO (actualização de estado; sem alterações de produto nesta revisão)  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main` @ `7fb89f1` (Spades current-tricks HUD + histórico até advanced music)  
**Data de revisão:** 2026-09-17  
**Revisão:** ROADMAP-REFINE-VISUAL-AUDIO-UX-01 (após ROADMAP-ADD-DEDICATED-AI-01)  
**Base anterior:** rebase `03681f8` @ `5d49c0e` (2026-09-13) + commits até `7fb89f1`

---

## 0. Executive summary

Produto **solo jogável** nas quatro variantes, **Phaser default**, **Vite**, **Capacitor 6**, baseline **OPPO Reno13 5G**, deck **Casino** + **CardMeister** disponível (ainda sem atribuição temática), **backs por tema**, **SFX de mesa**, e **música híbrida v1** (6 core + 23 remote R2 + modos avançados) validada em web + OPPO.

Desde o rebase de 13 Set, fecharam-se: limpeza de package Android, signing release, remoção Pixi/cards2, CardMeister deck, theme→deckId API, SFX round/game, core music, cache Android, R2 catalog completo, advanced music settings, Spades current-tricks HUD.

**Não há P0 técnico** para solo play no OPPO.

**Feature diferenciadora (produto):** **AI dedicada** (Game AI + Card Intelligence + eventual mini-modelo) — workstream próprio em §5; não confundir bots de partida com a camada de observação/métricas.

**Release gate visual (§12):** cada jogo (Sueca / Spades / Hearts / King) precisa de um **Final Visual Pass** manual próprio — **não** um único item genérico “UX polish”. Automação sozinha **não** fecha este gate.

**Theme Architecture Foundation:** **ACTIVE WORKSTREAM** — plano vivo [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md). Migração temática global React/DOM (tokens → components); Landing segue o theme activo; Phaser aesthetics ficam em Premium Classic.

**Themes + Audio UX (§13):** redesign futuro da personalização (Theme ↔ Music ↔ SFX) — **DEFERRED / DESIGN PENDING**; Francisco decide o desenho; **não** confundir com a foundation de tokens/UI (§ Theme Architecture).

**Não fazer hoje:** custom domain / CDN R2, site OXS/Suecão, Cap 7, ONNX/WASM mini-LLM, redesign Themes/Audio unificada (§13) antes de decisão de desenho.

**Próximo bloco recomendado:** (1) **Theme Architecture Foundation** (Etapa 0+) → (2) Final Visual Passes restantes / revalidation Sueca após foundation → (3) curadoria theme↔deck / release-licensing → (4) Card Intelligence produto opcional (P2) → (5) Themes+Audio UX redesign (**DEFERRED**) → (6) mini-LLM experimental **DEFERRED**.

### Contagens desta revisão

| Classe | N |
|--------|---|
| **DONE** | 92 |
| **PARTIAL** | 14 |
| **OPEN** | 16 |
| **DEFERRED** | 11 |
| **SUPERSEDED** | 13 |

| Prioridade | N |
|------------|---|
| **P0** | 0 |
| **P1** | 6 |
| **P2** | 7 |
| **P3** | 10 |

*(Contagens: +1 DONE Hearts H15-OK; −1 PARTIAL; −1 P2 (H15 fecho). King H16 + Visual Pass + Themes/Audio mantidos.)*

### Roadmap summary — visual / audio UX

| Área | Estado |
|------|--------|
| Theme Architecture Foundation | **ACTIVE WORKSTREAM** — Stage 0–6 DONE · **Etapa 7 Legacy Purple Cleanup** · [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md) |
| Sueca Visual Pass | **LOCAL PASS / GLOBAL CLEANUP PENDING** |
| Spades Visual Pass | **OPEN** |
| Hearts Visual Pass | **OPEN** |
| King Visual Pass | **OPEN** |
| Themes + Audio UX | **DEFERRED / DESIGN PENDING** (§13) |

---

## 1. Fontes usadas

| Fonte | Uso |
|-------|-----|
| Este ficheiro (rebase 13 Set + refresh/AI 17 Set + visual/audio UX refine) | baseline |
| `docs/plan/ROADMAP_GAMEPLAY_UX_2026.md` | histórico A–H |
| `docs/ASSETS.md` | Casino, CardMeister, music hybrid, R2 |
| `docs/ANDROID_SIGNING.md` | signing release |
| `docs/plan/ANDROID_OPPO_RENO13_BASELINE_2026.md` | device |
| `docs/ai/active/ROADMAP_AI.md` | fases históricas CI |
| `docs/ai/active/CARD_INTELLIGENCE_STATUS_REPORT.md` | inventário (Jun 2026; arquitectura ainda válida) |
| `docs/ai/active/current-work/IMPLEMENTATION_15_*` / `16*` / `16_1*` | Hearts/King bot metrics |
| `git log` até `462315c` | evidência |
| Código `frontend/src/ai/**`, `frontend/src/cardIntelligence/**`, `services/aiClient.ts`, `config/features.ts` | verificação 2026-09-17 |
| Testes: `vitest` `src/ai` + `src/cardIntelligence` + `aiClient` → **61 files / 388 tests** PASS | evidência |

---

## 2. Roadmap original A–H — estado (confirmado)

Legenda: **DONE** · **PARTIAL** · **OPEN** · **DEFERRED** · **SUPERSEDED**

### 2.1 Fase A — Regras

| ID | Estado | Notas |
|----|--------|-------|
| A1–A14 | **DONE** | Quatro jogos; commits A1–A14 |
| A15 Blind nil / King MP joiner | **OPEN** / **DEFERRED** produto | Não bloquear release solo |

### 2.2 Fase B — UX baseline

| ID | Estado |
|----|--------|
| B1–B7 | **DONE** |
| B8 Landscape deep | **OPEN** / **DEFERRED** (portrait-first OPPO) |

### 2.3 Fase C — Architecture

| ID | Estado |
|----|--------|
| C1–C5 (SoT, flow, VariantFlowApi, controllers, TableRenderModel) | **DONE** |

### 2.4 Fase D — MP / storage

| ID | Estado | Notas |
|----|--------|-------|
| D1 Extrair Firebase / host-joiner | **DEFERRED** | MP flag-gated |
| D2 Session / continue / lifecycle | **PARTIAL** | Continue + Android resume OK; isolamento MP não |
| D3 Preferences Capacitor | **OPEN** | Dep presente; runtime ainda `localStorage` (`preferences.ts`) |

### 2.5 Fase E / F / G / H — Renderer

| ID | Estado |
|----|--------|
| E1–E2 Phaser | **DONE** (POC framing **SUPERSEDED**) |
| Pixi como candidato | **SUPERSEDED** — removido do bundle (`db0b757`) |
| F1 Web / F2 Android | **DONE** |
| G Phaser default Sueca | **DONE** |
| H1–H3 Spades/Hearts/King Phaser | **DONE** |
| “DOM default Spades/Hearts/King” | **SUPERSEDED** |
| DOM fallback | **DONE** (`?renderer=dom` / erro / MP) |

### 2.6 Toolchain / “fora de scope” original

| Item | Estado |
|------|--------|
| CRA → Vite | **DONE** / CRA **SUPERSEDED** |
| AI / Card Intelligence (bucket único “mesa”) | **SUPERSEDED** como item monolítico — ver **§5** |
| Ads / IAP reais | **DEFERRED** |
| Godot/Unity/Kotlin | **SUPERSEDED** nesta fase |

---

## 3. Pós-rebase (13→17 Set) — estado real

### 3.1 Cards / themes

| Item | Estado | Evidência |
|------|--------|-----------|
| Casino deck (`cards3`) | **DONE** | runtime default |
| Remoção cards1/cards2 | **DONE** | `89f337e`, cleanup package |
| Theme → `backId` (30 temas) | **DONE** | `THEME_CARD_VISUALS` |
| Theme → `deckId` architecture (API) | **DONE** | `resolveCardDeckForTheme`; sem decks alt. activos |
| CardMeister second deck (assets + registry) | **DONE** | `0d78226`; `?deck=cardmeister` |
| Atribuição CardMeister a themes | **OPEN** | nenhum `deckId: 'cardmeister'` em themes |
| Card hand polish Phaser | **DONE** / residual **PARTIAL** | `e673f8a` + série hand; fine polish OK |
| SmallCards em UI compacta/history | **OPEN** | catalogadas em ASSETS; não integradas |
| Pixi archive no bundle | **SUPERSEDED** / **DONE** removed | `db0b757` |

### 3.2 Android / release

| Item | Estado | Evidência |
|------|--------|-----------|
| Capacitor 6 baseline | **DONE** | 6.2.x; SDK 34 |
| Release signing local | **DONE** | `6d16569`, `docs/ANDROID_SIGNING.md` |
| assembleRelease / bundleRelease | **DONE** | OPPO smokes recorrentes |
| Package cleanup (maps, legacy packs, GIF, ambiance) | **DONE** | `c623bb4`…`d97f7fd` |
| OPPO Reno13 baseline | **DONE** | doc + smokes |
| Resume / background | **DONE** | smokes release |
| Cap 7 / targetSdk 35+ | **DEFERRED** | janela dedicada |
| Play Store listing / políticas | **OPEN** | não bloqueia solo |

### 3.3 Audio SFX

| Item | Estado | Evidência |
|------|--------|-----------|
| Card play / shuffle / deal / trick collect | **DONE** | `c163cd0` |
| Round start / end / win / lose | **DONE** | `a4201ee` |
| Mute global (música+SFX) | **DONE** | `audioService` |
| Resume / Off ≠ mute | **DONE** | advanced settings smoke OPPO |
| Phaser `noAudio` mesa | **PARTIAL** | SFX via React/`audioService`; OK produto |

### 3.4 Music hybrid v1

| Item | Estado | Evidência |
|------|--------|-----------|
| 6 core bundled | **DONE** | `ab16950`; `public/assets/music/core` |
| Theme Default mapping 30/30 | **DONE** | `musicThemeMap` |
| Mock remote catalog | **DONE** | `844c3c3` |
| Android cache + SHA | **DONE** | `946c7cb` |
| Hybrid playback | **DONE** | `bac3910` |
| R2 real + smoke 2 tracks | **DONE** | `66c3720` |
| Full remote catalog 23 | **DONE** | `8c441d3` |
| Web stream / Android on-demand | **DONE** | OPPO smokes |
| Fallback core | **DONE** | |
| Off / Theme Default | **DONE** | |
| Random / Random Streaming Safe / Family / Specific | **DONE** | `462315c` |
| Content ID filter (3 tracks) | **DONE** | metadata + Random Safe |
| Persistence settings | **DONE** | `sueca-music-settings` |
| OPPO validation (catalog + modes) | **DONE** | 2026-09-17 |
| Bulk download | **DONE** (ausente — correcto) | on-demand only |
| Custom domain / sair de `r2.dev` | **OPEN** / **DEFERRED** | **não hoje** |
| Prefetch / packs opcionais | **DEFERRED** | |

### 3.5 Licenças / música (registo)

| Item | Estado |
|------|--------|
| StockTune Aztec Relic (`meso-aztec-relic`) | **DONE** — LICENSE OK (core) |
| Ethiopic `ambient.mp3` | **SUPERSEDED** / **DONE** policy — REFERENCE ONLY / não ship |
| `ethiopia-groove` | **DONE** — release-safe remote |
| `mohenjo_dharo.mp3` | **DEFERRED** / **OPEN** policy — CONDITIONAL / DO NOT SHIP |
| 3 remotes Content ID (`whiskey-jazz`, `northern-glow`, `hawaii-relax`) | **DONE** — permitidas em modos normais; excluídas de Streaming Safe |
| Raw `_temp/_musicas` no repo público | **OPEN** hygiene — não trackear; `_temp/` gitignored |
| Casino commercial license clarificação | **PARTIAL** / **OPEN** p/ distribuição loja |

### 3.6 Website / presença web

| Item | Estado |
|------|--------|
| Domínio principal OXS | **DEFERRED** |
| Site OXS / página Suecão | **DEFERRED** |
| Privacy / credits / download links no site | **DEFERRED** |
| Ligação domínio → R2 `music.<domínio>` | **DEFERRED** (ver §4) |

---

## 4. Music / infra — o que ainda falta

### 4.1 Custom domain / CDN — **OPEN / DEFERRED** (**NÃO fazer hoje**)

1. Escolher domínio OXS/Suecão  
2. Comprar/registar domínio  
3. Adicionar domínio à Cloudflare  
4. Subdomínio música (ex. `music.<domínio>`)  
5. Ligar custom domain ao bucket R2  
6. Substituir `*.r2.dev` em `VITE_MUSIC_REMOTE_BASE_URL`  
7. Restringir CORS ao origin final quando aplicável  
8. Revalidar web + Android  

**Nota:** `r2.dev` continua endpoint **dev/smoke** (`docs/ASSETS.md`).

### 4.2 Website / web presence — **DEFERRED**

Separado do runtime do jogo. Não desenhar nem implementar nesta fase de produto mesa.

---

## 5. DEDICATED AI / CARD INTELLIGENCE

**Objectivo de produto:** AI dedicada como feature diferenciadora do Suecão — bots competentes *e* camada de inteligência observável/avaliável.

### 5.0 Separação obrigatória

| Camada | O quê | Onde |
|--------|-------|------|
| **GAME AI** | Decisão dos bots *durante* a partida | `frontend/src/ai/**` → `*Game.ts` (`choose*Card`) |
| **CARD INTELLIGENCE** | Observação, métricas, encoder, evaluator, memória, Dev Lab, advisory | `frontend/src/cardIntelligence/**` |
| **Dedicated / Mini-LLM** | Camada experimental sobre CI (advisory); não substitui Game AI | `cardIntelligence/llm/**`; futuro ONNX/WASM **DEFERRED** |

Partilham infra (legal moves, estado, fixtures) mas **não são a mesma feature**.  
**Não marcar “AI concluída”** só porque um jogo tem bots maduros.

Flags (`frontend/src/config/features.ts`):

| Flag | Default | Papel |
|------|---------|-------|
| `CARD_INTELLIGENCE_LOGGER_ENABLED` | **on** (off só com `=false`) | logger live no `GameBoard` |
| `CARD_INTELLIGENCE_DEBUG` | dev / `VITE_…=true` | `__ci*` console |
| `CARD_INTELLIGENCE_DEV_LAB` | **off** | cenários / seeded |
| `CARD_INTELLIGENCE_LLM_ADVISORY` | **off** | mini-LLM advisory |
| `USE_LOCAL_AI_ONLY` | Android / flag | bloqueia `aiClient` externo |

### 5.1 Sequência de fases (actualizada)

Histórico (`docs/ai/active/ROADMAP_AI.md`): metrics → logger → encoder → evaluator → memory → mini-LLM.

**Sequência vigente (2026-09):**

1. **Game AI core** (legal / fallback / difficulty / adapters) — **DONE**  
2. **Métricas de bot** (heurísticas por jogo) — **DONE** cobertura jogável (Sueca/Spades/Hearts H15/King H16); polish Hearts v2 (cartas altas) **DEFERRED**  
3. **Logger / history** — **DONE** (live)  
4. **State encoder** — **DONE** (biblioteca; 4 variantes)  
5. **Decision evaluator** — **DONE** (biblioteca + testes; **não** no loop de play)  
6. **Memory / learning ingest** — **PARTIAL** (IDB + APIs; não ingest automático em produção)  
7. **Dev Lab / report / export** — **DONE** (flag-gated)  
8. **Mini-LLM / dedicated model** — **PARTIAL** advisory (mock/Ollama); **DEFERRED** ONNX/WASM  

Dev Lab ficou *antes* de um modelo dedicado — correcto; não reordenar para “LLM cedo”.

### 5.A AI Core (GAME AI)

| ID | Item | Estado | Evidência / gaps |
|----|------|--------|------------------|
| DAI-A1 | Legal move filtering | **DONE** | `ai/core/LegalMoveFilter.ts` + tests |
| DAI-A2 | Fallback selector | **DONE** | `ai/core/FallbackMoveSelector.ts` + tests |
| DAI-A3 | Difficulty profiles (easy/medium/hard) | **DONE** | `ai/core/DifficultyProfile.ts` |
| DAI-A4 | Shared strategy interfaces | **DONE** | `choose*Card` por variante; core partilhado |
| DAI-A5 | Adapters por jogo (wiring) | **DONE** | `SuecaGame` / `SpadesGame` / `HeartsGame` / `King*Game` |

### 5.B Card Intelligence

| ID | Item | Estado | Evidência / gaps |
|----|------|--------|------------------|
| DAI-B1 | Logger | **DONE** | `playCardAndLogDecision` no `GameBoard`; flag on |
| DAI-B2 | History / trick events | **DONE** | `history/**` + tests |
| DAI-B3 | State encoder (4 jogos) | **DONE** | `encoder/**` (sueca/spades/hearts/king) |
| DAI-B4 | Metrics inventory / taxonomy | **PARTIAL** | métricas em bots + CI; cobertura desigual entre jogos |
| DAI-B5 | Scenario / report flow | **DONE** | `debug/reportFlow/**`, `devLab/scenarioReport*` — flag/dev |
| DAI-B6 | Decision evaluator | **DONE** | `evaluator/**` + golden/synthetic tests; offline |
| DAI-B7 | Warnings / risk map | **PARTIAL** | `mapLegalMoveRisks` etc.; não UX produto |

### 5.C Memory / Learning

| ID | Item | Estado | Evidência / gaps |
|----|------|--------|------------------|
| DAI-C1 | Played-card / evaluation memory | **DONE** | `memory/memoryStore*.ts` (IDB) |
| DAI-C2 | Pattern / history persistence | **DONE** | store + debug `readMemory` |
| DAI-C3 | Learning / evaluation ingest | **PARTIAL** | `ingestEvaluation` + tests; sem auto-wire play→memory |
| DAI-C4 | Reset / versioning | **PARTIAL** | `clearDebugData`; versioning produto fraco |

### 5.D Dev Lab / Diagnostics

| ID | Item | Estado | Evidência / gaps |
|----|------|--------|------------------|
| DAI-D1 | Seeded scenarios | **DONE** | `devLab/**`; `VITE_CARD_INTELLIGENCE_DEV_LAB` |
| DAI-D2 | Report export (JSON/human) | **DONE** | `reportFlow/exportReport*`, formatters |
| DAI-D3 | External AI review workflow | **PARTIAL** | reports para revisão humana/LLM; não pipeline produto |
| DAI-D4 | Reproducibility | **DONE** | `seededRandom` + scenario runners |

### 5.E Mini-LLM / Dedicated Model

| ID | Item | Estado | Evidência / gaps |
|----|------|--------|------------------|
| DAI-E1 | Mock advisory provider | **DONE** | `llm/mockProvider.ts`; flag off |
| DAI-E2 | Ollama advisory provider | **PARTIAL** | `ollamaProvider`; endpoint local; flag off; sem hook play |
| DAI-E3 | ONNX / WASM / modelo dedicado on-device | **DEFERRED** | desenho em docs Fase 7; **sem** código runtime |
| DAI-E4 | External `aiClient` `/play` | **PARTIAL** | `services/aiClient.ts`; Android `USE_LOCAL_AI_ONLY`; fallback local Game AI |
| DAI-E5 | Offline advisory behaviour | **PARTIAL** | mock offline; Ollama exige servidor |
| DAI-E6 | Failure soft-fallback | **DONE** | `getMiniLLMAdvice` não quebra play |

### 5.F Multi-game coverage (auditar separado)

| Jogo | Game AI | Card Intelligence | Notas |
|------|---------|-------------------|-------|
| **Sueca** | **DONE** | **DONE** (lib) | Estratégia madura; `aiClient` legado Sueca-oriented |
| **Spades** | **DONE** | **DONE** (lib) | Play strategy + tests; menos “Impl metrics ID” |
| **Hearts** | **DONE** | **DONE** (lib) | Impl 15; **H15-OK: DONE** 2026-09-17 (full-match smoke + suites); polish «cartas altas» → Hearts v2 DEFERRED |
| **King** | **DONE** | **DONE** (lib) | Impl 16 + hotfix 16.1; **H16-OK: DONE** (2026-09-17, smoke seed + suites) |

### 5.G Prioridade Dedicated AI (não P3 automático)

| Fatia | Prioridade | Justificação |
|-------|------------|--------------|
| AI necessária para **jogar bem** (Game AI) | **DONE** (King H16-OK fechado 2026-09-17) | Solo jogável; gate H16 fechado |
| Card Intelligence **avançada** (evaluator live, memória produto, UX warnings) | **P2** | Diferenciador; não bloqueia release solo |
| Dev Lab / export polish | **P2** | Ferramenta interna |
| Mini-LLM / ONNX experimental | **P3** / **DEFERRED** | Advisory existe; modelo dedicado não |

### 5.H Gaps top (Dedicated AI)

1. **CI não no loop de decisão** — evaluator/memory offline; logger só observa  
2. **Sem modelo dedicado on-device** (ONNX/WASM)  
3. **Advisory LLM off + sem UX** — mock/Ollama não são produto mesa  
4. **Hearts bot v2** (opcional) — slough perigo cedo / H12 / H13 alargado — **DEFERRED** polish, não bloqueia H15-OK  

~~Hearts H15-OK~~ — **DONE** 2026-09-17 (`heartsH15FullMatch.smoke` + suites).  
~~King H16-OK~~ — **DONE** 2026-09-17 (`kingH16FullMatch.smoke` + suites auction/AI/play).

---

## 6. Open / deferred — reavaliação (sem itens mortos)

| Item | Prioridade | Estado | Notas |
|------|------------|--------|-------|
| King Game AI H16-OK re-smoke | — | **DONE** | 2026-09-17 — full match smoke + auction/AI suites |
| Theme ↔ CardMeister curation | P1 | **OPEN** | Deck shipped; falta curadoria temática |
| SmallCards / history compact UI | P2 | **OPEN** | Assets catalogados |
| Native Preferences (D3) | P2 | **OPEN** | Dep ok; wiring não |
| Blind nil / regras opcionais (A15) | P3 | **DEFERRED** | Decisão produto |
| Casino license clarificação | P1 | **PARTIAL** | Antes de loja comercial |
| Cap 7 / SDK 35 | P3 | **DEFERRED** | Manter Cap 6 |
| Landscape polish (B8) | P3 | **DEFERRED** | Portrait-first |
| Chips / dice / visual extra | P3 | **DEFERRED** | Catalogados |
| Ambiance/sons adicionais | P3 | **DEFERRED** | Music v1 fechada |
| Docs stale (CRA/Hazmat audits) | P2 | **OPEN** | Housekeeping |
| DevLab console test timeouts (full suite load) | P3 | **OPEN** | Flaky sob carga (`devLabConsole` / `debugConsoleAlias`); PASS isolados — **não** blocker H16; estabilizar depois |
| Play Store listing | P1 | **OPEN** | Signing já OK |
| CI productization (evaluator/memory/UX) | **P2** | **PARTIAL** | §5.B–C |
| Hearts metrics smoke H15 | — | **DONE** | 2026-09-17 — full match Medium/Hard + regras/moon/pass |
| Mini-LLM ONNX/WASM | **P3** | **DEFERRED** | §5.E |
| MP Online focus | — | **DEFERRED** | |
| Custom domain R2 | — | **DEFERRED** | §4 |
| Site OXS/Suecão | — | **DEFERRED** | §4 |
| cards1/Hazmat no tree | — | **SUPERSEDED** | Removidos |
| Pixi no bundle | — | **SUPERSEDED** | Removido |
| Ambiance single-file only | — | **SUPERSEDED** | Core+remote |
| “AI mesa” como único DEFERRED | — | **SUPERSEDED** | Substituído por §5 |
| Final Visual Pass — Sueca | **P1** | **LOCAL PASS / GLOBAL CLEANUP PENDING** | §12.3 + `docs/plan/SUECA_FINAL_VISUAL_PASS.md` (2026-09-17) |
| Final Visual Pass — Spades | **P1** | **OPEN** | §12 — NOT REVIEWED |
| Final Visual Pass — Hearts | **P1** | **OPEN** | §12 — NOT REVIEWED |
| Final Visual Pass — King | **P1** | **OPEN** | §12 — NOT REVIEWED |
| Visual tweaks (BUG/UX/POLISH) do Final Pass | **P2** | **OPEN** | Criados após review; batches pequenos |
| Theme Architecture Foundation | **P1** | **ACTIVE WORKSTREAM** | [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md) — 2026-09-20 |
| Themes + Audio Experience Redesign | — | **DEFERRED** / DESIGN PENDING | §13 — não blocker imediato; distinto da foundation |

---

## 7. Prioridades recalculadas

### P0
**Nenhum.** Solo OPPO + web estáveis; music v1 fechada.

### P1 (6)
1. **Theme Architecture Foundation** — workstream activo ([`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md))  
2. **Final Visual Pass por jogo** (Sueca / Spades / Hearts / King) — **release gate** (§12); Sueca revalidation após foundation  
3. Release/licensing cleanup (Casino clarificação; checklist Play se for a loja)  
4. Theme ↔ deck curation (activar CardMeister onde fizer sentido)  
5. Play Store listing / políticas (quando for a loja)  
6. Docs/roadmap housekeeping (stale audits)

~~King Game AI — H16-OK~~ — **DONE** 2026-09-17

### P2 (7)
1. **Tweaks do Final Visual Pass** (BUG / UX / POLISH em batches pequenos)  
2. Card Intelligence productization (evaluator/memory opcional; warnings)  
3. SmallCards / history compact UI  
4. Native Preferences adoption  
5. Dev Lab / external review workflow polish  
6. Residual hand/visual polish se sessões reais pedirem (fora do gate formal §12)  
7. Docs stale (CRA/Hazmat audits)

~~Hearts H15-OK fecho~~ — **DONE** 2026-09-17  
9. **Estabilizar timeouts flaky DevLab** (`devLabConsole` / `debugConsoleAlias` sob suite completa) — não blocker; PASS isolados (2026-09-17)

### P3 / DEFERRED (10 + Themes/Audio design)
1. Mini-LLM ONNX/WASM dedicated model  
2. LLM advisory productizado (flags/UX)  
3. Blind nil / optional rules  
4. Landscape deep  
5. Chips/dice  
6. Cap 7 window  
7. Custom domain + site OXS  
8. MP Online  
9. Extra music packs  
10. Ads / IAP reais  

**DEFERRED / DESIGN (não P3 de implementação imediata):**  
- Themes + Audio Experience Redesign (§13)  
- Unified customization UI  
- Theme ↔ Music relationship (A/B/C — DECISION OPEN)  
- SFX na mesma área de personalização  
- Preview theme/deck/music/SFX  

Não transformar o redesign Themes/Audio em blocker enquanto o desenho não estiver decidido.

---

## 8. Ordem recomendada (curta e realista)

1. **Theme Architecture Foundation** — **ACTIVE WORKSTREAM** ([`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md))  
2. **Final Visual Passes** — retomar só depois da foundation estabilizar (§12; Sueca revalidation)  
3. **Theme ↔ deck curation** (CardMeister)  
4. **Release / licensing** (Casino + store checklist)  
5. **Card Intelligence P2** (só com decisão explícita de diferenciador)  
6. **Themes + Audio UX redesign** — **DEFERRED**; só após decisão de desenho (Francisco)  
7. **Domínio / site / CDN** — **DEFERRED, não hoje**  
8. **Optional gameplay** (blind nil, etc.) só com decisão explícita  
9. **Mini-LLM / ONNX** — janela experimental própria (**DEFERRED**)  
10. **Future Capacitor 7** — janela dedicada + re-smoke OPPO  
11. **Final release readiness** (listing, políticas, CDN prod, **visual gate PASS ×4**)

~~King H16-OK smoke~~ — **DONE** 2026-09-17

---

## 9. Health summary

| Área | Estado | 1 linha |
|------|--------|---------|
| Gameplay | **GREEN** | 4 variantes; P0/P1 regras do roadmap original fechados. |
| UX (baseline) | **GREEN** | HUD/mão/continue; landscape fine polish não bloqueia baseline. |
| **Final Visual Pass** | **YELLOW** | Sueca **TWEAKS OPEN**; Spades/Hearts/King **NOT REVIEWED**; gate §12. |
| Cards | **GREEN** | Casino + backs; CardMeister ready; curadoria theme↔deck OPEN. |
| Audio SFX | **GREEN** | Mesa + round/game; mute/Off OK; redesign unificado **DEFERRED**. |
| Music | **GREEN** | Hybrid v1 + advanced modes + OPPO; CDN custom DEFERRED; UX Theme↔Music gap §13. |
| Themes + Audio UX | **YELLOW** | Runtime OK; personalização conceptualmente desagregada — redesign DESIGN PENDING. |
| Android | **GREEN** | Cap 6, signing, AAB/APK, OPPO smokes. |
| Web | **GREEN** | Vite/CI; Vercel path conhecido. |
| Infra/CDN | **YELLOW** | R2 funciona via `r2.dev` smoke; custom domain pendente. |
| Licenses | **YELLOW** | Music policies claras; Casino comercial a fechar p/ loja. |
| Release readiness | **YELLOW** | Artefactos OK; falta visual gate ×4 + store/CDN/casino license. |
| **Game AI** | **GREEN** | Core+4 jogos; **H15-OK** + **H16-OK DONE** 2026-09-17. |
| **Card Intelligence** | **YELLOW** | Pipeline library madura + logger live; evaluator/memory/Dev Lab offline/flag. |
| **Dedicated AI / Mini-LLM** | **RED** | Advisory mock/Ollama only; sem ONNX/WASM; flags off; não produto mesa. |

---

## 10. O que foi ultrapassado (mantido)

| Ideia antiga | Estado |
|--------------|--------|
| Phaser POC / flag-only | **SUPERSEDED** |
| Pixi candidato produção | **SUPERSEDED** |
| CRA toolchain | **SUPERSEDED** |
| Hazmat deck activo | **SUPERSEDED** |
| Cap upgrade urgente | **SUPERSEDED** — Cap 6 suficiente |
| Single ambiance.ogg como única música | **SUPERSEDED** — core + remote |
| Advanced music “ainda pendente” | **SUPERSEDED** — `462315c` |
| AI / Card Intelligence como único item DEFERRED | **SUPERSEDED** — expandido em §5 |

---

## 11. Relação com documentos

- `ROADMAP_GAMEPLAY_UX_2026.md` = **histórico cumprido**, não fila activa.  
- `docs/ai/active/ROADMAP_AI.md` + status/Impl reports = detalhe técnico AI; **fila de produto AI** = **§5** deste ficheiro.  
- `THEME_ARCHITECTURE_MASTER_PLAN.md` = **plano vivo** da foundation temática React/DOM — **ACTIVE WORKSTREAM** (§12.8).  
- **Fila activa geral** = §6–§8 + **§12** (visual) + **§12.8 Theme Architecture** + **§13** (themes/audio design, DEFERRED).  
- Workstream **música runtime** = **fechado** (v1 + advanced); CDN/domínio permanece **DEFERRED**; **UX Theme↔Music** = **§13 DEFERRED / DESIGN PENDING**.  
- Próxima actualização sugerida: Etapa 0+ do Theme Architecture Master Plan; depois Visual Passes / theme↔deck / decisão Themes+Audio / CDN / Cap 7 / Play Store.

---

## 12. PER-GAME VISUAL POLISH / FINAL TWEAK PASS

**STATUS workstream:** **OPEN**  
**Prioridade:** **P1** (gate de release); tweaks encontrados → **P2**  
**Motivo:** Os ecrãs variam entre Sueca, Spades, Hearts e King. Grande parte da validação anterior foi automática; cada jogo precisa de uma passagem **visual/manual** própria antes de release.

**Este workstream NÃO é um único item genérico “UX polish”.** Subsecções independentes abaixo.

### 12.0 Release gate

**Condição de release:** `Final Visual Pass completed for all 4 games`

| Jogo | Gate state |
|------|------------|
| Sueca | **TWEAKS OPEN** |
| Spades | **NOT REVIEWED** |
| Hearts | **NOT REVIEWED** |
| King | **NOT REVIEWED** |

Estados possíveis por jogo: **NOT REVIEWED** · **IN REVIEW** · **TWEAKS OPEN** · **PASS**

Não fechar este workstream (nem o gate) apenas com testes automáticos.

### 12.1 Tipo de tarefas desta fase

Aceitar **pequenos itens independentes** (tickets/tweaks) sem obrigar a abrir uma grande feature, por exemplo:

- text overflow · alinhamento · hierarquia visual  
- componente demasiado grande · informação pouco legível  
- botão mal colocado · estado pouco evidente · modal confuso  
- informação em falta · redundância · spacing · card sizing · contraste  
- animações/transições · leitura em portrait · inconsistência entre jogos  

Prioridade ao criar tickets: **BUG** · **UX** · **POLISH**

### 12.2 Método (por jogo)

1. Jogar manualmente uma partida  
2. Tirar screenshots dos estados relevantes  
3. Criar lista de tweaks  
4. Priorizar: BUG / UX / POLISH  
5. Implementar em **pequenos batches**  
6. Smoke real (device/web conforme o caso)  
7. Fechar o jogo visualmente (**PASS**)  

### 12.3 Sueca — Final Visual Pass

**STATUS:** **LOCAL PASS — GLOBAL CLEANUP PENDING** · Gate: **não** é release PASS absoluto enquanto globais pendentes  
**Doc detalhado:** [`SUECA_FINAL_VISUAL_PASS.md`](./SUECA_FINAL_VISUAL_PASS.md)  
**Screenshots:** `E:\SUECAO\_temp\sueca-visual-pass\` (OPPO portrait, 2026-09-17)  
**Nota:** auditoria automática revista manualmente por Francisco; lista consolidada S1–S10 + globais.

**Issues Sueca locais DONE:** S1 · S2 · S4 · S5 · S6 · S7 · S9  

**Issues globais ainda pendentes:** S3→GLOBAL-UI-01 · S8→GLOBAL-UI-02 · S10→GLOBAL-UI-03 · GLOBAL-CARDS-01 (PARTIAL)  

**Próximo (transversal):** GLOBAL-UI-01/02/03 + fecho GLOBAL-CARDS-01 em Hearts/King.

### 12.4 Spades — Final Visual Pass

**STATUS:** **OPEN** · Gate: **NOT REVIEWED**

Rever:

- bidding screen  
- tricks/bid HUD  
- score / bags  
- nil indicators  
- round result  
- gameplay table  
- mobile portrait  
- spacing / alignment · clareza visual  

### 12.5 Hearts — Final Visual Pass

**STATUS:** **OPEN** · Gate: **NOT REVIEWED**

Rever:

- passing phase  
- hearts broken indication  
- penalties  
- moon states  
- current score / round score  
- table / gameplay  
- mobile portrait  
- modals / transitions  

### 12.6 King — Final Visual Pass

**STATUS:** **OPEN** · Gate: **NOT REVIEWED**

Rever **separadamente**:

- negativos · festas · auction · auction timeline · negotiation  
- 8-or-nulls · 4x3x3  
- contract display · score / history  
- table / gameplay · mobile portrait  

### 12.7 Global visual / UI cleanup (registo único)

Workstream transversal ao Final Visual Pass. **Não duplicar** por jogo.

| ID | Título | PRIORITY | STATUS |
|----|--------|----------|--------|
| **GLOBAL-UI-01** | Legacy purple remnants | P2 | OPEN |
| **GLOBAL-UI-02** | In-game top bar density | P2 | OPEN |
| **GLOBAL-UI-03** | Active player cue consistency | P2 | OPEN |
| **GLOBAL-CARDS-01** | Card separation (bordo/contraste lateral em fan) | P2 | PARTIAL |

Detalhe e contexto Sueca: [`SUECA_FINAL_VISUAL_PASS.md`](./SUECA_FINAL_VISUAL_PASS.md).  
Testar GLOBAL-CARDS-01 **antes** de aumentar significativamente spacing das mãos.

### 12.8 Theme Architecture Foundation (ponte)

**STATUS:** **ACTIVE WORKSTREAM** — **Stage 0–6 DONE** · **Theme Contract APPROVED (16 `--sc-*`)** · **Landing + App Shell + Shared Components themed** · **current = Etapa 7 Legacy Purple Cleanup**  
**Plano canónico:** [`THEME_ARCHITECTURE_MASTER_PLAN.md`](./THEME_ARCHITECTURE_MASTER_PLAN.md)  
**Baseline Stage 0:** [`THEME_ARCHITECTURE_STAGE_0_BASELINE.md`](./THEME_ARCHITECTURE_STAGE_0_BASELINE.md)  
**Contract Stage 1:** [`THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md`](./THEME_ARCHITECTURE_STAGE_1_CONTRACT_PROPOSAL.md)  
**Foundation Stage 2:** [`THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md`](./THEME_ARCHITECTURE_STAGE_2_IMPLEMENTATION.md)  
**Built-in Stage 3:** [`THEME_ARCHITECTURE_STAGE_3_BUILTIN_THEMES.md`](./THEME_ARCHITECTURE_STAGE_3_BUILTIN_THEMES.md)  
**Custom Stage 4:** [`THEME_ARCHITECTURE_STAGE_4_CUSTOM_PARITY.md`](./THEME_ARCHITECTURE_STAGE_4_CUSTOM_PARITY.md)  
**Shell/Landing Stage 5:** [`THEME_ARCHITECTURE_STAGE_5_SHELL_LANDING.md`](./THEME_ARCHITECTURE_STAGE_5_SHELL_LANDING.md)

Foundation de tokens / theming React/DOM **antes** de retomar Final Visual Passes (master plan Etapa 13 = `BLOCKED` até foundation).  
`GLOBAL-UI-01` (legacy purple) é absorvido pela Etapa 7 do master plan; `GLOBAL-UI-02/03` e `GLOBAL-CARDS-01` permanecem no cleanup transversal.

---

## 13. THEMES + AUDIO EXPERIENCE REDESIGN

**STATUS:** **DEFERRED / DESIGN PENDING**  
**Prioridade:** não é P1/P2 de implementação imediata — **DESIGN** até Francisco decidir.  
**Distinto de:** Theme Architecture Foundation (tokens/UI DOM) — §12.8 / master plan.

### 13.1 Motivo

Temas visuais e música **funcionam tecnicamente**, mas estão **conceptualmente desagregados**.

**Música (settings actuais):** Theme Default · Random · Random Streaming Safe · Family · Specific Track · Off  

**Temas:** controlam visual / table / back / deck / etc.

A relação existe no runtime, mas **não está suficientemente clara na UX**.

### 13.2 Objectivo futuro

Redesenhar para que **Theme** e **Music / Sound** pareçam partes da **mesma experiência de personalização**.

**Não definir ainda a solução final.**

### 13.3 Possível direcção — NÃO IMPLEMENTAR

Hipótese de produto (Francisco decide):

**Personalização** — uma área/aba única (ou equivalente) contendo:

- Tema visual · Baralho · Música · Sons · Volume · modo musical · preview  

Não assumir que esta é a solução final.

### 13.4 Relação Theme ↔ Music (gap actual)

Problema actual documentado:

- cada theme pode ter música default  
- essa relação é **pouco visível** para o utilizador  
- músicas também podem ser seleccionadas **independentemente**  
- sensação de **duas features separadas**  

Futuro redesign deve escolher claramente:

| Opção | Descrição |
|-------|-----------|
| **A** | Theme como experiência completa: visual + deck + music default |
| **B** | Theme visual independente, Music na mesma área de personalização |
| **C** | Modelo híbrido |

**DECISION:** **OPEN**

### 13.5 SFX

Incluir SFX no futuro redesign.

Actual: música tem settings próprios; SFX/mute estão separados.  
Objectivo futuro: juntar conceptualmente **Themes / Music / Sounds** numa experiência coerente.

**Sem alterar comportamento actual nesta fase.**

### 13.6 Preview

Possível requisito futuro:

- preview do theme · preview do deck · preview de música · preview de SFX  

**STATUS:** **OPEN / DESIGN PENDING**

### 13.7 Não apagar arquitectura actual

O redesign futuro deve **reutilizar** (não recomeçar do zero):

- 30 themes · theme music mapping · 6 core tracks · 23 remote  
- advanced music modes · `audioService` · deck selection architecture  

### 13.8 Prioridade deste workstream

| Classe | Itens |
|--------|-------|
| **DEFERRED / DESIGN** | Themes + Audio Experience redesign; unified customization UI; theme/music relationship (A/B/C); SFX na mesma área; previews |

---

*ROADMAP + KING-H16-OK-CLOSURE-01 + HEARTS-H15-OK-CLOSURE-01 · H15/H16 fechados 2026-09-17*  
*THEME-ARCHITECTURE-MASTER-PLAN-01 · 2026-09-20 — Theme Architecture Foundation = ACTIVE WORKSTREAM*
