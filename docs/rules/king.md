# King PT · modo normal

Preset id: `king-pt-normal`

Variante simplificada: [`king-simplified.md`](king-simplified.md) (`king-simplified`)

## Estrutura

- 4 jogadores **individuais**; partida **zero-sum** (1300 neg + 1300 pos)
- **10 jogos:** 6 negativos fixos + 4 festas (uma por jogador)
- Viragem **K♥** define ordem de festas; primeiro a jogar no 1.º negativo = oposto a quem tirou K♥

## Fase negativa (sem trunfo)

| # | Contrato | Penalização | Total |
|---|----------|-------------|-------|
| 1 | Não fazer vazas | 20/vaza | 260 |
| 2 | Não fazer copas | 20/copa | 260 |
| 3 | Não fazer homens (K+V) | 30/homem | 240 |
| 4 | Não fazer damas | 50/dama | 200 |
| 5 | Não fazer K♥ | 160 | 160 |
| 6 | Não fazer duas últimas | 90/vaza (×2) | 180 |

## Festas (fase positiva)

- Ordem = ordem de jogo (começa quem tirou K♥)
- **Positiva:** +25/vaza (325 total)
- **Negativa (nulos):** cada jogador `325 − 75×vazas`; total da festa = 325
- Opções do dono: trunfo, sem trunfo, nulos, 4×3×3, leilão

## Leilão

- Preferência sequencial (jogador a seguir ao dono)
- Positivo: oferta 1–8 vazas; dono fica sempre com total oferecido; incumprimento −25/vaza
- Negativo: surplus de vazas para o dono vale +75 cada

## UI

- Popup tabela após cada jogo
- Nome do contrato + índice na mesa

## Detalhe contabilístico

Ver exemplos numéricos em [`king-scoring-examples.md`](king-scoring-examples.md) (festa negativa, leilão).
