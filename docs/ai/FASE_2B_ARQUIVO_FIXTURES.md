# Fase 2B — Arquivo de Fixtures (diferidos)

Fixtures **fora** da seleção inicial de 23 definida em [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md).

**Fixtures activos (prioritários):** [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md)  
**Origem:** antiga Fase 2 completa (40 fixtures) — preservada para Fase 2B estendida / Fase 5 v2.

**Data arquivo:** 2026-05-31 · **Scope:** documentação apenas — **sem código**.

---

## Índice do que ficou arquivado (não está na seleção 2B inicial)

| Jogo | IDs / temas arquivados |
|------|------------------------|
| Sueca | S04 singleton, S23 escola, S10 memória, S24 horizonte 2–3 vazas |
| Spades | SP01 meia-vaza (isolado), SP15 destrunfar, SP03 nil |
| Hearts | H12 meninos, H06 void pass, H09 detect moon |
| King | negativo vazas, homens, positivo, nulos, festa/leilão, sintético |
| Transversal | T07 limpar, T08 perigo contextual, T09 void, T10/T11 memória |

**Nota:** Alguns fixtures abaixo **duplicam** métricas já refinadas em FASE_2B (ex.: S08, K02). Preferir sempre a versão 2B para avaliador v0.

---

## Como ler este documento (corpus original)

Cada secção é um **fixture**: situação concreta de mesa com boa / média / má.

Notação: `A♠` = Ás de espadas; `7♦` = manilha; trunfo Sueca indicado explicitamente.

---

# Sueca

## Abrir carta seca para criar corte

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Tu lideras a vaza (trick vazio). Trunfo = copas. Tens singleton em ouros (só o `8♦`) e três copas incluindo `K♣`/`5♣`.
* **Contrato / contexto:** Ronda a meio; parceiro na tua equipa; ainda há jogadores por jogar depois de ti nesta vaza.
* **Mão do jogador (resumo):** `8♦` (singleton), `K♣` `5♣` `2♣`, mais paus baixos.
* **Vaza actual:** vazia — és o líder.
* **Cartas legais:** qualquer carta da mão.
* **Boa jogada:** `8♦`
* **Jogada média:** `2♣` (puxar naipe longo de copas sem necessidade)
* **Má jogada:** `K♣` (gastar trunfo alto cedo sem plano de corte)
* **Razão curta:** Singleton abre o naipe para cortares depois; não gastas trunfo nem Ás/7.
* **Dados necessários para avaliar automaticamente:** liderança; comprimento por naipe; trunfo; cartas já jogadas.
* **Avaliação automática:** parcial
* **ID (referência Fase 1):** S04

---

## Nunca abrir com manilha antes do Ás sair

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Lideras. Trunfo = espadas. Tens `7♦` e `4♦` em ouros; **Ás de ouros ainda não saiu** (nem no trick nem em `playedCards`).
* **Contrato / contexto:** Primeiras vazas da ronda.
* **Mão do jogador:** `7♦` `4♦` `J♠` …
* **Vaza actual:** vazia.
* **Cartas legais:** todas.
* **Boa jogada:** `4♦`
* **Jogada média:** `J♠` (side suit, aceitável mas não ideal se ouros era opção)
* **Má jogada:** `7♦`
* **Razão curta:** Manilha de ouros é cartão de controlo; Ás de ouros ainda pode estar na mesa.
* **Dados necessários para avaliar automaticamente:** rank da carta; naipe; registo de Ás de ouros jogado ou não.
* **Avaliação automática:** sim (se tracking de Ás por naipe existir)
* **ID:** S16

---

## Ganhar com a carta mínima que chega (com risco de corte)

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** Parceiro liderou `Q♦`. Adversário seguiu `K♦`. É a tua vez; **ainda jogam Norte e Este** (podem ter trunfo = copas).
* **Contrato / contexto:** Vaza vale pontos; queres ganhar para a equipa.
* **Mão do jogador:** `A♦` `9♦` `3♣` …
* **Vaza actual:** `Q♦` — `K♦`
* **Cartas legais:** `A♦` `9♦` (seguir ouros)
* **Boa jogada:** `9♦` **se** inferência diz que corte improvável; senão **descartar** `3♣` se parceiro pode perder vaza — *neste fixture, assumir corte possível:* **`3♣`** (perder barato)
* **Jogada média:** `9♦` quando corte é 50/50
* **Má jogada:** `A♦` com void de copas provável à esquerda
* **Razão curta:** Ganhar barato só quando desejável **e** risco de corte aceitável; senão poupar Ás.
* **Dados necessários para avaliar automaticamente:** trick; ordem de jogo; trunfo; voids inferidos; pontos na vaza.
* **Avaliação automática:** parcial
* **ID:** S08 · T04

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
* **Má jogada:** `K♣` (roubar ou gastar figura sem necessidade)
* **Razão curta:** Parceiro ganha; não subir.
* **Dados necessários para avaliar automaticamente:** winner actual do trick; identidade parceiro; cartas legais.
* **Avaliação automática:** sim
* **ID:** S19 · T05

---

## Mandar putos à escola

* **Jogo:** Sueca
* **Nível:** Hard
* **Situação:** Segues naipe paus. Parceiro `J♣`, adversário `Q♣`. Tens `4♣` `K♣` `A♣`. Queres **provocar** o último adversário a gastar trunfo num trick de baixo valor.
* **Contrato / contexto:** Plano a 2 vazas: se adversário sobe, parceiro corta depois.
* **Mão do jogador:** `4♣` `K♣` `A♣` + trunfos
* **Vaza actual:** `J♣` — `Q♣`
* **Cartas legais:** `4♣` `K♣` `A♣`
* **Boa jogada:** `4♣`
* **Jogada média:** `K♣` (ganha já mas gasta figura)
* **Má jogada:** `A♣` num trick de 3 pts
* **Razão curta:** Jogar baixo para forçar resposta alta adversária.
* **Dados necessários para avaliar automaticamente:** valor do trick; plano multi-vaza; posição adversários.
* **Avaliação automática:** não
* **ID:** S23

---

## Destrunfar só quando não prejudica o parceiro

* **Jogo:** Sueca
* **Nível:** Hard
* **Situação:** Tens `A♣` trunfo (copas) e parceiro **void em copas** com mão longa em ouros. Últimas vazas; parceiro precisa de **entrada** em ouros.
* **Contrato / contexto:** Destrunfar `A♣` deixa parceiro cortar ouros depois.
* **Mão do jogador:** `A♣` `6♣` + ouros
* **Vaza actual:** lideras — trick vazio
* **Cartas legais:** todas
* **Boa jogada:** `A♣` (destrunfar a favor)
* **Jogada média:** liderar ouro médio (parceiro não entra)
* **Má jogada:** guardar `A♣` até parceiro ficar sem corte
* **Razão curta:** Destrunfar **ajuda** parceiro void.
* **Dados necessários para avaliar automaticamente:** void parceiro inferido; trunfos restantes; fase da ronda.
* **Avaliação automática:** parcial
* **ID:** S25

**Contra-exemplo (má destrunfar):** parceiro tem copas longas e tu destrunfas `A♣` → adversário corta e parceiro perde controlo. Classificação: **má**.

---

## Memória Medium — cartas importantes

* **Jogo:** Sueca
* **Nível:** Medium
* **Situação:** **Ás de ouros já saiu** (registado). Tens `7♦` e `5♦`. Segues ouros liderados por `6♦`.
* **Contrato / contexto:** Memória activa de Ás ouros.
* **Mão do jogador:** `7♦` `5♦`
* **Vaza actual:** `6♦`
* **Cartas legais:** `7♦` `5♦`
* **Boa jogada:** `7♦` (manilha agora mais segura com Ás fora)
* **Jogada média:** `5♦` se trick perdido
* **Má jogada:** tratar `7♦` como «ainda perigoso com Ás por sair» — erro de memória
* **Razão curta:** Decisão coerente com cartas vistas.
* **Dados necessários para avaliar automaticamente:** `playedCards` / histórico Ás por naipe.
* **Avaliação automática:** sim
* **ID:** S10 · T10

---

## Hard — consequências a 2–3 vazas

* **Jogo:** Sueca
* **Nível:** Hard
* **Situação:** Ronda no trick 6. Tens `K♠` `Q♠` trunfo e singleton ouro. Se gastares **ambos** trunfos nesta vaza de 4 pts, ficas **sem corte** nos tricks 8–10 com adversário void em ouros provável.
* **Contrato / contexto:** Horizonte 3 vazas.
* **Mão do jogador:** trunfos altos + singleton side
* **Vaza actual:** adversário a ganhar paus; podes overtrump
* **Cartas legais:** trunfos ou descarte
* **Boa jogada:** descarte paus baixo **sem** overtrump
* **Jogada média:** overtrump com trunfo **mínimo** se vaza decisiva
* **Má jogada:** `K♠` + `Q♠` na mesma sequência de tricks baixos
* **Razão curta:** Reservar trunfo para vazas futuras de alto valor.
* **Dados necessários para avaliar automaticamente:** trick index; trunfos na mão; voids inferidos; pontos futuros estimados.
* **Avaliação automática:** parcial
* **ID:** S24 · S26 · T11

---

# Spades

## Bid conservador

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Fase de bid. Mão: `A♠` `K♠` `Q♠`, `A♥`, `K♦`, resto médio-baixo — ~4 tricks claros, Dama espadas = meia.
* **Contrato / contexto:** Bid individual antes do play.
* **Mão do jogador:** (como acima)
* **Vaza actual:** N/A (pré-jogo)
* **Cartas legais:** N/A — escolha de **bid**
* **Boa jogada:** Bid **4**
* **Jogada média:** Bid **5** (optimista)
* **Má jogada:** Bid **7**
* **Razão curta:** Contagem conservadora: A/K/Q♠ + A/K side ≈ 4, D=½.
* **Dados necessários para avaliar automaticamente:** mão; estimativa tricks; bid declarado vs tricks reais (pós-mão).
* **Avaliação automática:** parcial
* **ID:** SP01

---

## Contar vazas seguras e meia-vaza (Dama)

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Mesma mão; explicar **porque** D♠ ≈ ½ trick.
* **Contrato / contexto:** Bid.
* **Mão do jogador:** `A♠` `K♠` `Q♠` …
* **Vaza actual:** N/A
* **Cartas legais:** N/A
* **Boa jogada:** Incluir Q♠ como **+0,5** na estimativa, não +1 pleno
* **Jogada média:** Tratar Q♠ como 1 trick garantido
* **Má jogada:** Ignorar Q♠ na contagem
* **Razão curta:** Dama espadas pode perder para A/K adversários.
* **Dados necessários para avaliar automaticamente:** mão; heurística de contagem documentada.
* **Avaliação automática:** parcial
* **ID:** SP01

---

## Evitar bags depois de cumprir bid

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Dupla bid **6**, já ganharam **6 tricks**. És o último a jogar; podes ganhar trick extra com `A♠`.
* **Contrato / contexto:** `teamTricks >= teamBid`.
* **Mão do jogador:** `A♠` + lixo
* **Vaza actual:** parceiro ganha com `K♥`; tens `A♠` legal
* **Cartas legais:** `A♠` ou descarte
* **Boa jogada:** Descarte baixo (perder trick)
* **Jogada média:** Ganhar se trick evita under em outro lado (raro aqui)
* **Má jogada:** `A♠` → bag
* **Razão curta:** Bid cumprido; overtrick desnecessário custa bags.
* **Dados necessários para avaliar automaticamente:** teamTricks; teamBid; bags acumulados.
* **Avaliação automática:** sim
* **ID:** SP09 · SP11

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
* **Jogada média:** Descarte se diferença de score não justifica
* **Má jogada:** Poupar bag ignorando 9 adversário a caminho
* **Razão curta:** Quebrar contrato adversário > evitar 1 bag.
* **Dados necessários para avaliar automaticamento:** bids adversários; tricks ganhos; score.
* **Avaliação automática:** parcial
* **ID:** SP14 · SP16

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
* **Jogada média:** `5♠` se off-suit
* **Má jogada:** `K♠` (overtrump parceiro)
* **Razão curta:** Não roubar parceiro.
* **Dados necessários para avaliar automaticamente:** winner actual; seat parceiro.
* **Avaliação automática:** sim
* **ID:** SP06 · T05

---

## Cortar com espada mínima

* **Jogo:** Spades
* **Nível:** Medium
* **Situação:** Led `♥`. Void corações. Trick sem espadas ainda. Tens `4♠` `J♠`.
* **Contrato / contexto:** Precisas do trick (abaixo bid).
* **Mão do jogador:** `4♠` `J♠`
* **Vaza actual:** `A♥` — `7♥`
* **Cartas legais:** `4♠` `J♠`
* **Boa jogada:** `4♠`
* **Jogada média:** `J♠` se trick grande
* **Má jogada:** `A♠` se tivesses num trick de 1 pt
* **Razão curta:** Espada mínima que ganha.
* **Dados necessários para avaliar automaticamente:** led suit; spades in trick; hand.
* **Avaliação automática:** sim
* **ID:** SP08

---

## Destrunfar correctamente (Hard)

* **Jogo:** Spades
* **Nível:** Hard
* **Situação:** Tens `A♠` e sequência `K♠` `Q♠`. Queres **entrada**; adversário ainda não jogou `A♠`.
* **Contrato / contexto:** Destrunfar com `A♠` ou forçar com `Q♠` — **não** `2♠` «escola».
* **Mão do jogador:** `A♠` `K♠` `Q♠` …
* **Vaza actual:** lideras
* **Cartas legais:** espadas altas ou side
* **Boa jogada:** `A♠` ou `Q♠` para forçar
* **Jogada média:** `K♠` lead
* **Má jogada:** `2♠` sem plano
* **Razão curta:** Destrunfar com carta que **força** resposta, não espada irrelevante.
* **Dados necessários para avaliar automaticamente:** spades played; position.
* **Avaliação automática:** parcial
* **ID:** SP15

---

## Nil apenas Hard

* **Jogo:** Spades
* **Nível:** Hard
* **Situação:** Mão fraca: sem A/K♠, poucas espadas, side fraco — candidata **nil**.
* **Contrato / contexto:** `nilEnabled`; dificuldade **Hard** (catálogo); Medium **não** deve nil por defeito.
* **Mão do jogador:** lixo distribuído
* **Vaza actual:** bid phase
* **Cartas legais:** bid 0 nil vs bid 1
* **Boa jogada (Hard):** Bid **nil** se estimativa 0 tricks
* **Jogada média:** Bid **1** conservador
* **Má jogada (Medium):** Bid **nil** com `A♠` na mão
* **Razão curta:** Nil é decisão avançada e arriscada.
* **Dados necessários para avaliar automaticamente:** mão; difficulty level; nil success pós-mão.
* **Avaliação automática:** sim (pós-mão)
* **ID:** SP03

---

# Hearts

## Evitar pontos — objectivo geral

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Segues `♣`. Tens `K♥` `2♣`. Trick sem pontos ainda.
* **Contrato / contexto:** Minimizar pontos da ronda.
* **Mão do jogador:** `K♥` `2♣`
* **Vaza actual:** `5♣` — …
* **Cartas legais:** `2♣` (in suit)
* **Boa jogada:** `2♣` e **não** ganhar trick desnecessário
* **Jogada média:** Ganhar trick vazio com figura
* **Má jogada:** Capturar trick que depois leva `K♥` slough forçado
* **Razão curta:** Pontos vêm de ♥ e Q♠; evitar vazas inúteis.
* **Dados necessários para avaliar automaticamente:** penalty cards in trick; points taken.
* **Avaliação automática:** parcial
* **ID:** H01

---

## Q♠ — perigo máximo

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Pass phase ou play. Tens `Q♠` na mão.
* **Contrato / contexto:** Q♠ = 20 pts se capturada.
* **Mão do jogador:** `Q♠` + cartas médias
* **Vaza actual:** pass ou trick sem ♠ led
* **Cartas legais:** pass 3 ou slough Q♠ quando ♠ led
* **Boa jogada (pass):** Pass **Q♠** entre as 3 piores
* **Jogada média:** Guardar Q♠ até ♠ forced tarde
* **Má jogada:** Ficar com Q♠ + acumular ♥
* **Razão curta:** Eliminar bomba cedo.
* **Dados necessários para avaliar automaticamente:** hand; pass selection; Q♠ captured yes/no.
* **Avaliação automática:** sim (pass); parcial (play)
* **ID:** H11 · H05

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
* **Má jogada:** Pass só `2♣` `3♦` `4♦`, ficar com Q♠
* **Razão curta:** Desfazer perigo antes do play.
* **Dados necessários para avaliar automaticamente:** pass cards; penalty score function.
* **Avaliação automática:** sim
* **ID:** H05

---

## Evitar «meninos» — altas isoladas

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Mão com `A♠` isolado (sem mais espadas), resto fraco.
* **Contrato / contexto:** «Menino» = alta isolada que ganha vaza má depois.
* **Mão do jogador:** singleton `A♠`
* **Vaza actual:** pass ou trick 1
* **Cartas legais:** pass ou jogar cedo em contexto seguro
* **Boa jogada:** Pass `A♠` se possível; senão jogar cedo num trick ♠ led por outro
* **Jogada média:** Guardar A♠
* **Má jogada:** A♠ ganha trick ♥ depois → pontos
* **Razão curta:** Altas isoladas ganham vazas indesejadas.
* **Dados necessários para avaliar automaticamente:** suit length; pass; tricks won by player.
* **Avaliação automática:** parcial
* **ID:** H12

---

## Limpar carta alta se vaza sem pontos é nossa

* **Jogo:** Hearts
* **Nível:** Medium
* **Situação:** Trick **100% teu**: lideraste `2♣`, todos seguiram ♣, **zero pontos** no trick. Tens `Q♠` e `2♦`.
* **Contrato / contexto:** **Não** «ganhar barato» — **limpar perigo**.
* **Mão do jogador:** `Q♠` `2♦`
* **Vaza actual:** `2♣`–`4♣`–`6♣` — tu a ganhar
* **Cartas legais:** `Q♠` `2♦`
* **Boa jogada:** `Q♠` (slough perigo)
* **Jogada média:** `K♥` se tivesses
* **Má jogada:** `2♦` e guardar Q♠
* **Razão curta:** Vaza nossa sem pontos = oportunidade de limpar bomba.
* **Dados necessários para avaliar automaticamente:** trick points = 0; winner = self; penalty in hand.
* **Avaliação automática:** parcial
* **ID:** H13 · T07

---

## Criar void (Hard)

* **Jogo:** Hearts
* **Nível:** Hard
* **Situação:** Pass: 3 espadas baixas (`2♠` `4♠` `6♠`), sem Q♠. Ficas **void espadas**.
* **Contrato / contexto:** Hard pass void ♠.
* **Mão do jogador:** após pass, void ♠
* **Vaza actual:** pass / depois ♠ led por outro
* **Cartas legais:** slough ♥ ou Q♠ quando ♠ led
* **Boa jogada:** Pass 3 ♠ baixas (sem Q♠)
* **Jogada média:** Pass 2 ♠ + 1 ♥
* **Má jogada:** Pass Q♠
* **Razão curta:** Void permite descartar penalização.
* **Dados necessários para avaliar automaticamente:** suit lengths after pass.
* **Avaliação automática:** sim
* **ID:** H06 · T09

---

## Detectar shoot the moon (Hard)

* **Jogo:** Hearts
* **Nível:** Hard
* **Situação:** Trick 3: um adversário levou **3♥** e **A♥**; tens mão moonable (`A♠` `K♠` + ♥ altos).
* **Contrato / contexto:** Detectar intenção moon própria ou alheia.
* **Mão do jogador:** forte ♥
* **Vaza actual:** histórico tricks
* **Cartas legais:** variável
* **Boa jogada:** Se **tu** moon: jogar para ganhar ♥; se **bloquear**: ver fixture seguinte
* **Jogada média:** Ignorar padrão
* **Má jogada:** Ajudar moon adversário sem querer
* **Razão curta:** Contagem de ♥ por jogador.
* **Dados necessários para avaliar automaticamente:** hearts taken per player; hand strength.
* **Avaliação automática:** parcial
* **ID:** H09

---

## Bloquear shoot the moon

* **Jogo:** Hearts
* **Nível:** Hard
* **Situação:** Adversário levou 5♥ seguidos. Tens `2♥` legal num trick que ele vai ganhar.
* **Contrato / contexto:** Sacrificar pontos para bloquear moon.
* **Mão do jogador:** `2♥` …
* **Vaza actual:** adversário high
* **Cartas legais:** `2♥` ou slough baixo noutro suit
* **Boa jogada:** Dar `2♥` ao líder moon (+2 pts) vs moon −26
* **Jogada média:** Descartar 10♥ (+10) ainda bloqueia
* **Má jogada:** Deixar moon completar
* **Razão curta:** +2 << −26 para os outros.
* **Dados necessários para avaliar automaticamente:** hearts per player; moon still possible.
* **Avaliação automática:** parcial
* **ID:** H10

---

# King (contrato-first)

**Hierarquia em todos os exemplos:** (1) contrato → (2) obrigação legal → (3) penalização → (4) risco 2–3 vazas → (5) carta.

---

## Não Fazer Vazas

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer vazas (−20/vaza)
* **Situação:** Trick 4. Tens `A♣` `3♣`. Parceiro não existe — **4 jogadores individuais**. Lideraste por acidente; adversários a seguir.
* **Mão do jogador:** `A♣` `3♣` + ♥ médios
* **Vaza actual:** tu lideraste `5♦` — seguem
* **Cartas legais:** N/A no lead passado; agora seguir: cartas baixas
* **Boa jogada:** Jogar **mais baixa** legal; evitar ganhar
* **Jogada média:** Ganhar trick vazio sem pontos King
* **Má jogada:** Ganhar vaza #5 com figura
* **Razão curta:** Alvo = **zero vazas**; cada trick ganho = −20.
* **Dados necessários para avaliar automaticamente:** contract id; tricks won by player; trick winner.
* **Avaliação automática:** sim
* **ID:** K01 · K00

---

## Não Fazer Copas

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer copas (−20/copa)
* **Situação:** Led `♠`. Tens `K♥` `5♥` `2♣`. **Podes** seguir ♣ ou descartar ♥.
* **Regras:** Não puxar copas se tiveres outro naipe legal.
* **Mão do jogador:** `K♥` `5♥` `2♣`
* **Vaza actual:** `A♠` — …
* **Cartas legais:** `2♣` (não ♥)
* **Boa jogada:** `2♣`
* **Jogada média:** `5♥` se void ♣ (forçado)
* **Má jogada:** `K♥` descarte voluntário com ♣ legal
* **Razão curta:** Evitar copas; regra proíbe puxar ♥ com ♣.
* **Dados necessários para avaliar automaticamente:** contract; led suit; legal moves; hearts captured.
* **Avaliação automática:** sim
* **ID:** K01 · K03

---

## Não Fazer Damas

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer damas (−50/dama)
* **Situação:** Trick perdido. Descartas off-suit. Tens `Q♦` `J♠` `4♣`.
* **Mão do jogador:** `Q♦` `J♠` `4♣`
* **Vaza actual:** adversário ganhando `♥`
* **Cartas legais:** `Q♦` `J♠` `4♣`
* **Boa jogada:** `J♠` (homem ≠ dama, menor penalização se contrato homens depois — aqui **dama** penaliza Q)
* **Jogada média:** `4♣`
* **Má jogada:** `Q♦` (−50)
* **Razão curta:** Slough dama = disaster neste contrato.
* **Dados necessários para avaliar automaticamente:** contract; rank played; queens taken count.
* **Avaliação automática:** sim
* **ID:** K08

---

## Não Fazer Homens

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer homens (K/V) −30 cada
* **Situação:** Mesmo trick; tens `K♠` `V♠` (`J♠` homem) e `2♦`.
* **Mão do jogador:** `K♠` `J♠` `2♦`
* **Vaza actual:** adversário ganhando
* **Cartas legais:** todas off-suit
* **Boa jogada:** `2♦`
* **Jogada média:** `J♠` se homem inevitável mais tarde
* **Má jogada:** `K♠` slough
* **Razão curta:** Homens penalizam; descartar lixo.
* **Dados necessários para avaliar automaticamente:** contract; isMen(card); men taken.
* **Avaliação automática:** sim
* **ID:** K08

---

## Não Fazer o King (Rei de Copas)

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Não fazer K♥ (−160 se capturado)
* **Situação:** **Primeira vez** que podes jogar legalmente `K♥`: led `♥`, tens `K♥` `3♥`.
* **Regras:** **K♥ obrigatório** na 1.ª oportunidade legal ([`king.md`](../rules/king.md)).
* **Mão do jogador:** `K♥` `3♥`
* **Vaza actual:** `2♥` led
* **Cartas legais:** `K♥` `3♥`
* **Boa jogada:** `K♥` (cumpre obrigação — **não** esconder)
* **Jogada média:** —
* **Má jogada:** `3♥` escondendo K♥ ilegalmente
* **Razão curta:** Regra do jogo > minimizar risco; jogar K na 1.ª legal.
* **Dados necessários para avaliar automaticamente:** contract; K♥ played; first legal opportunity flag.
* **Avaliação automática:** sim
* **ID:** K02

**Nota estratégica (pós-obrigação):** depois de K♥ jogado, objectivo é que **outro** leve a penalização se possível — avaliar em tricks seguintes (Hard).

---

## Não Fazer as Duas Últimas

* **Jogo:** King PT
* **Nível:** Hard
* **Contrato activo:** Não fazer duas últimas (−90/vaza ×2)
* **Situação:** **Trick 11** (penúltimo). Quem ganha trick 11 **abre trick 12**. Tens cartas médias; podes forçar adversário a ganhar 11.
* **Mão do jogador:** mix baixa/média
* **Vaza actual:** trick 10 completado; 11 a começar
* **Cartas legais:** depende da mão
* **Boa jogada:** Perder trick 11 **de propósito** com carta baixa
* **Jogada média:** Ganhar 11 se mão fraca para 12
* **Má jogada:** Ganhar 11 **e** 12
* **Razão curta:** 11.ª define líder da 12.ª — crítico para evitar últimas.
* **Dados necessários para avaliar automaticamente:** trickNumber; contract; trick 11/12 winners.
* **Avaliação automática:** parcial
* **ID:** K05 · K10

---

## Positivo normal (festa positiva)

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Festa positiva (+25/vaza)
* **Situação:** Led `♦`. Tens `A♦` `8♦`. Trick sem figura alta ainda.
* **Regras:** Sem trunfo obrigatório salvo escolha festa; não puxar ♥ com alternativa.
* **Mão do jogador:** `A♦` `8♦`
* **Vaza actual:** `5♦`
* **Cartas legais:** `A♦` `8♦`
* **Boa jogada:** `8♦` se ganha; `A♦` se necessário
* **Jogada média:** `A♦` cedo sem necessidade
* **Má jogada:** Descartar ganhador
* **Razão curta:** Maximizar vazas com carta **mínima** que ganha.
* **Dados necessários para avaliar automaticamente:** contract festa; tricks won; winner comparison.
* **Avaliação automática:** sim
* **ID:** K09 · T04

---

## Nulos (festa negativa, sem trunfo)

* **Jogo:** King PT
* **Nível:** Medium
* **Contrato activo:** Nulos — 0 vazas desejadas; sem trunfo
* **Situação:** Trick 2. Tens figuras altas. Lideraste por erro.
* **Mão do jogador:** `A♣` `K♣` …
* **Vaza actual:** vaza em curso
* **Cartas legais:** seguir baixo
* **Boa jogada:** Jogar mais baixo legal; **nunca** ganhar
* **Jogada média:** Ganhar trick «vazio»
* **Má jogada:** 2.ª vaza ganha
* **Razão curta:** Cada vaza reduz payout nulos.
* **Dados necessários para avaliar automaticamente:** festaMode negative; tricks won.
* **Avaliação automática:** sim
* **ID:** K12

---

## Festa / Leilão

* **Jogo:** King PT
* **Nível:** Hard
* **Contrato activo:** Fase leilão — beneficiário decide após licitações
* **Situação:** És licitador AI. `bestBid` = 2 nulos. Beneficiário pede contraproposta. Score: beneficiário a −200, tu a +50.
* **Mão do jogador:** 13 cartas (pré-play)
* **Vaza actual:** fase `auction` / `negotiation`
* **Cartas legais:** pass / bid min / accept / counter
* **Boa jogada:** Bid mínimo que bate ou pass se mão fraca; negociar se score favorece
* **Jogada média:** Pass aleatório 35%
* **Má jogada:** Overbid positivo 8 sem mão
* **Razão curta:** Festa é fase estratégica; score importa.
* **Dados necessários para avaliar automaticamente:** festaPhase; scoreboard; bestBid; hand estimate.
* **Avaliação automática:** parcial
* **ID:** K06 · K07 · K15

---

## King Sintético (preset simplified)

* **Jogo:** King simplified
* **Nível:** Hard
* **Contrato activo:** Ronda 3 — «Não fazer damas»; jogador acumula −40 em rondas 1–2
* **Situação:** Tens `Q♣` e `2♠`. Descarte em trick perdido. **Risco acumulado** negativo alto se levas dama.
* **Mão do jogador:** `Q♣` `2♠`
* **Vaza actual:** adversário ganha
* **Cartas legais:** slough
* **Boa jogada:** `Q♣` **só se** trick já perdido e não podes evitar — preferir `2♠` se dama não for forçada
* **Jogada média:** Slough dama cedo «para limpar»
* **Má jogada:** Ignorar Q♣ com −40 acumulado + Q = −50
* **Razão curta:** Hard sintético: minimizar **soma global** de negativos, não só contrato actual.
* **Dados necessários para avaliar automaticamente:** contract; cumulative negative score; penalty cards.
* **Avaliação automática:** parcial
* **ID:** K11 (variante simplified)

---

# Métricas transversais

## Ganhar barato só quando ganhar é desejável

* **Jogo:** Sueca (positivo) vs Hearts (negativo)
* **Nível:** Medium
* **Situação A (Sueca):** Queres trick equipa; ganhas com mínima — ver fixture S08.
* **Situação B (Hearts):** Vaza nossa sem pontos — **não** ganhar barato, **limpar** Q♠ — ver H13.
* **Contrato / contexto:** Objectivo do jogo define se «ganhar» é bom.
* **Boa jogada:** Sueca: winner mínimo; Hearts: slough perigo
* **Jogada média:** Aplicar T04 cegamente em Hearts
* **Má jogada:** Hearts: ganhar com 2♣ guardando Q♠
* **Razão curta:** T04 é condicional ao objectivo.
* **Dados necessários para avaliar automaticamente:** variant; trick points; desired outcome.
* **Avaliação automática:** parcial
* **ID:** T04

---

## Jogar baixo para perder

* **Jogo:** Spades (pós-bid) / King negativos
* **Nível:** Medium
* **Situação:** Spades bid feito; podes ganhar trick → jogar `3♣`.
* **Contrato / contexto:** Não queremos trick.
* **Boa jogada:** Carta mais baixa legal
* **Jogada média:** Carta média
* **Má jogada:** Ganhar trick
* **Razão curta:** Perder vaza é objectivo.
* **Dados necessários para avaliar automaticamente:** teamTricks vs bid OR negative contract.
* **Avaliação automática:** sim
* **ID:** T06

---

## Limpar carta perigosa

* **Jogo:** Hearts (principal); King negativos
* **Nível:** Medium
* **Situação:** Ver H13 (Q♠) ou King slough dama em trick perdido.
* **Boa jogada:** Descartar perigo quando legal e útil
* **Má jogada:** Guardar perigo até ser forçado
* **Razão curta:** Reduz risco futuro.
* **Dados necessários para avaliar automaticamente:** penalty function per game; trick winner.
* **Avaliação automática:** parcial
* **ID:** T07 · T08

---

## Carta perigosa não é sempre a mais alta

* **Jogo:** King
* **Nível:** Medium
* **Situação:** Contrato não fazer damas: `J♠` (homem) vs `2♠` — **Q♦** é pior que **K♣** fora de contrato homens/damas.
* **Boa jogada:** Identificar perigo **por contrato**, não por rank absoluto
* **Má jogada:** Tratar K♣ como «mais perigosa» que Q♦ em contrato damas
* **Razão curta:** T08 — perigo é contextual.
* **Dados necessários para avaliar automaticamente:** contract penalization map.
* **Avaliação automática:** sim (King); parcial (Hearts Q♠)
* **ID:** T08

---

## Criar void

* **Jogo:** Hearts Hard pass; Sueca singleton lead; King Hard slough
* **Nível:** Hard (Hearts/King); Medium (Sueca lead seco)
* **Situação:** Ver S04 (singleton ouros) + H06 (pass ♠).
* **Boa jogada:** Acções que criam void ou exploram void
* **Má jogada:** Quebrar void voluntariamente cedo
* **Razão curta:** Void = descarte de penalização/corte.
* **Dados necessários para avaliar automaticamente:** suit lengths.
* **Avaliação automática:** parcial
* **ID:** T09

---

## Memória Medium vs Hard

* **Jogo:** Transversal
* **Nível:** Medium vs Hard
* **Situação Medium:** Esqueces Ás ouros → jogas 7♦ mal (ver S10).
* **Situação Hard:** Inferes void espadas após 5 ♠ jogadas + contagem — ajustas jogo Spades trick 8.
* **Boa jogada:** Decisão coerente com memória do nível
* **Má jogada:** Hard com raciocínio Medium (sem void inference)
* **Razão curta:** T10 = importantes; T11 = completa + horizon.
* **Dados necessários para avaliar automaticamente:** playedCards full; inferred voids; trick index.
* **Avaliação automática:** Medium sim/parcial; Hard parcial
* **ID:** T10 · T11

---

# Resumo (corpus arquivado)

Este ficheiro preserva o **catálogo completo** da antiga Fase 2 (~40 fixtures). Para avaliador v0, usar apenas [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) (23 prioritários).

---

## Métricas com avaliação automática simples (`sim`)

| Área | Exemplos |
|------|----------|
| Legalidade | T01 |
| King obrigações | K02 K♥; K03 não puxar ♥ |
| King negativos | slough dama/homem/copas errado |
| Spades | SP06 parceiro; SP09 pós-bid; SP08 corte mínimo |
| Sueca | S16 com tracking Ás; S19 parceiro ganha |
| Hearts pass | H05 cartas passadas |

---

## Métricas com avaliação parcial

| Área | Porquê |
|------|--------|
| Sueca S04 S08 S24 | Inferência void/corte/horizonte |
| Spades SP01 SP14 | Bid e score context |
| Hearts H13 H09 H10 | Trick ownership + moon |
| King K10 K06 | Trick 11/12; leilão |
| Transversais T04 T07 T09 | Objectivo-dependent |

---

## Métricas que precisam julgamento humano (`não`)

| ID | Motivo |
|----|--------|
| S23 | «Mandar putos à escola» — intenção estratégica multi-vaza |
| H15 | Deixar moon por score global (raro) |
| K15 | Negociação festa complexa |

---

## Prioridades para Fase 3 (Logger)

1. **P0:** Registar por jogada: `variant`, `contract`, `trickIndex`, `seat`, `legalMoves`, `chosenCard`, `playerType`
2. **P1:** Campos derivados automáticos: `teamTricks`, `bid`, `heartsTaken`, `contractPenalties`
3. **P2:** Tag opcional `metricIds[]` sugeridos pelo avaliador (Fase 5)
4. **P3:** Export JSONL a partir destes fixtures como **testes golden**

Ordem de implementação avaliador (Fase 5 sugerida): **T01 → K02/K03 → SP09 → H13 → S08 → S19 → SP06 → K01**.

---

## Referências

- [ROADMAP_AI.md](ROADMAP_AI.md) — Fase 2 do roadmap
- [FASE_1_METRICAS.md](FASE_1_METRICAS.md) — catálogo de métricas
- [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md) — inventário código
- [docs/rules/king.md](../rules/king.md) — regras King PT

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Fixtures iniciais Fase 2 |
