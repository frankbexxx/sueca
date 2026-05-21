# Prompt P8 — QA e release

> **Gate Android:** [PRODUCT_ESSENTIALS.md](../PRODUCT_ESSENTIALS.md) must-have completo.  
> P5 obrigatório antes de release MP. P6 adiado. Ver [STATUS.md](../../STATUS.md).

## Objetivo
CI verde + Maestro smoke + internal track — **só após** regras + app shell.

## Pré-requisitos (gate)
- [ ] [PRODUCT_ESSENTIALS.md](../PRODUCT_ESSENTIALS.md) must-have todos `[x]`
- [ ] App shell 4 tabs funcional
- [ ] Testes verdes por jogo (Sueca, Hearts, Spades, King)
- [ ] Smoke 1 partida completa por variante (360×800)

## Tarefas
1. `maestro test .maestro/smoke.yaml` no emulador.
2. Matriz dispositivos 360×800, tablet.
3. `npm run release:android` → upload AAB internal testing.
4. `docs/RELEASE_CHECK.md` Android.

## Critérios
- [ ] CI frontend verde.
- [ ] 1 partida por variante em dispositivo real ou emulador.
- [ ] Legal pages no deploy.
