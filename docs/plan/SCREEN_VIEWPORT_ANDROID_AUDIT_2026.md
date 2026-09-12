# SCREEN-VIEWPORT-AUDIT-01 — Auditoria completa de ecrã, viewport e layout global

**Modo:** READ-ONLY / inventário técnico  
**Data:** 2026-09-12  
**Branch auditada:** `v2-main` @ `a6e3ed9`  
**Project root:** `E:\SUECAO`  
**Âmbito:** frontend web + Capacitor Android (projecto local gerado; `/android` gitignored)  

**Este documento NÃO recomenda soluções.** Identifica apenas o estado real, conflitos potenciais e incertezas runtime.

---

## 0. Contexto do problema

### Alvo de produto

| Prioridade | Ambiente |
|---|---|
| **Primário** | Android via Capacitor / Android System WebView |
| **Secundário** | Web / Chrome mobile (também ambiente de teste) |

### Sintomas observados (Chrome Android browser)

- Barras superior/inferior do Chrome reduzem a área visível.
- Mão pode sobrepor ligeiramente a mesa (especialmente path Phaser).
- Topo ou fundo podem ficar fora da viewport.
- A página pode entrar em scroll (ou conteúdo ser cortado por `overflow: hidden`).
- Já houve tentativas com `100vh` / `100dvh`.
- **Comportamento no browser Chrome NÃO deve ser confundido automaticamente com Capacitor/WebView.**

### Commits relevantes

| Commit | Mensagem | Papel |
|---|---|---|
| `a6e3ed9` | `fix(mobile): respect dynamic browser viewport` | Última tentativa de alinhar shell/board/modals a `100dvh` + `viewport-fit=cover` |
| `4e0667f` | `build(frontend): migrate cra to vite` | Toolchain: `webDir: dist`, Vite 6, env `VITE_*` |

### Nota sobre `android/`

O directório `frontend/android/` **existe localmente** (Capacitor sync) mas está em `frontend/.gitignore` (`/android`). A auditoria Android baseia-se nos ficheiros locais presentes em disco, não no histórico git remoto.

---

## 1. Arquitectura global do ecrã

Árvore real (adaptada ao código actual):

```text
html                          [index.html + index.css]
└── body                      [index.css]
    └── #root                 [index.css]
        └── .App              [App.tsx + App.css]
            ├── (landing) .App.App--full → LandingPage
            ├── (shell)   .App.app-shell
            │               ├── main.app-shell-content → ShellRouter
            │               ├── BottomNav (fixed)
            │               └── ConfirmDialog (fixed overlay)
            └── (game)    .App.app-shell.app-shell--game
                            └── GameBoard.game-board[+modifiers]
                                ├── InGameBar
                                ├── ScoreStrip / UnifiedGameStatusPanel (.top-strip)
                                ├── path A — Phaser (default quando flag activa)
                                │     └── .game-table-zone
                                │           └── .sueca-phaser-root
                                │                 └── .sueca-phaser-canvas-host
                                │                       └── <canvas>  ← mão local + oponentes
                                ├── path B — DOM fallback
                                │     ├── TableSurface / .table-layout
                                │     ├── LocalPlayerDock
                                │     └── PlayerHand (.player-hand-bar)
                                ├── GameActions (.action-buttons-bar)
                                ├── Variant overlays (Hearts pass, King festa/auction, Spades bid…)
                                ├── RoundEndModal / KingScoreModal / EarlyRoundEndModal…
                                └── ConfirmDialog
```

### Por nível (resumo estrutural)

| Nível | Ficheiro(s) | Componente | CSS | display / position | width / height | overflow | z-index |
|---|---|---|---|---|---|---|---|
| `html` | `index.html`, `index.css` | — | `index.css` | block | `height: 100%` + `100dvh` | default (sem overflow explícito) | — |
| `body` | `index.css` | — | `index.css` | block | `min-height`/`height` `100%`+`100dvh`; **sem** padding safe-area (removido em `a6e3ed9`) | default; `overscroll-behavior-y: none` | — |
| `#root` | `index.css` | — | `index.css` | block | `min-height`/`height` `100%`+`100dvh` | default | — |
| `.App` | `App.tsx` | `App` | `App.css` | block | `min-height` `100%`+`100dvh`; `height: 100%` | default | — |
| `.App--full` | landing | `App` | `App.css` | block | `height`/`max-height` `100%`+`100dvh` | **`overflow: hidden`** | — |
| `.app-shell` | shell | `App` | `app-shell.css` | **flex column** | `min-height`/`height` `100%`+`100dvh`; safe-area padding top/L/R | content scroll via filho | — |
| `.app-shell--game` | game | `App` | `app-shell.css` | flex column | `height`/`max-height` `100%`+`100dvh`; `min-height: 0`; **`padding: 0`** | **`overflow: hidden`** | — |
| `.app-shell-content` | shell only | `main` | `app-shell.css` | flex:1 | — | **`overflow-y: auto`** | — |
| `.game-board` | `GameBoard.tsx` | `GameBoard` | `GameBoard.css` | block (flex only c/ `--team-table`) | `flex: 1 1 auto`; `height`/`max-height: 100%`; `min-height: 0` | `overflow-x: hidden` | — |
| `.in-game-bar` | `InGameBar.tsx` | `InGameBar` | `InGameBar.css` | flex | altura dinâmica + `padding-top: max(8px, safe-area-top)` | text ellipsis | `z-index: 100` |
| `.top-strip` | `ScoreStrip` / `UnifiedGameStatusPanel` | HUD | `GameBoard.css` | **grid** | padding/gap; shrink via media | partial overflow hidden em labels | no flow |
| `.sueca-phaser-root` | Phaser | `SuecaPhaserRenderer` | `SuecaPhaserRenderer.css` | relative | `height: min(70vh,680px)` mobile; `min-height` 360–420 | **`overflow: hidden`** | sheets usam z 1 vs hand bar 2100 |
| `.player-hand-bar` | DOM only | `PlayerHand` | `GameBoard.css` | flex | flow normal; margin | hand-row pode `overflow-x: auto` | pass/festa: `z-index: 2100` |
| `.action-buttons-bar` | `GameActions` | actions | `GameBoard.css` | flex | `min-height` ~60–64px; ≤430px **`position: sticky; bottom: 0`** | — | sticky `z-index: 40` |
| `.variant-modal-overlay` | vários | modals | `VariantModals.css` | **fixed** `inset:0` | `100vh`/`100dvh` + max-height | sheet `overflow-y: auto` | `2000` (KOH `1200`) |

Transforms relevantes: seats DOM (`translateX/Y`), cartas pass (`translateY(-8px)`), KOH seats.  
Não há transform no shell global.

---

## 2. HTML / BODY / ROOT — valores finais e cascata

### Valores declarados (CSS actual pós-`a6e3ed9`)

| Selector | width | height | min-height | max-height | overflow | overflow-x | overflow-y | position |
|---|---|---|---|---|---|---|---|---|
| `html` | (default 100%) | `100%` → **`100dvh`** | — | — | — | — | — | static |
| `body` | (default) | `100%` → **`100dvh`** | `100%` → **`100dvh`** | — | — | — | — | static |
| `#root` | (default) | `100%` → **`100dvh`** | `100%` → **`100dvh`** | — | — | — | — | static |
| `.App` | (default) | `100%` | `100%` → **`100dvh`** | — | — | — | — | static |
| `.App--full` | (default) | `100%` → **`100dvh`** | (herda `.App`) | `100%` → **`100dvh`** | **hidden** | — | — | static |
| `.app-shell` | (default) | `100%` | `100%` → **`100dvh`** | — | — | — | — | static (flex) |
| `.app-shell--game` | (default) | `100%` → **`100dvh`** | **`0`** | `100%` → **`100dvh`** | **hidden** | — | — | static (flex) |
| `.game-board` | `max-width: 100vw` | **`100%`** | **`0`** | **`100%`** | — | **hidden** | — | static |

`box-sizing: border-box` global (`*`).

### Usos de unidades de viewport (inventário)

| Unidade | Onde |
|---|---|
| **`100dvh`** | `html`, `body`, `#root`, `.App` / `.App--full`, `.app-shell` / `--game`, overlays Variant/KOH, Landing |
| **`100vh`** | Fallbacks em `.variant-modal-overlay`, `.king-koh-overlay` (declarados **antes** de `100dvh`) |
| **`100svh` / `100lvh`** | **Não encontrados** |
| **`100vw`** | `.game-board { max-width: 100vw }` |
| **`100%`** | Cascata de fallback + fill de filhos (`height: 100%` em board/canvas host) |
| **`NNvh` sem dvh** | `.sueca-phaser-root` (`62vh`/`70vh`), vários `max-height: NNvh` em Credits/Rules/status; landscape Hearts `52vh` sem par `dvh` em um ramo |
| **`NNvh` + `NNdvh`** | Margins/heights pass/festa/spades em `GameBoard.css`; sheets Variant |

### Cascata efectiva (in-game)

1. `html`/`body`/`#root` travam ao **dynamic viewport** (`100dvh`) quando suportado; senão `100%` (que herda do parent — browsers antigos sem `dvh` ficam na cadeia `%`).
2. `.app-shell--game` trava a mesma altura, **sem** safe-area padding, `overflow: hidden`.
3. `.game-board` preenche o shell (`flex: 1`, `height/max-height: 100%`, `min-height: 0`) — **já não** declara `min-height: 100dvh` (removido em `a6e3ed9`).
4. Dentro do board, o Phaser host usa **altura em `vh`**, não `flex-grow` — a soma InGameBar + HUD + `70vh` canvas + action bar pode exceder o shell; o shell corta (`overflow: hidden`) ou o documento pode scrollar se algum ancestral não cortar.

---

## 3. Viewport meta

Ficheiro: `frontend/index.html`

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

| Directiva | Presente? |
|---|---|
| `width=device-width` | SIM |
| `initial-scale=1` | SIM |
| `maximum-scale` | NÃO |
| `minimum-scale` | NÃO |
| `user-scalable` | NÃO (default browser) |
| `viewport-fit=cover` | SIM (adicionado em `a6e3ed9`) |

Também: `<meta name="theme-color" content="#000000" />`.

---

## 4. Safe areas

### Ocorrências `env(safe-area-inset-*)`

| Ficheiro | Selector | Elemento | top | bottom | left | right | Soma à altura total? | Pode causar overflow? | Condicionado por plataforma? |
|---|---|---|---|---|---|---|---|---|---|
| `app-shell.css` | `.app-shell` | shell (não-jogo) | sim | **não** (só via content padding) | sim | sim | Padding no shell → reduz content box | POSSIBLE se filho ainda usa 100dvh | Não |
| `app-shell.css` | `.app-shell-content` | main scroll | — | `bottom-nav + inset + 8px` | — | — | Padding-bottom; scroll interno | Baixo (scroll absorve) | Não |
| `app-shell.css` | `.app-shell--game` | jogo | **0** (padding:0) | **0** | **0** | **0** | NÃO no shell de jogo | — | Não |
| `InGameBar.css` | `.in-game-bar` | barra topo jogo | `max(8px, inset-top)` | — | — | — | Aumenta altura da barra | POSSIBLE (consome viewport) | Não |
| `BottomNav.css` | `.bottom-nav` | nav fixed | — | inset-bottom | — | — | Aumenta altura visual da nav | Baixo | Não |
| `GameBoard.css` | `.spades-bid-dock` | dock Spades | — | margin-bottom max(2px, inset) | — | — | Margem | Baixo | Não |
| `GameBoard.css` | `.action-buttons-bar` @≤430px | Continuar sticky | — | padding max(10px, inset) | — | — | Padding | POSSIBLE | Não |
| `VariantModals.css` | `.variant-modal-overlay` | overlays | max(16px,…) | max(16px,…) | max(16px,…) | max(16px,…) | Padding dentro de overlay já `100dvh` + `box-sizing:border-box` | Mitigado por border-box | Não |
| `VariantModals.css` | `.variant-modal--bottom-sheet` | sheets | — | max(0.75rem, inset) | — | — | Padding interno | Baixo | Não |
| `VariantModals.css` | `.king-koh-overlay` | KOH | — | max(8px, inset) | — | — | Padding; overlay 100dvh + border-box | Mitigado | Não |
| `RulesSheet.css` | overlay | regras | all four | | | | Padding | POSSIBLE | Não |
| `LandingPage.css` | `.landing-content` | landing | max(12px, top) | max(12px, bottom) | — | — | Padding | Mitigado por max-height root | Não |

### Tabela resumo (impacto)

| elemento | top | bottom | left | right | impacto |
|---|---|---|---|---|---|
| body (actual) | — | — | — | — | **Removido** em `a6e3ed9` (antes somava padding + filhos 100dvh) |
| `.app-shell` (menus) | ✓ | via content | ✓ | ✓ | Notch/home indicator nos ecrãs shell |
| `.app-shell--game` | ✗ | ✗ | ✗ | ✗ | Jogo **não** herda insets no shell; InGameBar / sticky / sheets tratam pontualmente |
| `.in-game-bar` | ✓ | ✗ | ✗ | ✗ | Empurra conteúdo abaixo do notch |
| `.action-buttons-bar` (≤430) | ✗ | ✓ | ✗ | ✗ | Levanta Continuar |
| Variant overlays | ✓ | ✓ | ✓ | ✓ | Overlay full-viewport com insets |
| Phaser `safeArea` API | opcional | opcional | opcional | opcional | **Declarada** em layout TS; **call sites actuais passam defaults 0** (não lido de CSS env) |

---

## 5. Viewport dinâmica — commit `a6e3ed9`

### `git show --stat`

```
frontend/index.html                       |  5 ++++-
frontend/src/App.css                      | 10 ++++++++--
frontend/src/components/GameBoard.css     | 13 +++++++++++--
frontend/src/components/VariantModals.css | 18 ++++++++++++++++++
frontend/src/index.css                    | 23 ++++++++++++++++++-----
frontend/src/styles/app-shell.css         | 17 +++++++++++++++--
 6 files changed, 74 insertions(+), 12 deletions(-)
```

### O que mudou (factual)

| Área | Antes | Depois |
|---|---|---|
| viewport meta | `width=device-width, initial-scale=1` | + `viewport-fit=cover` |
| `html` | sem regra height | `100%` + `100dvh` |
| `body` | `min-height: 100vh` + **padding safe-area nos 4 lados** | `min/height 100%+100dvh`; **sem** padding safe-area |
| `#root` | sem regras | `min/height 100%+100dvh` |
| `.App` | `min-height: 100vh` | `min-height 100%+100dvh`; `height: 100%` |
| `.App--full` | só `padding: 0` | height/max-height 100%/dvh + `overflow: hidden` |
| `.app-shell` | `min-height: 100dvh` | + height 100%; safe-area padding top/L/R |
| `.app-shell--game` | só `padding-bottom:0` + overscroll | lock height/max-height dvh; `overflow: hidden`; `padding: 0`; content `min-height: 0` |
| `.game-board` | **`min-height: 100dvh`** | `flex:1; min-height:0; height/max-height:100%` |
| margins/heights pass/festa | só `vh` | `vh` + **`dvh`** override |
| action bar ≤430 | padding fixo | + safe-area-bottom; sticky já existia |
| Variant/KOH overlays | `inset:0` | width/height/max-height vh+dvh; `box-sizing: border-box`; sheet padding-bottom safe-area |

### Fallbacks

Padrão dominante: declarar `100%` **ou** `100vh` primeiro, depois `100dvh` / `NNdvh`.

### Potenciais conflitos (sem corrigir)

Ver §31. Em destaque pós-commit:

- Parent `100dvh` + child Phaser `min(70vh)` + HUD + actions (sem flex repartição).
- Safe-area saiu do `body` mas continua no InGameBar / overlays.
- `SuecaPhaserRenderer.css` ainda usa **`vh` sem `dvh`** no host base.
- Overlay `100dvh` + padding safe-area agora com `border-box` (melhoria vs possível overflow prévio).

---

## 6. Scroll global

### Quem pode / não pode scrollar

| Camada | Pode acontecer? | Selectors / notas |
|---|---|---|
| **Document (`html`/`body`) scroll** | **DEPENDE** | Sem `overflow: hidden` em `html`/`body`. In-game: `.App--full` / `.app-shell--game` escondem overflow — se cadeia falhar ou conteúdo escapar fixed, document pode scrollar. Shell menus: content scroll interno. |
| **App shell scroll** | **SIM** (menus) / **NÃO** (jogo) | `.app-shell-content { overflow-y: auto }` · `.app-shell--game .app-shell-content { overflow: hidden }` |
| **Game board scroll** | **DEPENDE / tipicamente NÃO** | Board: `overflow-x: hidden` apenas. Sem `overflow-y` explícito. Shell pai `overflow: hidden` corta. Sticky Continuar implica scroll *do ancestral scrollable* — se nenhum ancestral scrolla, sticky não “salva” conteúdo cortado. |
| **Modal scroll** | **SIM** | `.variant-modal--bottom-sheet { overflow-y: auto }`; festa setup lists; `CreditsModal` `overflow-y: auto`; `RulesSheet` `overflow-y: auto`; penalty cards `overflow-y: auto` |
| **Hand horizontal** | **SIM** | `.hand-row--scroll`, `.player-hand-bar--narrow .hand-row` → `overflow-x: auto` |

### `overflow` chave

| Valor | Onde |
|---|---|
| `hidden` | `.App--full`, `.app-shell--game`, game content, `.sueca-phaser-root`, landing-root, vários text-ellipsis |
| `auto` | `.app-shell-content`, sheets, hand rows, credits, rules |
| `scroll` | **Não encontrado** como valor explícito dominante |

---

## 7. Visual viewport / métricas JS

| API | Onde | Para quê | Listener? |
|---|---|---|---|
| `window.visualViewport` | `phaserPremiumLayout.ts` → `resolveOrientationReference` | Classificar portrait/landscape quando canvas encolhe por sheets | **NÃO** — leitura pontual no layout |
| `window.innerWidth` | `resolveOrientationReference`, `useLayoutSnapshot`, `useMobileLayout`, `tableLayout.isMobileDevice` | Breakpoint / orientation ref | **NÃO** resize listener dedicado |
| `window.innerHeight` | `resolveOrientationReference` | Fallback altura | NÃO |
| `screen.width/height` | **Não usado** no código app (só Pixi `app.screen` = canvas lógico) | — | — |
| `document.documentElement.clientHeight/Width` | **Não encontrado** | — | — |
| `parent.clientWidth/Height` | Phaser init + Pixi resize | Tamanho do host | Pixi: **ResizeObserver**; Phaser: Scale.RESIZE (interno) |
| `devicePixelRatio` | **Pixi** `SuecaPixiStage` resolution | Densidade | NÃO em Phaser config |

**Não existem** listeners de `visualViewport` resize/scroll nem `orientationchange` no frontend React/TS (exceto Phaser `scale.on('resize')` e Pixi `ResizeObserver`).

`useLayoutSnapshot` **congela** `isNarrow` / `isMobileLayout` no mount (`useMemo([])`) — sem update em rotação.

---

## 8. Resize / orientation listeners

| Ficheiro | Evento / API | Lifecycle | Cleanup | Finalidade |
|---|---|---|---|---|
| `SuecaPhaserRenderer.tsx` | Phaser `Scale.RESIZE` (implícito ao parent) | mount Game | `game.destroy` | Canvas segue host |
| `SuecaTableScene.ts` | `this.scale.on('resize', handleResize)` | `create` | destroy scene/game | Relayout felt/hand/trick |
| `SuecaPixiStage.ts` | `ResizeObserver` no parent | mount | disconnect | Pixi resize (archive path) |
| `useShellBrowserBack.ts` | `popstate` | shell | remove | Navegação back |
| `App.tsx` | `click` | always | remove | SFX UI |
| `ConfirmDialog` / `InGameBar` tests | `keydown` Escape | open | remove | A11y |
| `bindCapacitorBackButton` | Capacitor `App` backButton | shell | remove | Android hardware back |
| — | `orientationchange` | — | — | **AUSENTE** |
| — | `screen.orientation` | — | — | **AUSENTE** |
| — | `matchMedia` listeners | — | — | **AUSENTE** (só CSS `@media`) |
| — | `visualViewport` listeners | — | — | **AUSENTE** |

---

## 9. Orientação Android

### AndroidManifest.xml (local)

`MainActivity`:

- `android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"`
- **Sem** `android:screenOrientation` → orientação **não fixa** no manifesto (sistema permite rotação).

### MainActivity.java

```java
public class MainActivity extends BridgeActivity {}
```

Sem overrides de orientation/fullscreen/insets.

### Capacitor

Sem plugin/config de orientation no `capacitor.config.ts`.

### Produto vs config

- Documentação Phaser (`PHASER_ANDROID_VALIDATION_2026.md`, `phaserPremiumLayout`) descreve **portrait phone como design primário**; landscape “sanity-only”.
- Manifest **não** força portrait → APK pode rodar landscape; browser também.
- Diferença APK vs browser: browser tem chrome UI; APK não — mas ambos podem rodar em landscape se o OS permitir.

---

## 10. Capacitor

### `frontend/capacitor.config.ts` (fonte)

```ts
{
  appId: 'com.suecao.cardgames',
  appName: 'SUECÂO',
  webDir: 'dist',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https' }
}
```

| Campo | Valor |
|---|---|
| webDir | `dist` (pós-Vite; docs antigas citavam `build`) |
| appId | `com.suecao.cardgames` |
| appName | `SUECÂO` |
| androidScheme | `https` |
| cleartext | não habilitado explicitamente; `allowMixedContent: false` |
| background colour | **não** no capacitor config |
| statusBar / splash / plugins UI | **não** configurados no TS config |

### Scripts npm (`package.json`)

- `build:android`, `cap:sync`, `cap:sync:android`, `cap:open:android`, `release:android`

### Plugins instalados (dependency + sync local)

| Package | Em `package.json` | Em `capacitor.plugins.json` local | Uso no código TS |
|---|---|---|---|
| `@capacitor/core` / `android` / `cli` | sim | — | sync |
| `@capacitor/app` | sim | sim | back button (`useShellBrowserBack`) |
| `@capacitor/preferences` | sim | sim | **não** wired (prefs via localStorage; comentário “extend”) |
| `@capacitor/splash-screen` | sim | sim | **sem chamadas TS** encontradas |
| `@capacitor/status-bar` | sim | sim | **sem import/uso TS** encontrados |

---

## 11. Status bar Android

| Pergunta | Resposta |
|---|---|
| Pacote instalado? | **SIM** (`@capacitor/status-bar` ^6.0.2) |
| Usado no código app? | **NÃO** (zero `StatusBar.*` / imports) |
| `setOverlaysWebView` / hide / show / style? | **Não invocados** |
| Status bar sobrepõe WebView? | **UNKNOWN — requires runtime check** ( Cap 6 default + theme AppCompat; sem edge-to-edge explícito no projecto) |
| WebView começa abaixo ou por trás? | **UNKNOWN — requires runtime check** |

Theme splash: `AppTheme.NoActionBarLaunch` parent `Theme.SplashScreen`.  
Runtime theme actividade: `AppTheme.NoActionBar` (NoActionBar DayNight).

---

## 12. Navigation bar Android / edge-to-edge

Pesquisa no projecto Android local + frontend:

| API / flag | Presente? |
|---|---|
| `WindowCompat` / `setDecorFitsSystemWindows` | **NÃO** |
| `WindowInsets` handling custom | **NÃO** |
| `SYSTEM_UI_FLAG_FULLSCREEN` / `IMMERSIVE_STICKY` | **NÃO** |
| `hideNavigation` | **NÃO** |
| Edge-to-edge APIs modernas | **NÃO** |

Insets CSS (`safe-area-inset-*`) existem no web layer; eficácia no WebView Android depende de `viewport-fit=cover` + comportamento do WebView — **UNKNOWN em runtime**.

---

## 13. Fullscreen

| Modo | Existe? | Evidência |
|---|---|---|
| Browser `requestFullscreen` / `exitFullscreen` / `fullscreenElement` / webkit* | **NÃO** | Sem matches no código |
| Android native fullscreen flags | **NÃO** | Manifest/MainActivity limpos |
| Immersive mode | **NÃO** | — |
| Capacitor fullscreen plugin | **NÃO** | — |
| Edge-to-edge | **INDETERMINADO / efectivamente não configurado** | Sem código; comportamento default WebView |

---

## 14. Game board

### DOM structure (jogo)

```text
.game-board[.game-board--team-table?][.game-board--hearts-pass|festa-sheet|spades-bid…]
  InGameBar
  ScoreStrip → .top-strip(--teams|--unified)
  [Phaser] .game-table-zone > .sueca-phaser-root > canvas-host > canvas
  [DOM]    TableSurface + LocalPlayerDock + PlayerHand
  [Spades] SpadesBidMinibox (.spades-bid-dock)
  GameActions (.action-buttons-bar--slot)
  modals/overlays (portaled via React tree, fixed CSS)
```

### CSS sizing

- Preenche shell: `flex: 1 1 auto; min-height: 0; height: 100%; max-height: 100%`.
- `max-width: 100vw`; `overflow-x: hidden`; `overscroll-behavior: none`.
- Flex column **só** com `.game-board--team-table` (mesa cresce; top-strip `flex-shrink: 0`).
- Path Phaser default: board **não** é flex column → filhos em **block flow**; canvas tem altura `vh` fixa relativa ao viewport, não ao espaço residual.

### Divisão da altura disponível (modelo actual)

| Região | Como obtém altura |
|---|---|
| InGameBar | Conteúdo + safe-area-top |
| HUD `.top-strip` | Conteúdo / grid; compacta em ≤430px |
| Mesa Phaser | **`min(70vh, 680px)`** mobile (CSS host); lógica interna zonas + `bottomChromePx` quando sheets |
| Mesa DOM | `--table-size` + seats absolute |
| Mão | Phaser: **dentro do canvas** (zona `hand`). DOM: `.player-hand-bar` no flow |
| Actions | `min-height` ~60–64px; sticky ≤430px |
| Modals | `position: fixed` fora do fluxo de altura do board |

---

## 15. HUD superior

| Bloco | Altura | flex-shrink | sticky/fixed | Notas |
|---|---|---|---|---|
| `InGameBar` | dinâmica (~padding 8 + safe-area) | N/A (block) | normal flow | `z-index: 100`; ≤360px aperta padding |
| `.top-strip--teams` | padding 6–10px | `0` em team-table | flow | Sueca scores |
| `.top-strip--unified` | padding; compact ≤430 | — | flow | Hearts/King: esconde rules/hint/history em ≤430 |
| Contract / trick / penalties | dentro panel | — | flow; penalties `overflow-y: auto` c/ max-height | Pode crescer verticalmente |

**Pode o topo ser empurrado para fora da viewport?**  
**SIM / DEPENDE:** se a soma vertical exceder o shell e o shell tiver `overflow: hidden`, o **fundo** é tipicamente cortado; se houver scroll de documento, o topo pode sair ao scrollar. Não há `position: sticky` no InGameBar.

---

## 16. Mesa — Phaser vs DOM

### Phaser

| Aspecto | Valor |
|---|---|
| Parent | `.sueca-phaser-canvas-host` (100%×100% do root) |
| CSS root height | Desktop: `min(62vh, 680px)`; mobile ≤768: `min(70vh, 680px)`; landscape curto: `min(70vh, 420px)` |
| min-height | 420 / 360 / 240 conforme MQ |
| Scale mode | **`Phaser.Scale.RESIZE`** |
| autoCenter | **`CENTER_BOTH`** |
| width/height init | `parent.clientWidth/Height` \|\| 640×480 |
| FIT / ENVELOP | **Não usados** |
| devicePixelRatio | **Não** passado na config Phaser |
| CSS canvas | `width/height: 100% !important` |
| Resize | `scale.on('resize')` → relayout |

Aspect modes (`portrait` / `landscape` / `desktop`) via `resolvePremiumAspectMode` + `resolveOrientationReference` (`visualViewport` / `innerWidth`×`innerHeight`).

### DOM

- `.table-layout` / `.table-surface` com CSS vars `--table-size`, seats `position: absolute` (N/E/S/W com offsets negativos).
- Mão e dock **fora** da mesa, no flow.
- Pode comportar-se de forma diferente em viewport baixa: table `overflow: hidden` em ≤430; seats colapsam offsets.

---

## 17. Phaser config (relevante, completa)

De `SuecaPhaserRenderer.tsx`:

```ts
new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: theme.exterior ?? theme.feltDark,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: parent.clientWidth || 640,
    height: parent.clientHeight || 480
  },
  scene: [scene],
  banner: false,
  audio: { noAudio: true }
});
```

**Como calcula no mobile:** o CSS define a caixa do host (`vh`); Phaser RESIZE faz o canvas lógico igual ao client size do host; a scene mapeia zonas (HUD interno Phaser mínimo, seats, trick, hand, `bottomSafe`, `bottomChromePx` se sheet activo). `safeArea` no layout **existe** mas os call sites observados passam só `bottomChromePx` + `orientationReference` (safe = 0).

---

## 18. DOM fallback

| Item | Detalhe |
|---|---|
| Activação | Flag renderer ≠ phaser, ou `PhaserTableErrorBoundary` / `onInitError` |
| Estrutura | `TableSurface` + `LocalPlayerDock` + `PlayerHand` |
| Wrappers | Pode usar `.game-table-zone` em team-table |
| Sizing | CSS vars + absolute seats; **sem** `Scale.RESIZE` |
| Diferença viewport pequena | Hand no documento aumenta altura total; Phaser hand não. Overlap mesa/mão via seats `bottom: -Npx` e hand margins |

---

## 19. Mão do jogador (local)

### Path Phaser (principal quando activo)

- Desenhada **dentro do canvas** (`layoutLocalHandPositions` / `handY`).
- Overlap mesa: **intencional / parcial** (fan sobre felt; `handPresenceScale` 1.06).
- Não aumenta altura do documento.

### Path DOM (`PlayerHand`)

| Pergunta | Resposta |
|---|---|
| Componente | `PlayerHand` → `.player-hand-bar` |
| Parte do normal document flow? | **SIM** |
| absolute/fixed no bar? | **NÃO** (bar é flex flow; cartas individuais podem ser `position: absolute` no layout fan clássico; narrow usa relative + scroll) |
| transform negativo no bar? | **NÃO** no bar; pass selected cards: `translateY(-8px)` |
| Sobreposição mesa intencional? | **PARCIAL** (seats south `bottom: -28px`… e margins; pass/festa elevam z-index e margins `12dvh`/`28dvh`) |
| Pode aumentar altura do documento? | **SIM** |

---

## 20. Opponent hands

| Path | Topo / Esq / Dir |
|---|---|
| Phaser | Cartas-back **dentro do canvas** (`redrawOpponents`) — **não** afectam layout CSS |
| DOM | `.player-seat.player-north/east/west` absolute no `.table-layout` — afectam bounding visual; podem “sair” da caixa com offsets negativos (`left/right: -38px`, etc.) |

---

## 21. Controlos inferiores

| Controlo | Position | bottom / safe-area | height | z-index | Fora do viewport? |
|---|---|---|---|---|---|
| Continuar / `GameActions` | flow; **sticky bottom** @ ≤430px | padding safe-area @ ≤430 | min ~60–64px | 40 sticky | **SIM possível** se shell corta e não há scroll ancestral |
| Spades bid dock | flow sob canvas | margin-bottom safe-area | compacto | — | POSSIBLE |
| Hearts pass sheet | fixed overlay bottom | overlay insets + sheet padding | max 16vh (22vh landscape curto) | 2000 | Mitigado fixed; hand band CSS margin |
| King festa / auction sheets | fixed bottom-sheet | idem | max 28–45dvh / festa 30dvh | 2000 | Mitigado; Phaser `bottomChromePx` |
| KOH overlay | fixed full | padding-bottom safe | 100dvh | 1200 | — |
| BottomNav | **só shell**, fixed | safe-area-bottom | ~44–56px | — | N/A in-game (não montada) |

---

## 22. Modals / sheets

| Tipo | CSS base | fixed? | max-height | overflow | safe-area | scroll interno |
|---|---|---|---|---|---|---|
| ConfirmDialog | `.variant-modal-overlay` + `.variant-modal` | SIM | conteúdo | — | overlay padding | pouco |
| King auction / festa | bottom-sheet variants | SIM | 28–45dvh | auto | sim | SIM |
| auction_continue / negotiation | mesmos overlays Variant | SIM | conforme modal | auto | sim | SIM |
| Hearts pass | `--hearts-pass` compact | SIM | 16vh (22vh LQ) | — | overlay transparente | limitado |
| Spades bid | dock in-flow + classes | misto | — | — | margin | — |
| Score / KingScoreModal | overlay + wide | SIM | — | — | overlay | — |
| Round end | `.modal-overlay` / round-end | fixed | — | — | ver GameBoard.css | — |
| EarlyRoundEnd | variant overlay | SIM | — | — | sim | — |
| RulesSheet | próprio CSS | fixed | 70vh | auto | all insets | SIM |
| CreditsModal | próprio | fixed | 90–95vh | auto | — | SIM |
| KOH | `.king-koh-overlay` | SIM | 100dvh | table areas | bottom | parcial |

---

## 23. Breakpoints (inventário)

| breakpoint | ficheiro | selector / objectivo |
|---|---|---|
| `max-width: 1024px` | `GameBoard.css` | compactação intermédia table/HUD |
| `max-width: 768px` | `GameBoard.css`, Phaser/Pixi CSS, Credits, GameSelector, Pente, Landing min 769 | mobile heights canvas; UI compact |
| `max-width: 480px` | `GameBoard.css`, Credits | phones médios |
| **`max-width: 430px`** | `GameBoard.css`, Landing | **narrow primary**; sticky Continuar; HUD King/Hearts strip |
| **`max-width: 360px`** | InGameBar, BottomNav, HomeDashboard | densificar chrome |
| `min-width: 769px` | Landing | desktop landing |
| `orientation: landscape` + `max-height: 500px` | GameBoard, Phaser CSS | sheets + canvas curto |
| `hover: hover` and `pointer: fine` | GameBoard hand | hover styles desktop |
| `prefers-reduced-motion` | GameBoard | animações |
| JS `NARROW_BREAKPOINT = 430` | `useLayoutSnapshot.ts` | hand scroll layout freeze |
| JS `innerWidth <= 768` | `isMobileDevice` | mobile UA or width |

Não há breakpoints dedicados 390 / 414 além do agrupamento ≤430 / ≤480.

---

## 24. Height-based media queries

| Query | Ficheiro | Efeito |
|---|---|---|
| `(orientation: landscape) and (max-height: 500px)` | `GameBoard.css` | canvas margin/height reduzidos; Hearts pass max-height 22vh; overlay transparente |
| idem | `SuecaPhaserRenderer.css` | `min-height: 240px`; `height: min(70vh, 420px)` |
| `max-height` **em propriedades** (não MQ) | Variant sheets, Credits `90vh`, Rules `70vh`, Landing clamps | limitar sheets |

Poucas MQ baseadas só em altura; a maioria usa `vh`/`dvh` em propriedades.

---

## 25. Font / UI scaling

| Tópico | Estado |
|---|---|
| `html` font-size root custom | **Não** — browser default ~16px |
| rem em estrutura shell | Usado em tipografia/modals; alturas estruturais maioritariamente **px / vh / dvh / %** |
| Zoom browser | Pode afectar layout (px + rem); sem `text-size-adjust` auditado |
| Touch targets | `--sueca-touch-min: 48px` (design-tokens); botões Continuar `min-height: 48px` |
| Inputs ≥16px | Selects Spades / UI usam rem/em; **não** há auditoria exaustiva anti-zoom-iOS em todos os inputs |

---

## 26. Device pixel ratio

| Path | Uso |
|---|---|
| Pixi | `resolution: devicePixelRatio \|\| 1` |
| Phaser | **Não** configura `resolution` / `zoom`; canvas CSS 100%; nitidez depende do default Phaser AUTO + CSS stretch |
| Impacto | Em ecrãs densos, Phaser pode parecer menos nítido que Pixi; sizing layout é em CSS pixels do host |

---

## 27. Android WebView (projecto local)

| Item | Valor |
|---|---|
| minSdk | **22** (`variables.gradle`) |
| compileSdk / targetSdk | **34** |
| MainActivity | `BridgeActivity` vazio |
| WebView layout | `match_parent` × `match_parent` em `CoordinatorLayout` |
| WebView settings custom | **Nenhum** no app code |
| edge-to-edge | **Não configurado** |
| status/navigation | Default theme; StatusBar plugin presente **sem uso** |
| display cutout | **UNKNOWN** |
| orientation | Livre (sem `screenOrientation`) |
| fullscreen | Não |
| `android/` no git | **gitignored** |

Valores que dependem de OEM/Android version: **UNKNOWN — requires runtime check**.

---

## 28. Chrome Android browser (secção separada)

O código **enfrenta** (não “é igual ao Capacitor”):

| Fenómeno | Relevância no código actual |
|---|---|
| Chrome top UI / bottom toolbar | Motivou `100dvh` + lock shell |
| Dynamic viewport | `dvh` cascade; Phaser host ainda misturado `vh` |
| `visualViewport` | Só orientation classifier Phaser |
| Address-bar show/hide | Sem listener; layout CSS pode desactualizar vs JS frozen snapshot |
| Document scroll | Mitigado por `overflow: hidden` in-game; ainda DEPENDE |
| Safe-area | `viewport-fit=cover`; insets no Chrome Android frequentemente **0** para browser chrome (≠ notch) |

---

## 29. Android Capacitor / WebView (secção separada)

| Pergunta | Resposta actual |
|---|---|
| Existe browser chrome? | **NÃO** |
| Existe status bar Android? | **Provavelmente SIM** (sistema); overlay/comportamento **UNKNOWN** |
| Existe navigation bar Android? | **Provavelmente SIM** (3-button ou gesture); **UNKNOWN** insets efectivos |
| WebView ocupa quê? | `match_parent` na activity; sem flags immersive |
| Safe areas CSS? | Declaradas no web; efectivas **UNKNOWN** sem notch + runtime |
| Fullscreen? | **NÃO** |
| Immersive mode? | **NÃO** |

Validação histórica (emulator API 34, doc 2026-09-07): Phaser jogável; **device real não validado** para viewport/safe-area.

---

## 30. Histórico de tentativas (git, amostragem)

| Commit | Intenção inferida | Efeito actual |
|---|---|---|
| `a6e3ed9` | Alinhar shell/board/modals ao dynamic viewport; evitar double-count safe-area | Cascata `100dvh`; board fill; overlays dvh |
| `4e0667f` | CRA → Vite | `webDir: dist`; toolchain |
| `9859d01` / `20d6143` / `41968ee` | Premium Phaser layout + Android stabilize | `70vh` host; RESIZE; orientationReference |
| `db076e9` | Doc validação Android emulator | Baseline Cap 6 / API 34 |
| `1e9c511` / `4cb6e5b` | Layout contextual / Continuar | sticky Continuar, slots |
| `46e4742` / `f4e7710` | Mobile hand / M1 tokens | narrow 430, touch 48 |
| Mais antigos (`217db2a`, etc.) | Redesign mesa | Base absolute seats / table vars |

---

## 31. Conflitos potenciais

| Conflito | Classificação |
|---|---|
| Parent `100dvh` + child **antes** `min-height: 100dvh` (pré-a6e3ed9) | **NOT PRESENT** agora no board (removido) |
| Parent `100dvh` + **Phaser `70vh` + HUD + actions** sem flex residual | **CONFIRMED** (arquitectura actual) |
| Body safe-area padding + child 100dvh | **NOT PRESENT** (removido do body) |
| Shell game sem safe-area + InGameBar com safe-area-top | **CONFIRMED** (intencional split) |
| Overlay `100dvh` + padding sem border-box | **NOT PRESENT** pós-fix (agora border-box) |
| Fixed modal + document scroll | **POSSIBLE** |
| Absolute/DOM seats + flex board | **POSSIBLE** (team-table flex vs default block) |
| Canvas aspect (`vh`) vs available height residual | **CONFIRMED** |
| Modal bottom + safe-area | **POSSIBLE** (mitigado; insets 0 no Chrome) |
| `vh` host Phaser vs `dvh` shell | **CONFIRMED** inconsistência de unidades |
| Sticky Continuar sem ancestral scroll | **POSSIBLE** (sticky ineficaz se overflow hidden no pai) |
| `useLayoutSnapshot` frozen vs rotate | **CONFIRMED** (sem listener) |
| StatusBar plugin instalado sem uso | **CONFIRMED** (dead capability) |

---

## 32. Screen geometry model

### Capacitor Android (modelo configurado + incertezas)

```text
Physical screen
├── Android status bar: UNKNOWN (default system; plugin unused)
├── WebView viewport (match_parent)
│   ├── html/body/#root/.App.app-shell--game  ≈ 100dvh (CSS)
│   │   └── .game-board (height 100%)
│   │       ├── InGameBar (+ safe-area-top CSS)
│   │       ├── HUD .top-strip
│   │       ├── Phaser host ≈ 70vh (CSS) → canvas RESIZE
│   │       │     ├── felt / opponents / trick
│   │       │     └── local hand (in-canvas)
│   │       └── GameActions (± sticky)
│   └── fixed modals (100dvh overlays)
└── Android navigation bar: UNKNOWN (may reduce WebView or overlay)
```

### Chrome Android browser

```text
Physical screen
├── Chrome top UI (URL / status)
├── Layout / visual viewport (dynamic; dvh targets visual)
│   └── same React tree as above
│       └── risk: 70vh host sized to layout viewport semantics ≠ residual UI
└── Chrome bottom UI (toolbar / gestures)
```

---

## 33. Medidas runtime necessárias (futuro — NÃO implementar agora)

Medir em **Chrome Android** e **APK Capacitor** (portrait, toolbars expandidas/colapsadas, com/sem notch, 3-button vs gesture):

1. `screen.width` / `screen.height`
2. `window.innerWidth` / `innerHeight`
3. `visualViewport.width` / `height` / `offsetTop` / `scale`
4. `document.documentElement.clientHeight` / `scrollHeight`
5. `document.body.scrollHeight` / `clientHeight`
6. `#root`, `.App`, `.app-shell--game`, `.game-board` → `getBoundingClientRect()` + computed height/overflow
7. `.in-game-bar`, `.top-strip`, `.sueca-phaser-root`, `canvas`, `.action-buttons-bar` rects
8. Soma vertical dos blocos vs `visualViewport.height`
9. Computed `padding` de safe-area nos selectors chave (efectivo px)
10. `devicePixelRatio`
11. Phaser `scale.width/height` + `aspect` mode
12. `window.scrollY` após Continuar / auction sheet
13. (Android) se WebView está edge-to-edge: comparar rect WebView vs `DisplayCutout` / insets nativos

---

## 34. Riscos actuais

### Android app

| Risco | Severidade |
|---|---|
| Viewport/safe-area nunca medidos em device real para shell pós-`a6e3ed9` | **HIGH** |
| StatusBar/NavBar defaults desconhecidos; plugin StatusBar morto | **MEDIUM** |
| Orientação livre vs design portrait-first | **MEDIUM** |
| Phaser `vh` vs WebView height estável | **LOW–MEDIUM** |
| `android/` gitignored → drift entre máquinas | **MEDIUM** |

### Chrome mobile

| Risco | Severidade |
|---|---|
| Soma HUD+70vh+actions > visual viewport → clip/scroll | **HIGH** |
| Inconsistência `vh`/`dvh` | **HIGH** |
| Sticky Continuar sem scroll container | **MEDIUM** |
| `visualViewport` só em classifier, sem relayout CSS | **MEDIUM** |
| Safe-area 0 ≠ browser chrome | **MEDIUM** |

### Desktop web

| Risco | Severidade |
|---|---|
| Overflow hidden landing/game pode cortar zoom extremo | **LOW** |
| Hover-only affordances | **LOW** |

---

## 35. Factos vs incertezas

### Confirmado pelo código

- Cascata `100dvh` em html/body/#root/App/shell-game pós-`a6e3ed9`.
- Board já não usa `min-height: 100dvh`.
- `viewport-fit=cover` presente.
- Safe-area removida do `body`; presente em shell menus, InGameBar, BottomNav, overlays, sticky actions.
- Phaser: `Scale.RESIZE` + `CENTER_BOTH`; mão in-canvas; oponentes in-canvas.
- DOM: mão no flow; seats absolute.
- Sem fullscreen / immersive / WindowInsets custom.
- `@capacitor/status-bar` instalado, **não usado**.
- Sem listeners `visualViewport` / `orientationchange`.
- Layout snapshot congelado no start da sessão.
- `frontend/android` gitignored mas auditable localmente (API 34, min 22).

### Não determinável sem dispositivo/runtime

- Se status bar sobrepõe WebView.
- Insets reais notch / gesture / 3-button.
- Se `100dvh` no WebView Capacitor = altura útil estável.
- Se Continuar fica acessível em Chrome com barras visíveis em todos os devices.
- Overlap exacto mão/mesa em px.
- DPR / nitidez Phaser percebida.
- Comportamento cutout Android 15+ edge-to-edge defaults.
- Diferença layout viewport vs visual viewport em OEM WebViews.

---

## 36. Sem soluções

Este documento **não** recomenda fullscreen, immersive, edge-to-edge, plugins, CSS futuros, nem rearranjo de layout.  
Serve como inventário para investigação externa (ex.: Perplexity) e desenho posterior de 2–3 arquitecturas candidatas.

---

## 37. Anexos

### A. Ficheiros relevantes

**Viewport / shell / CSS global**

- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/src/App.css`
- `frontend/src/App.tsx`
- `frontend/src/styles/app-shell.css`
- `frontend/src/styles/shell-screens.css`
- `frontend/src/styles/design-tokens.css`
- `frontend/src/styles/sueca-buttons.css`
- `frontend/src/styles/dobo-ui.css`
- `frontend/src/components/LandingPage.css`

**Game / HUD / hand / actions**

- `frontend/src/components/GameBoard.tsx`
- `frontend/src/components/GameBoard.css`
- `frontend/src/components/PlayerHand.tsx`
- `frontend/src/components/GameActions.tsx`
- `frontend/src/components/navigation/InGameBar.tsx`
- `frontend/src/components/navigation/InGameBar.css`
- `frontend/src/components/navigation/BottomNav.css`
- `frontend/src/components/table/ScoreStrip.tsx`
- `frontend/src/components/table/UnifiedGameStatusPanel.tsx`
- `frontend/src/hooks/useLayoutSnapshot.ts`
- `frontend/src/hooks/useMobileLayout.ts`
- `frontend/src/utils/tableLayout.ts`

**Phaser / Pixi**

- `frontend/src/renderers/phaser/SuecaPhaserRenderer.tsx`
- `frontend/src/renderers/phaser/SuecaPhaserRenderer.css`
- `frontend/src/renderers/phaser/SuecaTableScene.ts`
- `frontend/src/renderers/phaser/phaserPremiumLayout.ts`
- `frontend/src/renderers/phaser/phaserTableLayout.ts`
- `frontend/src/renderers/phaser/mapTableModelToPhaserView.ts`
- `frontend/src/renderers/pixi/SuecaPixiStage.ts`
- `frontend/src/renderers/pixi/SuecaPixiRenderer.css`

**Modals**

- `frontend/src/components/VariantModals.css`
- `frontend/src/components/common/ConfirmDialog.tsx`
- `frontend/src/components/RulesSheet.css`
- `frontend/src/components/CreditsModal.css`
- (+ King/Hearts/Spades/RoundEnd modal TSX)

**Capacitor / Android (local)**

- `frontend/capacitor.config.ts`
- `frontend/package.json`
- `frontend/android/app/src/main/AndroidManifest.xml`
- `frontend/android/app/src/main/java/com/suecao/cardgames/MainActivity.java`
- `frontend/android/app/src/main/res/values/styles.xml`
- `frontend/android/app/src/main/res/layout/activity_main.xml`
- `frontend/android/variables.gradle`
- `frontend/android/app/build.gradle`
- `frontend/android/capacitor.settings.gradle`
- `frontend/android/app/src/main/assets/capacitor.config.json`
- `frontend/android/app/src/main/assets/capacitor.plugins.json`
- `frontend/.gitignore` (`/android`)

**Docs relacionadas**

- `docs/plan/PHASER_ANDROID_VALIDATION_2026.md`
- `docs/plan/DEPENDENCY_TOOLCHAIN_AUDIT_2026.md`

### B. Selectors CSS chave

`.App`, `.App--full`, `.app-shell`, `.app-shell--game`, `.app-shell-content`, `#root`, `.game-board`, `.game-board--team-table`, `.game-board--hearts-pass`, `.game-board--festa-sheet`, `.game-board--spades-bid`, `.in-game-bar`, `.top-strip`, `.top-strip--unified`, `.sueca-phaser-root`, `.sueca-phaser-canvas-host`, `.player-hand-bar`, `.hand-row--scroll`, `.action-buttons-bar`, `.variant-modal-overlay`, `.variant-modal--bottom-sheet`, `.king-koh-overlay`, `.bottom-nav`, `.landing-root`, `.modal-overlay`

### C. APIs usadas

| API | Uso |
|---|---|
| `visualViewport` | orientation reference Phaser |
| `innerWidth` / `innerHeight` | breakpoints / orientation |
| `ResizeObserver` | Pixi only |
| Phaser `scale.resize` | canvas relayout |
| Capacitor `App` backButton | shell |
| Fullscreen APIs | **não** |
| `screen.orientation` | **não** |
| StatusBar / SplashScreen JS | **não** (plugins sync only) |

### D. Config Android relevante (literal resumido)

- `applicationId` / namespace: `com.suecao.cardgames`
- `minSdk 22`, `targetSdk 34`, `compileSdk 34`
- Activity: `singleTask`, `configChanges` inclui orientation/screenSize, **sem** `screenOrientation`
- Theme launch: `AppTheme.NoActionBarLaunch` (SplashScreen)
- Permission: `INTERNET`
- Capacitor: `androidScheme: https`, `webDir: dist`, `allowMixedContent: false`
- Plugins sync: App, Preferences, SplashScreen, StatusBar

### E. Variáveis de viewport (tabela)

| Token / unidade | Papel |
|---|---|
| `100%` | Fallback cadeia altura |
| `100vh` | Fallback overlays; legado |
| `100dvh` | Lock visual viewport shell/root |
| `NNvh` / `NNdvh` | Canvas host, sheets, margins pass/festa |
| `100vw` | `max-width` board |
| `env(safe-area-inset-*)` | Notch / home indicator (quando não-zero) |
| `--sueca-bottom-nav-height` | Padding shell content |
| `--sueca-touch-min` | 48px touch |
| `--table-size`, `--card-*`, `--hand-row-h` | DOM table metrics |
| Phaser `bottomChromePx` | Reserva in-canvas p/ sheets |
| Phaser `safeArea` (API) | Reservado; default 0 nos call sites |

---

## Verificação final (checklist auditoria)

| Check | Estado |
|---|---|
| Pesquisa `vh` / `dvh` / `svh` / `lvh` | Feita — `svh`/`lvh` ausentes |
| `visualViewport` / `innerHeight` / `screen.` | Feita |
| `safe-area` / `overflow` / `fullscreen` / `orientation` | Feita |
| `StatusBar` / `WindowInsets` | Feita — StatusBar unused; WindowInsets ausente |
| Android project local | Audited |
| Capacitor config | Audited |
| Phaser config | Audited |
| CSS global / GameBoard / hand / HUD / modals | Audited |
| Alterações de código de produto | **ZERO** (apenas este `.md`) |

---

*Fim do inventário SCREEN-VIEWPORT-AUDIT-01.*
