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
| 3 | Não fazer damas | 50/dama | 200 |
| 4 | Não fazer homens (K+V) | 30/homem | 240 |
| 5 | Não fazer K♥ | 160 | 160 |
| 6 | Não fazer duas últimas | 90/vaza (×2) | 180 |

## Festas (fase positiva)

- Ordem = ordem de jogo (começa quem tirou K♥)
- **Positiva:** +25/vaza (325 total)
- **Negativa (nulos):** cada jogador `325 − 75×vazas`; total da festa = 325
- **Leilão sempre primeiro** (3 licitadores); **13 cartas distribuídas** antes do leilão
- Se **todos passarem**, o beneficiário decide (trunfo / sem trunfo / nulos / 4×3×3)
- Se houver **qualquer oferta** (mesmo 1 positiva), o beneficiário **negocia e pode aceitar**

## Leilão

- Preferência sequencial (jogador a seguir ao beneficiário); equivalência **3 positivas = 1 nulo**
- Positivo: oferta 1–8 vazas; beneficiário recebe sempre o contratado; incumprimento −25/vaza ao leiloado
- Nulo: ajuste inicial (+475 beneficiário, +175 leiloado para 2 nulos) ou equivalente no fim
- **8 ou nulos**: beneficiário pode forçar 8 positivas; se oferecidas, é obrigado a aceitar
- Proibição de puxar Copas (com outro naipe); obrigação de jogar K♥ na 1.ª oportunidade legal (negativos relevantes)

## UI

- Popup viragem K♥ no arranque (automática na mesa, sem contador total)
- Popup **folha de pontuação** 10×4 após cada jogo + detalhe da ronda
- Histórico colapsável in-game
- Leilão: aceitar / recusar / **pedir subida** / 8 ou nulos
- Festa: **bottom sheet** (~45vh) com leilão/negociação; mão de 13 cartas scrollável por cima (consulta read-only)
- **Terminar cedo:** quando a penalização do negativo está esgotada (ex.: K♥ tomado, 13 copas, 4 damas, 8 homens), o jogo pergunta se termina a ronda; recusar = vazas mortas sem alterar pontos
- RulesSheet com secções completas (preset `king-pt-normal`)

## Detalhe contabilístico

Ver exemplos numéricos em [`king-scoring-examples.md`](king-scoring-examples.md) (festa negativa, leilão).
