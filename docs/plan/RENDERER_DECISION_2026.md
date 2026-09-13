# Renderer evaluation · 2026

Comparação DOM / Phaser / Pixi após C1–C5 e POCs Sueca solo.  
**Decisão: Phaser** = primary/default para os 4 jogos. **DOM** = fallback / debug. **Pixi** = **removido**.

## DOM

- Fallback estável (erro Phaser, multiplayer, `?renderer=dom`)
- Usado também quando a variante não é Phaser-capable

## Phaser

- Default para Sueca / Spades / Hearts / King
- Validado em OPPO (mão, themes, release)
- Lazy chunk; ErrorBoundary → DOM se falhar init
- Override: `?renderer=phaser` ou `VITE_TABLE_RENDERER=phaser`

## Pixi — removido

- POC comparado e arquivado; código + dep `pixi.js` **removidos** do tree
- `?renderer=pixi` / `?renderer=pixi-archive` / env equivalente → **ignorados** (fica default Phaser)
- Histórico: POC `28e75cd`; decisão de arquivo documentada nesta página

## Decisão

**Phaser escolhido** (custo operacional / DX). Pixi só ganhava em tamanho de lazy chunk.

Estado actual: Phaser primary · DOM fallback · Pixi gone.
