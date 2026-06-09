# Fase 1 — Catálogo de Métricas por Jogo (validação humana)

Documento de saída da **Fase 1** do [ROADMAP_AI](../ROADMAP_AI.md).  
Base: [PHASE0_INVENTORY.md](../design/PHASE0_INVENTORY.md) · Actualização: validação humana (2026-05-31).

**Scope:** documentação apenas — nenhuma alteração de código.

---

## Resumo

Este catálogo define **como um jogador competente (Medium) e avançado (Hard) deve pensar** em Sueca, Spades, Hearts e King — jogos de vazas.

- **Medium** = jogador competente: económico, seguro, memória das cartas importantes, leitura imediata da vaza.
- **Hard** = jogador avançado: memória completa, inferência de voids/cortes, consequências a **2–3 vazas**, alternância agressivo/passivo quando o score o exige.
- **Easy** fica **fora** deste catálogo.
- **Avaliação futura (Fase 5):** cada jogada classificada como **boa / média / má**, com razão curta.

O catálogo descreve o **alvo estratégico** acordado na validação humana. Onde o código actual diverge, indica-se em nota «Implementação actual» — sem confundir com mudança de regras do jogo.

---

## Princípios

1. **Linguagem de jogo primeiro** — título e descrição em português claro; ID técnico é auxiliar.
2. **Métricas de jogo, não de modelo** — avaliam decisões de vaza/bid/pass/contrato.
3. **Medium antes de Hard** — Hard estende Medium; não o substitui.
4. **Ganhar barato é condicional** — só quando **ganhar é desejável** e o risco de corte/perda futura é aceitável (ver transversais T04).
5. **King é contrato-first** — nenhuma métrica sobrepor-se ao contrato activo ([`docs/rules/king.md`](../rules/king.md)).
6. **Boa / Média / Má** — três níveis por métrica; «média» = jogada aceitável mas subóptima ou arriscada.

---

## Convenções de cada métrica

Ordem dos campos:

1. **Título** (frase humana)
2. **Descrição**
3. **Contexto necessário**
4. **Boa jogada** (+ razão curta)
5. **Média** (+ razão curta)
6. **Má jogada** (+ razão curta)
7. **Exemplo prático**
8. **ID** · **Nível** · **Tipo** · **Fonte** · **Avaliável automaticamente?**

**Fonte:** `validação humana` · `código` · `regra` · `inferência` (combinações possíveis).

---

# Catálogo Sueca

**Objectivo:** maximizar pontos da equipa (120 por ronda); minimizar desperdício de trunfos, manilhas e cartas de valor.

**Regras:** baralho 40; ordem A>7>K>J>Q>6>…; seguir naipe; trunfo corta.

## Visão humana — Medium / Base

- Jogar **seguro e económico**.
- **Ganhar com a carta mais baixa que chega** — mas só se a vaza vale a pena e ainda **não há jogadores por cortar** (ver S08).
- **Não gastar pontos** (Ás, 7, trunfos altos) sem necessidade.
- **Criar cortes:** abrir carta **seca/singleton** para preparar corte futuro; não confundir com «puxar trunfo».
- **Não puxar trunfo automaticamente** — trunfo longo não é por si motivo para liderar trunfo cedo.
- **Nunca abrir com manilha (7)** excepto se o **Ás desse naipe já saiu** ou houver **forte inferência** de que o parceiro tem o Ás.
- **Dar pontos ao parceiro** só quando a vaza está **segura** para a equipa.
- **Memória Medium:** Áses, manilhas, trunfos e cartas de ponto já jogados.

## Visão humana — Hard / Advanced

- **Prever quem pode cortar** antes de investir numa vaza.
- **Destrunfar:** avaliar se soltar trunfo alto **ajuda ou prejudica** o parceiro.
- **«Mandar putos à escola»:** jogar baixo para provocar carta alta adversária, quando útil estrategicamente.
- **Reservar Rei/Valete/Dama** para uma **segunda vaza futura** em vez de despejar tudo numa vaza já ganha.
- **Manilha de trunfo cedo** quando o risco de ficar **presa** no fim da ronda é alto.
- **Inferir se o parceiro tem o Ás** (por jogadas e sinais).
- **Memória Hard:** todas as cartas jogadas; voids prováveis; horizonte **2–3 vazas**.

## Path produção legado (AI externa Sueca)

Subordinado ao catálogo humano. Em produção, Sueca **hard** pode chamar `sueca-ai` (`heuristics.py`): lidera **carta mais alta** (não alinhado com Medium). Quando HTTP OK, **substitui** heurística TS Hard (sinais, win prob). **Alvo:** converger path externo para este catálogo ou mantê-lo só como fallback documentado.

---

## Métricas Sueca — Medium

### Abrir seco ou singleton para criar corte

**Descrição:** Ao liderar, preferir naipe **curto/seco** (idealmente singleton) para forçar adversários a gastar cartas e abrir oportunidade de corte — não «puxar naipe longo» por hábito.

**Contexto:** Liderança; comprimento por naipe na mão; trunfo conhecido.

| Classificação | Jogada | Razão |
|---------------|--------|-------|
| **Boa** | Liderar singleton médio-baixo de naipe side | Prepara corte; não gasta Ás/7 |
| **Média** | Liderar naipe longo com carta média | Ganha vaza mas não cria corte |
| **Má** | Liderar Ás ou 7 num singleton cedo sem Ás do naipe visto | Desperdiça cartão de controlo |

**Exemplo:** Singleton 8 ouros, trunfo copas na mão → lead 8 ouros, guardar trunfo.

**ID:** S04 · **Nível:** Medium · **Tipo:** liderança · **Fonte:** validação humana (+ código parcial `lead_strong_suit`, a realinhar) · **Auto?** parcial

---

### Não puxar trunfo por defeito

**Descrição:** Ter trunfos (mesmo 4+) **não** implica liderar trunfo cedo; trunfo é recurso de corte e controlo.

**Contexto:** Liderança; contagem trunfos; estado da ronda.

| Classificação | Jogada | Razão |
|---------------|--------|-------|
| **Boa** | Liderar side suit; guardar trunfo para cortar | Economia |
| **Média** | Liderar trunfo médio no meio da ronda com mão forte global | Contextual |
| **Má** | Liderar trunfo alto no trick 1–2 sem plano | Expõe e gasta trunfo |

**Exemplo:** 5 trunfos + 2 ouros → lead ouros, não trunfo.

**ID:** S05 · **Nível:** Medium · **Tipo:** trunfo · **Fonte:** validação humana · **Auto?** parcial  
**Implementação actual:** código dá bónus a liderar trunfo longo — **gap**, não mudança de regra Sueca.

---

### Ganhar barato com risco de corte

**Descrição:** Ao ganhar, usar a **menor carta que vença** — **se** ainda queremos a vaza **e** jogadores por jogar não tornam provável um corte que roube pontos.

**Contexto:** Trick em curso; ordem de jogo; trunfos por sair; pontos na vaza.

| Classificação | Jogada | Razão |
|---------------|--------|-------|
| **Boa** | Ganhar com carta mínima; último a jogar ou parceiro protege | Barato e seguro |
| **Média** | Ganhar barato com 1–2 ainda por jogar e trunfo provável | Risco calculado |
| **Má** | Ganhar com Ás/7 com adversário void provável | Perda de controlo |

**Exemplo:** Parceiro ganha; tu tens Q e 7 no naipe → se safe, 7; se void à esquerda, não subir.

**ID:** S08 · **Nível:** Medium · **Tipo:** regra · **Fonte:** validação humana + código · **Auto?** parcial

---

### Memória das cartas importantes (Medium)

**Descrição:** Registar Áses, 7s (manilhas), trunfos e cartas de ponto já jogados para não repetir erros.

**Contexto:** `playedCards`; trick actual.

| Classificação | Jogada | Razão |
|---------------|--------|-------|
| **Boa** | Decisão coerente com cartas já vistas | Consistência |
| **Média** | Esquece 1 carta relevante mas jogada ainda razoável | Subóptimo |
| **Má** | Joga 7 como se Ás ainda estivesse «lá» | Erro de memória |

**Exemplo:** Ás ouros saiu → 7 ouros torna-se jogável com menos risco.

**ID:** S10 · **Nível:** Medium · **Tipo:** memória · **Fonte:** validação humana + código (proxy fraco) · **Auto?** parcial

---

### Seguir naipe descartando baixo

**Descrição:** Seguir naipe **sem** ganhar: jogar a carta **mais baixa** do naipe.

**Contexto:** Impossível ou indesejável ganhar; parceiro pode estar a ganhar.

| Classificação | Jogada | Razão |
|---------------|--------|-------|
| **Boa** | Menor carta do naipe | Poupa figuras |
| **Média** | Carta média sem necessidade | Aceitável |
| **Má** | Maior carta quando parceiro ganha | Rouba ou gasta |

**ID:** S11 · **Nível:** Medium · **Tipo:** descarte · **Fonte:** código + validação · **Auto?** sim

---

### Cortar com trunfo baixo

**Descrição:** Void no led; trick sem trunfo → cortar com **trunfo mínimo** que ganhe.

**ID:** S12 · **Nível:** Medium · **Tipo:** trunfo · **Fonte:** código + validação · **Auto?** sim

| **Boa** | Trunfo baixo que ganha | Economia |
| **Média** | Trunfo médio | Funciona mas caro |
| **Má** | Ás trunfo em trick de 0 pts | Desperdício |

---

### Overtrump económico

**Descrição:** Bater trunfo adversário com o **menor** trunfo vencedor.

**ID:** S13 · **Nível:** Medium · **Tipo:** trunfo · **Fonte:** código + validação · **Auto?** sim

---

### Descarte off-suit mínimo

**Descrição:** Sem naipe led e sem corte útil → descartar carta **mais baixa** (preferir lixo off-suit).

**ID:** S15 · **Nível:** Medium · **Tipo:** descarte · **Fonte:** código + validação · **Auto?** sim

---

### Nunca abrir com manilha (7) prematuramente

**Descrição:** Não liderar 7 do naipe enquanto **Ás desse naipe** não saiu, salvo inferência forte de parceiro com Ás.

**ID:** S16 · **Nível:** Medium · **Tipo:** risco · **Fonte:** validação humana + código Python (`_aces_seen`) · **Auto?** sim (com tracking Ás)

| **Boa** | Lead outra carta do naipe ou side | Protege manilha |
| **Média** | Lead 7 com Ás provavelmente com parceiro | Inferência |
| **Má** | Lead 7 com Ás ainda em jogo desconhecido | Arriscado |

---

### Pontos ao parceiro só em vaza segura

**Descrição:** Subir ou dar cartas de valor ao parceiro **só** quando a equipa **já** tem a vaza ou o risco de perder pontos é baixo.

**ID:** S19 · **Nível:** Medium · **Tipo:** parceiro · **Fonte:** validação humana · **Auto?** parcial

| **Boa** | Parceiro ganha claramente → descarte baixo | Não rouba |
| **Média** | Subir modestamente com need trick | Contextual |
| **Má** | Roubar vaza ao parceiro com K/7 | Perda equipa |

---

## Métricas Sueca — Hard

### Filtro probabilístico antes de investir

**Descrição:** Só forçar ganho se probabilidade de vitória (tracking) **> limiar** (~0,5) ou vaza crítica.

**ID:** S09 · **Nível:** Hard · **Tipo:** memória · **Fonte:** código `calculateWinProbability` · **Auto?** sim

---

### «Mandar putos à escola»

**Descrição:** Jogar **baixo** de propósito para **provocar** carta alta adversária, ganhando informação ou preparando squeeze futuro.

**ID:** S23 · **Nível:** Hard · **Tipo:** risco · **Fonte:** validação humana · **Auto?** não

| **Boa** | 4 baixo num trick que adversário deve subir | Provoca gasto |
| **Média** | Tentativa sem leitura de mão | Arriscado |
| **Má** | «Escola» num trick de pontos altos perdidos | Penalização |

---

### Horizonte 2–3 vazas

**Descrição:** Escolher carta que optimiza **próximas 2–3 vazas**, não só a actual.

**ID:** S24 · **Nível:** Hard · **Tipo:** memória · **Fonte:** validação humana · **Auto?** parcial

---

### Destrunfar a favor / contra parceiro

**Descrição:** Libertar trunfo alto **só** se parceiro precisa de entrar ou se adversário não beneficia.

**ID:** S25 · **Nível:** Hard · **Tipo:** parceiro · **Fonte:** validação humana · **Auto?** parcial

---

### Reservar figuras para segunda vaza

**Descrição:** Não despejar K/Q/J numa vaza **já ganha**; guardar para **entrada** ou controlo posterior.

**ID:** S26 · **Nível:** Hard · **Tipo:** regra · **Fonte:** validação humana · **Auto?** parcial

---

### Manilha de trunfo cedo (anti-preso)

**Descrição:** Jogar manilha/trunfo forte **cedo** se risco alto de ficar **presa** no fim (ex.: único trunfo alto restante).

**ID:** S27 · **Nível:** Hard · **Tipo:** trunfo · **Fonte:** validação humana · **Auto?** parcial

---

### Sinais de parceiro (opcional Hard)

**Descrição:** `need_trump`, `need_help`, etc. — coordenação quando protocolo activo.

**IDs:** S17, S18, S20 · **Nível:** Hard · **Tipo:** parceiro · **Fonte:** código · **Auto?** parcial

---

### Memória completa e inferência de voids

**Descrição:** Todas as cartas jogadas; inferir voids; combinar com S09/S24.

**ID:** S21 · **Nível:** Hard · **Tipo:** memória · **Fonte:** código + validação · **Auto?** sim (com estado completo)

---

# Catálogo Spades

**Objectivo:** equipa cumpre **bid**; evitar **bags**; em Hard, também **quebrar bid adversária** quando score o exige.

## Visão humana — Medium / Base

- **Bid conservador.**
- Contar vazas seguras: **Áses e Reis protegidos**; **Dama = meia-vaza**; trunfos fortes **A/K/Q/J de espadas**.
- **Heurística de mesa:** total de bids entre **12 e 14** em jogo competente (não é regra oficial).
- **Cumprir bid da dupla**; depois de cumprido, **evitar bags**.
- Parceiro a ganhar → **jogar baixo**.
- Cortar com **espada mais baixa** que chega.
- Acompanhar **bid, tricks feitos, bags**.

## Visão humana — Hard / Advanced

- Alternar **agressivo / passivo** conforme score e necessidade.
- Adversário bid **8+** → **quebrar contrato** pode ser mais importante que evitar bags.
- **Destrunfar:** normalmente com **Ás**; sem Ás, carta **média/alta** para forçar Ás — **não** «mandar putos à escola» com espada muito baixa.
- Contar **espadas saídas**; inferir **voids**; proteger parceiro; **não dar bags** ao parceiro.
- **Nil apenas em Hard.**

---

## Métricas Spades — Medium

### Bid conservador por contagem

**ID:** SP01 · **Tipo:** bid · **Fonte:** código + validação

| **Boa** | Bid ≈ A/K/Q♠ + A/K outros arredondado | Alinhado com mão |
| **Média** | ±1 trick do ideal | Aceitável |
| **Má** | Overbid 3+ ou underbid severo | SP02 erro de bid |

---

### Erro de bid (under/over)

**ID:** SP02 · **Tipo:** bid · **Fonte:** regra scoring + inferência · **Auto?** sim (pós-mão)

---

### Heurística total bids 12–14

**Descrição:** Em mesa competente, soma dos 4 bids **12–14**; **<12** pode indicar jogador a esconder jogo.

**ID:** SP13 · **Nível:** Medium · **Tipo:** bid · **Fonte:** validação humana (heurística) · **Auto?** parcial

---

### Evitar liderar espadas cedo

**ID:** SP04 · **Tipo:** liderança · **Fonte:** código + validação · **Auto?** sim

---

### Cumprir bid — agressão controlada

**ID:** SP05 · **Tipo:** regra · **Fonte:** código + validação

| **Boa** | Abaixo bid → ganhar com winner mínimo | SP07 em hard |
| **Média** | Jogada neutra com bid longe | OK temporário |
| **Má** | Abaixo bid e descarta winner | Perde trick necessário |

---

### Parceiro a ganhar — jogar baixo

**ID:** SP06 · **Tipo:** parceiro · **Fonte:** código + validação · **Auto?** sim

---

### Evitar bags após bid cumprido

**ID:** SP09 · **Tipo:** risco · **Fonte:** validação humana · **Auto?** sim (teamTricks ≥ teamBid)

| **Boa** | Bid feito → perder trick activamente | Evita bag |
| **Média** | Ganha trick extra marginal | 1 bag tolerável |
| **Má** | Continua a forçar com bid+3 | Bags acumulam SP11 |

---

### Gestão de honras espadas

**ID:** SP10 · **Tipo:** trunfo · **Fonte:** validação + código parcial

---

### Cortar com espada mínima

**ID:** SP08 · **Nível:** Medium (base) / Hard (refinado) · **Fonte:** código · **Auto?** sim

---

## Métricas Spades — Hard

### Nil / blind nil

**ID:** SP03 · **Nível:** Hard only · **Fonte:** validação + código (medium tem nil ocasional — **gap**)

---

### Quebrar bid adversária alta (8+)

**ID:** SP14 · **Nível:** Hard · **Tipo:** risco · **Fonte:** validação humana · **Auto?** parcial

| **Boa** | Sacrifica bag para quebrar 9 bid adversário em match apertado | Score-aware |
| **Média** | Tenta quebrar com risco moderado | Contextual |
| **Má** | Ignora 10 bid adversário para poupar bag | Estratégia errada |

---

### Destrunfar disciplinado

**ID:** SP15 · **Nível:** Hard · **Tipo:** trunfo · **Fonte:** validação humana

| **Boa** | Ás espadas ou K/Q alta para forçar | Entrada |
| **Média** | Espada média sem plano | Arriscado |
| **Má** | 2♠ «escola» | Adversário não sobe |

---

### Bags e overtricks

**ID:** SP11 · **Tipo:** risco · **Fonte:** regra · **Auto?** sim

---

### Long spade bonus no bid

**ID:** SP12 · **Nível:** Hard · **Fonte:** código · **Auto?** parcial

---

### Modo score (agressivo vs passivo)

**ID:** SP16 · **Nível:** Hard · **Tipo:** risco · **Fonte:** validação humana · **Auto?** parcial

---

# Catálogo Hearts

**Objectivo:** **não fazer pontos**; ganhar vazas só em contexto **shoot the moon** ou para **limpar perigo** numa vaza já nossa.

**Nota crítica:** em Hearts **não** se aplica «ganhar barato» como regra geral. Se a vaza **sem pontos** é **100% nossa**, a boa jogada pode ser **limpar carta alta/perigosa**, não ganhar com a mais baixa.

## Visão humana — Medium / Base

- Minimizar pontos; **Q♠ = perigo máximo**.
- Pass: **Q♠, A♠, K♠, copas altas**.
- Evitar **«meninos»** — altas **isoladas** que ganham vazas más depois.
- Vaza nossa sem pontos → **limpar perigo** (alta penalização).
- Acompanhar **Q♠ e copas** jogadas; detectar **moon** mínimo.

## Visão humana — Hard / Advanced

- Criar **voids** para slough ♥/Q♠.
- Equilíbrio: nem sempre baixo, nem acumular todas as altas no fim.
- Carta torna-se **«baixa em jogo»** quando inferiores/superiores relevantes saíram.
- **Forçar saída da Q♠**; **bloquear moon** mesmo sacrificando pontos.
- **Raro:** deixar moon se **score global** favorece contra líder.

---

## Métricas Hearts — Medium

### Penalização Q♠ e copas

**ID:** H01 · **Tipo:** penalização · **Fonte:** regra · **Auto?** sim

---

### Passar cartas perigosas

**ID:** H05 · **Tipo:** descarte · **Fonte:** código + validação

| **Boa** | Pass Q♠ + piores ♥/♠ | Reduz risco |
| **Média** | Pass 2 piores sem Q♠ | Subóptimo |
| **Má** | Ficar com Q♠ | H11 |

---

### Evitar «meninos» (altas isoladas)

**ID:** H12 · **Nível:** Medium · **Tipo:** risco · **Fonte:** validação humana · **Auto?** parcial

| **Boa** | Pass ou jogar cedo altas isoladas em contexto seguro | Evita vaza má forced |
| **Média** | Fica com K♠ isolado longo | Risco |
| **Má** | A♠ isolado ganha trick ♥ depois | Pontos |

---

### Limpar carta perigosa numa vaza nossa (sem pontos)

**Descrição:** Trick **sem pontos** e **100% nosso** → jogar **Q♠, K♠, A♠ ou ♥ alta** para limpar, **não** a carta mais baixa.

**ID:** H13 · **Nível:** Medium · **Tipo:** descarte · **Fonte:** validação humana · **Auto?** parcial

| **Boa** | Slough Q♠ num trick ♣ nosso | Elimina bomba |
| **Média** | Slough ♥ alta | Reduz risco futuro |
| **Má** | Jogar 2♣ e guardar Q♠ | Moon ou +20 futuro |

---

### Liderar baixa penalização (quando lideramos)

**ID:** H03 · **Tipo:** liderança · **Fonte:** código + validação · **Auto?** sim

---

### Descartar penalização ao seguir (trick perdido)

**ID:** H02 · **Tipo:** descarte · **Fonte:** código · **Auto?** sim

---

### Evitar ganhar vaza penalizante

**ID:** H07 · **Tipo:** risco · **Fonte:** validação + regra · **Auto?** parcial

---

### Evitar liderar copas cedo

**ID:** H08 · **Tipo:** penalização · **Fonte:** regra + código · **Auto?** sim

---

### Detectar shoot the moon (mínimo)

**ID:** H09 · **Nível:** Medium (mínimo) / Hard (pleno) · **Fonte:** validação · **Auto?** parcial · **Código:** não implementado

---

## Métricas Hearts — Hard

### Pass void espadas

**ID:** H06 · **Fonte:** código hard pass · **Auto?** sim

---

### Não liderar copas se alternativa

**ID:** H04 · **Fonte:** código hard · **Auto?** sim

---

### Bloquear shoot the moon

**ID:** H10 · **Nível:** Hard · **Fonte:** validação · **Auto?** parcial · **Código:** não implementado

| **Boa** | Dar ♥ baixa a quem acumula ♥ | Impede moon |
| **Média** | Bloqueia com +10 sacrificado | Custo OK |
| **Má** | Deixa moon por poupar 2♣ | −26 ou pior |

---

### Forçar saída da Q♠

**ID:** H14 · **Nível:** Hard · **Fonte:** validação humana · **Auto?** parcial

---

### Moon sacrifice for score (raro)

**ID:** H15 · **Nível:** Hard · **Fonte:** validação humana · **Auto?** não

---

### Evitar Q♠ explícito

**ID:** H11 · **Fonte:** regra + validação · **Auto?** sim

---

# Catálogo King

## Hierarquia AI King (obrigatória)

Antes de qualquer métrica de carta:

1. **Qual é o contrato activo?**
2. **Há regra obrigatória?** (ex.: K♥ na 1.ª oportunidade legal)
3. **O que penaliza neste contrato?**
4. **Que carta reduz risco agora e nas próximas 2–3 vazas?**
5. **Só depois escolher carta.**

**Regra central:** nenhuma métrica sobrepor-se ao contrato activo nem às regras da variante PT do autor ([`docs/rules/king.md`](../rules/king.md)).

## Regras do autor (King PT)

- **10 jogos:** 6 negativos + 4 festas (positiva/negativa por jogador).
- **Zero-sum:** negativos total **−1300**; positivos total **+1300**.
- **Sem obrigação** de cortar nem de cortar por cima.
- **Proibição:** não puxar **copas** se tiver **outro naipe** legal.
- **«Não Fazer o King»:** **K♥ obrigatório** na **primeira oportunidade legal**.
- Negativos: só importa **evitar o alvo penalizador** do contrato.
- **11.ª vaza** crucial (define quem abre a 12.ª) — contrato «duas últimas».
- **Nulos** = festa em modo negativo, **sem trunfo**.
- **Festa/leilão** = fase estratégica central (não detalhe).

## Visão humana — Medium / Base

- Identificar contrato; respeitar obrigações.
- **Negativos:** evitar alvo (vazas, copas, damas, homens, K♥, duas últimas).
- Defensivo; descartar perigo em trick perdido; **não puxar copas** com alternativa.
- **K♥:** jogar na **1.ª oportunidade legal** (contrato relevante).
- **Positivos:** ganhar com **carta mais baixa que chega**.
- **Nulos:** zero vazas.
- Memória das cartas **perigosas do contrato**.

## Visão humana — Hard / Advanced

- Planear **2–3 vazas**; cartas perigosas **reais** (não só altas).
- **Voids** para descarregar penalizações; forçar adversários a ficar com damas/homens/K♥.
- **Caçar K♥** nos adversários quando aplicável.
- Planear **11.ª e 12.ª** desde cedo em «duas últimas».
- Positivos: **sequência de vazas** cedo se mão permite.
- **Festa/leilão:** nulos, 8 ou nulos, 4×3×3, trunfo, sem trunfo, bloquear adversário — fase própria.
- Score-aware; memória total + voids.

---

## King PT — Métricas Medium

### Respeitar contrato activo (meta)

**ID:** K00 · **Nível:** Medium · **Tipo:** contrato · **Fonte:** regra + validação · **Auto?** sim

---

### Descarte consciente por contrato

**ID:** K01 · Negativos: slough carta que **penaliza** o contrato · **Auto?** sim

---

### K♥ — primeira oportunidade legal

**ID:** K02 · **Contrato:** «Não Fazer o King» · **Fonte:** regra · **Auto?** sim

| **Boa** | Joga K♥ na 1.ª vez legal | Cumpre regra |
| **Média** | Demora 1 trick se ainda legal depois | Risco |
| **Má** | Esconde K♥ além do legal | Penalização |

---

### Não puxar copas com alternativa

**ID:** K03 · **Fonte:** regra · **Auto?** sim

---

### Liderança negativa fora de copas

**ID:** K04 · **Fonte:** código + validação · **Auto?** sim

---

### Duas últimas — fase inicial vs final

**ID:** K05 · Tricks 0–7 mais livres; **8–9 defesa máxima** · **Fonte:** código + validação

---

### Damas e homens (negativos)

**ID:** K08 · **Fonte:** regra + código · **Auto?** sim

---

### Positivos — ganhar barato

**ID:** K09 · **Fonte:** código + validação · **Auto?** sim

---

### Nulos — zero vazas

**ID:** K12 · **Nível:** Medium · **Tipo:** contrato · **Fonte:** regra festa · **Auto?** sim

---

## King PT — Métricas Hard

### Positivo hard económico

**ID:** K03h (alias K09 hard) · **Fonte:** código · **Auto?** sim

---

### Últimas vazas — 11.ª e 12.ª

**ID:** K10 · **Fonte:** validação + regra · **Auto?** parcial

| **Boa** | Trick 10–11: força adversário a levar últimas | Controla abertura 12.ª |
| **Média** | Defende mas não planifica | |
| **Má** | Ganha 11.ª e abre 12.ª para adversário | Perde contrato |

---

### Festa — leilão e negociação

**ID:** K06 · **Fase:** auction, counter, accept · **Fonte:** código + validação · **Auto?** parcial

---

### Festa — fallback (4×3×3, nulos, no_trump)

**ID:** K07 · **Fonte:** código · **Auto?** parcial

---

### Caçar K♥ / forçar penalizações

**ID:** K13 · **Nível:** Hard · **Fonte:** validação · **Auto?** parcial

---

### Voids e descarte planeado

**ID:** K14 · **Nível:** Hard · **Fonte:** validação · **Auto?** parcial

---

### Score-aware festa/leilão

**ID:** K15 · **Nível:** Hard · **Fonte:** validação · **Auto?** parcial

---

### Evitar penalizações globais (meta)

**ID:** K11 · **Fonte:** regra scoring · **Auto?** sim (pós-jogo)

---

## King simplified (preset `king-simplified`)

Secção curta — partilha contratos negativos/positivos **sem** festa/leilão completa do PT.

**Medium:** mesma hierarquia K00→K5; K01, K02, K04, K08, K09, K12 aplicam-se por contrato simplificado.

**Hard adicional:** **somar riscos acumulados** de **todos** os negativos da partida — jogada que minimiza exposição **global**, não só contrato actual.

**Remissão:** festa, leilão, 8 ou nulos → ver King PT (K06, K07, K15).

---

# Métricas transversais (vazas)

Aplicam-se a vários jogos; **não** são métricas genéricas de ML.

### T01 — Jogada legal

**ID:** T01 (G01) · **Tipo:** regra · **Auto?** sim · Carta deve ser legal (`canPlayCard`).

### T02 — Resposta externa válida (Sueca legado)

**ID:** T02 (G02) · Path AI externa · **Auto?** sim

### T03 — Fallback primeira legal

**ID:** T03 (G03) · Último recurso · **Auto?** sim (detectar activação)

### T04 — Ganhar barato (condicional)

**Descrição:** Winner **mínimo** **só** quando **ganhar é objectivo** e risco de corte/perda futura aceitável.

**Jogos:** Sueca, Spades positivo, King positivo — **não** Hearts por defeito.

**ID:** T04 · **Auto?** parcial

### T05 — Não roubar parceiro

**ID:** T05 (G05) · Sueca, Spades · **Auto?** sim

### T06 — Jogar baixo

**Descrição:** Perder vaza ou evitar penalização/bags quando **não** queremos ganhar.

**ID:** T06 · **Auto?** parcial

### T07 — Limpar carta perigosa

**Descrição:** Vaza **inevitavelmente nossa** (ou futuro muito provável) → slough **perigo** (Hearts H13, King negativos).

**ID:** T07 · **Auto?** parcial

### T08 — Carta perigosa ≠ mais alta

**Descrição:** Q♠, K♥, homens em King negativos podem ser «perigo» independentemente do rank bruto.

**ID:** T08 · **Auto?** parcial

### T09 — Void e corte planeado

**Descrição:** Hard — criar/explorar void (Sueca singleton, Hearts pass ♠, King slough).

**ID:** T09 · **Auto?** parcial

### T10 — Memória Medium

**Descrição:** Áses, manilhas, trunfos, Q♠, alvos de contrato King.

**ID:** T10 · **Auto?** parcial

### T11 — Memória Hard

**Descrição:** Todas as cartas; voids; horizonte 2–3 vazas; score.

**ID:** T11 · **Auto?** parcial

---

# Dúvidas, conflitos e validação pendente

| # | Tema | Estado |
|---|------|--------|
| 1 | Sueca S05 código vs «não puxar trunfo» | **Estratégia alvo**; gap implementação — **não** mudança de regra |
| 2 | AI externa Sueca lead highest | **Path legado subordinado**; alvo = catálogo humano |
| 3 | Hearts H09/H10/H14/H15 | **Alvo Hard**; **não implementado** no código |
| 4 | Spades nil em medium (código) vs catálogo Hard-only | Gap implementação |
| 5 | Hearts moon sacrifice (H15) | Alvo raro; **avaliação automática difícil** |
| 6 | «Mandar putos à escola» (S23) | Termo autor; manter em PT |
| 7 | Spades total bids 12–14 | **Heurística**, não regra oficial — confirmado |
| 8 | King sem obrigação cortar | **Regra autor** — confirmado |
| 9 | Easy | Fora do catálogo |

**Nenhuma questão de regra real do jogo pendente** após validação humana desta revisão.

---

# Recomendações para Fase 2

1. **Alinhar código Sueca** com S04/S05/S08 (singleton, anti-auto-trump, risco corte).
2. **Implementar Hearts H13, H09, H10** no avaliador antes do bot.
3. **Spades:** SP09/SP11 explícitos em medium; nil só hard.
4. **King:** fixtures por contrato (K02, K05 trick 11, K06 leilão).
5. **Logger (Fase 3):** registar classificação boa/média/má por métrica ID.
6. **Fixtures JSON** por métrica para Fase 5.
7. **Unificar path AI externa** com catálogo ou documentar desactivação.
8. **King simplified:** testes de risco acumulado negativos (Hard).

---

## Referências

- [ROADMAP_AI.md](../ROADMAP_AI.md)
- [PHASE0_INVENTORY.md](../design/PHASE0_INVENTORY.md)
- [docs/rules/king.md](../rules/king.md)
- [docs/rules/sueca.md](../rules/sueca.md)
- Código (referência): `frontend/src/ai/games/*`, `sueca-ai/engine/heuristics.py`

---

## Índice rápido de IDs

| Jogo | Medium (selecção) | Hard (selecção) |
|------|-------------------|-----------------|
| Sueca | S04–S06, S08, S10–S11, S15–S16, S19 | S09, S17–S18, S20–S27 |
| Spades | SP01–SP02, SP04–SP06, SP08–SP10, SP13 | SP03, SP11–SP16 |
| Hearts | H01–H03, H05, H07–H08, H12–H13 | H04, H06, H09–H11, H14–H15 |
| King PT | K00–K05, K08–K09, K12 | K06–K07, K10–K11, K13–K15 |
| King simplified | K00–K05, K08–K09, K12 | + risco acumulado negativos |
| Transversal | T01, T03–T08, T10 | T02, T09, T11 |

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Catálogo inicial (Fase 0 → formalização) |
| 1.1 | 2026-05-31 | **Validação humana** — visão por jogo, Boa/Média/Má, alvo estratégico |
