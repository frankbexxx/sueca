# Sueca portuguesa

Preset: `sueca-pt-normal`

Regras em vigor no jogo. O sentido de jogo e o alinhamento da distribuição descritos aqui são o modelo actual. Método A/B e um sentido de jogo fixo só à direita já não se jogam.

## Visão geral

- Quatro jogadores, duas equipas de dois. Os parceiros sentam-se frente a frente.
- Cada mão vale pontos de cartas. O baralho soma 120.
- A partida acaba quando uma equipa chega a 4 ou mais pontos de partida.

## Baralho, hierarquia e pontos

Baralho de 40 cartas: retiram-se 8, 9, 10 e os jokers. Naipes: paus, ouros, copas, espadas.

Cada jogador recebe 10 cartas.

| Carta | Força | Pontos |
|-------|-------|--------|
| Ás | mais forte | 11 |
| 7 | | 10 |
| Rei | | 4 |
| Valete | | 3 |
| Dama | | 2 |
| 6, 5, 4, 3, 2 | 6 mais forte que 2 | 0 |

Ordem de força, da mais fraca para a mais forte: 2, 3, 4, 5, 6, Dama, Valete, Rei, 7, Ás.

## Lugares e equipas

Os lugares são fixos.

| Índice | Lugar | Equipa |
|--------|-------|--------|
| 0 | Sul | com Norte |
| 1 | Oeste | com Este |
| 2 | Norte | com Sul |
| 3 | Este | com Oeste |

No jogo a solo, o humano senta-se a Sul, o parceiro a Norte, e os adversários a Este e a Oeste.

A direita da mesa, a partir de um lugar, é o lugar anti-horário: Sul → Este → Norte → Oeste. A esquerda é o lugar horário: Sul → Oeste → Norte → Este. Estas duas voltas não mudam com o sentido de jogo nem com a distribuição.

## Sentido de jogo

Escolhe-se para a partida e fica fixo até ao fim. O valor predefinido é pela direita.

| Sentido | Volta da mesa | Próximo lugar |
|---------|---------------|---------------|
| Pela direita | anti-horário | Este a seguir a Sul |
| Pela esquerda | horário | Oeste a seguir a Sul |

O sentido de jogo decide:

- quem abre a primeira vaza
- a ordem das jogadas dentro da vaza
- quem abre a vaza seguinte (o vencedor)
- para que lado roda o dealer na mão seguinte

Não decide quem baralha nem quem corta.

## Distribuição

O alinhamento escolhe-se em cada mão e é relativo ao sentido de jogo da partida. O valor predefinido é o mesmo sentido. Mudar o alinhamento não muda quem abre nem a ordem das vazas.

A distribuição é em blocos de 10. Cada jogador fica com 10 cartas. O trunfo fica fixo até ao fim da mão.

| Alinhamento | Sentido dos blocos | Quem recebe primeiro | Trunfo |
|-------------|--------------------|-----------------------|--------|
| Mesmo sentido | o sentido de jogo | o primeiro lugar nesse sentido, a seguir ao dealer | a última carta do dealer, virada |
| Sentido oposto | o sentido contrário ao jogo | o dealer | a primeira carta do dealer, virada |

### Mesmo sentido

1. Três blocos de 10 no sentido de jogo, a começar no lugar a seguir ao dealer e a terminar antes dele.
2. O dealer recebe 9 cartas e, por último, a carta virada.
3. Essa carta virada é a 10.ª do dealer e define o trunfo.

### Sentido oposto

1. A primeira carta, virada, é do dealer e define o trunfo. O dealer recebe mais 9.
2. Os outros três jogadores recebem um bloco de 10 cada, no sentido contrário ao jogo.
3. Quem abre a mão e a ordem das vazas mantêm-se.

## Embaralhar e cortar

Independente do sentido de jogo e do alinhamento.

- Quem baralha é o jogador à direita do dealer.
- Quem corta é o parceiro de quem baralha, que é também o jogador à esquerda do dealer.

Com o dealer a Sul: baralha Este, corta Oeste.

## Exemplo com o dealer a Sul

| Sentido de jogo | Alinhamento | Ordem dos blocos | Primeiro a jogar |
|-----------------|-------------|------------------|------------------|
| Pela direita | Mesmo | Este, Norte, Oeste, Sul | Este |
| Pela direita | Oposto | Sul, Oeste, Norte, Este | Este |
| Pela esquerda | Mesmo | Oeste, Norte, Este, Sul | Oeste |
| Pela esquerda | Oposto | Sul, Este, Norte, Oeste | Oeste |

Nas duas linhas «mesmo», o trunfo é a última carta de Sul. Nas duas linhas «oposto», o trunfo é a primeira carta de Sul.

Rotação do dealer a partir de Sul:

- Pela direita: Sul → Este → Norte → Oeste → Sul
- Pela esquerda: Sul → Oeste → Norte → Este → Sul

O primeiro a jogar da mão seguinte é sempre o lugar a seguir ao novo dealer, no sentido de jogo.

## A vaza

Cada vaza tem quatro jogadas, uma por jogador, no sentido de jogo.

- Quem abre pode jogar qualquer carta. O naipe dessa carta é o naipe da vaza.
- Quem tem esse naipe tem de o jogar.
- Quem não tem pode jogar qualquer carta, incluindo trunfo. Não é obrigatório cortar nem sobrepor um trunfo já jogado.
- Se houver trunfo na vaza, ganha o trunfo mais alto.
- Se não houver, ganha a carta mais alta do naipe de saída. Outros naipes não ganham.
- Quem ganha a vaza abre a seguinte.
- A mão tem dez vazas. Os pontos das quatro cartas ficam para a equipa do vencedor.

Uma jogada que não segue o naipe quando o jogador o tem é recusada. Não entra na vaza.

## Pontos da mão e da partida

No fim das dez vazas, os pontos de carta das duas equipas somam 120.

| Pontos de carta da equipa | Pontos de partida |
|---------------------------|-------------------|
| 61–90 | 1 |
| 91–119 | 2 |
| 120 (capote) | 4 |
| 60–60 | 0 nesta mão; ver abaixo |

A partida acaba quando uma equipa chega a 4 ou mais. Um escalão de 2 ou de 4, ou um dobro, pode ultrapassar 4.

## 60–60

Empate a 60 não dá pontos de partida a nenhuma equipa.

A mão seguinte que não seja outro 60–60 vale o dobro do escalão normal: 1 passa a 2, 2 passa a 4, e um capote passa a 8. Depois dessa mão, o dobro acaba.

Um novo 60–60 antes disso não sobe o factor. Continua a ser dobro, não quádruplo, até haver uma mão com vencedor.

## Legacy migration only

Partidas gravadas antes deste modelo podem ainda trazer Método A/B e um sentido absoluto de distribuição. Esses campos não se usam a jogar. Na leitura, convertem-se uma vez para sentido de jogo e alinhamento. Combinações antigas que não têm uma conversão clara não se jogam como um segundo regulamento: ou a mão é reposta no alinhamento «mesmo sentido», ou a gravação é recusada se a mão já ia a meio.
