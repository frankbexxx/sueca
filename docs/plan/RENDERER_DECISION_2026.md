# Renderer evaluation · 2026

Comparação DOM / Phaser / Pixi após C1–C5 e POCs Sueca solo.  
**Decisão: Phaser** para evolução do table renderer. Pixi fica arquivado como referência.

## DOM

- Renderer actual / **default** (sem flag)
- Estável; usado em produção
- Limitado para evolução visual avançada (animações de mesa, fan, drag, etc.)

## Phaser

- E1 POC validado (Sueca solo)
- 10 vazas + Round End React + nova mão + pause/resume + resize básico
- ~311 kB gzip lazy
- Menor glue operacional
- Tweens / scale / input built-in
- **Escolhido para evolução** (`?renderer=phaser`)

Commits:

- POC: `58c4594` — `poc(renderer): add phaser sueca table`
- Tests: `86405e6` — `test(renderer): cover phaser model transitions`

## Pixi

- POC equivalente validado (paridade E1)
- ~185 kB gzip lazy (ganhou em bundle)
- Mais glue; lifecycle / texture sync mais sensível; tween/resize mais manual
- **Arquivado** após comparação — código e testes permanecem no repo
- Activação só para referência: `?renderer=pixi-archive` (não `?renderer=pixi`)

Commit:

- POC: `28e75cd` — `poc(renderer): add pixi sueca table`

Dependência `pixi.js` mantida enquanto o POC arquivado existir no tree.

## Decisão

**Phaser escolhido.**

Razão: Pixi só ganhou claramente em bundle; Phaser teve melhor custo operacional e DX para este projecto (glue, tweens/scale, lifecycle React).

Próximo passo: **E2 Phaser** (aprofundar Sueca; não expandir já para Spades/Hearts/King).
