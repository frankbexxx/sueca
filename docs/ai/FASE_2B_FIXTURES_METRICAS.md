# Fase 2B — Fixtures Prioritários (exemplos avaliáveis)

Documento de saída da **Fase 2B** do [ROADMAP_AI](ROADMAP_AI.md).

**Prioridades:** [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md) · **Catálogo:** [FASE_1_METRICAS.md](FASE_1_METRICAS.md)  
**Arquivo (fixtures diferidos):** [FASE_2B_ARQUIVO_FIXTURES.md](FASE_2B_ARQUIVO_FIXTURES.md)  
**Data:** 2026-05-31  
**Scope:** 20 fixtures jogo-específicos + 3 transversais — **sem código**, **sem JSON**.

---

## Como ler este documento

Cada secção é um **fixture** alinhado com a lista Fase 2A. Formato: boa / média / má, linguagem de mesa primeiro.

Notação: `A♠` = Ás de espadas; `7♦` = manilha; trunfo Sueca indicado explicitamente.

| Jogo | Fixtures | Medium | Hard |
|------|----------|--------|------|
| Sueca | 5 | S08, S16, S19, S12 | S25 |
| Spades | 5 | SP01, SP06, SP09, SP08 | SP14 |
| Hearts | 5 | H01, H05, H13, H11 | H10 |
| King | 5 | K00, K02, K03, K01 | K10 |
| Transversal | 3 | T01, T04, T06 | — |
| **Total** | **23** | | |

---

# Sueca

## Ganhar com carta mínima (com risco de corte)

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Parceiro liderou `Q♦`. Adversário seguiu `K♦`. É a tua vez; **ainda jogam Norte e Este** (podem ter trunfo = copas).
* **Contrato / contexto:** Vaza vale pontos; queres ganhar para a equipa.
* **Mão do jogador:** `A♦` `9♦` `3♣` …
* **Vaza actual:** `Q♦` — `K♦`
* **Cartas legais:** `A♦` `9♦` (seguir ouros)
* **Boa jogada:** `9♦` se corte improvável; **neste fixture, corte possível:** `3♣` (descarte — poupar Ás)
* **Jogada média:** `9♦` quando corte é incerto
* **Má jogada:** `A♦` com void de copas provável à esquerda
* **Razão curta:** Ganhar barato só quando desejável **e** risco de corte aceitável.
* **Dados necessários para avaliar automaticamente:** trick; ordem de jogo; trunfo; voids inferidos.
* **Avaliação automática:** parcial
* **ID:** S08 · T04

---

## Nunca abrir com manilha antes do Ás sair

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Lideras. Trunfo = espadas. Tens `7♦` e `4♦` em ouros; **Ás de ouros ainda não saiu**.
* **Contrato / contexto:** Primeiras vazas da ronda.
* **Mão do jogador:** `7♦` `4♦` `J♠` …
* **Vaza actual:** vazia.
* **Cartas legais:** todas.
* **Boa jogada:** `4♦`
* **Jogada média:** `J♠` (side suit aceitável se ouros era opção)
* **Má jogada:** `7♦`
* **Razão curta:** Manilha de ouros é controlo; Ás de ouros ainda pode estar na mesa.
* **Dados necessários para avaliar automaticamente:** rank; naipe; registo de Ás de ouros jogado.
* **Avaliação automática:** sim (com tracking de Ás por naipe)
* **ID:** S16

---

## Dar pontos ao parceiro só com vaza segura

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Parceiro liderou e está a ganhar com `A♣`. Tu tens `K♣` e `2♣`. Trick sem trunfo.
* **Contrato / contexto:** Vaza **já segura** para a equipa.
* **Mão do jogador:** `K♣` `2♣` …
* **Vaza actual:** `A♣` (parceiro a ganhar)
* **Cartas legais:** `K♣` `2♣`
* **Boa jogada:** `2♣`
* **Jogada média:** `5♣` se tivesses (ainda baixo)
* **Má jogada:** `K♣` (roubar ou gastar figura)
* **Razão curta:** Parceiro ganha; não subir.
* **Dados necessários para avaliar automaticamente:** winner actual; seat parceiro.
* **Avaliação automática:** sim
* **ID:** S19 · T05

---

## Cortar com trunfo mínimo que chega

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Lideraram `A♥`. Seguiste `7♥`. Adversário ganha com `K♥`. Tens trunfo copas: `5♣` e `J♣`. **Void em copas** não — seguiste copas. Cenário alternativo: **void em copas**, trick em ouros, podes cortar.
* **Contrato / contexto:** Trunfo = copas. Precisas ganhar a vaza para a equipa.
* **Mão do jogador:** `5♣` `J♣` …
* **Vaza actual:** `A♦` — `K♦` (ouros; tu void em ouros)
* **Cartas legais:** `5♣` `J♣` (cortar)
* **Boa jogada:** `5♣`
* **Jogada média:** `J♣` se `5♣` não ganha
* **Má jogada:** `J♣` quando `5♣` bastava
* **Razão curta:** Trunfo mínimo que vence; não gastar figura de trunfo.
* **Dados necessários para avaliar automaticamente:** trick; trunfo; winners legais na mão.
* **Avaliação automática:** sim
* **ID:** S12

---

## Destrunfar sem prejudicar o parceiro

* **Jogo:** Sueca
* **Nível:** Hard
* **Situação:** Tens `A♣` trunfo (copas) e parceiro **void em copas** com mão longa em ouros. Parceiro precisa de **entrada** em ouros.
* **Contrato / contexto:** Destrunfar `A♣` deixa parceiro cortar ouros depois.
* **Mão do jogador:** `A♣` `6♣` + ouros
* **Vaza actual:** lideras — trick vazio
* **Cartas legais:** todas
* **Boa jogada:** `A♣` (destrunfar a favor)
* **Jogada média:** liderar ouro médio (parceiro não entra)
* **Má jogada:** guardar `A♣` até parceiro ficar sem corte
* **Razão curta:** Destrunfar **ajuda** parceiro void.
* **Dados necessários para avaliar automaticamente:** void parceiro inferido; trunfos restantes.
* **Avaliação automática:** parcial
* **ID:** S25

**Contra-exemplo (má):** parceiro tem copas longas e destrunfas `A♣` → adversário corta. Classificação: **má**.

---

# Spades

## Bid conservador (inclui meia-vaza Dama)

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Fase de bid. Mão: `A♠` `K♠` `Q♠`, `A♥`, `K♦`, resto médio-baixo. **Q♠ ≈ meia-vaza**, não trick garantido.
* **Contrato / contexto:** Bid individual antes do play.
* **Mão do jogador:** (como acima)
* **Vaza actual:** N/A (pré-jogo)
* **Cartas legais:** N/A — escolha de **bid**
* **Boa jogada:** Bid **4** (A/K♠ + A/K side + ½ Q♠)
* **Jogada média:** Bid **5** (tratar Q♠ como 1 pleno)
* **Má jogada:** Bid **7**
* **Razão curta:** Contagem conservadora; Dama espadas pode perder para A/K adversários.
* **Dados necessários para avaliar automaticamente:** mão; bid vs tricks reais (pós-mão).
* **Avaliação automática:** parcial
* **ID:** SP01

---

## Proteger parceiro — jogar baixo

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Parceiro ganha trick com `A♠`. Tens `K♠` `3♣`.
* **Contrato / contexto:** Trick em curso.
* **Mão do jogador:** `K♠` `3♣`
* **Vaza actual:** `A♠` (parceiro high)
* **Cartas legais:** `K♠` `3♣`
* **Boa jogada:** `3♣`
* **Jogada média:** `5♠` off-suit se existisse
* **Má jogada:** `K♠` (overtrump parceiro)
* **Razão curta:** Não roubar parceiro.
* **Dados necessários para avaliar automaticamente:** winner actual; seat parceiro.
* **Avaliação automática:** sim
* **ID:** SP06 · T05

---

## Evitar bags depois de cumprir bid

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Dupla bid **6**, já ganharam **6 tricks**. És o último a jogar; podes ganhar trick extra com `A♠`.
* **Contrato / contexto:** `teamTricks >= teamBid`.
* **Mão do jogador:** `A♠` + lixo
* **Vaza actual:** parceiro ganha com `K♥`; tens `A♠` legal
* **Cartas legais:** `A♠` ou descarte
* **Boa jogada:** Descarte baixo (perder trick) — ver também **T06**
* **Jogada média:** Ganhar se evita under noutro lado (raro)
* **Má jogada:** `A♠` → bag
* **Razão curta:** Bid cumprido; overtrick desnecessário custa bags.
* **Dados necessários para avaliar automaticamente:** teamTricks; teamBid; bags.
* **Avaliação automática:** sim
* **ID:** SP09 · SP11 · T06

---

## Cortar com espada mínima

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Led `♥`. Void corações. Trick sem espadas ainda. Tens `4♠` `J♠`. Abaixo do bid — precisas do trick.
* **Contrato / contexto:** Precisas de vaza para cumprir bid.
* **Mão do jogador:** `4♠` `J♠`
* **Vaza actual:** `A♥` — `7♥`
* **Cartas legais:** `4♠` `J♠`
* **Boa jogada:** `4♠`
* **Jogada média:** `J♠` se trick grande
* **Má jogada:** `A♠` num trick de 1 pt
* **Razão curta:** Espada mínima que ganha.
* **Dados necessários para avaliar automaticamente:** led suit; spades in trick; hand.
* **Avaliação automática:** sim
* **ID:** SP08

---

## Quebrar bid adversária alta (8+)

* **Jogo:** Spades
* **Nível:** Hard
* **Situação:** Adversário bid **9**; match apertado. Podes forçar trick com `K♠` que quebra contrato deles, mesmo arriscando **bag** teu (bid já cumprido).
* **Contrato / contexto:** Score-aware; modo agressivo.
* **Mão do jogador:** `K♠` …
* **Vaza actual:** adversário a ganhar
* **Cartas legais:** `K♠` ou descarte
* **Boa jogada:** `K♠` para quebrar 9 adversário
* **Jogada média:** Descarte se score não justifica
* **Má jogada:** Poupar bag com adversário a caminho de 9
* **Razão curta:** Quebrar contrato adversário > evitar 1 bag.
* **Dados necessários para avaliar automaticamente:** bids adversários; tricks; score.
* **Avaliação automática:** parcial
* **ID:** SP14 · SP16

---

# Hearts

## Evitar pontos — objectivo geral

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Segues `♣`. Tens `K♥` `2♣`. Trick sem pontos ainda.
* **Contrato / contexto:** Minimizar pontos da ronda.
* **Mão do jogador:** `K♥` `2♣`
* **Vaza actual:** `5♣` — …
* **Cartas legais:** `2♣` (seguir naipe)
* **Boa jogada:** `2♣` — **não** ganhar trick desnecessário
* **Jogada média:** Ganhar trick vazio com figura
* **Má jogada:** Capturar trick que depois força slough de `K♥`
* **Razão curta:** Pontos vêm de ♥ e Q♠; evitar vazas inúteis.
* **Dados necessários para avaliar automaticamente:** penalty cards in trick; points taken.
* **Avaliação automática:** parcial
* **ID:** H01

---

## Passar cartas perigosas

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Pass left. Mão: `Q♠` `A♠` `K♥` `Q♥` `2♣` …
* **Contrato / contexto:** Pass 3 cartas.
* **Mão do jogador:** (como acima)
* **Vaza actual:** pass
* **Cartas legais:** escolher 3 para pass
* **Boa jogada:** Pass `Q♠` `A♠` `K♥` (ou Q♥)
* **Jogada média:** Pass 2 perigos + 1 lixo
* **Má jogada:** Pass só lixo, ficar com Q♠
* **Razão curta:** Desfazer perigo antes do play.
* **Dados necessários para avaliar automaticamente:** pass cards; penalty score.
* **Avaliação automática:** sim
* **ID:** H05

---

## Limpar perigo em vaza nossa sem pontos

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Trick **100% teu**: lideraste `2♣`, todos seguiram ♣, **zero pontos**. Tens `Q♠` e `2♦`.
* **Contrato / contexto:** **Não** «ganhar barato» — **limpar perigo** (contraste T04).
* **Mão do jogador:** `Q♠` `2♦`
* **Vaza actual:** `2♣`–`4♣`–`6♣` — tu a ganhar
* **Cartas legais:** `Q♠` `2♦`
* **Boa jogada:** `Q♠` (slough perigo)
* **Jogada média:** `K♥` se tivesses
* **Má jogada:** `2♦` e guardar Q♠
* **Razão curta:** Vaza nossa sem pontos = limpar bomba.
* **Dados necessários para avaliar automaticamente:** trick points = 0; winner = self.
* **Avaliação automática:** parcial
* **ID:** H13 · T07

---

## Q♠ — perigo máximo (play)

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Trick 5. **Espadas lideradas** por adversário. Tens `Q♠` `2♠` `4♥`. Q♠ = **20 pts** se ficas com ela no fim.
* **Contrato / contexto:** Play (pós-pass); Q♠ ainda na mão.
* **Mão do jogador:** `Q♠` `2♠` `4♥`
* **Vaza actual:** `A♠` led — …
* **Cartas legais:** `Q♠` `2♠` (seguir espadas)
* **Boa jogada:** `2♠` (não ganhar; poupar Q♠ se possível)
* **Jogada média:** `Q♠` se trick já perdido e slough inevitável
* **Má jogada:** `Q♠` ganhando trick desnecessário
* **Razão curta:** Q♠ é a maior bomba da ronda.
* **Dados necessários para avaliar automaticamente:** Q♠ in trick/hand; points taken.
* **Avaliação automática:** parcial
* **ID:** H11

---

## Bloquear shoot the moon

* **Jogo:** Hearts
* **Nível:** Hard
* **Situação:** Adversário levou 5♥ seguidos. Tens `2♥` legal num trick que ele vai ganhar.
* **Contrato / contexto:** Sacrificar pontos para bloquear moon.
* **Mão do jogador:** `2♥` …
* **Vaza actual:** adversário high
* **Cartas legais:** `2♥` ou slough baixo noutro naipe
* **Boa jogada:** Dar `2♥` ao líder moon (+2 pts) vs moon −26
* **Jogada média:** Descartar 10♥ (+10) ainda bloqueia
* **Má jogada:** Deixar moon completar
* **Razão curta:** +2 ≪ −26 para os outros.
* **Dados necessários para avaliar automaticamente:** hearts per player; moon still possible.
* **Avaliação automática:** parcial
* **ID:** H10

---

# King

**Hierarquia:** (1) contrato → (2) obrigação legal → (3) penalização → (4) risco 2–3 vazas → (5) carta.

## Respeitar contrato activo (meta)

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer copas (−20/copa)
* **Situação:** Led `♠`. Tens `K♥` `5♥` `2♣`. Jogador trata o jogo como «positivo» e quer **ganhar** trick — erro de meta.
* **Mão do jogador:** `K♥` `5♥` `2♣`
* **Vaza actual:** `A♠` — …
* **Cartas legais:** `2♣` (não ♥)
* **Boa jogada:** `2♣` — **objectivo = evitar copas**, não ganhar vaza
* **Jogada média:** Ganhar trick vazio com figura off-suit
* **Má jogada:** `K♥` descarte voluntário (viola K03 **e** K00)
* **Razão curta:** Contrato activo define objectivo antes de qualquer «ganhar barato».
* **Dados necessários para avaliar automaticamente:** contractId; penalty captured; legal moves.
* **Avaliação automática:** sim
* **ID:** K00 · K03

---

## K♥ — primeira oportunidade legal

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer K♥ (−160)
* **Situação:** **Primeira vez** legal: led `♥`, tens `K♥` `3♥`.
* **Regras:** K♥ **obrigatório** na 1.ª oportunidade legal ([`king.md`](../rules/king.md)).
* **Mão do jogador:** `K♥` `3♥`
* **Vaza actual:** `2♥` led
* **Cartas legais:** `K♥` `3♥`
* **Boa jogada:** `K♥` (cumpre obrigação — **não** esconder)
* **Jogada média:** —
* **Má jogada:** `3♥` escondendo K♥ (ilegal)
* **Razão curta:** Regra do jogo > minimizar risco imediato.
* **Dados necessários para avaliar automaticamente:** K♥ played flag; first legal opportunity.
* **Avaliação automática:** sim
* **ID:** K02

---

## Não puxar copas com alternativa

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer copas (−20/copa)
* **Situação:** Led `♠`. Tens `K♥` `5♥` `2♣`. **Podes** seguir ♣ ou descartar — tens ♣ legal (não void).
* **Regras:** Não puxar copas se tiveres outro naipe legal.
* **Mão do jogador:** `K♥` `5♥` `2♣`
* **Vaza actual:** `A♠` — …
* **Cartas legais:** `2♣` (descarte — **não** ♥)
* **Boa jogada:** `2♣`
* **Jogada média:** `5♥` só se void em ♣/♦/♠ (forçado)
* **Má jogada:** `K♥` descarte voluntário com ♣ legal
* **Razão curta:** Proibição de puxar ♥; regra autor King.
* **Dados necessários para avaliar automaticamente:** led suit; legal moves; heart pulled flag.
* **Avaliação automática:** sim
* **ID:** K03

---

## Descarte consciente por contrato (negativo)

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer damas (−50/dama)
* **Situação:** Trick perdido. Descartas off-suit. Tens `Q♦` `J♠` `4♣`.
* **Mão do jogador:** `Q♦` `J♠` `4♣`
* **Vaza actual:** adversário ganhando `♥`
* **Cartas legais:** `Q♦` `J♠` `4♣`
* **Boa jogada:** `4♣` ou `J♠` — **não** `Q♦`
* **Jogada média:** `J♠` (homem ≠ dama neste contrato)
* **Má jogada:** `Q♦` (−50)
* **Razão curta:** Slough alinhado ao mapa de penalização do contrato (K01).
* **Dados necessários para avaliar automaticamente:** contract; isQueen(card); queens taken.
* **Avaliação automática:** sim
* **ID:** K01 · K08 · T08

---

## Duas últimas — trick 11 define quem abre 12

* **Jogo:** King PT
* **Nível:** Hard
* **Contrato activo:** Não fazer duas últimas (−90/vaza ×2)
* **Situação:** **Trick 11** (penúltimo). Quem ganha trick 11 **abre trick 12**. Podes forçar adversário a ganhar 11.
* **Mão do jogador:** mix baixa/média
* **Vaza actual:** trick 10 completado; 11 a começar
* **Cartas legais:** depende da mão
* **Boa jogada:** Perder trick 11 **de propósito** com carta baixa
* **Jogada média:** Ganhar 11 se mão fraca para 12
* **Má jogada:** Ganhar 11 **e** 12
* **Razão curta:** 11.ª define líder da 12.ª — crítico neste contrato.
* **Dados necessários para avaliar automaticamente:** trickNumber; trick 11/12 winners.
* **Avaliação automática:** parcial
* **ID:** K10 · K05

---

# Métricas transversais

## Jogada legal

* **Jogo:** Todos
* **Nível:** Medium
* **Situação:** Led `♣`. Tens `2♣` `5♥` `K♦`. **Obrigatório** seguir copas… na verdade led ♣ — tens `2♣` legal.
* **Contrato / contexto:** Regra base; pré-condição do avaliador.
* **Mão do jogador:** `2♣` `5♥` `K♦`
* **Vaza actual:** `A♣` led
* **Cartas legais:** `2♣` apenas (seguir naipe)
* **Boa jogada:** `2♣`
* **Jogada média:** —
* **Má jogada:** `5♥` ou `K♦` (**ilegal** — não segue naipe)
* **Razão curta:** Avaliador rejeita jogada ilegal antes de métricas estratégicas.
* **Dados necessários para avaliar automaticamente:** `legalMoves`; `canPlayCard`.
* **Avaliação automática:** sim
* **ID:** T01 · G01

---

## Ganhar barato só quando ganhar é desejável

* **Jogo:** Sueca (positivo) vs Hearts (negativo)
* **Nível:** Medium
* **Situação A (Sueca):** Queres trick equipa — ver fixture **S08**.
* **Situação B (Hearts):** Vaza nossa sem pontos — **limpar** Q♠, não «ganhar barato» — ver **H13**.
* **Contrato / contexto:** Objectivo do jogo define se «ganhar» é bom.
* **Boa jogada:** Sueca: winner mínimo; Hearts: slough perigo
* **Jogada média:** Aplicar T04 cegamente em Hearts
* **Má jogada:** Hearts: ganhar com 2♣ guardando Q♠
* **Razão curta:** T04 é condicional ao objectivo (King positivo: ver K09 na Fase 2B estendida).
* **Dados necessários para avaliar automaticamente:** variant; trick points; desired outcome.
* **Avaliação automática:** parcial
* **ID:** T04

---

## Jogar baixo para perder / evitar penalização

* **Jogo:** Spades (pós-bid) · King negativos
* **Nível:** Medium
* **Situação A (Spades):** Bid cumprido — ver fixture **SP09** (descarte vs `A♠`).
* **Situação B (King):** Contrato não fazer vazas — jogar mais baixo legal para **não** ganhar trick.
* **Contrato / contexto:** Objectivo = perder vaza ou evitar bag/penalização.
* **Boa jogada:** Carta mais baixa legal que **não** ganha trick
* **Jogada média:** Carta média
* **Má jogada:** Ganhar trick quando objectivo é perder
* **Razão curta:** T06 liga SP09, King negativos e nulos.
* **Dados necessários para avaliar automaticamente:** teamTricks vs bid OR negative contract OR tricks won.
* **Avaliação automática:** sim (Spades); parcial (King contexto)
* **ID:** T06

---

# Resumo Fase 2B

| Métrica | Avaliação auto | Fixture |
|---------|----------------|---------|
| T01 | sim | Transversal |
| Sueca S08–S19, S12, S25 | sim–parcial | 5 |
| Spades SP01, SP06, SP09, SP08, SP14 | sim–parcial | 5 |
| Hearts H01, H05, H13, H11, H10 | sim–parcial | 5 |
| King K00, K02, K03, K01, K10 | sim–parcial | 5 |
| T04, T06 | parcial–sim | Transversal |

**Próximo passo (Fase 3):** logger com campos P0 de [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md).

**Fixtures diferidos:** [FASE_2B_ARQUIVO_FIXTURES.md](FASE_2B_ARQUIVO_FIXTURES.md) (corpus ~40 fixtures da antiga Fase 2).

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Subconjunto prioritário 23 fixtures (Fase 2A) |
