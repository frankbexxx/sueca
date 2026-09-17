# Sueca — Final Visual Pass

**Data:** 2026-09-17  
**Estado:** `LOCAL PASS — GLOBAL CLEANUP PENDING` — issues locais S1/S2/S4/S5/S6/S7/S9 DONE; restam globais S3/S8/S10 + GLOBAL-CARDS-01 PARTIAL  
**Screenshots batch-01:** `E:\SUECAO\_temp\sueca-visual-batch-01\`  
**Screenshots cards polish:** `E:\SUECAO\_temp\sueca-cards-render-polish-01\`  
**Screenshots batch-02:** `E:\SUECAO\_temp\sueca-visual-batch-02\`  
**Screenshots audit:** `E:\SUECAO\_temp\sueca-visual-pass\`  
**Nota:** auditoria automática inicial revista manualmente por Francisco. Esta lista **substitui/refina** a interpretação automática.

**Roadmap:** `docs/plan/ROADMAP_REBASE_SEPTEMBER_2026.md` §12.3  

---

## Cobertura / evidência

| Ficheiro | Estado representado |
|----------|---------------------|
| `00-dashboard.png` | Dashboard |
| `01-mesa-inicial-mao-cheia.png` | Modal distribuição |
| `02-jogador-activo-legais.png` | Mesa / mão / turno local |
| `04-trick-parcial.png` | Trick parcial |
| `05-trick-cheia-ou-recolha.png` | Trick 4 cartas + Continuar |
| `06-hud-score.png` | HUD com pontos |
| `07-pause.png` | Pause / Retomar |
| `08-resume.png` | Pós-resume |
| `09-round-or-game-end.png` | **Mid-hand / Vaza 2** — **não** é fim de ronda/jogo |

**Não usar** `09-round-or-game-end.png` como evidência de round/game end.

---

## Issues Sueca (consolidados)

### S1 — HUD / Phaser overlap

| Campo | Valor |
|-------|--------|
| TYPE | BUG visual |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** A mesa Phaser invade parcialmente o HUD superior.

**Efeito observado:**
- carta de trunfo parcialmente tapada;
- parte inferior dos painéis superiores ocultada.

**Não afirmar** que `Pontos/Jogos` estão ilegíveis: nas screenshots continuam legíveis.  

**Fix (SUECA-VISUAL-BATCH-01):** o `game-table-zone` centrava um canvas `~70vh` no slot flex, o que fazia overflow para cima sobre o strip. Solução mínima: `align-items: stretch` + `overflow: hidden` no zone; `.sueca-phaser-root` em team-table com `height/max-height: 100%` e `min-height: 0`; `z-index` no strip como rede de segurança. Sem empurrar a mesa com padding morto.

---

### S2 — AI Local (fallback)

| Campo | Valor |
|-------|--------|
| TYPE | UX / POLISH |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** Remover `AI Local (fallback)` do header in-game em release.

É informação técnica/debug sem valor para o jogador.  
**Não** substituir automaticamente por outro label.

**Fix (SUECA-VISUAL-S2-CLOSE-01):** `InGameBar` deixa de receber `metaLabel` em produção; em `isDevMode()` continua a mostrar AI Local / AI Externa. Strings i18n e lógica `aiSource` intactas.

---

### S3 — Legacy purple

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL UI |
| PRIORITY | P2 |
| STATUS | OPEN / GLOBAL |

**DECISION:** O roxo é legado da linguagem visual anterior e ainda aparece em CTAs, faixas, estados intermédios e chrome.

É transversal aos jogos. **Não** corrigir isoladamente na Sueca.

**Referência:** `GLOBAL-UI-01 — Legacy purple remnants`

---

### S4 — Modal distribuição

| Campo | Valor |
|-------|--------|
| TYPE | UX |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** Simplificar o modal.

**Problemas:** `Método de Distribuição: — #1`; repetição do título; radios separados dos labels; excesso de altura/padding.

**Direcção aprovada:**

```
Distribuição

Método
● Standard
○ Dealer First

Direcção
● Esquerda (anti-horário)
○ Direita (horário)

[ Iniciar Jogo ]
```

Remover `— #1` salvo se houver razão funcional demonstrável.

**Fix (SUECA-VISUAL-BATCH-01):** copy compacta (i18n `modals.dealing*`); radios em linha; padding/gap reduzidos; mesma API/comportamento de deal.

---

### S5 — Pausa auto

| Campo | Valor |
|-------|--------|
| TYPE | UX |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** `Pausa auto` está visualmente tratado como CTA primário e compete com `Continuar`.

Separar conceptualmente:
- `Continuar` = acção contextual;
- `Pausa auto` = controlo persistente secundário.

**Não** decidir ainda a localização final global.

**Fix (SUECA-VISUAL-BATCH-01):** estilo local `ghost` + tipografia/altura reduzidas; idle alinhado à direita; Continuar mantém `primary`. Sem redesign transversal / top bar.

---

### S6 — Densidade da mão

| Campo | Valor |
|-------|--------|
| TYPE | POLISH |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** A mão é compacta mas funcional. **Não** aumentar simplesmente spacing.

**Fix (SUECA-VISUAL-BATCH-02):** lift/scale de selecção reforçados; `depthSelected` na carta seleccionada; hover usa `handPresenceScale`; ilegal um pouco mais distinto. Fan spacing **inalterado**.

---

### S7 — Trick de 4 cartas

| Campo | Valor |
|-------|--------|
| TYPE | POLISH |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** Funcional, mas anchors/overlap ligeiramente apertados e assimétricos.

**Fix (SUECA-VISUAL-BATCH-02):** offsets N/S unificados e ligeiramente mais abertos; E/W escalados ao tamanho do trick card; depth por compass (south por cima). Sem redesenhar a mesa.

---

### S8 — Top bar

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL UI |
| PRIORITY | P2 |
| STATUS | OPEN / GLOBAL |

**DECISION:** Top bar demasiado densa em portrait (Pausar / pin / Novo / Sair).

Tratar transversalmente. **Não** escolher ainda overflow/menu final.

**Referência:** `GLOBAL-UI-02 — In-game top bar density`

---

### S9 — Artefacto faces/cartas

| Campo | Valor |
|-------|--------|
| TYPE | BUG / POLISH |
| PRIORITY | P2 |
| STATUS | DONE |

**DECISION:** Existem artefactos visuais aparentes nas faces quando sobrepostas.

**Diagnóstico (SUECA-CARDS-RENDER-POLISH-01):** não é crop/UV. Pipeline Phaser carrega PNG completo 352×512. Causa = combinação de overlap denso + outline baked que some no downscale + face Casino (campo cinza + painel branco). Evidência: `_temp/sueca-cards-render-polish-01/DIAGNOSIS.md`.

**Fix:** mat escura atrás de cada face da mão (`PREMIUM_TABLE.handEdge*` + `handEdgePad`) — o stroke fino sozinho era invisível após downscale WebView; fan spacing **não** alterado.

---

### S10 — Active player cue

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL UI / POLISH |
| PRIORITY | P2 |
| STATUS | OPEN / GLOBAL |

**DECISION:** O jogador activo tem destaque demasiado subtil em portrait.

Futuro objectivo: cue discreto consistente com Premium Classic Table.

**Referência:** `GLOBAL-UI-03 — Active player cue consistency`

---

## Issues globais (registo único)

Detalhe canónico também em `ROADMAP_REBASE_SEPTEMBER_2026.md` §12.7.

### GLOBAL-UI-01 — Legacy purple remnants

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL UI |
| PRIORITY | P2 |
| STATUS | OPEN |

Roxo legado em CTAs / faixas / chrome — transversal aos 4 jogos.

### GLOBAL-UI-02 — In-game top bar density

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL UI |
| PRIORITY | P2 |
| STATUS | OPEN |

Barra in-game densa em portrait (Pausar / pin / Novo / Sair).

### GLOBAL-UI-03 — Active player cue consistency

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL UI / POLISH |
| PRIORITY | P2 |
| STATUS | OPEN |

Cue de jogador activo subtil; alinhar Premium Classic Table em todos os jogos.

### GLOBAL-CARDS-01 — Card separation

| Campo | Valor |
|-------|--------|
| TYPE | GLOBAL CARDS / POLISH |
| PRIORITY | P2 |
| STATUS | PARTIAL |

**PROBLEM:** Cartas sobrepostas com bordo/contraste lateral demasiado fraco → várias cartas brancas parecem uma faixa contínua (mãos 10 e 13).

**Fix (SUECA-CARDS-RENDER-POLISH-01):** mat Phaser atrás da mão local + `border`/box-shadow CSS em `.card-hand` (DOM fallback). Casino e CardMeister partilham o mesmo pipeline. **PARTIAL** até validação visual explícita Spades/Hearts/King em play (Spades 13 já smokeado no OPPO).

**Não** aumentou spacing do fan (S6).

---

## Ordem provisória de trabalho — Sueca

1. S1  
2. S4  
3. S5  
4. S9 + GLOBAL-CARDS-01  
5. S6  
6. S7  
7. S2  
8. S3 / S8 / S10 → cleanup transversal posterior  

**Locais DONE:** S1, S2, S4, S5, S6, S7, S9.  
**Pendentes (globais):** S3 / S8 / S10 + GLOBAL-CARDS-01 (PARTIAL).  
**Não** marcar Final Visual Pass Sueca como release PASS absoluto enquanto globais estiverem abertos.

---

*SUECA-VISUAL-PASS-REGISTER-01 · 2026-09-17 · documentação*  
*SUECA-VISUAL-S2-CLOSE-01 · 2026-09-17 · S2 DONE → LOCAL PASS / GLOBAL CLEANUP PENDING*
