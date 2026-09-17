# Sueca — Final Visual Pass

**Data:** 2026-09-17  
**Estado:** `TWEAKS OPEN`  
**Origem:** revisão manual de screenshots OPPO portrait  
**Screenshots:** `E:\SUECAO\_temp\sueca-visual-pass\`  
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
| STATUS | OPEN |

**DECISION:** A mesa Phaser invade parcialmente o HUD superior.

**Efeito observado:**
- carta de trunfo parcialmente tapada;
- parte inferior dos painéis superiores ocultada.

**Não afirmar** que `Pontos/Jogos` estão ilegíveis: nas screenshots continuam legíveis.  
**Não assumir** solução técnica ainda.

---

### S2 — AI Local (fallback)

| Campo | Valor |
|-------|--------|
| TYPE | UX / POLISH |
| PRIORITY | P2 |
| STATUS | OPEN |

**DECISION:** Remover `AI Local (fallback)` do header in-game em release.

É informação técnica/debug sem valor para o jogador.  
**Não** substituir automaticamente por outro label.

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
| STATUS | OPEN |

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

---

### S5 — Pausa auto

| Campo | Valor |
|-------|--------|
| TYPE | UX |
| PRIORITY | P2 |
| STATUS | OPEN |

**DECISION:** `Pausa auto` está visualmente tratado como CTA primário e compete com `Continuar`.

Separar conceptualmente:
- `Continuar` = acção contextual;
- `Pausa auto` = controlo persistente secundário.

**Não** decidir ainda a localização final global.

---

### S6 — Densidade da mão

| Campo | Valor |
|-------|--------|
| TYPE | POLISH |
| PRIORITY | P2 |
| STATUS | OPEN |

**DECISION:** A mão é compacta mas funcional. **Não** aumentar simplesmente spacing.

Antes:
- melhorar separação visual entre cartas;
- verificar hit areas;
- reforçar selecção/lift das cartas centrais.

Reavaliar spacing depois. Ver também `GLOBAL-CARDS-01`.

---

### S7 — Trick de 4 cartas

| Campo | Valor |
|-------|--------|
| TYPE | POLISH |
| PRIORITY | P2 |
| STATUS | OPEN |

**DECISION:** Funcional, mas anchors/overlap estão ligeiramente apertados e assimétricos.

Futuro ajuste fino: offsets; distância ao centro; leitura dos índices.  
**Sem** redesign.

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
| STATUS | OPEN |

**DECISION:** Existem artefactos visuais aparentes nas faces quando sobrepostas.

Antes de corrigir, diagnosticar: asset; crop; scale; clipping; renderer.  
**Não** assumir que é UV/crop.

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
| STATUS | OPEN |

**PROBLEM:** Cartas sobrepostas com bordo/contraste lateral demasiado fraco → várias cartas brancas parecem uma faixa contínua (mãos 10 e 13).

**AUDIT FUTURO:** Casino; CardMeister; DOM; Phaser; mãos; trick.

**Possíveis testes futuros:** bordo fino mais definido; sombra muito discreta; contraste lateral. Evitar aspecto pesado/sticker.

**IMPORTANTE:** Testar isto **antes** de aumentar significativamente o spacing das mãos.

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

Ordem provisória; pode mudar após cada batch.  
**Nenhuma correcção marcada DONE nesta revisão.**

---

*SUECA-VISUAL-PASS-REGISTER-01 · 2026-09-17 · documentação apenas*
