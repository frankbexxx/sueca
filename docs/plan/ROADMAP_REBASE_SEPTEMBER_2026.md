# ROADMAP REBASE — Setembro 2026

**Modo:** READ-ONLY (este ficheiro é a única entrega)  
**Root:** `E:\SUECAO`  
**Branch:** `v2-main` @ `5d49c0e`  
**Data:** 2026-09-13  
**Base:** `ROADMAP_GAMEPLAY_UX_2026.md` + audits 2026 + `docs/ASSETS.md` + git desde 2026-09-01

---

## 0. Executive summary

Estamos num **produto jogável solo** nas quatro variantes, com **Phaser default**, **Vite**, **Capacitor 6**, baseline **OPPO Reno13 5G (Android 16)**, deck **Casino** e **backs por tema**.

O roadmap original (gameplay/UX → POC Phaser → Android → default Sueca) está **essencialmente cumprido** e em vários pontos **ultrapassado**: Phaser já cobre Spades/Hearts/King; CRA foi a Vite; temas/cartas avançaram fora do “fora de scope” inicial.

**Fechado:** P0/P1 de regras A1–A14; UX baseline B1–B7; separação C1–C5; E/F/G; expansão Phaser às 4 variantes; Casino + theme backs; Firebase Android opcional.

**Ainda importa:** polish de mão/cartas no telefone; residual King UX se aparecer em jogo real; readiness de release Android (store/signing); limpeza de debt (Pixi archive, packs mortos); **não** Cap 7/8 nem MP agora.

**Próximo bloco recomendado:** polish visual de cartas/mão no Phaser (OPPO-first) — valor alto, risco baixo, sem misturar toolchain.

---

## 1. Fontes usadas

| Fonte | Uso |
|-------|-----|
| `docs/plan/ROADMAP_GAMEPLAY_UX_2026.md` | roadmap original a reconciliar |
| `docs/plan/DEPENDENCY_TOOLCHAIN_AUDIT_2026.md` | toolchain (parcialmente desactualizado pós-Vite) |
| `docs/plan/CARD_ASSETS_RENDERER_AUDIT_2026.md` | assets/renderer (pré-Casino) |
| `docs/plan/CARD_HAND_VISIBILITY_AUDIT_2026.md` | mão/geometria (pré-Casino faces) |
| `docs/plan/SCREEN_VIEWPORT_ANDROID_AUDIT_2026.md` | viewport |
| `docs/plan/ANDROID_OPPO_RENO13_BASELINE_2026.md` | device baseline |
| `docs/ASSETS.md` | estado actual Casino + theme backs |
| `CAPACITOR-TOOLCHAIN-AUDIT-01` (sessão 2026-09-13) | Cap 6 / SDK 34 / recomendação manter |
| `git log --since=2026-09-01` | commits que moveram o roadmap |
| Código actual (`resolveTableRenderer`, registry, CI) | verificação |

---

## 2. Roadmap original — estado por item

Legenda: **DONE** · **PARTIAL** · **STILL OPEN** · **SUPERSEDED** · **NO LONGER RELEVANT**

### 2.1 Fase A — Estabilização funcional

| ID | Estado | Evidência |
|----|--------|-----------|
| A1 Capote Sueca | **DONE** | `7b30b56` |
| A2 Pause adapters | **DONE** | `19c365a` |
| A3 Bags Spades | **DONE** | `57457c5` |
| A4 Modais Spades /4 | **DONE** | `79faf51` |
| A5 King nulos sem trunfo | **DONE** | `e55a950` |
| A6 K♥ primeira oportunidade | **DONE** | `2bcb24b` |
| A7 4×3×3 history | **DONE** | `e389e43` |
| A8 8 ou nulos gate | **DONE** | `64fbbf5` |
| A9 Settlement positivo | **DONE** | `bc5959b` |
| A10a Fallback copy | **DONE** | `96b1180` |
| A10b Breakdown / null scores | **DONE** | `936ef25` |
| A11 Hearts 1ª vaza | **DONE** | `0dc4e3a` |
| A12 Moon modal | **DONE** | `01bf8d8` |
| A13 Dealing direction | **DONE** | `c098b20` |
| A14 Game-over race | **DONE** | `dc5dfaa` |
| A15 Blind nil / King MP joiner | **STILL OPEN** | LATER de produto; MP Android off |

### 2.2 Fase B — UX baseline

| ID | Estado | Evidência |
|----|--------|-----------|
| B1 Active player | **DONE** | `1bd548d` (+ refinements renderer) |
| B2 Legal/illegal | **DONE** | `98ff414` |
| B3 Bags + broken Spades | **DONE** | `e66925c` |
| B4 Hearts broken | **DONE** | `615f330` |
| B5 Trump Sueca | **DONE** | `e8be329` |
| B6 King festa actions | **DONE** | `4b1e8c5` (+ leilão/HUD King em Set) |
| B7 Continue idle | **DONE** | `4cb6e5b` |
| B8 Landscape deep | **STILL OPEN** | LATER; prioridade = portrait OPPO |

### 2.3 Fase C — Separação architecture

| ID | Estado | Evidência |
|----|--------|-----------|
| C1 Single source adapters | **DONE** | `a2f4047` |
| C2 Orchestration fora JSX | **DONE** | `adc0092` |
| C3 Variant APIs adapter | **DONE** | `c3b6f3f` |
| C4 Flow controllers | **DONE** | `737eb04` |
| C5 Table renderer boundary | **DONE** | `26ebe26` |

### 2.4 Fase D — MP / storage / session

| ID | Estado | Evidência |
|----|--------|-----------|
| D1 Extrair Firebase / host-joiner | **STILL OPEN** | MP flag-gated; não prioridade |
| D2 Session save / continue / lifecycle | **PARTIAL** | Continue flows estáveis; lifecycle Android OK o suficiente; isolamento MP não feito |
| D3 Preferences Capacitor | **STILL OPEN** | Dep instalada; runtime ainda `localStorage` |

### 2.5 Fase E / F / G / H — Renderer

| ID | Estado | Evidência |
|----|--------|-----------|
| E1 POC Phaser Sueca | **DONE** | `58c4594` — framing “POC” **SUPERSEDED** |
| E2 Candidato mesa + “não default ainda” | **DONE** trabalho; cláusula “não default” **SUPERSEDED** | `3f28471` → `48f036d` |
| Comparação Pixi | **DONE** / Pixi **SUPERSEDED** como candidato | `28e75cd`, `bb75c20`; só `?renderer=pixi-archive` |
| F1 Web | **DONE** | docs + uso contínuo |
| F2 Android real | **DONE** | `db076e9`, baseline OPPO |
| G Phaser default Sueca | **DONE** | `48f036d`, `f1f9e89` |
| “Spades/Hearts/King ficam DOM” (texto G) | **SUPERSEDED** | defaults Phaser |
| H1 Spades Phaser | **DONE** (além do plano “flag only”) | `0d78c0a`, `252b403` |
| H2 Hearts Phaser | **DONE** | `a59b508`, `7f378ed` |
| H3 King Phaser | **DONE** | `ffa622f`, `af509f4` |
| H “flag only / DOM default” | **SUPERSEDED BY CURRENT ARCHITECTURE** | `resolveTableRenderer` → Phaser p/ 4 variantes |

### 2.6 Checkpoints originais

| CP | Estado |
|----|--------|
| 1–8 | **DONE** (atingidos ou ultrapassados) |

### 2.7 “Fora de scope” original vs realidade

| Item original | Estado |
|---------------|--------|
| AI / Card Intelligence | **STILL OPEN** (fora deste rebase de produto mesa; código CI existe) |
| Godot/Unity/Kotlin | **NO LONGER RELEVANT** nesta fase |
| Redesign / temas | **SUPERSEDED** — temas + backs por tema shipped |
| Ads / IAP reais | **STILL OPEN** / NOT NOW |
| Dual renderer produção | **SUPERSEDED** — Phaser default; DOM fallback só |
| CRA como toolchain | **SUPERSEDED** — Vite (`4e0667f`) |
| Deck Hazmat activo | **SUPERSEDED** — Casino `cards3` |

### Contagens (itens discretos auditados acima)

| Classe | N |
|--------|---|
| DONE | 38 |
| PARTIAL | 1 |
| STILL OPEN | 5 |
| SUPERSEDED | 8 |
| NO LONGER RELEVANT | 1 |

*(A15, B8, D1, D3, AI-out-of-scope contam como OPEN de produto/fase; supersessions são cláusulas/arquitecturas substituídas.)*

---

## 3. Fotografia do estado real (Set 2026)

### Gameplay
| Variante | Estado |
|----------|--------|
| Sueca | Estável; capote/dealing; Phaser default |
| Spades | Bags/broken/modais 500; Phaser default |
| Hearts | 1ª vaza/moon/broken; Phaser default |
| King | Motor P0/P1 + leilão/HUD festa iterados em Set; Phaser default |

### UX
- HUD premium / seats / trick progress unificados (série `fix(ui|renderer)` Set)
- Mão Phaser com geometria partilhada 10/13
- Continue flows estabilizados
- Modais React (sem native confirm)
- Mobile **portrait-first**; landscape deep ainda aberto
- **OPPO Reno13 5G** = device de referência documentado

### Renderer
- **Phaser** default: sueca / spades / hearts / king
- **DOM** via `?renderer=dom` ou erro Phaser / MP
- **Pixi** removido (`chore(renderer): remove archived pixi renderer`)

### Cards
- Faces: **Casino** global (`/assets/cards3`)
- Back fallback: **Suecão navy**
- Backs por tema: 30 temas → `backId` (`THEME_CARD_VISUALS`)
- SmallCards Casino: catalogadas — **UI compacta futura**, não gameplay
- Casino `cards3`: **único** deck runtime; `cards1`/`cards2` removidos do tree

### Android
- Capacitor **6.2.x**; compile/target **34**; minSdk **22**
- Corre em Android **16 / API 36** (compatibility mode)
- Firebase init **opcional** (`ebe44b9`) — APK android sem keys já não fica ecrã vazio
- Viewport baseline OPPO documentada

### Toolchain
- **Vite 6** + Vitest + tsc no CI (Node 20)
- Vercel frontend (histórico verde pós-lockfile)
- Cap 7/8 auditados: **manter 6 agora**; próximo major planeado = 7, não 8

---

## 4. Commits relevantes desde Setembro (agrupados)

Não é o log completo — só o que mudou o estado do roadmap.

### Gameplay / King
`7b30b56`…`c098b20` (A1–A14) · série King festa/auction/HUD (`c917d3e`…`ac1283b`)

### UX
`1bd548d`…`4cb6e5b` (B) · `e527a64` confirms · `1e9c511`/`3ff8215`/`e4a2bd8` HUD · `a6e3ed9` viewport

### Renderer
`58c4594` Phaser POC · `bb75c20` Pixi archive · `48f036d` Sueca default · `0d78c0a`/`a59b508`/`ffa622f` + defaults Spades/Hearts/King · premium layout `20d6143`…

### Cards / themes
`2a93f1e`/`b6cb119` Suecão back · `ba4ea3f` Casino faces · `11a8302`/`5d49c0e` backs por tema

### Android
`41968ee`/`db076e9` Phaser Android · `aac5b65` OPPO baseline · `ebe44b9` Firebase optional

### Toolchain / CI / docs
`4e0667f` CRA→Vite · `21d162c` deps audit · `2b9add1`/`22c6f6e` CI · audits cards/viewport/hand

---

## 5. O que foi ultrapassado

| Ideia do roadmap original | Estado |
|---------------------------|--------|
| Phaser como POC / flag-only Sueca | **SUPERSEDED BY CURRENT ARCHITECTURE** |
| Decisão futura de renderer | **SUPERSEDED** — Phaser escolhido e default 4 jogos |
| Spades/Hearts/King permanecem DOM após G | **SUPERSEDED** |
| CRA / react-scripts como base | **SUPERSEDED** — Vite |
| Hazmat `cards2` como deck activo | **REMOVED** — Casino `cards3` only |
| “Sem temas / redesign” nesta fase | **SUPERSEDED** — N5 themes + backs |
| Viewport tratado como browser-first | **SUPERSEDED** — Android/OPPO é referência |
| Cap upgrade urgente para E2 | **SUPERSEDED** — Cap 6 suficiente agora |

---

## 6. Open items reais

### P0 — bloqueia estabilidade ou release
**Nenhum P0 técnico aberto** para solo play no OPPO no estado actual.

*(Release Play Store / signing não é P0 de gameplay; ver P1.)*

### P1 — importante de produto
1. **Polish cartas/mão Phaser no OPPO** (tamanho, contraste backs vs felt, fan/overlap) — audits hand/cards desactualizados pós-Casino  
2. **Android release readiness** (signing, checklist store, targetSdk planeado via Cap 7 mais tarde)  
3. **King UX residual** só se bugs reais em sessão (leilão/HUD já muito iterados)  
4. **Licença Casino** clarificar antes de distribuição comercial  

### P2 — polish / future-facing
1. ~~Preparar `theme → deckId` **sem activar** decks alternativos~~ **DONE** (THEME-DECK-ID-01 — API pronta; todos → casino)  
2. SmallCards em UI compacta (históricos / mini)  
3. ~~Retirar Pixi archive do bundle~~ **DONE**
4. Blind nil Spades (A15) — decisão de produto  
5. Sons: serviço existe; Phaser `noAudio` — afinamento SFX de mesa  
6. Preferences nativas Capacitor (D3)

### P3 — nice-to-have / experimental
1. Limpar `cards1` / staging duplicado  
2. Landscape deep (B8)  
3. Chips/dice Casino catalogados  
4. IAP / ads  
5. Card Intelligence / mini-LLM como prioridade de produto mesa  

---

## 7. Candidatos a próximo bloco

| bloco | valor | risco | esforço | dependências |
|-------|-------|-------|---------|--------------|
| Polish cartas/mão Phaser (OPPO) | alto | baixo | S–M | baseline OPPO; Casino já in |
| Prep `theme→deckId` (sem activar) | médio | baixo | S | **DONE** — `resolveCardDeckForTheme`; sem decks alt. |
| Android release readiness | alto p/ store | médio | M | signing docs; Cap 6 ok |
| King UX bugfix (só se repro) | médio | baixo | S | sessões reais |
| Sons mesa (SFX on play/trick) | médio | baixo | S | `audioService` |
| Pixi archive / dead assets cleanup | baixo | baixo | S | nenhum gameplay |
| Cap 7 upgrade window | médio futuro | médio–alto | L | janela dedicada; OPPO após |
| MP isolation / Online | alto futuro | alto | L | produto MP on |

---

## 8. Ordem recomendada — Setembro (curta)

1. **Polish cartas/mão Phaser (OPPO-first)** — melhora o que o jogador vê agora; audits pedem isto; Casino/backs já estáveis.  
2. ~~**Prep `theme→deckId` sem activar**~~ **DONE** (THEME-DECK-ID-01).  
3. **Android release readiness** (signing/checklist) — quando quiserem loja; sem misturar Cap major.  
4. **Cleanup opcional** packs mortos — reduz ruído (Pixi archive já removido).  
5. **Sons de mesa** — polish perceptível, isolado.  

*(Cap 7 e MP ficam fora desta sequência.)*

---

## 9. NOT NOW

- Capacitor **7 / 8** (manter 6; ver audit toolchain)  
- Multiplayer / Online como foco  
- Activar **decks diferentes por tema**  
- Chips / dice / jokers Casino  
- Poker / novas variantes  
- Rewrite renderer (Pixi/Godot/Unity)  
- Landscape-first redesign  
- Ads / IAP reais  
- React 19 / Phaser 4 / TS 5+ “porque sim”  
- Blind nil só por checklist  

---

## 10. Health check

| Área | Estado | 1 linha |
|------|--------|---------|
| Gameplay | **GREEN** | Quatro variantes com P0/P1 de regras do roadmap fechados. |
| UX | **GREEN** | HUD/mão/continue jogáveis; polish fino restante, não bloqueio. |
| Android | **GREEN** | Cap 6 + OPPO baseline + Firebase opcional; store ainda não é o foco. |
| Web | **GREEN** | Vite build/CI; Vercel path conhecido. |
| Toolchain | **YELLOW** | Vite/CI verdes; Cap major e targetSdk 35+ adiados conscientemente. |
| Assets | **GREEN** | Casino + backs por tema; licença Casino a clarificar p/ comercial. |
| Docs | **YELLOW** | Muitos audits bons mas parcialmente stale (CRA/Hazmat/hand pré-Casino). |
| Release readiness | **YELLOW** | Solo APK debug sólido; signing/store/targetSdk não fechados. |

---

## 11. Relação com o roadmap original

O documento `ROADMAP_GAMEPLAY_UX_2026.md` deve ler-se como **histórico cumprido**, não como fila activa.

**Fila activa** = secções 6–8 deste rebase.

Próxima actualização sugerida: após o bloco de polish de cartas/mão, ou se abrir janela Cap 7 / Play Store.

---

*ROADMAP-REBASE-01 · Setembro 2026 · alterações de produto: ZERO*
