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

As regras variam por mesa. Para este projeto, definimos dois modos suportados explicitamente:

## Metodo A (padrao de implementacao inicial)

- Distribui-se 1 carta de cada vez ate 10 por jogador.
- Ordem de distribuicao definida pela implementacao (consistente e documentada no motor).
- O naipe de trunfo e determinado pela carta de referencia definida no processo (na implementacao atual: ultima carta distribuida).

## Metodo B (variante suportada)

- O dealer recebe primeiro a carta que fixa o trunfo.
- Completa-se a distribuicao ate todos terem 10 cartas.

## Requisito canonico para ambos

- No inicio da mao, cada jogador tem exatamente 10 cartas.
- O trunfo da mao fica fixo ate ao fim da mao.
- Qualquer detalhe de ordem (sentido, primeiro a receber) deve ser deterministicamente especificado pelo ruleset e testado.

## 5) Ordem de jogo da vaza

- Cada vaza tem 4 jogadas (1 por jogador).
- O jogador que abre (lidera) define o naipe da vaza.
- Os restantes jogam em ordem de turno.

## Quem abre

- Primeira vaza: regra configurada pelo ruleset (neste projeto, atualmente: jogador a direita do dealer).
- VazAs seguintes: vence a vaza anterior, abre a proxima.

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

