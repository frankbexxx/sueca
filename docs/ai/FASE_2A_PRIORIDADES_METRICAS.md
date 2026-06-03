# Fase 2A — Prioridades de Métricas

Documento de saída da **Fase 2A** do [ROADMAP_AI](ROADMAP_AI.md).

**Base:** [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md) · [FASE_1_METRICAS.md](FASE_1_METRICAS.md)  
**Data:** 2026-05-31  
**Scope:** priorização documental — **sem código**, **sem fixtures**, **sem JSON**.

---

## Resumo

A Fase 1 formalizou dezenas de métricas por jogo. Antes de criar fixtures (Fase 2B) e implementar logger/encoder/avaliador (Fases 3–5), este documento **ordena** o que entra primeiro.

| Prioridade | Significado | Uso nas fases seguintes |
|------------|-------------|-------------------------|
| **P0** | Essencial para o **primeiro avaliador** mínimo viável | Logger + encoder + fixtures 2B + avaliador v0 |
| **P1** | Importante; entra logo após P0 estabilizado | Avaliador v1; cobertura Medium completa |
| **P2** | Avançada / Hard / refinamento | Avaliador v2; bots Hard |
| **P3** | Memória profunda, score global, inferência ou julgamento humano | Fase 6+; mini-LLM (Fase 7) |

**Legenda de colunas (por métrica):**

| Campo | Significado |
|-------|-------------|
| **Tipo** | `automática` · `parcial` · `humana` |
| **Logger** | sim = evento deve ser registado na Fase 3 |
| **Encoder** | sim = campo derivado necessário na Fase 4 |
| **Memória** | sim = depende de histórico de cartas / inferência |
| **Código** | `sim` = heurística existente · `parcial` = gap vs catálogo · `não` = só alvo Fase 1 |

---

# Sueca

Referência estratégica do projecto. P0 concentra legalidade, economia de trunfo, parceiro e riscos imediatos.

## P0 — Essenciais

| ID | Descrição humana | Nível | Tipo | Porquê P0 | Dados para avaliar | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------------------|--------|---------|---------|--------|
| **T01** | Jogada legal | Medium | automática | Base de qualquer avaliador | `legalMoves`, carta escolhida | sim | sim | não | sim (`canPlayCard`) |
| **S08** | Ganhar com carta mínima quando ganhar é desejável | Medium | parcial | Economia central Sueca; já no código | trick, trunfo, winner candidatos, risco corte | sim | sim | parcial | sim |
| **S16** | Nunca abrir com manilha (7) antes do Ás do naipe | Medium | automática | Regra clássica; verificável com tracking | rank, naipe, Ás visto | sim | sim | sim | parcial (`_aces_seen` ext.) |
| **S12** | Cortar com trunfo mínimo que chega | Medium | automática | Evita desperdício de trunfo | trick, trunfo, winners legais | sim | sim | não | sim |
| **S19** | Dar pontos ao parceiro só com vaza segura | Medium | parcial | Cooperação equipa; winner actual | winner trick, seat parceiro | sim | sim | não | parcial |
| **S11** | Seguir naipe descartando baixo | Medium | automática | Descarte básico | led suit, cartas legais | sim | sim | não | sim |
| **S15** | Descarte off-suit mínimo | Medium | automática | Não subir trick perdido | trick, legal moves | sim | sim | não | sim |

## P1 — Importantes

| ID | Descrição humana | Nível | Tipo | Porquê P1 | Dados para avaliar | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------------------|--------|---------|---------|--------|
| **S04** | Abrir carta seca/singleton para criar corte | Medium | parcial | Estratégia Medium chave; gap código (`lead_strong_suit`) | comprimento naipes, liderança | sim | sim | parcial | parcial |
| **S05** | Não puxar trunfo por defeito | Medium | parcial | Alvo humano; código favorece trunfo longo — **gap** | trunfo length, trick index | sim | sim | não | parcial (inverso) |
| **S10** | Memória Medium: Áses, manilhas, trunfos, pontos | Medium | parcial | Decisões coerentes com cartas vistas | `playedCards` por rank/naipe | sim | sim | sim | parcial (proxy fraco) |
| **S13** | Overtrump económico | Medium | automática | Complemento S12 | trunfos no trick | sim | sim | não | sim |
| **S09** | Filtro probabilístico antes de investir | Hard | automática | Gate Hard; já no código | win probability | sim | sim | sim | sim |

## P2 — Avançadas / Hard

| ID | Descrição humana | Nível | Tipo | Porquê P2 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **S24** | Horizonte 2–3 vazas | Hard | parcial | Reserva de trunfos/figuras | trick index, trunfos restantes | sim | sim | sim | não |
| **S25** | Destrunfar sem prejudicar parceiro | Hard | parcial | Cooperação avançada | void parceiro inferido | sim | sim | sim | não |
| **S26** | Reservar figuras para segunda vaza | Hard | parcial | Economia multi-trick | mão, tricks futuros | sim | sim | sim | não |
| **S27** | Manilha trunfo cedo (anti-preso) | Hard | parcial | Evitar trunfo preso no fim | trunfos na mão, fase ronda | sim | sim | sim | não |
| **S21** | Memória completa + voids | Hard | parcial | Base inferência Hard | histórico completo | sim | sim | sim | parcial |

## P3 — Inferência / julgamento humano

| ID | Descrição humana | Nível | Tipo | Porquê P3 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **S23** | «Mandar putos à escola» | Hard | humana | Intenção estratégica multi-vaza | plano, valor trick | sim | sim | sim | não |
| **S17–S18** | Sinais de parceiro / inferir Ás parceiro | Hard | humana | Convenções implícitas | histórico jogadas parceiro | sim | sim | sim | parcial |
| **T02** | Resposta AI externa válida | Hard | automática | Path legado Sueca-only | HTTP response, legalidade | sim | sim | não | sim |

---

# Spades

P0 cobre bid conservador, cumprimento de contrato, parceiro, bags e corte mínimo.

## P0 — Essenciais

| ID | Descrição humana | Nível | Tipo | Porquê P0 | Dados para avaliar | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------------------|--------|---------|---------|--------|
| **T01** | Jogada legal | Medium | automática | Base | legal moves | sim | sim | não | sim |
| **SP01** | Bid conservador por contagem | Medium | parcial | Fase pré-play; A/K/Q♠ + meia-vaza | mão, bid declarado | sim | sim | não | sim |
| **SP05** | Cumprir bid — agressão controlada | Medium | parcial | Objectivo central Spades | teamTricks vs teamBid | sim | sim | não | sim |
| **SP06** | Proteger parceiro — jogar baixo | Medium | automática | Não roubar parceiro | winner trick, parceiro | sim | sim | não | sim |
| **SP09** | Evitar bags após bid cumprido | Medium | automática | Regra scoring directa | teamTricks ≥ teamBid | sim | sim | não | parcial |
| **SP08** | Cortar com espada mínima | Medium | automática | Economia espadas | void suit, spades legais | sim | sim | não | sim |
| **SP11** | Bags e overtricks (regra) | Medium | automática | Penalização bags | bags acumulados | sim | sim | não | regra |

## P1 — Importantes

| ID | Descrição humana | Nível | Tipo | Porquê P1 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **SP02** | Erro de bid (under/over) | Medium | automática | Avaliação pós-mão | tricks vs bid | sim | sim | não | inferência |
| **SP04** | Evitar liderar espadas cedo | Medium | automática | Preservar honras | trick index, spades led | sim | sim | não | sim |
| **SP10** | Gestão de honras espadas | Medium | parcial | A/K/Q♠ timing | spades played | sim | sim | sim | parcial |
| **SP14** | Quebrar bid adversária alta (8+) | Hard | parcial | Modo agressivo score-aware | bids adversários, score | sim | sim | sim | não |
| **SP07** | Ganhar barato quando abaixo bid | Hard | automática | Variante T04 Spades | need tricks, winners | sim | sim | não | sim |

## P2 — Avançadas / Hard

| ID | Descrição humana | Nível | Tipo | Porquê P2 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **SP03** | Nil / blind nil | Hard | automática | Só Hard no catálogo; gap medium | difficulty, nil success | sim | sim | não | parcial (medium nil ocasional) |
| **SP15** | Destrunfar disciplinado | Hard | parcial | Entrada forçada | spades sequence | sim | sim | sim | parcial |
| **SP12** | Long spade bonus no bid | Hard | parcial | Refinamento SP01 | spade length | sim | sim | não | sim |
| **SP13** | Heurística total bids 12–14 | Medium | parcial | **Heurística**, não regra | soma bids mesa | sim | sim | não | inferência |

## P3 — Score / inferência

| ID | Descrição humana | Nível | Tipo | Porquê P3 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **SP16** | Modo score agressivo vs passivo | Hard | parcial | Trade-off bag vs quebrar bid | scoreboard, fase match | sim | sim | sim | parcial |

---

# Hearts

P0 cobre evitar pontos, Q♠, pass e limpar perigo. Moon e void ficam P1/P2.

## P0 — Essenciais

| ID | Descrição humana | Nível | Tipo | Porquê P0 | Dados para avaliar | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------------------|--------|---------|---------|--------|
| **T01** | Jogada legal | Medium | automática | Base | legal moves | sim | sim | não | sim |
| **H01** | Evitar pontos (♥ e Q♠) | Medium | parcial | Objectivo do jogo | penalty in trick, points taken | sim | sim | não | sim |
| **H11** | Q♠ como perigo máximo | Medium | automática | 20 pts; regra explícita | Q♠ in hand/trick | sim | sim | não | regra |
| **H05** | Passar cartas perigosas | Medium | parcial | Fase pass | pass selection, penalty score | sim | sim | não | sim |
| **H13** | Limpar carta perigosa em vaza nossa sem pontos | Medium | parcial | **Alvo**; distinto de «ganhar barato» | trick owner, trick points=0 | sim | sim | parcial | parcial |
| **H02** | Descartar penalização ao seguir (trick perdido) | Medium | automática | Slough quando não ganhamos | trick winner, penalty cards | sim | sim | não | sim |
| **H03** | Liderar baixa penalização | Medium | automática | Lead seguro | penalty in hand | sim | sim | não | sim |

## P1 — Importantes

| ID | Descrição humana | Nível | Tipo | Porquê P1 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **H12** | Evitar «meninos» (altas isoladas) | Medium | parcial | Vazas indesejadas | suit length, singletons | sim | sim | parcial | não |
| **H07** | Evitar ganhar vaza penalizante | Medium | parcial | Não capturar ♥/Q♠ | trick composition | sim | sim | parcial | parcial |
| **H08** | Evitar liderar copas cedo | Medium | automática | Controlo ♥ | hearts broken, trick index | sim | sim | não | sim |
| **H06** | Pass void espadas | Hard | automática | Slough ♥ quando ♠ led | suit lengths pós-pass | sim | sim | não | sim |
| **H04** | Não liderar copas se alternativa | Hard | automática | Hard lead discipline | legal leads | sim | sim | não | sim |

## P2 — Moon / Hard

| ID | Descrição humana | Nível | Tipo | Porquê P2 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **H09** | Detectar shoot the moon | Hard | parcial | Alvo Fase 1; **não no código** | hearts per player | sim | sim | sim | não |
| **H10** | Bloquear shoot the moon | Hard | parcial | Sacrificar pts vs −26 | moon still possible | sim | sim | sim | não |
| **H14** | Forçar saída da Q♠ | Hard | parcial | Timing Q♠ | spades led, voids | sim | sim | sim | parcial |

## P3 — Julgamento humano

| ID | Descrição humana | Nível | Tipo | Porquê P3 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **H15** | Moon sacrifice for score (raro) | Hard | humana | Trade-off global raro | scoreboard | sim | sim | sim | não |

---

# King

**Hierarquia obrigatória:** contrato activo → regra legal → penalização → risco 2–3 vazas → carta.

## P0 — Essenciais (todos os negativos + obrigações)

| ID | Descrição humana | Nível | Tipo | Porquê P0 | Dados para avaliar | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------------------|--------|---------|---------|--------|
| **K00** | Respeitar contrato activo (meta) | Medium | automática | King é contrato-first | `contractId`, festa phase | sim | sim | não | sim |
| **K02** | K♥ obrigatório na 1.ª oportunidade legal | Medium | automática | Regra autor | K♥ played flag, led ♥ | sim | sim | não | sim |
| **K03** | Não puxar copas se houver outro naipe | Medium | automática | Regra autor | legal moves, led suit | sim | sim | não | sim |
| **K01** | Descarte consciente por contrato (negativos) | Medium | automática | Evitar alvo penalizado | contract penalty map | sim | sim | não | sim |
| **K08** | Damas e homens nos negativos | Medium | automática | Q vs K/V por contrato | isQueen/isMen | sim | sim | não | sim |
| **K09** | Positivos — ganhar com carta mínima | Medium | automática | T04 King positivo | trick winner candidates | sim | sim | não | sim |
| **K12** | Nulos — evitar vazas | Medium | automática | Festa negativa | tricks won player | sim | sim | não | sim |
| **K04** | Liderança negativa fora de copas | Medium | automática | Não liderar ♥ em negativos | contract, legal leads | sim | sim | não | sim |

## P1 — Importantes

| ID | Descrição humana | Nível | Tipo | Porquê P1 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **K05** | Duas últimas — fase inicial vs final | Medium | parcial | Tricks 0–7 vs 8–9 | trick index, contract | sim | sim | parcial | sim |
| **K10** | Últimas vazas — 11.ª define quem abre 12.ª | Hard | parcial | Crítico contrato no_last_two | trick 10–12 winners | sim | sim | sim | parcial |
| **K03h** | Positivo hard económico | Hard | automática | Refinamento K09 | winners | sim | sim | não | sim |

## P2 — Festa / leilão

| ID | Descrição humana | Nível | Tipo | Porquê P2 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **K06** | Festa — leilão e negociação | Hard | parcial | Fase própria; não é play trick | auction state, score | sim | sim | sim | sim |
| **K07** | Festa — fallback (4×3×3, nulos, no_trump) | Hard | parcial | Decisão beneficiário | festa mode | sim | sim | parcial | sim |
| **K13** | Caçar K♥ / forçar penalizações | Hard | parcial | Hard negativo | K♥ location | sim | sim | sim | parcial |
| **K14** | Voids e descarte planeado | Hard | parcial | Slough planeado | suit lengths | sim | sim | sim | parcial |

## P3 — Score global / sintético

| ID | Descrição humana | Nível | Tipo | Porquê P3 | Dados | Logger | Encoder | Memória | Código |
|----|------------------|-------|------|-----------|-------|--------|---------|---------|--------|
| **K11** | Evitar penalizações globais (King simplified) | Hard | parcial | Soma acumulada negativos | cumulative score | sim | sim | sim | pós-jogo |
| **K15** | Score-aware festa/leilão | Hard | parcial | Negociação multi-ronda | scoreboard 10 jogos | sim | sim | sim | parcial |

---

# Métricas transversais prioritárias

Aplicam-se a vários jogos; **T01** e **T04–T06** entram no avaliador v0 antes de métricas P2 por jogo.

| ID | Descrição humana | Jogos | Nível | Prioridade | Tipo | Porquê | Logger | Encoder | Memória | Código |
|----|------------------|-------|-------|------------|------|--------|--------|---------|---------|--------|
| **T01** | Jogada legal | Todos | Medium | **P0** | automática | Pré-condição | sim | sim | não | sim |
| **T03** | Fallback primeira legal | Todos | Medium | P1 | automática | Detectar último recurso | sim | sim | não | sim |
| **T04** | Ganhar barato só quando ganhar é desejável | Sueca, Spades+, King+ | Medium | **P0** | parcial | **Não** Hearts por defeito | sim | sim | parcial | parcial |
| **T05** | Não roubar parceiro | Sueca, Spades | Medium | **P0** | automática | SP06, S19 | sim | sim | não | sim |
| **T06** | Jogar baixo para perder / evitar penalização | Spades pós-bid, King−, Hearts | Medium | **P0** | parcial | Objectivo invertido | sim | sim | parcial | parcial |
| **T07** | Limpar carta perigosa | Hearts, King | Medium | **P1** | parcial | H13, slough negativos | sim | sim | parcial | parcial |
| **T08** | Carta perigosa ≠ carta mais alta | King, Hearts | Medium | **P1** | parcial | Perigo por contrato | sim | sim | não | parcial |
| **T09** | Criar void | Sueca, Hearts, King | Hard | **P2** | parcial | Singleton, pass ♠ | sim | sim | sim | parcial |
| **T10** | Memória Medium | Todos | Medium | **P1** | parcial | Áses, trunfos, alvos | sim | sim | sim | parcial |
| **T11** | Memória Hard | Todos | Hard | **P3** | parcial | Horizonte 2–3 vazas | sim | sim | sim | parcial |
| **T02** | Resposta AI externa válida | Sueca legado | Hard | P3 | automática | Path subordinado | sim | sim | não | sim |

---

# Recomendação para Fase 2B

A Fase 2B cria **fixtures documentais** (boa / média / má) **apenas** para métricas abaixo — máximo **5 por jogo**, com **≥2 Medium** e **≥1 Hard** cada.

Critérios de selecção: utilidade para avaliador v0, avaliação automática ou parcial simples, cobertura de regras vs estratégia.

## Lista Fase 2B inicial (20 fixtures + 3 transversais)

### Sueca (5)

| # | ID | Métrica | Nível | Motivo |
|---|-----|---------|-------|--------|
| 1 | **S08** | Ganhar com carta mínima (com risco corte) | Medium | Core economia; código existe |
| 2 | **S16** | Não abrir manilha antes do Ás | Medium | Auto com tracking |
| 3 | **S19** | Pontos ao parceiro só vaza segura | Medium | Cooperação |
| 4 | **S12** | Cortar com trunfo mínimo | Medium | Par trunfo P0 |
| 5 | **S25** | Destrunfar sem prejudicar parceiro | Hard | Representa Hard Sueca |

*Opcional 6.º (se S04 alinhado cedo):* **S04** singleton — substitui S19 na lista se parceiro for menos prioritário.

### Spades (5)

| # | ID | Métrica | Nível | Motivo |
|---|-----|---------|-------|--------|
| 1 | **SP01** | Bid conservador / meia-vaza | Medium | Pré-play + pós-mão |
| 2 | **SP06** | Proteger parceiro | Medium | Auto |
| 3 | **SP09** | Evitar bags pós-bid | Medium | Auto, scoring |
| 4 | **SP08** | Cortar espada mínima | Medium | Auto |
| 5 | **SP14** | Quebrar bid adversária 8+ | Hard | Score-aware |

### Hearts (5)

| # | ID | Métrica | Nível | Motivo |
|---|-----|---------|-------|--------|
| 1 | **H01** | Evitar pontos | Medium | Objectivo base |
| 2 | **H05** | Pass cartas perigosas | Medium | Fase pass |
| 3 | **H13** | Limpar perigo em vaza nossa | Medium | Alvo crítico; gap código |
| 4 | **H11** | Q♠ perigo máximo | Medium | Regra 20 pts |
| 5 | **H10** | Bloquear shoot the moon | Hard | Hard Hearts representativo |

### King (5)

| # | ID | Métrica | Nível | Motivo |
|---|-----|---------|-------|--------|
| 1 | **K00** | Contrato activo primeiro | Medium | Meta King |
| 2 | **K02** | K♥ 1.ª oportunidade legal | Medium | Obrigação regra |
| 3 | **K03** | Não puxar copas | Medium | Obrigação regra |
| 4 | **K01** | Slough consciente negativo | Medium | Por contrato |
| 5 | **K10** | Duas últimas — trick 11 | Hard | Especificidade King |

### Transversais (3 fixtures partilhados)

| # | ID | Métrica | Aplicar em fixtures |
|---|-----|---------|---------------------|
| 1 | **T01** | Jogada legal | Todos os jogos (cenário ilegal vs legal) |
| 2 | **T04** | Ganhar barato condicional | Sueca + King positivo (contraste Hearts H13) |
| 3 | **T06** | Jogar baixo para perder | Spades SP09 + King negativo |

**Total Fase 2B:** 23 fixtures documentais (20 jogo-específicos + 3 transversais reutilizáveis).

**Fixtures implementados:** [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) · **Diferidos:** [FASE_2B_ARQUIVO_FIXTURES.md](FASE_2B_ARQUIVO_FIXTURES.md)

**Explicitamente fora da Fase 2B inicial:** S23, H15, K06 leilão, SP03 nil, T11 — ficam no arquivo para Fase 2B estendida ou Fase 5 v2.

---

# Fases seguintes

## Fase 2B — Fixtures avaliáveis (prioritários)

Usa **este documento** como filtro: só métricas da secção «Recomendação para Fase 2B». Saída: [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) (23 fixtures). Fixtures restantes: [FASE_2B_ARQUIVO_FIXTURES.md](FASE_2B_ARQUIVO_FIXTURES.md). Formato boa/média/má — ver [FASE_1_METRICAS.md](FASE_1_METRICAS.md) §Convenções.

## Fase 3 — Logger de partidas

Desenho: [FASE_3_LOGGER_DESIGN.md](FASE_3_LOGGER_DESIGN.md).

Campos mínimos derivados de **P0 + P1**:

- Identificação: `variant`, `contractId`, `trickIndex`, `seat`, `playerType`
- Decisão: `hand`, `legalMoves`, `chosenCard`, `trickBefore`, `trickAfter`
- Contexto: `trump`, `teamBid`, `teamTricks`, `bags`, `heartsTaken`, `contractPenalties`
- Histórico: `roundPlayHistory` por evento (genérico; **não** depender só de `GameState.playedCards`)
- Tags logger v0: `metricsCandidateIds`, `fixtureCandidateIds` — **sem** avaliação
- `classification`: sempre `"unknown"` · `reason`: sempre `null` — **só Fase 5 preenche** (não pertencem ao logger v0)

Prioridade logger: **T01 → K02/K03 → SP09 → H13 → S08 → SP06 → K01**.

## Fase 4 — Encoder de estado

Um encoder por jogo, alinhado com logger. Campos **P0**:

| Jogo | Campos encoder prioritários |
|------|------------------------------|
| Sueca | trunfo, trick, legal mask, winner trick, acesSeen, trumpMinWinner |
| Spades | bid, teamTricks, bags, spadesBroken, needTricks |
| Hearts | heartsBroken, penaltyInHand, trickPoints, passPhase |
| King | contractId, festaPhase, kHeartPlayed, penaltyMap, trick11Leader |

**P2/P3** acrescentam: void inference bitmap, scoreboard festa, moon counters.

## Fase 5 — Avaliador de decisões

Pipeline: **legalidade (T01) → métricas P0 do jogo → alternativas legais → classificação boa/média/má**.

Entrada: fixture Fase 2B + log Fase 3 + estado Fase 4.  
Saída: `{ metricId, classification, reason, alternatives[] }`.

Ordem implementação sugerida: transversais T01/T04/T06 → King obrigações → Spades SP09/SP06 → Sueca S08/S12 → Hearts H13/H11.

## Fase 6 — Memória / aprendizagem

Métricas **T10, T11, S21, H09, K15** — padrões agregados por jogador e por métrica.

## Fase 7 — Mini-LLM local/fallback

Recebe encoder + métricas aplicáveis + avaliação heurística; **nunca** escolhe carta ilegal. Métricas **P3** (S23, H15, K06 negociação) como contexto explicativo, não como ground truth automática.

---

# Resumo executivo das prioridades

| Jogo | P0 (count) | P1 | P2 | P3 | Top 3 P0 |
|------|------------|----|----|-----|----------|
| **Sueca** | 7 (+T01) | 5 | 5 | 3 | S08, S16, S12 |
| **Spades** | 7 | 5 | 4 | 1 | SP01, SP09, SP06 |
| **Hearts** | 7 | 5 | 3 | 1 | H01, H11, H13 |
| **King** | 8 | 3 | 4 | 2 | K00, K02, K03 |
| **Transversal** | 4 | 4 | 1 | 2 | T01, T04, T05, T06 |

**Primeiro avaliador viável (P0 only):** ~30 regras verificáveis, maioritariamente automáticas, sem moon/leilão/escola.

---

# Dúvidas e conflitos (herdados Fase 1)

| # | Tema | Impacto na priorização |
|---|------|------------------------|
| 1 | Sueca S05 código vs catálogo | P1, não P0 — avaliador pode flag gap sem bloquear v0 |
| 2 | AI externa Sueca lead highest | T02 em P3; P0 usa catálogo humano |
| 3 | Hearts H09/H10/H13 sem código completo | H13 em P0 e Fase 2B — avaliador **antes** do bot |
| 4 | Spades nil em medium vs Hard-only | SP03 P2; não entra Fase 2B |
| 5 | King K10 trick 11 — inferência líder trick 12 | P1/P2; fixture Hard Fase 2B |
| 6 | «Mandar putos à escola» S23 | P3; fora Fase 2B inicial |

---

## Referências

- [ROADMAP_AI.md](ROADMAP_AI.md)
- [FASE_1_METRICAS.md](FASE_1_METRICAS.md)
- [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md)
- [docs/rules/king.md](../rules/king.md)

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Prioridades Fase 2A — base para Fase 2B |
| 1.1 | 2026-05-31 | Ligação a FASE_2B_FIXTURES + arquivo diferidos |
| 1.2 | 2026-05-31 | Fase 3: logger v0 sem classification/reason; roundPlayHistory genérico |
