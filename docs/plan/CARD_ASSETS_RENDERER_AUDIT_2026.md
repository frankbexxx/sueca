# Card assets + renderer audit · 2026

**Data:** 2026-09-11  
**Scope:** READ-ONLY inventário antes de UX-P3  
**Root:** `E:\SUECAO`  
**Constraint:** este ficheiro é a **única** alteração permitida nesta auditoria (sem refactor, sem deletes, sem commit/push).

**Baseline visual:** phone ~390×844 (também 360×800 / 414×896 nos docs).  
**Renderer default:** Phaser (`sueca` / `spades` / `hearts` / `king`); DOM via `?renderer=dom` ou MP / erro Phaser.

---

## 0. Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| Faces actuais servem para UX premium? | **SIM COM LIMITAÇÕES** |
| Podemos trocar só a costa? | **SIM** (esforço **baixo**) |
| Atlas coupling? | **NÃO** — ficheiros individuais |
| Assets duplicados / redundantes? | **3 grupos** (~122 ficheiros de imagem fora do hot path + 1 back não usado) |
| Loaders redundantes? | **1** stack activo-duplicado (Pixi archive ‖ Phaser) |
| Código morto confirmado? | **3** símbolos TS + pack `cards1` sem refs |
| CSS morto confirmado? | **8** famílias de selectors em `GameBoard.css` |
| Pixi removível no futuro? | **SIM** |
| DOM fallback isolado? | **SIM** (com ressalvas) |
| Limpar antes de UX-P3? | **Não obrigatório** → **UX-P3 PODE AVANÇAR PRIMEIRO** |

---

## 1. Inventário de cartas

### 1.1 Packs no disco (`frontend/public/assets/`)

| Pack | Path | Ficheiros | Dimensões | Formato | Tamanho | Origem documentada | Uso runtime |
|------|------|-----------|-----------|---------|---------|-------------------|-------------|
| **cards2 (activo)** | `frontend/public/assets/cards2/` | 54 | 533×764 | PNG | **~2.86 MB** | Hazmat Hand Drawn (trial) — `docs/ASSETS.md` | **ACTIVE** DOM + Phaser + Pixi-archive |
| **cards-pack-import/hazmat** | `…/cards-pack-import/hazmat/` | 54 | (iguais) | PNG | **~2.86 MB** | Staging Hazmat (`tools/stage-hazmat.mjs`) | **STAGING ONLY** — byte-identical a `cards2` (54/54 MD5 match amostrado completo) |
| **cards1 (legado)** | `frontend/public/assets/cards1/` | 67 | 500×726 | PNG | **~4.72 MB** | Pack antigo / baralho 52 + variantes `*2` + jokers | **UNUSED** — zero refs de código a `/assets/cards1` |
| UI public | `frontend/public/assets/ui/` | — | — | — | vazio / irrelevante | — | n/a |
| UI bundled | `frontend/src/assets/ui/dobo/` | (DOBO) | — | — | — | StartMenu — `docs/ASSETS.md` | menus, não cartas de mesa |

**Não encontrado:** atlases, spritesheets, WebP/SVG de cartas em `public/assets`, fonts exclusivas de carta, TexturePacker JSON.

### 1.2 Inventário `cards2` (activo)

Convenção: `{Rank}_of_{Suit}.png` Title_Case + `card_back.png` + `card_back_red.png`.  
URL builder: `frontend/src/constants/cardAssets.ts` → `CARD_ASSETS_DIR = '/assets/cards2'`.

| Item | Path | Dim | Formato | ~KB | DOM | Phaser | Pixi archive | Actual | Notas |
|------|------|-----|---------|-----|-----|--------|--------------|--------|-------|
| 52 faces (2–10,J,Q,K,A × 4) | `cards2/*_of_*.png` | 533×764 | PNG | 24–97 | SIM | SIM | SIM | **ACTIVE** | Sueca usa subset 40; 8/9 presentes p/ Spades/Hearts/King |
| Costa azul | `cards2/card_back.png` | 533×764 | PNG | 84.7 | SIM | SIM | SIM | **ACTIVE** | = Hazmat `Back_Blue.png` |
| Costa vermelha | `cards2/card_back_red.png` | 533×764 | PNG | 79.3 | NÃO | NÃO | NÃO | **UNUSED** | `CARD_BACK_RED_PATH` exportado; **sem imports** — “future theme / IAP” |

**Consumidores de faces:**

- DOM: `PlayerHand`, `TrickArea`, `GameInfo` / `UnifiedGameStatusPanel` (trump thumbs), `KingKohRevealModal`
- Phaser: `SuecaTableScene.ensureTextures` → `load.image(key, getCardImage(card))`
- Pixi archive: `SuecaPixiStage` (mesmo URL resolver)

**Consumidores de costa:**

- DOM: `PlayerSeats` (`hand-back-stack` → `CARD_BACK_PATH`)
- Phaser: `preload()` → key `card-back`
- Pixi: alias `sueca-pixi-card-back`

### 1.3 Inventário `cards1` (não usado)

- 52 faces lowercase (`ace_of_clubs.png`, …) @ 500×726  
- 12+ variantes face “art” (`jack_of_*2`, `queen_of_*2`, `king_of_*2`, `ace_of_spades2`) — ficheiros grandes (~190–278 KB)  
- `black_joker.png`, `red_joker.png`  
- **Sem** `card_back*` no pack  
- **Estado:** DEAD asset pack (histórico / archive de disco)

### 1.4 Staging `cards-pack-import`

- `.gitkeep` + `hazmat/*` (nomes curtos `1c.png`…`13s.png`, `Back_Blue.png`, `Back_Red.png`)  
- Pipeline: `stage-hazmat.mjs` → `map-card-pack.mjs` → `cards2`  
- **Estado:** duplicado exacto do pack activo; útil para re-import, **não** servido pela app

### 1.5 Fonts / icons de cartas

- Phaser trump/seat text: `Segoe UI, system-ui` em `SuecaTableScene` (não asset de carta)  
- Glyphs de naipe via Unicode no banner Phaser / badge React  
- Ícones app: `image/ico/buga_ico_draw/` (Capacitor) — fora do pipeline de mesa

---

## 2. Face das cartas

### Como são renderizadas hoje

1. `GameBoard.getCardImage(card)` → `getCardImagePath(rank, suit)` → URL `/assets/cards2/{Rank}_of_{Suit}.png`
2. **Sem atlas** — 1 ficheiro por carta  
3. Phaser texture key: `face:${rank}_${suit}` (`cardTextureKey` em `mapTableModelToPhaserView.ts`)  
4. Display size via `setDisplaySize(cardWidth, cardHeight)` (layout), **não** scale da textura source

### Resolução e scaling (phone 390×844)

| Métrica | Valor |
|---------|-------|
| Source | 533×764 |
| Layout portrait `cardWidth` | `min(64, max(44, floor(W*0.12)))` → **~46 px** @ 390 |
| `cardHeight` | `round(cardWidth * 1.4)` → **~64 px** |
| Opponent backs | ~55% da mão |
| Scale efectivo source→display | ~**0.086** (533→46) |
| Qualidade esperada | Source ≥512 largura (critério `ASSETS.md`) — **suficiente** para nitidez em phone se filtro linear default Phaser OK; arte hand-drawn pode parecer “busy” / pouco premium a 46 px |

### Trocar faces sem alterar engine?

| Abordagem | Viável? |
|-----------|---------|
| Substituir PNGs em `cards2/` mantendo nomes | **SIM** |
| Mudar `CARD_ASSETS_DIR` / `REACT_APP_CARD_EXT` | **SIM** (SVG path existe mas **não há SVGs**) |
| Introduzir atlas | Requer mudança Phaser/Pixi loaders — **não necessário** para swap simples |

### Riscos de “trocar atlas”

- **Não há atlas hoje** — risco N/A  
- Riscos reais de swap de pack: nomes Title_Case; alpha; aspect ~1.43; licença/créditos; peso APK/CDN

### Veredicto faces

**AS FACES ACTUAIS SERVEM PARA UX PREMIUM? → SIM COM LIMITAÇÕES**

Limitações concretas:

1. Pack **Hazmat trial** — look genérico hand-drawn, não identidade Suecão  
2. Em phone a face ocupa ~46×64 — detalhe fino perde-se; percepção “premium” depende mais de **arte + costa + felt** do que de megapixels  
3. `card_back_red` e staging/legado incham o repo sem valor de produto  
4. Sem tratamento de filtro/mipmaps documentado (default Phaser)  
5. Docs ainda falam em trial — compra/licença comercial pode ser obrigatória antes de Store

---

## 3. Costas das cartas

| Versão | Path | Carregada? | Usada em jogo? |
|--------|------|------------|----------------|
| Azul (activa) | `cards2/card_back.png` | SIM | SIM |
| Vermelha | `cards2/card_back_red.png` | NÃO | NÃO (`CARD_BACK_RED_PATH` orphan) |
| Hazmat staging | `…/hazmat/Back_Blue.png` / `Back_Red.png` | NÃO | NÃO (staging) |
| cards1 | — | — | sem back |

**Separação faces/back:** total — ficheiros distintos; Phaser `backKey = 'card-back'` independente de `face:*`.

### PODEMOS TROCAR SÓ A COSTA? → **SIM**

| | |
|--|--|
| Esforço | **baixo** |
| Ficheiros a tocar (mínimo) | `frontend/public/assets/cards2/card_back.png` **ou** `CARD_BACK_PATH` em `cardAssets.ts` |
| Também afectados (mesmo path) | DOM `PlayerSeats`, Phaser `preload`, Pixi archive `SuecaPixiStage` |
| Opcional | ligar `CARD_BACK_RED_PATH` a tema/IAP; senão remover depois |
| Atlas dependency | **nenhuma** |

---

## 4. Phaser texture pipeline

```
preload()          → load.image('card-back', CARD_BACK_PATH)
create()           → felt + trump texts + resize listener
applyModel/sync    → mapTableModelToPhaserView → ensureTextures → redraw*
ensureTextures     → para cada face em hand+trick em falta: load.image(face:key, url)
                   → load.start() async → callback redraw
redrawHand/Trick   → image sprites + setDisplaySize(layout)
redrawOpponents    → sprites com 'card-back'
```

| Tópico | Estado |
|--------|--------|
| Atlas | **não usado** |
| Cache | Phaser `textures.exists(key)` — load-once por key |
| Fallback textura | se back em falta, opponents não desenham backs |
| Fallback renderer | `PhaserTableErrorBoundary` → DOM |
| Resize | `scale.on('resize')` → `syncFromModel(true)` |
| pixelArt / NEAREST | **não** configurado |
| Loaders duplicados (activo) | **um** pipeline Phaser |
| Keys antigas | só `card-back` + `face:rank_suit` — limpas |
| Paths não usados | `CARD_BACK_RED_PATH`; `/assets/cards1`; hazmat staging |
| Residual POC | `rendererFlag.ts` comentário “POC”; globals `__suecaPhaserScene` |

**Helpers duplicados (Phaser ‖ Pixi archive):** `cardTextureKey`, layout builders, model→view mappers — espelho de POC, não dual-load em produção.

---

## 5. DOM / Phaser / Pixi

### DOM — classificação

| Item | Ficheiros | Estado |
|------|-----------|--------|
| Mesa + mão | `TableSurface`, `TrickArea`, `PlayerSeats`, `LocalPlayerDock`, `PlayerHand` | **FALLBACK-ONLY** em solo Phaser-default; **ACTIVE** se `?renderer=dom`, MP, ou falha Phaser |
| CSS mesa/mão | `GameBoard.css` (hand, seats, trick-from-*, etc.) | **FALLBACK + partilhado** (HUD/modais ainda React) |
| Glue | `mapTableModelToDomProps.ts` | ACTIVE (sempre calculado; só montado no ramo DOM) |

Não é “morto”: é caminho de suporte explícito.

### Phaser — classificação

| Item | Estado |
|------|--------|
| `SuecaPhaserRenderer` + `SuecaTableScene` | **ACTIVE** default |
| `phaserHandVisual` / `phaserSeatPresentation` / `phaserTableBanner` / `phaserHandInput` | **ACTIVE** (UX-P1/P2 + fix input) |
| `shouldUseSuecaPhaserTable` | **QA/TEST** (+ re-export); produção usa `resolveTableRendererForBrowser` |
| `isPhaserTableRendererRequested` | **LIKELY DEAD** (só definição/re-export; zero call sites) |

### Pixi — o que resta

| Item | Detalhe |
|------|---------|
| Código | `frontend/src/renderers/pixi/*` (~1240 LOC incl. testes) |
| Activação | **só** `?renderer=pixi-archive` ou `REACT_APP_TABLE_RENDERER=pixi-archive` + variante `sueca` |
| `?renderer=pixi` | **ignorado** de propósito |
| Dep | `pixi.js ^8.20.1` em `package.json` (~71 MB em `node_modules`) |
| Bundle | lazy via `GameBoard` Suspense; docs ~185 kB gzip (histórico) |
| CSS | `SuecaPixiRenderer.css` |
| Global QA | `__suecaPixiStage` |
| Remoção futura | **segura** se: apagar pasta + import lazy + dep + testes + docs; risco baixo (archive) |

**Classificação Pixi:** **ARCHIVE / QA** — não DEAD (ainda alcançável).

---

## 6. Flags / debug / selectors

| Flag / hook | Uso actual | Classificação |
|-------------|------------|---------------|
| Default Phaser (sem query) | Produção solo 4 variantes | **necessário produção** |
| `?renderer=dom` | Forçar DOM / regressão | **necessário QA** (+ útil prod smoke) |
| `?renderer=phaser` | Forçar Phaser se env=dom | **necessário QA** |
| `REACT_APP_TABLE_RENDERER` | `dom` \| `phaser` (Pixi-archive tratado noutro flag) | **necessário QA** / CI |
| `?renderer=pixi-archive` / env `pixi-archive` | Sueca archive | **histórico / candidato remover** com Pixi |
| `REACT_APP_CARD_EXT=svg` | Extensão cartas | **histórico** (sem assets SVG) |
| `window.__suecaPhaserScene` | Dev scene handle | **necessário QA** |
| `window.__suecaRenderer` | Dev only (`NODE_ENV=development`) | **necessário QA** |
| `window.__suecaPixiStage` | Archive | **candidato remover** |
| `window.__ci*` / `__ciLab` | Card Intelligence | **necessário QA** (feature-flagged) |
| Branches `archive` / `poc` / `legacy` | Pixi archive; comentários POC; session storage migrate | misto — ver código |

MP: Phaser **não** — força DOM (caller).

---

## 7. CSS dead / redundant

Ficheiro principal: `frontend/src/components/GameBoard.css`.  
Heurística: selector sem `className` / string ref em `src/**/*.{ts,tsx}` (além do próprio CSS).

### DEAD CONFIRMED (famílias)

| Selector / família | Estado | Risco remover | Acção futura |
|--------------------|--------|---------------|--------------|
| `.continue-button` (+ enabled/disabled/hover + media) | DEAD CONFIRMED | baixo | apagar após grep CI |
| `.trump-minimal` (+ `.trump-red` / `.trump-black` + media) | DEAD CONFIRMED | baixo | substituído por `.sueca-trump-badge*` |
| `.modal-trump-section` / `.modal-trump-card` / `.modal-trump-suit` / `.modal-trump-note` | DEAD CONFIRMED | baixo | limpar bloco modal legado |
| `.modal-dealer-info` | DEAD CONFIRMED | baixo | limpar |
| `.modal-score-box` (+ related modal-score-* no mesmo bloco legado) | DEAD CONFIRMED | médio-baixo | confirmar vs outros CSS files antes |
| `.modal-games-content` / `.modal-games-section` | DEAD CONFIRMED | baixo | limpar |
| `.modal-container-medium` | DEAD CONFIRMED | baixo | limpar |
| `.game-scores--teams` | DEAD CONFIRMED | baixo | limpar |

**Contagem chat:** **8** famílias CSS mortas confirmadas.

### ACTIVE / FALLBACK (não apagar com Phaser default)

| Área | Notas |
|------|-------|
| `.player-hand*`, `.hand-back-stack`, `.trick-from-*` | DOM fallback |
| `.sueca-phaser-root` / canvas `pointer-events` (Hearts pass) | Phaser ACTIVE |
| `.sueca-pixi-*` | ARCHIVE |
| `.game-board--hearts-pass`, Spades bid modifiers | ACTIVE |
| HUD / ScoreStrip / pass sheet | ACTIVE React |

Duplicações: media queries repetem `.trump-minimal` / `.continue-button` — dívida, não conflito runtime.

---

## 8. Code dead / redundant

| Item | Ficheiro | Estado | Risco remover | Acção futura |
|------|----------|--------|---------------|--------------|
| `CARD_BACK_RED_PATH` | `constants/cardAssets.ts` | **DEAD CONFIRMED** | baixo | usar ou apagar + asset |
| `isPhaserTableRendererRequested` | `resolveTableRenderer.ts` | **DEAD CONFIRMED** (sem call sites) | baixo | remover export |
| `isPixiTableRendererRequested` | `pixi/rendererFlag.ts` | **DEAD CONFIRMED** (alias deprecated, só re-export) | baixo | remover com Pixi |
| Pack `cards1/*` | `public/assets/cards1/` | **DEAD CONFIRMED** (assets) | baixo (repo/APK size) | apagar ou mover `_archives` |
| `cards-pack-import/hazmat/*` | staging | **LIKELY DEAD** em runtime; útil p/ re-map | baixo se docs/tools actualizados | gitignore ou não ship no APK |
| Tree `renderers/pixi/**` | — | **QA/DEBUG / ARCHIVE** | médio (deps + lazy import) | remoção planeada pós-UX |
| DOM table components | `components/table/*`, `PlayerHand` | **FALLBACK-ONLY** | alto se apagar cedo | manter enquanto `?renderer=dom` |
| `shouldUseSuecaPhaserTable` | resolve + tests | **QA/DEBUG** | baixo | consolidar testes em `resolveTableRenderer` |
| `cardTextureKey` duplicado | phaser + pixi mappers | **ACTIVE + ARCHIVE mirror** | n/a | unificar só se remover Pixi |
| `phaser` vs `pixi` layout twins | `*TableLayout.ts` | idem | n/a | — |

**Contagem chat “código morto confirmado”:** **3** símbolos TS (`CARD_BACK_RED_PATH`, `isPhaserTableRendererRequested`, `isPixiTableRendererRequested`) — pack `cards1` tratado em assets.

Não confiar só no TS: refs manuais + ausência de `className` / imports.

---

## 9. Bundle / dep impact

| Item | Estimativa / nota | Potencial redução |
|------|-------------------|-------------------|
| Phaser | `^3.80.1`; ~138 MB `node_modules`; lazy chunk ~311 kB gzip (doc 2026) | manter |
| Pixi | `^8.20.1`; ~71 MB `node_modules`; lazy ~185 kB gzip | **remover dep** no futuro |
| `cards2` shipped | ~2.86 MB (54 PNG) | WebP/compressão opcional; atlas opcional |
| Duplicados no repo | hazmat ~2.86 MB + cards1 ~4.72 MB | **~7.6 MB** repo/CI checkout; confirmar se Capacitor copia `public/assets/**` → risco APK |
| `card_back_red` | ~79 KB | irrelevante até limpar |

**Não optimizar nesta fase.**

---

## 10. Tabelas finais

### Assets

| Item | Path | Uso | Estado | Acção futura |
|------|------|-----|--------|--------------|
| Faces 52 | `public/assets/cards2/*_of_*.png` | DOM+Phaser(+Pixi) | ACTIVE | trocar pack mantendo nomes |
| Costa azul | `cards2/card_back.png` | DOM+Phaser(+Pixi) | ACTIVE | swap isolado OK |
| Costa vermelha | `cards2/card_back_red.png` | nenhum | UNUSED | theme ou delete |
| Staging Hazmat | `cards-pack-import/hazmat/` | tools only | DUPLICATE | não ship; limpar ou gitignore |
| Pack legado | `cards1/` | nenhum | DEAD | remover do tree público |
| Atlas | — | — | N/A | só se perf exigir |

### Código

| Item | Ficheiro | Estado | Risco remover | Acção futura |
|------|----------|--------|---------------|--------------|
| Phaser scene/renderer | `renderers/phaser/*` | ACTIVE | — | UX-P3 aqui |
| Pixi archive | `renderers/pixi/*` | ARCHIVE | médio | remover pós decisão |
| DOM mesa | `components/table/*`, `PlayerHand`, `TrickArea` | FALLBACK | alto | manter |
| `CARD_BACK_RED_PATH` | `cardAssets.ts` | DEAD | baixo | limpar |
| Flag helpers mortos | `resolveTableRenderer` / pixi flag | DEAD | baixo | limpar |

### CSS

| Selector/file | Estado | Risco | Acção futura |
|---------------|--------|-------|--------------|
| `.continue-button*` | DEAD | baixo | delete |
| `.trump-minimal*` | DEAD | baixo | delete |
| `.modal-trump-*` / `.modal-dealer-info` | DEAD | baixo | delete |
| `.modal-score-box` / `.modal-games-*` / `.modal-container-medium` | DEAD | baixo–médio | delete c/ verificação |
| `.game-scores--teams` | DEAD | baixo | delete |
| DOM hand/trick/seat + Phaser host | ACTIVE/FALLBACK | alto | manter |

### Flags/debug

| Flag | Uso actual | Manter/Remover depois |
|------|------------|----------------------|
| Phaser default | prod | **Manter** |
| `?renderer=dom` / `phaser` | QA + override | **Manter** |
| `REACT_APP_TABLE_RENDERER` | QA/CI | **Manter** |
| `pixi-archive` | archive | **Remover** com Pixi |
| `__suecaPhaserScene` / `__suecaRenderer` | QA | **Manter** |
| `__suecaPixiStage` | archive | **Remover** com Pixi |
| `__ci*` | Card Intelligence | **Manter** (flagged) |

---

## 11. Decisões explícitas

1. **Faces actuais servem?** → **SIM COM LIMITAÇÕES** (resolução OK; look trial / não branded).  
2. **Podemos trocar só as costas?** → **SIM**, esforço **baixo**.  
3. **Existe atlas coupling?** → **NÃO**.  
4. **Há assets duplicados?** → **SIM** — hazmat≡cards2 (54), cards1 (67), red back unused.  
5. **Há loaders redundantes?** → **SIM** — **1** stack Pixi archive paralelo ao Phaser (produção tem 1 loader).  
6. **Há código morto confirmado?** → **SIM** — 3 símbolos TS (+ assets mortos).  
7. **Há CSS morto confirmado?** → **SIM** — 8 famílias.  
8. **Pixi pode ser removido no futuro?** → **SIM**.  
9. **DOM fallback está suficientemente isolado?** → **SIM** — gate em `GameBoard` + resolve + MP + error boundary; CSS DOM ainda partilha `GameBoard.css`.  
10. **Limpeza ANTES de UX-P3?** → **Não bloqueante.** Preferível documentar paths de swap; limpeza de packs/CSS/Pixi pode ser paralelo ou depois.

---

## 12. Prioridades

### P0 — risco funcional
- Nenhum finding novo desta auditoria. (Input Phaser já corrigido noutro commit; fora de scope de limpeza.)

### P1 — limpeza importante (opcional antes / em paralelo a UX-P3)
- Confirmar que build Android **não** embute `cards1/` + `cards-pack-import/` se `public/` é copiado à letra.  
- Decidir destino de `card_back_red` (feature vs delete).  
- Manter convenção de nomes estável para swap de pack UX-P3.

### P2 — dívida técnica
- Remover Pixi archive + `pixi.js` dep quando não precisar de referência.  
- Apagar CSS morto listado.  
- Remover exports mortos (`isPhaserTableRendererRequested`, alias Pixi).  
- Remover ou arquivar `cards1/` do `public/`.

### P3 — opcional
- Atlas / WebP / compressão.  
- Unificar helpers Phaser/Pixi (só se Pixi ficar).  
- `REACT_APP_CARD_EXT=svg` path cleanup.  
- Mipmaps / filter explícito se arte nova exigir.

---

## Recomendação

**UX-P3 PODE AVANÇAR PRIMEIRO.**

Razão: o pipeline de texturas já isola faces e costa por ficheiro; não há atlas coupling; limpeza (Pixi, CSS, packs mortos) melhora peso/clareza mas **não desbloqueia** troca de arte.  
Se UX-P3 = novo pack de cartas, começar por substituir `cards2/` (e opcionalmente só `card_back.png`) seguindo `docs/ASSETS.md` / `DESIGN_HANDOFF.md`.

**Não fazer nesta auditoria:** deletes, refactors, commits, pushes.

---

## Apêndice A — phone layout cheat sheet

`buildPhaserTableLayout` (`phaserTableLayout.ts`):

- portrait cardWidth = clamp(W×0.12, 44..64)  
- cardHeight = round(width×1.4)  
- opponent ≈ 0.55× (portrait)

## Apêndice B — refs chave

- `frontend/src/constants/cardAssets.ts`  
- `frontend/src/renderers/phaser/SuecaTableScene.ts`  
- `frontend/src/renderers/resolveTableRenderer.ts`  
- `frontend/src/components/GameBoard.tsx` (ramos Phaser / Pixi / DOM)  
- `docs/ASSETS.md`, `docs/DESIGN_HANDOFF.md`, `docs/plan/RENDERER_DECISION_2026.md`
