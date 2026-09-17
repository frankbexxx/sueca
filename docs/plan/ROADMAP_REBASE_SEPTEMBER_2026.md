# ROADMAP REBASE — Setembro 2026

**Modo:** DOCUMENTAÇÃO (actualização de estado; sem alterações de produto nesta revisão)  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main` @ `462315c` (`feat(audio): add advanced music settings`)  
**Data de revisão:** 2026-09-17  
**Revisão:** ROADMAP-ADD-DEDICATED-AI-01 (após ROADMAP-REFRESH-SEPTEMBER-2026)  
**Base anterior:** rebase `03681f8` @ `5d49c0e` (2026-09-13) + commits até `462315c`

---

## 0. Executive summary

Produto **solo jogável** nas quatro variantes, **Phaser default**, **Vite**, **Capacitor 6**, baseline **OPPO Reno13 5G**, deck **Casino** + **CardMeister** disponível (ainda sem atribuição temática), **backs por tema**, **SFX de mesa**, e **música híbrida v1** (6 core + 23 remote R2 + modos avançados) validada em web + OPPO.

Desde o rebase de 13 Set, fecharam-se: limpeza de package Android, signing release, remoção Pixi/cards2, CardMeister deck, theme→deckId API, SFX round/game, core music, cache Android, R2 catalog completo, advanced music settings.

**Não há P0 técnico** para solo play no OPPO.

**Feature diferenciadora (produto):** **AI dedicada** (Game AI + Card Intelligence + eventual mini-modelo) — workstream próprio em §5; não confundir bots de partida com a camada de observação/métricas.

**Não fazer hoje:** custom domain / CDN R2, site OXS/Suecão, Cap 7, ONNX/WASM mini-LLM.

**Próximo bloco recomendado:** (1) gate Game AI King H16-OK smoke → (2) curadoria theme↔deck / release-licensing → (3) Card Intelligence produto opcional (P2) → (4) mini-LLM experimental **DEFERRED**.

### Contagens desta revisão

| Classe | N |
|--------|---|
| **DONE** | 90 |
| **PARTIAL** | 16 |
| **OPEN** | 12 |
| **DEFERRED** | 10 |
| **SUPERSEDED** | 13 |

| Prioridade | N |
|------------|---|
| **P0** | 0 |
| **P1** | 5 |
| **P2** | 7 |
| **P3** | 10 |

*(Contagens agregam itens das secções 2–6 + §5 Dedicated AI; recalculadas de raiz nesta revisão.)*

---

## 1. Fontes usadas

| Fonte | Uso |
|-------|-----|
| Este ficheiro (rebase 13 Set + refresh 17 Set) | baseline |
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
2. **Métricas de bot** (heurísticas por jogo) — **PARTIAL** (Sueca madura; Hearts Impl15; King Impl16+16.1 smoke pendente; Spades ok mas menos “metrics ID”)  
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
| **Hearts** | **PARTIAL** | **DONE** (lib) | Impl 15; **H15-OK: Parcial** (smoke manual) |
| **King** | **PARTIAL** | **DONE** (lib) | Impl 16 + hotfix 16.1; **H16-OK: Pendente** re-smoke |

### 5.G Prioridade Dedicated AI (não P3 automático)

| Fatia | Prioridade | Justificação |
|-------|------------|--------------|
| AI necessária para **jogar bem** (Game AI) | **P1** só o gap King H16-OK; resto **DONE** | Solo já jogável; smoke King é gate de qualidade |
| Card Intelligence **avançada** (evaluator live, memória produto, UX warnings) | **P2** | Diferenciador; não bloqueia release solo |
| Dev Lab / export polish | **P2** | Ferramenta interna |
| Mini-LLM / ONNX experimental | **P3** / **DEFERRED** | Advisory existe; modelo dedicado não |

### 5.H Gaps top (Dedicated AI)

1. **King H16-OK** — re-smoke manual pós-16.1 (`no_tricks` / `no_hearts`)  
2. **Hearts H15-OK** — fechar “Parcial” ou documentar aceite  
3. **CI não no loop de decisão** — evaluator/memory offline; logger só observa  
4. **Sem modelo dedicado on-device** (ONNX/WASM)  
5. **Advisory LLM off + sem UX** — mock/Ollama não são produto mesa  

---

## 6. Open / deferred — reavaliação (sem itens mortos)

| Item | Prioridade | Estado | Notas |
|------|------------|--------|-------|
| King Game AI H16-OK re-smoke | **P1** | **PARTIAL** | §5.F; hotfix 16.1 feito |
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
| Play Store listing | P1 | **OPEN** | Signing já OK |
| CI productization (evaluator/memory/UX) | **P2** | **PARTIAL** | §5.B–C |
| Hearts metrics smoke H15 | **P2** | **PARTIAL** | §5.F |
| Mini-LLM ONNX/WASM | **P3** | **DEFERRED** | §5.E |
| MP Online focus | — | **DEFERRED** | |
| Custom domain R2 | — | **DEFERRED** | §4 |
| Site OXS/Suecão | — | **DEFERRED** | §4 |
| cards1/Hazmat no tree | — | **SUPERSEDED** | Removidos |
| Pixi no bundle | — | **SUPERSEDED** | Removido |
| Ambiance single-file only | — | **SUPERSEDED** | Core+remote |
| “AI mesa” como único DEFERRED | — | **SUPERSEDED** | Substituído por §5 |

---

## 7. Prioridades recalculadas

### P0
**Nenhum.** Solo OPPO + web estáveis; music v1 fechada.

### P1 (5)
1. **King Game AI — H16-OK re-smoke** (qualidade bots; não CI)  
2. Release/licensing cleanup (Casino clarificação; checklist Play se for a loja)  
3. Theme ↔ deck curation (activar CardMeister onde fizer sentido)  
4. Play Store listing / políticas (quando for a loja)  
5. Docs/roadmap housekeeping (esta revisão + stale audits)

### P2 (7)
1. Card Intelligence productization (evaluator/memory opcional; warnings)  
2. Hearts H15-OK fecho / aceite documentado  
3. SmallCards / history compact UI  
4. Native Preferences adoption  
5. Dev Lab / external review workflow polish  
6. Residual hand/visual polish se sessões reais pedirem  
7. Docs stale (CRA/Hazmat audits)

### P3 / DEFERRED (10)
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

---

## 8. Ordem recomendada (curta e realista)

1. **King H16-OK smoke** (Game AI gate) — curto  
2. **Theme ↔ deck curation** (CardMeister)  
3. **Release / licensing** (Casino + store checklist)  
4. **Card Intelligence P2** (só com decisão explícita de diferenciador)  
5. **Domínio / site / CDN** — **DEFERRED, não hoje**  
6. **Optional gameplay** (blind nil, etc.) só com decisão explícita  
7. **Mini-LLM / ONNX** — janela experimental própria (**DEFERRED**)  
8. **Future Capacitor 7** — janela dedicada + re-smoke OPPO  
9. **Final release readiness** (listing, políticas, CDN prod)

---

## 9. Health summary

| Área | Estado | 1 linha |
|------|--------|---------|
| Gameplay | **GREEN** | 4 variantes; P0/P1 regras do roadmap original fechados. |
| UX | **GREEN** | HUD/mão/continue; landscape e fine polish não bloqueiam. |
| Cards | **GREEN** | Casino + backs; CardMeister ready; curadoria theme↔deck OPEN. |
| Audio SFX | **GREEN** | Mesa + round/game; mute/Off OK. |
| Music | **GREEN** | Hybrid v1 + advanced modes + OPPO; CDN custom DEFERRED. |
| Android | **GREEN** | Cap 6, signing, AAB/APK, OPPO smokes. |
| Web | **GREEN** | Vite/CI; Vercel path conhecido. |
| Infra/CDN | **YELLOW** | R2 funciona via `r2.dev` smoke; custom domain pendente. |
| Licenses | **YELLOW** | Music policies claras; Casino comercial a fechar p/ loja. |
| Release readiness | **YELLOW** | Artefactos assinados OK; store listing / CDN prod / casino license. |
| **Game AI** | **YELLOW** | Core+4 jogos wired; Sueca/Spades sólidos; Hearts/King smoke parcial/pendente. |
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
- **Fila activa geral** = §6–§8 deste ficheiro.  
- Workstream **música** = **fechado** (v1 + advanced); CDN/domínio permanece **DEFERRED**.  
- Próxima actualização sugerida: após H16-OK ou theme↔deck curation, ou ao abrir CDN/domínio / Cap 7 / Play Store.

---

*ROADMAP-ADD-DEDICATED-AI-01 · commit base `462315c` · alterações de código nesta tarefa: ZERO*
