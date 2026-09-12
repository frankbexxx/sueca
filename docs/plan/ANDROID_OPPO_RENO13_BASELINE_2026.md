# ANDROID-SCREEN-01 — Baseline OPPO Reno13 5G (2026-09-12)

**Modo:** medições reais / READ-ONLY (sem correções de layout)  
**Device físico:** OPPO Reno13 5G (único telefone de referência)  
**Package:** `com.suecao.cardgames`  
**Commit web base:** `a6e3ed9` (`fix(mobile): respect dynamic browser viewport`)  
**Artefactos:** `docs/plan/android-screen-baseline/oppo-reno13/`

---

## 0. Método e builds

| Fase | Build | Notas |
|---|---|---|
| A | `vite build --mode android` + Firebase env injectido no processo | **Baseline principal** Sueca / Hearts / Spades / King negativo |
| B | `vite build --mode development` + `NODE_ENV=development` + flags android | **Só** para saltos `?devKingFesta=` / `?devKingNeg=` (King festa detalhado) — CSS/layout idêntico; jumps DEV não existem no APK production |

**Importante — falha inicial da APK android “pura”:**  
`.env.android` **não** contém `VITE_FIREBASE_*`. O módulo `firebaseConfig.ts` inicializa Firebase no load → **FIREBASE FATAL ERROR** → `#root` vazio (gradient roxo).  
Para a baseline, Firebase foi injectado **só no ambiente de build** (sem alterar ficheiros de produto). Isto é um **problema de packaging/ops confirmado**, não um bug de viewport.

**Alterações de produto:** ZERO.

---

## 1. Device info (adb)

| Campo | Valor |
|---|---|
| serial | `DAV8SCONJZHQUSUG` |
| manufacturer / brand | OPPO |
| model (adb) | **CPH2689** |
| market name | **OPPO Reno13 5G** (`ro.vendor.oplus.market.name`) |
| device codename | `OP5E9EL1` |
| product | `CPH2689EEA` |
| Android | **16** (`ro.build.version.release`) |
| SDK / API | **36** |
| build display | `CPH2689_16.0.5.1001(EX01)` |
| orientation during tests | **portrait** (`rotation=0`, `USER_ROTATION_LOCKED` observado) |

### Display

| Campo | Valor |
|---|---|
| Physical size (`wm size`) | **1080 × 2373** |
| Alternate panel modes | também 1256 × 2760 @ 60/90/120 Hz |
| Physical density | **560** |
| Override density | **480** (activo) |
| CSS `devicePixelRatio` | **3** |
| CSS `screen` | 360 × 791 |
| Cutout | top inset **120 px** físicos; bounding ~`Rect(507,0–573,120)` |
| Rounded corners | radius 120 |

### System bars (dumpsys window — confirmado)

| Bar | Visível? | Frame físico (px) | Altura |
|---|---|---|---|
| Status bar | **SIM** | `[0,0]–[1080,120]` | **120** |
| Navigation bar | **SIM** | `[0,2241]–[1080,2373]` | **132** |
| Display cutout (top) | SIM | `[0,0]–[1080,120]` | 120 |

**Navigation mode:** `settings secure navigation_mode = 0` → **3-button** (não gestures).  
Confirmação visual: Overview / Home / Back na barra inferior.

**Não se alterou** nenhuma setting permanente do telefone.

---

## 2. WebView vs ecrã físico

Do Chrome DevTools remote (`/json` description):

| Campo | Valor |
|---|---|
| WebView width | **1080** |
| WebView height | **2121** |
| screenX / screenY | **0 / 120** |
| Relação | `2373 − 120 − 132 = 2121` |

### Conclusão system chrome

| Pergunta | Resposta |
|---|---|
| Status bar presente? | **SIM** |
| WebView começa por baixo ou atrás? | **Por baixo** (`screenY=120`) — **não** edge-to-edge |
| Navigation bar presente? | **SIM** (3-button, 132 px) |
| Conteúdo entra na nav area? | **NÃO** (WebView termina em Y=2241) |
| `env(safe-area-inset-*)` no WebView | **todos 0px** (probe CSS) |

---

## 3. Viewport JS (CSS px) — in-game típico

Medido via CDP `Runtime.evaluate` no WebView:

| Métrica | Valor |
|---|---|
| `innerWidth` × `innerHeight` | **360 × 707** |
| `visualViewport` w × h | **360 × 707** (`offsetTop=0`, `scale=1`) |
| `documentElement.clientHeight` | **707** |
| `documentElement.scrollHeight` | **707** |
| `body.scrollHeight` | **707** |
| `window.scrollY` | **0** |
| `dpr` | **3** |

`707 × 3 = 2121` → CSS altura = altura WebView física.

---

## 4. Geometria in-game (tabela real)

Unidades: **CSS px**. Origem = topo do WebView (abaixo da status bar).

### Sueca (com action bar; modal de distribuição aberto no ecrã — métricas de chrome ainda válidas)

| Região | top | bottom | height |
|---|---:|---:|---:|
| WebView / `.App` / `.app-shell--game` / `.game-board` | 0 | 707 | **707** |
| `.in-game-bar` | 0 | 79.33 | **79.33** |
| `.top-strip` (HUD) | 79.33 | 138.4 | **59.06** |
| `.sueca-phaser-root` / canvas | 145.25 | 640.15 | **494.9** |
| `.action-buttons-bar` | 647 | 707 | **60** |

**Soma** InGameBar + HUD + Phaser + Actions ≈ **693.3**  
**Board** = **707**  
**Excesso** = **−13.7** → cabe (folga ~14 px).

### Hearts pass / King festa (sheet activo; sem action bar)

| Região | top | bottom | height |
|---|---:|---:|---:|
| Shell / board | 0 | 707 | 707 |
| InGameBar | 0 | 79.33 | 79.33 |
| HUD | 79.33 | 167.79 | 88.46 |
| Phaser host | 167.79 | 606.13 | **438.34** |
| Sheet (ex. auction) | (fixed) | | ~161–212 |
| Actions | — | — | **ausente** |

**Soma** bar+HUD+Phaser ≈ **606.1** vs board **707** → excess **−100.9** (espaço reservado / sheet).

### Spades (bid dock; métrica `metrics-spades.json`)

| Região | height (aprox.) |
|---|---:|
| InGameBar | 79.33 |
| HUD | 74.3 |
| Phaser | **494.9** |
| Actions | ausente no instante |
| Soma chrome medido | 648.5 |
| Excess vs 707 | **−58.5** |

---

## 5. Phaser (OPPO real)

| Campo | Sueca (sem sheet) | Hearts/King c/ sheet |
|---|---|---|
| parent / canvas CSS | 360 × **494.9** | 360 × **438.34** |
| `scale.width/height` | 360 / 494.9 | 360 / 438.34 |
| aspect mode | **portrait** | **portrait** |
| `handY` | 418.9 | 305.34 |
| `cardHeight` | 64 | 64 |
| hand bottom approx | 450.9 | 337.34 |
| gap até fundo canvas | **44** | **101** |
| `bottomChromePx` | 0 | **57** |
| handFitsInCanvas | **true** | **true** |
| handClipped | **false** | **false** |

### Leitura qualitativa da mão

| Questão | Resposta |
|---|---|
| Cabe totalmente no canvas? | **SIM** |
| Invade visualmente outra região? | **PARCIAL** — com bottom sheet (auction/pass), o sheet **cobre** parte da mão de propósito |
| É cortada pelo canvas? | **NÃO** (gap ≥ 44 px) |
| Demasiado próxima do fundo? | Em Sueca gap 44 px — **apertada mas dentro**; com chrome de sheet, gap 101 px |

---

## 6. Overflow / scroll (APK)

| Check | Resultado |
|---|---|
| Document `scrollHeight > clientHeight`? | **NÃO** |
| `window.scrollY` sempre 0? | **SIM** (todas as amostras) |
| GameBoard excede o shell? | **NÃO** (rects iguais 0–707) |
| Phaser host excede espaço residual? | **NÃO** nos estados medidos (soma ≤ board) |
| Actions completamente visíveis? | **PASS** quando presentes (Sueca: bottom=707, alinhado ao fundo do WebView, **acima** da nav nativa) |
| `.game-board { overflow-y: auto }` | Presente, mas `scrollHeight === clientHeight` → **sem scroll efectivo** |

### Conclusão scroll APK

**Scroll inesperado do documento: NÃO** neste OPPO / WebView.

Isto **contrasta** com o problema observado no Chrome Android browser (barras dinâmicas / `vh`), onde o mesmo CSS foi motivado pelo commit `a6e3ed9`.

---

## 7. Smoke dos 4 jogos

| Jogo | Resultado | Notas |
|---|---|---|
| **Sueca** | **PASS** | Mesa Phaser, HUD, InGameBar; action slot presente; modal distribuição no ecrã de controlo |
| **Spades** | **PASS** | Bid dock + Confirmar bid; mesa Phaser |
| **Hearts** | **PASS** | Pass sheet + mão in-canvas; Continuar/pass UI |
| **King** | **PASS** | Negativo (KOH) via play normal; festa auction/setup/negotiation/fallback via DEV jumps |

### King detalhado

| Estado | Como obtido | Screenshot | Continuar / actions |
|---|---|---|---|
| Negativo / play normal | Jogar King | `03-king-normal-play.png`, `03c-king-negative.png` | HUD contrato visível |
| Auction | `?devKingFesta=7&festaPhase=auction&devKingFestaLive=1` | `06-king-auction.png` | **Continuar PASS** |
| Auction Continuar | tap Continuar | `06b-king-auction-continue.png` | PASS |
| Setup | `festaPhase=setup` | `06c-king-setup.png` | sheet setup |
| Negotiation | `festaPhase=negotiation` | `06d-king-negotiation.png` | sheet |
| Festa fallback / play attempt | `festaPhase=fallback` + UI | `06e` / `06f` | opções Trunfo / Sem trunfo |

---

## 8. Screenshots recolhidos

Pasta: `docs/plan/android-screen-baseline/oppo-reno13/`

Mínimo pedido + extras:

1. Home / landing / dashboard — `01-*`, `02-home-dashboard.png`
2. King normal — `03-king-normal-play.png`
3. King auction — `06-king-auction.png`
4. King auction Continuar — `06b-king-auction-continue.png`
5. King setup — `06c-king-setup.png`
6. King festa — `06e` / `06f`
7. King actions / phases — `07-king-actions.png`, `06-king-phase-*.png`
8. Controlo outro jogo — `08-sueca-play-control.png`, `04-spades-*`, `05-hearts-*`

JSON de métricas: `metrics-*.json` (Hearts, Sueca, Spades, King auction/setup/festa).

---

## 9. Diferenças face ao Chrome mobile

| Tópico | Chrome Android (problema reportado) | OPPO Capacitor APK (esta baseline) |
|---|---|---|
| Browser top/bottom chrome | Dinâmico; reduz visual viewport | **Ausente** |
| WebView vs system bars | N/A | WebView **entre** status (120) e nav (132) |
| `100dvh` necessidade | Alta (barras Chrome) | Menor — altura WebView já é “útil” |
| Document scroll | Observado / temido | **Não reproduzido** |
| Actions cortadas | Risco alto | **Não** — acima da nav nativa |
| `safe-area` CSS | frequentemente 0 também | **0**; insets vêm do layout Android |
| Edge-to-edge | N/A | **Não** activo |

---

## 10. Problemas CONFIRMADOS

1. **APK `build:android` sem Firebase env → crash fatal / UI vazia** (`.env.android` incompleto).  
2. **Bottom sheets cobrem a mão** durante auction/pass (comportamento de UI actual; overlap intencional).  
3. **Phaser host ainda dimensionado em `vh`** (`min(70vh,…)`) — no OPPO coincide com espaço residual, mas a unidade não é “altura restante do flex”.  
4. **`@capacitor/status-bar` instalado mas não usado**; bars geridas pelo default Android (WebView não overlay).  
5. King festa profundo **não acessível** em APK production sem DEV jumps / jogar 6 negativas.

---

## 11. Problemas NÃO reproduzidos (neste OPPO / APK)

1. Document scroll (`scrollY≠0` / `scrollHeight>clientHeight`).  
2. Actions inferiores cortadas pela navigation bar.  
3. Conteúdo desenhado atrás da status bar.  
4. Mão cortada pelo limite do canvas Phaser.  
5. Soma InGameBar+HUD+Phaser+Actions **exceder** o GameBoard (nos estados medidos: sempre folga negativa).

---

## 12. Incógnitas restantes

1. Gesture navigation neste mesmo telefone (não testado — modo actual é 3-button).  
2. Landscape (orientação bloqueada/observada portrait).  
3. Festa play “limpo” pós-Começar com métricas de action bar (setup ficou em sheet de escolha).  
4. Comportamento se no futuro se activar edge-to-edge / `StatusBar.setOverlaysWebView(true)`.  
5. Outros devices (só existe este físico).  
6. Chrome mobile neste mesmo OPPO (comparação directa browser vs APK **não** feita nesta sessão).

---

## 13. Implicação para a próxima arquitectura (sem escolher solução)

No **alvo Capacitor Android neste OPPO**, o modelo geométrico actual é:

```text
Physical 1080×2373
├── Status bar 120 (WebView NÃO desenha aqui)
├── WebView 1080×2121 (= 360×707 CSS @3x)
│   └── app-shell--game 707
│       ├── InGameBar ~79
│       ├── HUD ~59–88
│       ├── Phaser ~438–495  (mão in-canvas, cabe)
│       └── Actions ~60 (quando existem; bottom=707)
└── Nav bar 132 (WebView NÃO desenha aqui)
```

O problema de **Chrome mobile** e o de **APK Capacitor** **não são o mesmo**. Qualquer arquitectura futura deve tratar os dois ambientes como constraints distintas.

---

## 14. Verificação final

| Check | Estado |
|---|---|
| Testado no OPPO físico | **SIM** (`DAV8SCONJZHQUSUG` / CPH2689) |
| Package instalado | **SIM** |
| Screenshots reais | **SIM** |
| Medições reais CDP | **SIM** |
| King testado | **SIM** (negativo + festa via DEV) |
| Alterações produto | **ZERO** |
| Commit / push | **NÃO** |
