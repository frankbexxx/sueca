# Sueca Portuguesa - Regras Canonicas (Fonte de Verdade)

Preset id: `sueca-pt-normal`

Status: draft canonico para alinhar engine e testes  
Date: 2026-04-24

## 1) Visao geral

- Jogo de vazas para 4 jogadores, em 2 equipas de 2.
- Parceiros sentam-se frente a frente.
- Objetivo da mao: fazer mais pontos em cartas (total disponivel: 120).
- Objetivo da partida: acumular "vitorias de mao" ate ao limite acordado (neste projeto: primeiro a 4).

## 2) Baralho, hierarquia e pontos

- Baralho: 40 cartas (retiram-se 8, 9, 10 e jokers).
- Naipes: paus, ouros, copas, espadas.
- Hierarquia (fraca -> forte):
  - 2 < 3 < 4 < 5 < 6 < Dama < Valete < Rei < 7 < As
- Pontuacao por carta:
  - As = 11
  - 7 = 10
  - Rei = 4
  - Valete = 3
  - Dama = 2
  - 6, 5, 4, 3, 2 = 0
- Soma total do baralho = 120 pontos.

## 3) Formacao e lugares

- Existem 4 lugares fixos: Norte, Este, Sul, Oeste.
- Equipas sao formadas por jogadores opostos:
  - Norte <-> Sul
  - Este <-> Oeste
- No modo single-player local deste projeto:
  - Jogador humano em Sul
  - Parceiro em Norte
  - Oponentes em Este e Oeste

## 4) Distribuicao e trunfo

Geometria de lugares (motor / UX-SEAT-01): indice `0` Sul, `1` Oeste, `2` Norte, `3` Este.
A **direita fisica** do dealer e `(dealer + 3) % 4` (ex.: Sul → Este).
A **esquerda fisica** do dealer e `(dealer + 1) % 4` (ex.: Sul → Oeste).

Distribuicao e **sempre em blocos de 10 cartas** por jogador (cada um recebe as 10
antes de passar ao seguinte). A animacao pode mostrar cartas uma a uma; a ordem
de atribuicao no motor e a do bloco.

### Sentido de distribuicao (apenas a distribuicao)

| Valor no motor | Sentido | Primeiro a receber (Metodo A) |
|----------------|---------|--------------------------------|
| `right` (padrao) | Anti-horario / a direita | Direita fisica do dealer |
| `left` | Horario / a esquerda | Esquerda fisica do dealer |

O sentido de distribuicao **nao** controla o sentido de jogo nem quem abre.

### Metodo A (tradicional / padrao)

1. Bloco de 10 ao jogador a **direita fisica** do dealer.
2. Seguinte anti-horario: bloco de 10.
3. Seguinte: bloco de 10.
4. Dealer: bloco de 10.
5. **Trunfo** = ultima carta distribuida (ultima do ultimo bloco).

### Metodo B (variante alternativa)

1. Dealer recebe o **primeiro** bloco de 10; **trunfo** = primeira / topo do baralho.
2. Os restantes recebem blocos de 10 no sentido configurado (tipicamente horario / `left`).
3. Depois da distribuicao: quem abre e o sentido de jogo **nao mudam**.

### Requisito canonico para ambos

- No inicio da mao, cada jogador tem exatamente 10 cartas.
- O trunfo da mao fica fixo ate ao fim da mao.

## 5) Ordem de jogo da vaza

- Cada vaza tem 4 jogadas (1 por jogador).
- O jogador que abre (lidera) define o naipe da vaza.
- Os restantes jogam em ordem de turno.

### Sentido de jogo (independente da distribuicao)

- Padrao: **anti-horario / a direita** = `(jogador + 3) % 4` na geometria acima.
- Nao e alterado pelo Metodo A/B nem pelo sentido de distribuicao.

### Quem abre

- Primeira vaza: **sempre** o jogador a **direita fisica** do dealer (`(dealer + 3) % 4`).
- Vazas seguintes: quem venceu a vaza anterior abre a proxima.

### Rotacao do dealer

- Entre maos, o dealer passa a **direita fisica**: `novoDealer = (dealer + 3) % 4`.
- Sequencia de exemplo a partir do Sul: Sul → Este → Norte → Oeste → Sul.
- Consistente com o sentido de jogo (anti-horario / a direita); independente do Metodo A/B.

## 6) Regra de seguir naipe (obrigatoria)

- Se o jogador tiver carta do naipe liderado, tem de jogar esse naipe.
- Se nao tiver, pode jogar qualquer carta (incluindo trunfo).
- Nao existe obrigacao de "cortar" nem de "montar" no trunfo nesta baseline.

## 7) Quem ganha a vaza

1. Se existir pelo menos um trunfo na vaza, ganha o trunfo mais alto.
2. Se nao houver trunfo, ganha a carta mais alta do naipe liderado.
3. Cartas de naipes diferentes do liderado (sem trunfo) nao podem ganhar.

O vencedor recolhe as 4 cartas da vaza para a sua equipa (ou pilha de equipa).

## 8) Contagem de pontos da mao

- Soma-se a pontuacao das cartas ganhas por cada equipa.
- Invariante obrigatoria: `pontos_equipa1 + pontos_equipa2 = 120`.

## 9) Resultado da mao e valor em vitorias

Para este projeto, fixamos a seguinte regra (a alinhar por teste):

- 61 a 90 pontos: 1 vitoria de mao
- 91 a 119 pontos: 2 vitorias de mao
- 120 pontos: 4 vitorias de mao ("capote/perfeita")
- 60-60: empate de mao

## Empate 60-60

- Convenio adotado no projeto: empate "transporta valor" para a mao seguinte.
- Na implementacao atual existe intencao de "proxima mao vale dobro"; esta regra deve ser implementada explicitamente e testada end-to-end.

## 10) Fim de partida

- A partida termina quando uma equipa atinge ou ultrapassa 4 vitorias de mao.
- Essa equipa e declarada vencedora da partida.

## 11) Renuncia (caso-limite obrigatorio)

Definicao:

- Renuncia ocorre quando um jogador nao segue o naipe liderado tendo carta desse naipe.

Politica para este projeto (canonica para engine):

- A deteccao deve ser automatica (engine valida jogada).
- Jogada ilegal por renuncia nao deve ser aceite em runtime normal.
- Para modo "desafio de renuncia" (opcional futuro), deve existir mecanismo auditavel de historico e penalizacao configuravel.

Enquanto nao existir modo de desafio formal, a regra minima obrigatoria e: **renuncia nao passa pela validacao de jogada**.

## 12) Outros casos-limite obrigatorios para testes

1. **10 cartas por jogador no inicio**  
   Sempre verdadeiro apos distribuir.

2. **120 pontos totais por mao**  
   Sempre verdadeiro apos 10 vazas.

3. **Trunfo fixo por mao**  
   Nao pode mudar no meio da mao.

4. **Primeira jogada de vaza**  
   Qualquer carta da mao do lider e valida.

5. **Obrigacao de seguir naipe**  
   Se tem naipe liderado, jogar fora de naipe e invalido.

6. **Sem naipe liderado**  
   Qualquer carta e valida.

7. **Determinacao de vencedor da vaza com trunfo**  
   Trunfo mais alto vence, independentemente do naipe liderado.

8. **Determinacao sem trunfo na vaza**  
   Ganha a mais alta do naipe liderado.

9. **Transicao de lider**  
   Vencedor da vaza anterior abre a seguinte.

10. **Fim da mao apos 10 vazas**  
    Nao pode haver vaza 11.

11. **Atribuicao de vitorias por escaloes (61/91/120)**  
    Deve bater exatamente com tabela definida.

12. **Empate 60-60**  
    Comportamento de carry/valor acumulado testado explicitamente.

## 13) Convenios de implementacao (para evitar ambiguidade)

- O ruleset deve exportar funcoes puras:
  - `deal`
  - `validateMove`
  - `applyMove`
  - `isTrickComplete`
  - `trickWinner`
  - `scoreHand`
  - `isGameEnd`
- Sem dependencia de UI, sem side effects de DOM, sem `Math.random` nao-seeded.
- Toda variacao regional deve ser modelada por configuracao de ruleset (nao por ifs espalhados na UI).

## 14) Itens ainda a confirmar contigo (checkpoint funcional)

Mesmo com este baseline, existem variacoes regionais reais. Antes de fechar Phase 2, confirmar:

- Sentido de distribuicao e de jogo que queres como oficial no produto.
- Regra formal de empate 60-60 (dobra so a proxima mao ou acumula cadeia).
- Terminologia de vitoria especial (capote/perfeita) que queres mostrar na UI.

Esta pagina passa a ser a referencia unica para os testes do `engine-sueca`.

