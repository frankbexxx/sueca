# CARD-HAND-AUDIT-01 — Cartas, back, tamanho e geometria da mão · 2026

**Modo:** READ-ONLY  
**Data:** 2026-09-13  
**Root:** `E:\SUECAO`  
**Commit de referência:** `ebe44b9` (`v2-main`)  
**Renderer auditado:** Phaser (default)  
**Device de referência:** OPPO Reno13 5G — ver `docs/plan/ANDROID_OPPO_RENO13_BASELINE_2026.md`  
**Alterações de produto / assets / código:** **ZERO** (só este documento)

Relacionado (inventário assets anterior): `docs/plan/CARD_ASSETS_RENDERER_AUDIT_2026.md` (2026-09-11).  
Este documento **aprofunda** faces/back/tamanho/mão Phaser; actualiza o estado do **back** (Suecão v1, não Hazmat blue).

---

## 0. Verificação prévia

| Check | Resultado |
|-------|-----------|
| Assets reais em disco | **SIM** — `frontend/public/assets/cards2/` (54 PNG @ 533×764) |
| Renderer real default | **SIM** — Phaser via `resolveTableRenderer` |
| Phaser path | `frontend/src/renderers/phaser/*` |
| OPPO baseline | canvas Sueca **360×494.9**, `handY` **418.9**, `cardHeight` **64** |
| Sueca 10 / Spades·Hearts·King 13 | mesma geometria; só muda `count` |
| Código/assets alterados nesta auditoria | **ZERO** |

---

## 1. Inventário dos assets de cartas

### 1.1 Packs no disco

| Pack | Path | Formato | Dimensões | # ficheiros | Naming | Jokers | Backs | Origem / licença | Uso |
|------|------|---------|-----------|-------------|--------|--------|-------|------------------|-----|
| **cards2 (activo)** | `frontend/public/assets/cards2/` | PNG | **533×764** | **54** | `{Rank}_of_{Suit}.png` Title_Case | **não** | `card_back.png`, `card_back_red.png` | Faces: **Hazmat Hand Drawn** (trial) — `docs/ASSETS.md`. Back activo: **Suecão card back v1** (`tools/generate-suecao-card-back-v1.py`) | **Phaser + DOM** |
| **hazmat staging** | `frontend/public/assets/cards-pack-import/hazmat/` | PNG | 533×764 | 54 | Hazmat + `Back_Blue` / `Back_Red` | não | sim (staging) | Staging `tools/stage-hazmat.mjs` | **só tools** |
| **cards1 (legacy)** | `frontend/public/assets/cards1/` | PNG | ~500×726 (legado) | **67** | lowercase + variantes `*2` | `black_joker`, `red_joker` | **não** | pack antigo | **UNUSED** (0 refs runtime) |

**Resolução activa:** 533×764 ≈ aspect **1 : 1.434** (layout Phaser usa **1 : 1.4**).  
**DPR 3 (OPPO):** display mão ~49×68 CSS → ~147×204 physical px; source 533×764 tem **folga** (~3.6× sobre physical).

### 1.2 Separação pedida

| Categoria | Conteúdo |
|-----------|----------|
| **Faces** | 52 PNG em `cards2/` (`2`–`10`, `Jack`, `Queen`, `King`, `Ace` × Clubs/Diamonds/Hearts/Spades) |
| **Backs** | `card_back.png` (**activo** Suecão navy); `card_back_red.png` (**exportado**, **não usado** em runtime — IAP/theme futuro) |
| **Legacy / archive** | `cards1/` (67); staging hazmat; Pixi archive (código, não pack separado) |
| **Usados pelo Phaser** | faces `cards2/*_of_*.png` + `card_back.png` |
| **Usados só no DOM fallback** | **mesmos** paths (`getCardImagePath` / `CARD_BACK_PATH`); DOM não tem pack distinto |

### 1.3 Licença (documentada)

| Asset | Licença (`docs/ASSETS.md`) |
|-------|----------------------------|
| Hazmat faces | Comercial OK; no redistribute/resell do pack |
| Suecão back v1 | asset gerado no repo (script próprio) |
| DOBO / Kenney | UI / SFX — fora do baralho |

---

## 2. Como as cartas são renderizadas

### Pipeline

```
Card (rank/suit)
  → GameBoard.getCardImage
  → getCardImagePath(RANK_TO_IMAGE_NAME, SUIT_TO_NAME)
  → /assets/cards2/{Rank}_of_{Suit}.png
  → mapTableModelToPhaserView.cardTextureKey → `face:${rank}_${suit}`
  → SuecaTableScene.ensureTextures (load.image se em falta)
  → redrawHand / redrawTrick / redrawOpponents
  → Phaser.GameObjects.Image.setDisplaySize(dw, dh)
  → position (layout slots) + angle + depth
```

| Peça | Ficheiro | Função / classe |
|------|----------|-----------------|
| Path builder | `frontend/src/constants/cardAssets.ts` | `getCardImagePath`, `CARD_BACK_PATH` |
| Rank/suit map | `frontend/src/utils/cardMappings.ts` | `RANK_TO_IMAGE_NAME`, `SUIT_TO_NAME` |
| Host React | `frontend/src/renderers/phaser/SuecaPhaserRenderer.tsx` | cria `Phaser.Game`, passa `getCardImage` |
| Scene | `frontend/src/renderers/phaser/SuecaTableScene.ts` | `preload`, `ensureTextures`, `redrawHand`, `redrawTrick`, `redrawOpponents` |
| View map | `frontend/src/renderers/phaser/mapTableModelToPhaserView.ts` | `cardTextureKey`, hand entities |
| Layout sizes | `frontend/src/renderers/phaser/phaserPremiumLayout.ts` | `computePremiumTableLayout` |
| Fan slots | `frontend/src/renderers/phaser/phaserTableLayout.ts` | `layoutLocalHandPositions` |
| Visual chrome | `frontend/src/renderers/phaser/phaserHandVisual.ts` | alpha/tint/scale/lift |
| Hit policy | `frontend/src/renderers/phaser/phaserHandInput.ts` | default frame hit area |

### Atlas / spritesheet

**Não.** Ficheiros PNG individuais. Sem TexturePacker.

### Texture loading / cache

- `preload`: só `card-back`.
- Faces: lazy `this.load.image(key, url)` na primeira necessidade (`ensureTextures`), depois cache Phaser por key.
- Sem atlas; sem mipmap custom.

### Scaling / origin / depth

| Propriedade | Valor |
|-------------|-------|
| Size | `setDisplaySize(dw, dh)` — **não** `setScale` directo no texture |
| Origin | default Image **(0.5, 0.5)** — centro |
| Hand depth | `20 + i` (esquerda → direita sobe) |
| Trick | `PREMIUM_TABLE.depthTrick` = 32 |
| Opponents | 18 |
| Selected / drag | até 80 |

Local hand display:

```
dw = cardWidth  * visual.scale * PREMIUM_TABLE.handPresenceScale  // 1.06
dh = cardHeight * visual.scale * handPresenceScale
```

(`SuecaTableScene.redrawHand`)

---

## 3. Dimensões das cartas

### Native

| Item | Valor |
|------|------:|
| Source W×H | 533×764 |
| Aspect | 1 : 1.434 |
| Layout aspect | `cardHeight = round(cardWidth * 1.4)` |

### Fórmulas de tamanho (`computePremiumTableLayout`)

| Aspect | `cardWidth` |
|--------|-------------|
| portrait | `min(68, max(46, floor(w * 0.125)))` |
| landscape | `min(60, max(42, floor(h * 0.145)))` |
| desktop | `min(78, max(52, floor(w * 0.088)))` |

Derivados: opponents ×0.78 (portrait) / ×0.68 (landscape); trick ×**1.11**; hand presence ×**1.06**.

### Tabela — contexto actual

| contexto | width | height | scale (vs native) | origem |
|---|---:|---:|---:|---|
| Native asset | 533 | 764 | 1.0 | PNG `cards2` |
| Layout base (OPPO 360×494.9) | 46 | 64 | ~0.086 | `floor(360*0.125)` → max floor 46 |
| **Local hand display (OPPO)** | **48.8** | **67.8** | ~0.092 | base × 1.06 |
| Opponent backs (OPPO) | 36 | 50 | ~0.068 | base × 0.78 |
| Trick / centro (OPPO) | 51 | 71 | ~0.096 | base × 1.11 |
| Phone 390×844 layout base | 48 | 67 | ~0.090 | portrait formula |
| Desktop 1100×800 layout base | 60 | 84 | ~0.113 | desktop formula |
| DOM fallback base CSS | 49 | 71 | — | `--card-w/h` em `GameBoard.css` |
| DOM media (largo→estreito) | 63→44 | 90→63 | — | media queries |

**Nota OPPO baseline:** `cardHeight: 64` medido = layout base; display mão ≈ **68** com presence (não instrumentado à parte no baseline).

---

## 4. Legibilidade das faces

**Estilo:** Hazmat hand-drawn — outline preto grosso, face branca, índices TL/BR, figuras geométricas coloridas no centro.

### Avaliação estrutural (amostra: A♠, 10♥, Q♦, K♣)

| Aspecto | Classificação | Notas |
|---------|---------------|-------|
| Tamanho do rank no canto | **GOOD** | A/K/Q/J chunky; `10` mais largo mas stroke forte |
| Tamanho do suit no canto | **GOOD** | suit sólido sob o rank, outline preto |
| Distância ao bordo | **ACCEPTABLE** | índice colado ao bordo (~5–8% margem) — bom p/ fan, risco de clip em scale extremo |
| Contraste | **GOOD** | preto/vermelho vs branco |
| Stroke / shadow | **GOOD** / n/a | stroke grosso; sem drop shadow na face |
| Espessura tipográfica | **GOOD** | “chunky” informal |
| Legibilidade de `10` | **ACCEPTABLE** | precisa mais largura horizontal que A/K |
| Legibilidade J/Q/K | **GOOD** | letras simples e grandes |
| Diferença ♥♦♣♠ | **ACCEPTABLE** | forma + cor; ♥/♦ ambos vermelhos — dependem da silhueta |
| Detalhe das figuras | **WEAK** @ small | mosaico geométrico torna-se “ruído” em ~50px |
| Detalhe do centro (pip cards) | **GOOD** | pips grandes e limpos |
| Informação visual pequena | **WEAK** | padrões finos das figuras; índice aguenta melhor |

### Por escala de carta

| Escala | Rank/suit canto | Centro / figuras | Global |
|--------|-----------------|------------------|--------|
| Grande (desktop ~64–78) | **GOOD** | **GOOD** | **GOOD** |
| Média (hand ~49–55) | **GOOD** | **ACCEPTABLE** | **ACCEPTABLE** |
| Pequena (opponent ~36) | **ACCEPTABLE** (só backs na mesa) | n/a faces | backs: ver §11 |
| Parcialmente sobreposta (~50% W visível actual) | **GOOD** | centro cortado | **ACCEPTABLE** |
| Hipótese 20–25% W visível | **WEAK**–**BAD** p/ `10` | irrelevante | ver §14 |

**Identidade de marca:** look Hazmat trial / genérico — legível, mas **não** “Suecão premium”.

---

## 5. Overlap actual da mão

### Algoritmo

`layoutLocalHandPositions(count, layout)` em `phaserTableLayout.ts`:

```
overlapFactor =
  count ≥ 8 → 0.52 (dense)
  count ≥ 5 → 0.62 (mid)
  else      → 0.70 (loose)

spacing = min(cardWidth * overlapFactor, handSpreadMax / count)
total   = spacing * (count - 1)
startX  = width/2 - total/2          // centro
x_i     = startX + i * spacing       // L → R
y_i     = handY + |i - mid| * arcK   // arco (extremos mais baixos)
rot_i   = (i - mid) * fanDeg         // leque
depth_i = 20 + i                     // carta da direita por cima
```

`HAND_LAYOUT`: portrait arc **1.2** / fan **2.2°**; landscape arc **1.6** / fan **1.4°**.

**Ordem das cartas:** ordem do array `model.localHand` (pós `sortHand` no motor/UI) — índice 0 à **esquerda**.

### Overlap actual

| Pergunta | Resposta |
|----------|----------|
| Direcção | **esquerda → direita** |
| Simétrico? | **SIM** em X (centrado); arco/fan simétricos em torno do meio |
| Outro | fan leve + depth crescente para a direita |

### Quanto fica exposto? (OPPO 360×494.9, display W≈48.8)

**Nota de nomenclatura:** no código, `overlapDense: 0.52` é factor de **espaçamento** (= fracção da `cardWidth` de layout entre centros), **não** “% coberto”.

| count | spacing (px) | exposto ≈ spacing | % da display W | % coberto (aprox.) |
|------:|-------------:|------------------:|---------------:|-------------------:|
| 13–8 | 23.9 | 23.9 | **~49%** | ~51% |
| 7–5 | 28.5 | 28.5 | **~58%** | ~42% |
| 3 | 32.2 | 32.2 | **~66%** | ~34% |
| 1 | — | 100% carta | 100% | 0% |

A carta do topo (direita) está **100%** visível. As restantes mostram essencialmente a **faixa esquerda** ≈ `spacing`.

---

## 6. O canto que fica visível

Com fan L→R e depth crescente à direita:

| Parte | Visível nas cartas de trás? |
|-------|----------------------------|
| **Canto superior esquerdo** | **SIM — principal** (rank + suit) |
| Canto superior direito | **NÃO** (coberto) |
| Centro | **parcial / não** com overlap denso |
| Canto inferior | **pouco** (arco + cobertura) |

**Alinhamento design ↔ geometria:** **BOM.** Hazmat coloca índice **TL** (e BR espelhado) — exactamente o que o fan actual revela.

Com ~**49%** da largura exposta (~24 CSS px ≈ **~130 native px** de faixa):

| Elemento | Cabe? |
|----------|-------|
| Rank (A/K/Q/J) | **SIM** folgado |
| Rank `10` | **SIM** (mais justo) |
| Suit sob o rank | **SIM** na maioria |
| Ambos legíveis | **SIM** no layout actual |

Se o overlap futuro cair para **20–25%** da largura (~10–12 CSS px), o índice TL continua no sítio certo, mas a **margem tipográfica** para `10` + suit fica **apertada** (ver §14).

---

## 7. Comportamento dinâmico

### Tipo de sistema

**C — fan com largura alvo / reflow por contagem** (não slots fixos).

- Posições recalculadas a partir de `localHand.length`.
- Centrado sempre (`startX` a partir do total).
- **Sem** buracos de cartas jogadas: a carta sai do array → reflow contínuo.
- Tamanho da carta (`cardWidth`) **não** cresce quando há menos cartas — só muda `overlapFactor` (tiers 8 / 5).
- Tween ~130 ms em `redrawHand` (posição/ângulo/tamanho).

### Sueca (10 → 1) e Spades/Hearts/King (13 → 1) — OPPO canvas 360×494.9

| # | total mão W (px) | spacing | overlap factor | gaps? | recentra? | sensação |
|--:|-----------------:|--------:|---------------:|-------|-----------|----------|
| 13 | 336 | 23.9 | 0.52 | não | sim | mão densa |
| 12 | 312 | 23.9 | 0.52 | não | sim | mão |
| 11 | 288 | 23.9 | 0.52 | não | sim | mão |
| 10 | 264 | 23.9 | 0.52 | não | sim | mão |
| 9 | 240 | 23.9 | 0.52 | não | sim | mão |
| 8 | 216 | 23.9 | 0.52 | não | sim | mão |
| 7 | 220 | 28.5 | 0.62 | não | sim | abre um pouco |
| 5 | 163 | 28.5 | 0.62 | não | sim | abre |
| 3 | 113 | 32.2 | 0.70 | não | sim | fan frouxo |
| 1 | 49 | — | — | não | sim | carta isolada |

`handSpreadMax` portrait = `w * 0.92` = 331 — com 13 cartas o spacing está no **cap do factor 0.52**, não no spread max.

**Não parece fila de slots vazios.** Parece mão que encolhe/recentra; **não** cresce o tamanho físico das cartas.

---

## 8. “Hand feel”

| Critério | Avaliação |
|----------|-----------|
| Parece mão segurada? | **PARCIAL** — há fan + arco, mas cartas pequenas e spacing aberto (~50%) |
| Fila de slots? | **NÃO** |
| Cartas pousadas na mesa? | **PARCIAL** — felt + sombra; fan sugere mão |
| Continuidade visual? | **SIM** (tween + reflow) |
| Recentra após jogar? | **SIM** |
| Abre com menos cartas? | **PARCIAL** — só spacing (tiers), não tamanho |
| Fan? | **SIM** (leve) |
| Compressão progressiva? | **PARCIAL** — 3 escalões discretos, não curva contínua |

**Classificação global:** **PARTIAL** (entre NATURAL e STATIC no tamanho).

---

## 9. Tamanho actual da mão local (OPPO Sueca)

Canvas: **360 × 494.9** · display carta ≈ **48.8 × 67.8** · `handY` **418.9**

| Métrica | Valor |
|---------|------:|
| Altura carta / canvas | **~13.7%** |
| Largura carta / canvas | **~13.5%** |
| Largura mão @13 | **~93%** do canvas (~336 px) |
| Largura mão @10 | **~73%** (~264 px) |
| Margem inferior (centro carta → fundo) | **~42 px** (baseline gap ~44) |
| Margem lateral @13 | **~12 px**/lado |
| Margem lateral @10 | **~48 px**/lado |

### Margem para aumentar cartas?

**SIM**, com trade-offs:

| Aumento | Viabilidade @13 | Risco |
|---------|-----------------|-------|
| +~13% (52×73) | cabe com overlap ≤0.40 | baixo–médio |
| +~26% (58×81) | cabe com overlap ≤0.40; folga lateral mínima | médio |
| +~39% (64×90) | cabe só com overlap ≤~0.35 | médio–alto (trick/HUD/chrome) |

Limites: não tapar trick (`handY - cardHeight*1.15`), actions React, sheets (`bottomChromePx`), hitboxes (seguem displaySize).

Estimativa prudente de margem “sem redesign”: **+15–25%** no `cardWidth` portrait se o overlap for **apertado** em paralelo.

---

## 10. Hit areas e interacção

| Tópico | Estado |
|--------|--------|
| Hitbox | Phaser **default texture-frame** com `displaySize` — **equivale ao sprite visível** |
| Hitbox maior que sprite? | **NÃO** (política explícita anti-rect em px de layout) |
| Drag | sim se move >10 px + drop zone centro |
| Tap | play / pass toggle |
| Hover desktop | lift + cursor |
| Legal / illegal / selected / disabled | `phaserHandVisual` + `disableInteractive` |
| Overlap vs click | carta da **direita** (maior depth) ganha o hit na zona partilhada — esperado |
| Frente bloqueia trás? | **SIM** na faixa sobreposta (~50% hoje) — aceitável; se overlap → 20%, a faixa clicável de trás estreita |
| Aumentar tamanho afecta input? | hit cresce com `displaySize` — **positivo** para touch |

---

## 11. Card back

| Campo | Valor |
|-------|-------|
| Path activo | `frontend/public/assets/cards2/card_back.png` |
| Dimensões | 533×764 |
| Geração | `tools/generate-suecao-card-back-v1.py` |
| Cores dominantes | navy ~`#0E1C3E` (amostra média ~RGB 15,27,56); brass/ivory frame; medalhão dourado |
| Padrão | diamantes geométricos **grossos** (anti-moiré) |
| Red back | `card_back_red.png` — **não ligado** ao runtime |

### Avaliação

| critério | resultado |
|---|---|
| contraste com felt Premium (`#173C3B`) | **STRONG** (navy frio vs teal) |
| contraste com verde (CSS themes / `--theme-table-felt` verdes) | **STRONG**–**MEDIUM** (felt Phaser fixo teal; shell CSS pode ser verde — back navy ainda lê) |
| contraste com azul (themes azulados) | **MEDIUM** (ambos frios; brass/ivory salvam silhueta) |
| leitura pequena (opponent ~36×50) | **ACCEPTABLE**–**GOOD** (frame + medalhão; grelha some) |
| premium feel | **GOOD** (mais “Suecão” que faces Hazmat) |
| risco de “desaparecer” | **LOW** no felt actual; **MEDIUM** se felt futuro for navy escuro sem brass |

---

## 12. Themes / table colors

### Felt Phaser (identidade de mesa — **fixo**)

| Token | Hex | Luminosidade aprox. (0–255 luma) | vs back |
|-------|-----|--------------------------------:|---------|
| exterior | `#10191b` | ~22 | back mais azul |
| felt | `#173c3b` | ~52 | **STRONG** |
| feltCenter | `#1c4846` | ~62 | **STRONG** |
| feltEdge | `#102c2d` | ~38 | **STRONG** |
| brass | `#c5a45b` | — | accent no back e na mesa |

`phaserTheme.ts`: CSS theme **não** muda felt Phaser — só text/accent/active.

### Shell CSS (`themes.css`) — exemplos

| Theme felt CSS | Cor | Contraste back (se shell visível à volta) |
|----------------|-----|-------------------------------------------|
| azul escuro | `#1a3a5a` | **MEDIUM** |
| ouro/castanho | `#6a5020` | **STRONG** |
| verde | `#0d3a1a` / `#1a4a1a` | **STRONG** |
| azul noite | `#1a2a4a` | **MEDIUM** |

---

## 13. Novas cartas — requisitos técnicos (sem procurar packs)

### Face (obrigatório)

- Rank **grande** no canto **superior esquerdo**
- Suit **muito** legível sob/ao lado do rank
- Corner index legível com **70–80%** da carta tapada (faixa ~20–30% W)
- Alto contraste; figuras **simples**; centro forte
- Bom em mobile e tamanho reduzido (~45–55 CSS px)

### Asset

- 52 cartas; aspect estável (~2.5:3.5 / 1:1.4)
- Resolução ≥ **512 px** largura (ideal ≥533 actual; folga DPR 3)
- SVG **ou** raster hi-res sem artefactos
- Naming `{Rank}_of_{Suit}` compatível com `cardMappings` / `map-card-pack.mjs`

### Licença

- Uso no produto + distribuição app (Capacitor/store)
- Modificação se necessário
- Preferir permissiva / OSS / public domain; senão comercial itch.io com crédito em `CreditsModal`

---

## 14. Limites de overlap (métrica)

Native W = 533. Display OPPO W ≈ 48.8 → escala ≈ **0.0915**.

| % largura visível | faixa native (px) | faixa display (px) | rank | suit |
|------------------:|------------------:|-------------------:|------|------|
| **20%** | 107 | ~9.8 | justo p/ A/K; **fraco** p/ `10` | arriscado sob o rank |
| **25%** | 133 | ~12.2 | A–K OK; `10` limite | justo |
| **30%** | 160 | ~14.7 | OK | OK na maioria |
| **35%** | 187 | ~17.1 | folgado | folgado |
| **~49% (actual)** | ~261 | ~24 | folgado | folgado |

**Recomendação métrica (não implementação):** para cartas estilo índice TL, **não descer abaixo de ~28–30%** da largura display sem redesign tipográfico do `10`; **25%** só com índice ultra-compacto.

---

## 15. Tamanho candidato (simulação OPPO 360 portrait)

Sem alterar código — combinações que **cabem** (`total ≤ 0.98×W`):

### 13 cartas (Spades / Hearts / King)

| cardW | display≈ | overlap factor | spacing | exposto % | total W | nota |
|------:|---------:|---------------:|--------:|----------:|--------:|------|
| 46 (actual) | 49 | 0.52 | 24 | 49% | 336 | baseline |
| 52 | 55 | 0.35 | 18 | 33% | 274 | candidato A |
| 58 | 62 | 0.30 | 17 | 28% | 270 | candidato B |
| 64 | 68 | 0.25 | 16 | 24% | 260 | candidato C (apertado no índice) |

### 10 cartas (Sueca)

| cardW | overlap | exposto % | total W | nota |
|------:|--------:|----------:|--------:|------|
| 52 | 0.40 | 38% | 242 | folgado |
| 58 | 0.35 | 33% | 244 | bom equilíbrio |
| 64 | 0.30 | 28% | 241 | grande |

### 7 / 5 cartas

Quase todos os pares (46–64)×(0.22–0.52) cabem; aqui a oportunidade é **crescer a carta** (hoje o tamanho é fixo).

**Não se escolhe solução nesta auditoria.**

---

## 16. Regras para reflow futuro

### Já existe (reutilizável)

- `layoutLocalHandPositions` / `computeLocalHandLayout`
- `HAND_LAYOUT` knobs
- `handSpreadMax`, centering, fan/arc
- Tweens em `redrawHand`
- `handPresenceScale`
- Testes: `phaserTableLayout.test.ts`, `phaserPremiumLayout.test.ts`, `phaserModelTransitions.test.ts`

### Teria de mudar

- Curva contínua spacing vs count (em vez de 3 tiers)
- Opcional: `cardWidth = f(count)` (cartas maiores com mão curta)
- Possível clamp vs trick zone / chrome
- Se faces novas: validar índice TL vs novo overlap target

### Dependências Phaser layout

- `computePremiumTableLayout` (handY, reserves)
- `mapTableModelToPhaserView` (slots ← count)
- `SuecaTableScene.redrawHand` (displaySize + tween)
- Sheets: `resolveBottomChromePx`

---

## 17. Dependências de uma alteração futura

| Área | Impacto |
|------|---------|
| Phaser renderer / scene | alto (textures, redraw) |
| Premium / table layout | alto se size/handY mudarem |
| Hit testing / drag | médio (escala com display) |
| Animations / tweens | médio |
| Card assets / `cardAssets.ts` / mappings | alto se pack novo |
| Tests Phaser layout/mapping | alto |
| DOM fallback (`PlayerHand`, CSS `--card-w`) | médio se quiserem paridade visual |
| Screenshots / OPPO baseline | regenerar |
| Pixi archive | baixo (já não default) |

---

## 18. Riscos

| Mudança | Risco |
|---------|-------|
| **Alterar apenas faces** | **MEDIUM** — paths/naming OK; legibilidade + identidade; licença |
| **Alterar apenas back** | **LOW** — 1 ficheiro + contraste themes |
| **Aumentar cartas** | **MEDIUM** — trick/HUD/chrome/sheets; 13-card squeeze |
| **Alterar overlap/reflow** | **MEDIUM** — hit targets + sensação; testes densos |
| **Fazer tudo junto** | **HIGH** — confunde causa de regressão visual/input |

---

## 19. Decisão preliminar (sem implementar)

### Faces actuais

- Podem ser **melhoradas**? Sim (contraste já bom; figuras noisy @ small).
- Mais racional **substituir**? **SIM** se o objectivo for identidade Suecão + índice ultra-robusto a overlap apertado. Hazmat é **trial / genérico**.

→ **SUBSTITUIR** (recomendação preliminar) · interim: **MELHORAR** só se budget zero para pack.

### Back actual

- Suecão v1 navy já alinhado ao felt teal.
→ **MANTER** (ajustar só se faces novas pedirem harmonia cromática).

### Hand size

- Margem para crescer: **SIM**, ~**+15–25%** com overlap mais apertado; até ~**+30–35%** se aceitar ~25% exposição e redesign de índice.

### Hand geometry

- Já é **dinâmica** (reflow + center + fan).
- Precisa **AJUSTAR** (tiers → curva; opcional size×count), não rewrite total.
→ **AJUSTAR** (não OK estático; não REFACTOR completo).

---

## 20. EXECUTIVE SUMMARY

### 1. Faces

| | |
|--|--|
| **Estado actual** | Hazmat hand-drawn PNG 533×764; índice TL forte; figuras busy |
| **Principal problema** | Identidade genérica + ruído @ tamanho mão mobile |
| **Margem de melhoria** | Alta via pack novo; baixa via só CSS/scale |
| **Recomendação preliminar** | **SUBSTITUIR** (quando houver pack com licença OK) |

### 2. Back

| | |
|--|--|
| **Estado actual** | Suecão v1 navy + brass; contraste forte no felt Phaser |
| **Principal problema** | Menor vs themes CSS azulados; red back morto |
| **Margem de melhoria** | Baixa–média |
| **Recomendação preliminar** | **MANTER** |

### 3. Size

| | |
|--|--|
| **Estado actual** | OPPO hand ~49×68 CSS (~14% altura canvas); formula portrait floor 46 |
| **Principal problema** | Cartas pequenas face ao espaço lateral livre @10 cartas |
| **Margem de melhoria** | **+15–25%** realista; mais com overlap apertado |
| **Recomendação preliminar** | Crescer **com** ajuste de overlap (não isolado) |

### 4. Hand geometry

| | |
|--|--|
| **Estado actual** | Fan L→R centrado; overlap factor 0.52/0.62/0.70; ~49% exposto @8–13 |
| **Principal problema** | Tamanho fixo vs count; compressão só em 3 escalões; feel PARTIAL |
| **Margem de melhoria** | Média — knobs já isolados em `HAND_LAYOUT` |
| **Recomendação preliminar** | **AJUSTAR** reflow (curva + opcional size×count); preservar índice TL |

---

## Apêndice A — Ficheiros-chave

| Concern | Path |
|---------|------|
| Assets activos | `frontend/public/assets/cards2/` |
| Constantes | `frontend/src/constants/cardAssets.ts` |
| Scene | `frontend/src/renderers/phaser/SuecaTableScene.ts` |
| Fan | `frontend/src/renderers/phaser/phaserTableLayout.ts` |
| Sizes / felt | `frontend/src/renderers/phaser/phaserPremiumLayout.ts` |
| View | `frontend/src/renderers/phaser/mapTableModelToPhaserView.ts` |
| Hit | `frontend/src/renderers/phaser/phaserHandInput.ts` |
| DOM hand | `frontend/src/components/PlayerHand.tsx` |
| Docs assets | `docs/ASSETS.md` |
| OPPO baseline | `docs/plan/ANDROID_OPPO_RENO13_BASELINE_2026.md` |

## Apêndice B — Correcção vs auditoria 2026-09-11

`CARD_ASSETS_RENDERER_AUDIT_2026.md` listava `card_back.png` como Hazmat `Back_Blue`.  
**Estado 2026-09-13:** `card_back.png` é **Suecão v1** (ficheiro ~15 KB, navy/brass; script `generate-suecao-card-back-v1.py`). Hazmat blue permanece só em staging.
