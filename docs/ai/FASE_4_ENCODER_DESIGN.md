# Fase 4 — Encoder de Estado (desenho)

Documento de saída da **Fase 4** do [ROADMAP_AI](ROADMAP_AI.md).

**Base:** [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md) · [FASE_1_METRICAS.md](FASE_1_METRICAS.md) · [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md) · [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) · [FASE_3_LOGGER_DESIGN.md](FASE_3_LOGGER_DESIGN.md)  
**Data:** 2026-05-31  
**Scope:** desenho documental — **sem implementação**, **sem código**, **sem backend**.

---

## Frase-guia

| Papel | Metáfora | Responsabilidade |
|-------|----------|------------------|
| **Logger (Fase 3)** | Gravador | Regista eventos e snapshots |
| **Encoder (Fase 4)** | Tradutor | Transforma bruto → features/contexto |
| **Avaliador (Fase 5)** | Juiz | Classifica boa / média / má |

O encoder **não decide** se a jogada foi boa. Apenas **traduz** estado bruto em contexto útil.

---

# 1. Resumo

Sequência Card Intelligence:

```
Fase 2A — prioridades de métricas (P0–P3)
    ↓
Fase 2B — 23 fixtures activos (boa / média / má)
    ↓
Fase 3 — logger (CardDecisionLogEvent + auxiliares)
    ↓
Fase 4 — encoder (EncodedDecisionState)     ← este documento
    ↓
Fase 5 — avaliador (classification + reason)
    ↓
Fase 6 — memória / aprendizagem
    ↓
Fase 7 — mini-LLM local / fallback
```

**Objectivo do encoder:** consumir logs e/ou snapshots da engine e produzir **EncodedDecisionState** — estrutura estável, legível por avaliador, análise humana, agregadores Fase 6 e futura mini-LLM.

**Duas saídas obrigatórias por decisão:**

| View | Audiência | Conteúdo |
|------|-----------|----------|
| **Engine View** | Debug, replay, auditoria, treino offline controlado | Estado completo + derivados |
| **Player View** | Avaliador justo, treino honesto, LLM | Só informação que o jogador **podia** ter |

**Player View é essencial** — contaminar treino ou LLM com mãos adversárias ocultas invalida comparação humano/AI.

---

# 2. O que o encoder NÃO faz

| Não faz | Porquê |
|---------|--------|
| Alterar gameplay | Camada read-only sobre logs/engine |
| Escolher cartas | Papel dos bots / humano |
| Classificar boa / média / má | Papel do avaliador (Fase 5) |
| Preencher `classification` ou `reason` | Reservado Fase 5 |
| Substituir bots ou heurísticas | Card Intelligence acima dos bots |
| Chamar LLM | Fase 7 |
| Escrever logs | Papel do logger (Fase 3) |
| Inventar informação oculta na Player View | Viola perspectiva real do jogador |
| Substituir motor de regras | `legalMoves` vêm de `canPlayCard` / adapter |

---

# 3. Duas visões obrigatórias

## 3.1 Engine View

**Uso:** debug; testes unitários; treino offline com supervisão; auditoria; replay frame-a-frame.

**Pode conter:**

- Todas as mãos (se disponíveis no host / replay omnisciente)
- `roundPlayHistory` completo
- Todos os derivados (voids confirmados, não só inferidos)
- Score e `variantState` completos
- Campos de debug (`aiSource`, divergências log vs replay)

**Quando gerar:** debug local; testes automatizados; export JSONL para análise offline — **não** usar por defeito como entrada da mini-LLM (Fase 7); preferir **Player View**.

## 3.2 Player View

**Uso:** avaliador justo; treino honesto; futura mini-LLM; comparação humano vs AI.

**Só pode conter:**

| Permitido | Proibido |
|-----------|----------|
| Mão do **decisor** (`hand`) | Mãos exactas dos adversários |
| Cartas já jogadas (`visiblePlayedCards` / `roundPlayHistory`) | Cartas ainda na mão adversária |
| Bids / contratos **visíveis** na mesa | Bids ocultos não revelados (raro) |
| Score **visível** ao jogador | Score interno host-only se existir |
| Inferências **deduzíveis** do histórico (`inferredVoids`) | Void confirmado só porque engine sabe a mão |

**Regra:** se o jogador humano na mesa **não poderia** deduzir um facto, a Player View **não** inclui esse facto como `known` — no máximo como `inferred` com `confidence < 1`.

## 3.3 Política `hiddenInformationPolicy`

Campo global em `EncodedDecisionState`:

```typescript
hiddenInformationPolicy: {
  viewType: 'engine' | 'player';
  excludedFields: string[];     // ex.: ['opponentHands', 'deckRemaining']
  inferenceAllowed: boolean;    // player: true para voids; engine: true
  sourceOfTruth: 'log' | 'replay' | 'live_engine';
}
```

---

# 4. Output base: `EncodedDecisionState`

Schema documental **v4.0.0** — notação TypeScript, não código.

## 4.1 Campos globais

```typescript
interface EncodedDecisionState {
  schemaVersion: '4.0.0';
  sourceEventId: string | null;   // CardDecisionLogEvent.eventId ou BidEvent etc.
  gameId: string;
  sessionId: string;
  timestamp: string;

  variant: 'sueca' | 'spades' | 'hearts' | 'king';
  mode: string | null;            // preset id
  contractId: string | null;      // King; null noutros
  phase: DecisionPhase;

  playerIndex: number;
  playerType: 'human' | 'ai' | 'remote';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  viewType: 'engine' | 'player';
  encodeMode: 'pre_decision' | 'post_decision';

  roundIndex: number;
  trickIndex: number;
  turnIndex: number;

  // --- Bruto (perspectiva filtrada por viewType) ---
  hand: Card[];
  legalMoves: Card[];
  chosenCard: Card | null;        // ver §4.2 — null em pre_decision; preenchido em post_decision

  currentTrick: Card[];           // cartas na vaza antes de chosenCard
  trickPosition: number;          // 0–3 cartas já no trick
  ledSuit: Suit | null;
  trumpSuit: Suit | null;
  currentWinner: number | null;

  visiblePlayedCards: RoundPlayEntry[];  // subset player-safe de roundPlayHistory
  importantCardsSeen: ImportantCardsSeen;

  scoreContext: ScoreContext;
  riskContext: RiskContext;
  memoryContext: MemoryContext;

  metricContext: MetricContextEntry[];

  availableInformation: InformationBucket;   // known
  hiddenInformationPolicy: HiddenInfoPolicy;

  // --- Extensão por jogo ---
  variantEncoding: SuecaEncoding | SpadesEncoding | HeartsEncoding | KingEncoding;
}

type DecisionPhase =
  | 'play'
  | 'bid'
  | 'pass'
  | 'auction'
  | 'contract_select'
  | 'other';
```

## 4.2 Modos de encode: pré-decisão vs pós-decisão

O encoder expõe **dois modos** explícitos (`encodeMode`). Não confundir com Engine/Player View — são eixos independentes (4 modos combinatórios possíveis).

| Modo | `encodeMode` | `chosenCard` | Consumidor | Fase |
|------|--------------|--------------|------------|------|
| **Pré-decisão** | `pre_decision` | **`null`** | Bots actuais; AI provider; futura mini-LLM a **sugerir** jogada | 7 (e integração bot) |
| **Pós-decisão** | `post_decision` | **Preenchido** (carta efectivamente jogada) | Avaliador a **classificar** boa / média / má | **5** |

### Pré-decisão (`pre_decision`)

- Estado **immediately before** a escolha: `hand`, `legalMoves`, `currentTrick`, derivados de contexto.
- `chosenCard` **deve ser** `null` — ainda não há decisão.
- **Não** usar para avaliar qualidade de jogada (não há jogada a julgar).
- Player View recomendada para sugestões honestas; Engine View só para debug interno.

### Pós-decisão (`post_decision`)

- Estado no instante **depois** da escolha registada no logger (`CardDecisionLogEvent.chosenCard`).
- `chosenCard` **obrigatório** e ∈ `legalMoves`.
- Entrada principal do **avaliador Fase 5**: comparar `chosenCard` vs alternativas legais e fixtures 2B.
- `metricContext` pode incluir métricas cuja avaliação depende da carta escolhida.

**Regra:** o avaliador (Fase 5) usa **sempre** encode **pós-decisão**. Pré-decisão é fora do scope do juiz.

## 4.3 Notas de campos

| Campo | Nota |
|-------|------|
| `encodeMode` | `pre_decision` \| `post_decision` — ver §4.2 |
| `chosenCard` | Ligado a `encodeMode`; ver §4.2 |
| `metricContext` | Lista de métricas **aplicáveis** — **não** é classificação |
| `importantCardsSeen` | Áses, manilhas, Q♠, K♥, trunfos — agregado cross-game |
| `viewType` | Mesmo evento pode gerar **dois** outputs: `engine` + `player` |

## 4.4 Buckets de informação

```typescript
interface InformationBucket {
  known: Record<string, unknown>;      // factos visíveis
  inferred: Record<string, unknown>;   // deduções com confidence
  hidden: string[];                    // nomes de campos omitidos na Player View
}

interface MetricContextEntry {
  metricId: string;                    // ex.: "S08"
  metricNameHuman: string;
  applicable: boolean;                 // NÃO é boa/média/má
  neededFields: string[];
  missingFields: string[];             // se applicable=false por falta de dados
  confidence: number;                  // 0–1 relevância desta métrica aqui
  reasonShort: string;                 // ex.: "Parceiro a ganhar trick"
}
```

---

# 5. Dados brutos vs features derivadas

## 5.1 Dados brutos

Origem: logger, `GameState`, eventos auxiliares.

| Exemplo | Fonte típica |
|---------|----------------|
| `hand`, `legalMoves` | CardDecisionLogEvent |
| `currentTrick`, `ledSuit` | trickBefore |
| Bids | BidEvent |
| Contrato | ContractSelectedEvent |
| Score | scoreBefore / variantState |
| Cartas jogadas | `roundPlayHistory` |

## 5.2 Features derivadas

Calculadas pelo encoder a partir de bruto + histórico. **Devem ser recalculáveis** a partir de log + regras — nunca «fonte única» irrecuperável.

| Feature | Fórmula / regra |
|---------|-----------------|
| `currentWinner` | Trick-taking rules por variant |
| `pointsInTrick` | Hearts/King penalty map |
| `needTricks` | Spades: `max(0, teamBid - teamTricks)` |
| `bidMet` | `teamTricks >= teamBid` |
| `acesSeenBySuit` | Scan `visiblePlayedCards` |
| `dangerousCardsInHand` | Variant penalty function |
| `voidsInferred` | Pass + follow patterns |
| `contractPenaltyMap` | King contractId |
| `moonStillPossible` | Hearts hearts per player |
| `lastTwoRisk` | King trick 10–12 |
| `canWinCheaply` | Min winner ∈ legalMoves (T04 condicional) |
| `safeToFeedPartner` | partnerWinning && team safe |

## 5.3 Política de persistência vs recálculo

| Abordagem | Logger guarda derivado? | Encoder recalcula? |
|-----------|-------------------------|---------------------|
| P0 avaliador v0 | Opcional (debug) | **Sim** — fonte de verdade na recalc |
| Divergência log vs encoder | — | **Replay/engine** ganha |

---

# 6. Encoder por jogo

Um **encoder module** por variant; interface comum: `(event, viewType) => EncodedDecisionState`.

## 6.1 Sueca Encoder

**Contexto para métricas:** parceiro, trunfo, pontos na vaza, memória Medium/Hard, corte, destrunfar.

### Campos `SuecaEncoding`

| Campo | Tipo | Bruto/D | Métricas |
|-------|------|---------|----------|
| `trumpSuit` | Suit | B | S12, S08 |
| `partnerIndex` | number | D | S19, T05 — `(playerIndex + 2) % 4` |
| `teamIndex` | 1 \| 2 | B | score |
| `teamPointsInTrick` | number | D | S08 |
| `partnerWinning` | boolean | D | S19 |
| `acesSeenBySuit` | Record<Suit, boolean> | D | S16 |
| `sevensSeenBySuit` | Record<Suit, boolean> | D | S16, S10 |
| `trumpSeenCount` | number | D | S12, S05 |
| `playerSuitLengths` | Record<Suit, number> | B | S04 |
| `singletonSuits` | Suit[] | D | S04 |
| `inferredVoids` | Record<number, Suit[]> | D | S08, S25 |
| `cutRisk` | 'low' \| 'medium' \| 'high' | D | S08, T04 |
| `safeToFeedPartner` | boolean | D | S19 |
| `canWinCheaply` | boolean | D | S08, T04 |
| `trumpControlEstimate` | number | D | S09 Hard |
| `isLeading` | boolean | D | S04, S16 |
| `playersYetToPlayInTrick` | number | D | S08 |

**Memória Medium:** `importantCardsSeen` (Áses, 7s, trunfos, cartas de ponto).  
**Memória Hard:** `visiblePlayedCards` completo + `inferredVoids` + horizonte 2–3 tricks (`tricksRemaining`).

## 6.2 Spades Encoder

**Contexto:** bid, tricks, bags, espadas, parceiro, quebrar bid adversária.

### Campos `SpadesEncoding`

| Campo | Tipo | Bruto/D | Métricas |
|-------|------|---------|----------|
| `playerBid` | number | B | SP01 |
| `teamBid` | number | B | SP05, SP09 |
| `opponentBid` | number | D | SP14 |
| `playerTricks` | number | D | SP01 pós-mão |
| `teamTricks` | number | D | SP09, T06 |
| `opponentTricks` | number | D | SP14 |
| `bags` | number | D | SP09, SP11 |
| `spadesBroken` | boolean | B/D | SP04, SP08 |
| `needTricks` | number | D | SP05, SP08 |
| `bidMet` | boolean | D | SP09, T06 |
| `avoidBagMode` | boolean | D | SP09 |
| `opponentHighBidThreat` | boolean | D | SP14 — opp bid ≥ 8 |
| `nilStatus` | string | B | SP03 P2 |
| `partnerWinning` | boolean | D | SP06, T05 |
| `spadesSeen` | Card[] | D | SP08, SP10 |
| `inferredVoids` | Record<number, Suit[]> | D | SP08 |
| `spadeControlEstimate` | number | D | SP10 Hard |

**Bid phase:** `phase: 'bid'` — encoder usa `BidEvent`; `hand` completa; sem trick.

## 6.3 Hearts Encoder

**Contexto:** pontos, Q♠, pass, voids, moon, limpar perigo.

### Campos `HeartsEncoding`

| Campo | Tipo | Bruto/D | Métricas |
|-------|------|---------|----------|
| `heartsBroken` | boolean | B/D | H08 |
| `queenSpadesPlayed` | boolean | D | H11 |
| `queenSpadesOwnerKnown` | number \| null | D | H11 |
| `heartsTakenByPlayer` | number[] | D | H10 |
| `pointsTakenByPlayer` | number[] | D | H01 |
| `pointsInTrick` | number | D | H01, H13 |
| `dangerousCardsInHand` | Card[] | D | H05, H11, H13 |
| `passDirection` | string | B | H05 |
| `passedCards` | Card[] | B | H05 — do PassCardsEvent |
| `voidSuits` | Suit[] | D | H06, T09 |
| `moonCandidatePlayer` | number \| null | D | H10 |
| `moonStillPossible` | boolean | D | H10 |
| `trickIsSafeAndPointless` | boolean | D | H13 — trick ours, 0 pts |
| `canCleanDangerousCard` | boolean | D | H13, T07 |
| `isPassPhase` | boolean | B | H05 |

**Nota:** Hearts **não** usa `canWinCheaply` como regra geral (T04); encoder expõe `trickIsSafeAndPointless` + `canCleanDangerousCard` em vez de «ganhar barato».

## 6.4 King Encoder

**Contrato-first.** Hierarquia de avaliação espelhada no encoding:

1. `contractId` / `contractType`
2. Obrigações legais (`mustPlayKingHeartsNow`, `cannotLeadHearts`)
3. `penaltyMap` / `contractPenaltiesInTrick`
4. Risco futuro (`isLastTwoPhase`, `eleventhTrickControlRisk`)
5. Carta / trick local

### Campo P0 obrigatório: `mustPlayKingHeartsNow`

**Prioridade:** P0 · **Métrica:** K02 · **Tipo:** derivado (obrigação legal).

`true` **se e só se** todas as condições:

1. O jogador **tem** Rei de Copas (`K♥`) na mão;
2. **É legal** jogar `K♥` agora (`K♥ ∈ legalMoves`);
3. É a **primeira oportunidade legal** de o fazer (nunca jogado numa ocasião legal anterior nesta partida/ronda);
4. A **regra King** obriga a jogá-lo nessa oportunidade ([`king.md`](../rules/king.md)).

`false` em qualquer outro caso — incluindo «tem K♥ mas ainda não é oportunidade legal» ou «K♥ já foi jogado na 1.ª legal».

**Distinção:** `kingHeartsPlayed` = histórico (já saiu); `mustPlayKingHeartsNow` = **obrigação activa neste instante**. Ambos P0; o avaliador K02 depende de `mustPlayKingHeartsNow`.

### Campos `KingEncoding`

| Campo | Tipo | Bruto/D | Métricas |
|-------|------|---------|----------|
| `contractId` | string | B | K00, K01 |
| `contractType` | string | B | K00 |
| `festaPhase` | string \| null | B | K06 P2 |
| `beneficiaryIndex` | number \| null | B | festa |
| `auctionState` | object \| null | B | P2 |
| `trumpSuit` | Suit \| null | B | positivos |
| `noTrump` | boolean | B | nulos |
| `kingHeartsPlayed` | boolean | D | K02 |
| `kingHeartsHolderKnown` | number \| null | D | K02 |
| `mustPlayKingHeartsNow` | boolean | D | **P0** · K02 — ver bloco acima |
| `cannotLeadHearts` | boolean | D | K03, K04 |
| `penaltyMap` | Record<string, number> | D | K01, T08 |
| `penaltyCardsVisible` | Card[] | D | K01 |
| `contractPenaltiesInTrick` | number | D | K01 |
| `nulosMode` | boolean | B | K12, T06 |
| `syntheticMode` | boolean | B | K11 |
| `isLastTwoPhase` | boolean | D | K10 |
| `trickNumberForLastTwo` | number | D | K10 — 1-based |
| `eleventhTrickControlRisk` | 'low' \| 'high' | D | K10 |
| `currentContractTarget` | string | D | ex.: "zero_tricks", "zero_hearts", "+25/trick" |

**Player View King:** score festa visível; mão própria; cartas jogadas; contrato activo — **não** mãos adversárias.

---

# 7. MetricContext

O encoder **prepara** contexto; o avaliador **julga**.

## 7.1 Pipeline

```
CardDecisionLogEvent
    → Encoder (viewType)
    → EncodedDecisionState.metricContext[]
    → Avaliador (Fase 5) filtra applicable + aplica regras/fixtures
```

## 7.2 Exemplo (Sueca, parceiro a ganhar)

```typescript
{
  metricId: "S19",
  metricNameHuman: "Dar pontos ao parceiro só com vaza segura",
  applicable: true,
  neededFields: ["partnerWinning", "legalMoves", "teamPointsInTrick"],
  missingFields: [],
  confidence: 0.9,
  reasonShort: "Parceiro é currentWinner; trick em curso"
}
```

## 7.3 Regras MetricContext

| Regra | Detalhe |
|-------|---------|
| `applicable: true` | **Não** significa boa jogada — só relevância |
| `confidence` | Quão seguro está o encoder de que a métrica se aplica ao **contexto** |
| `missingFields` | Se ≠ [], avaliador pode marcar «não avaliável» |
| Prioridade P0 | Gerar entries para métricas Fase 2B + T01/T04/T06 |
| P3 | S23, H15 — `applicable` possível com `confidence` baixa |

## 7.4 Mapeamento rápido P0 → metricContext

| ID | Trigger encoder (resumo) |
|----|--------------------------|
| T01 | Sempre em `phase: play` |
| T04 | `canWinCheaply` ou Hearts `canCleanDangerousCard` |
| T06 | `bidMet` ou King negativo / nulos |
| S08 | `canWinCheaply` && `cutRisk` |
| S16 | `isLeading` && 7 in hand && !acesSeenBySuit[suit] |
| S19 | `partnerWinning` |
| SP09 | `avoidBagMode` |
| H13 | `trickIsSafeAndPointless` |
| K02 | `mustPlayKingHeartsNow` |

---

# 8. Informação escondida e inferência

## 8.1 Três classes

| Classe | Definição | Player View | Engine View |
|--------|-----------|-------------|-------------|
| **known** | Visível na mesa | Sim | Sim |
| **inferred** | Deduzível com raciocínio humano | Sim, com `confidence` | Sim |
| **hidden** | Só engine conhece | **Omitido** | Sim |

## 8.2 Exemplos

| Facto | Classe (Player View) |
|-------|----------------------|
| Cartas no trick actual | known |
| Ás de ouros já jogado | known |
| Adversário seguiu naipe 3 vezes → provável void | inferred |
| Mão exacta do adversário (12 cartas) | hidden |
| Ordem restante do baralho | hidden |
| Void **confirmado** porque engine viu mão | hidden (Player); known (Engine) |

## 8.3 Inferência permitida na Player View

| Inferência | Método | Confidence |
|------------|--------|------------|
| Void por não seguir naipe | Histórico `roundPlayHistory` | Média-alta |
| Ás ainda por sair | Contagem por naipe | Alta se all seen |
| Parceiro void (Sueca Hard) | Padrão de descartes | Baixa-média |
| Moon candidate | ♥ acumulados por seat | Média |

**Proibido:** expor `hidden` como `known` «porque o bot precisa».

---

# 9. Relação com fixtures 2B

Fixtures: [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md). Campos **mínimos** do encoder (Player View salvo nota).

## 9.1 Sueca

| Fixture | ID | Campos encoder mínimos |
|---------|-----|------------------------|
| Ganhar barato / risco corte | S08 | `canWinCheaply`, `cutRisk`, `legalMoves`, `currentWinner`, `playersYetToPlayInTrick` |
| Não abrir manilha antes Ás | S16 | `isLeading`, `acesSeenBySuit`, `sevensSeenBySuit`, `hand` |
| Parceiro vaza segura | S19 | `partnerWinning`, `safeToFeedPartner`, `partnerIndex` |
| Trunfo mínimo | S12 | `trumpSuit`, `legalMoves`, `needTricks` N/A, winners in trick |
| Destrunfar parceiro | S25 | `inferredVoids[partnerIndex]`, `trumpControlEstimate`, `isLeading` |

## 9.2 Spades

| Fixture | ID | Campos encoder mínimos |
|---------|-----|------------------------|
| Bid conservador | SP01 | `phase: bid`, `hand`, `playerBid`; pós: tricks vs bid |
| Proteger parceiro | SP06 | `partnerWinning`, `legalMoves` |
| Evitar bags | SP09 | `bidMet`, `avoidBagMode`, `teamTricks`, `bags` |
| Espada mínima | SP08 | `needTricks`, `legalMoves`, `spadesBroken` |
| Quebrar bid 8+ | SP14 | `opponentHighBidThreat`, `bidMet`, scoreContext |

## 9.3 Hearts

| Fixture | ID | Campos encoder mínimos |
|---------|-----|------------------------|
| Evitar pontos | H01 | `pointsInTrick`, `pointsTakenByPlayer` |
| Pass perigosos | H05 | `phase: pass`, `dangerousCardsInHand`, `passedCards` |
| Limpar perigo vaza nossa | H13 | `trickIsSafeAndPointless`, `canCleanDangerousCard` |
| Q♠ perigo | H11 | `dangerousCardsInHand`, `queenSpadesPlayed` |
| Bloquear moon | H10 | `moonStillPossible`, `moonCandidatePlayer`, `heartsTakenByPlayer` |

## 9.4 King

| Fixture | ID | Campos encoder mínimos |
|---------|-----|------------------------|
| Contrato activo | K00 | `contractId`, `currentContractTarget`, `contractType` |
| K♥ obrigatório | K02 | `mustPlayKingHeartsNow`, `legalMoves`, `kingHeartsPlayed` |
| Não puxar copas | K03 | `cannotLeadHearts`, `ledSuit`, `legalMoves` |
| Slough consciente | K01 | `penaltyMap`, `contractPenaltiesInTrick`, `penaltyCardsVisible` |
| Duas últimas / t11 | K10 | `isLastTwoPhase`, `trickNumberForLastTwo`, `eleventhTrickControlRisk` |

## 9.5 Transversais

| Fixture | ID | Campos |
|---------|-----|--------|
| Jogada legal | T01 | `legalMoves`, `chosenCard` |
| Ganhar barato condicional | T04 | `canWinCheaply` (Sueca/King+); **not** default Hearts |
| Jogar baixo perder | T06 | `bidMet`, `avoidBagMode`, `currentContractTarget` negativo |

---

# 10. Relação com logger

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│ Game / UI   │────▶│ Logger (F3)  │────▶│ IndexedDB / JSONL   │
└─────────────┘     └──────────────┘     └──────────┬──────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │ Encoder (F4)         │
                                         │  • lê evento(s)      │
                                         │  • recalcula derived │
                                         │  • filtra viewType   │
                                         └──────────┬───────────┘
                                                    │
                                                    ▼
                                         EncodedDecisionState
                                                    │
                                                    ▼
                                         Avaliador (F5)
```

| Aspecto | Logger | Encoder |
|---------|--------|---------|
| Grava eventos | Sim | Não |
| `roundPlayHistory` | Snapshot por evento | Filtra → `visiblePlayedCards` |
| Derivados debug | Pode gravar | **Recalcula** preferencialmente |
| `classification` | `"unknown"` fixo | Não toca |
| `metricContext` | `metricsCandidateIds` tags | **`MetricContextEntry` rico** |
| Fonte em divergência | Log + replay | **Replay / engine** |

**Modos de entrada encoder:**

1. **Online:** último `CardDecisionLogEvent` + janela de eventos auxiliares
2. **Offline:** stream JSONL completo reconstruído
3. **Fixture test:** estado sintético + `source: fixture`

---

# 11. Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | Player View contamina treino/LLM | Modelo «batota» | `hiddenInformationPolicy`; testes que falham se opponent hand presente |
| R2 | Encoder demasiado grande | Manutenção | Módulos por variant; P0 fields only v1 |
| R3 | Features difíceis de recalcular | Divergência avaliador | Funções puras documentadas; golden tests vs fixtures 2B |
| R4 | Divergência entre jogos | API inconsistente | `EncodedDecisionState` comum + `variantEncoding` |
| R5 | King complexidade | Bugs contrato | Hierarquia explícita; campos obrigação antes de estratégia |
| R6 | Multiplayer host/joiner | Player View parcial no joiner | Encoder no host; joiner só self perspective |
| R7 | Mobile / performance | Lag | Encoder offline ou pós-partida v1; cache por eventId |
| R8 | Logs schema 3.0.0 vs encoder 4.0.0 | Incompatibilidade ao reler JSONL antigo | **Documentação futura** — mapeamento de versões; **sem implementação** nesta fase |
| R9 | MetricContext confundido com veredicto | UX errada | Naming; avaliador único autor de good/ok/bad |
| R10 | Inferência demasiado optimista | Avaliador injusto | `confidence` + conservador na Player View |

---

# 12. Próxima fase — Avaliador (Fase 5)

## 12.1 Entradas

| Fonte | Uso |
|-------|-----|
| Logger (F3) | Eventos brutos, `roundPlayHistory`, chosenCard |
| Encoder (F4) | `EncodedDecisionState` **Player View** para julgamento justo |
| Fixtures 2B | Golden expected boa/média/má |
| Métricas F1 | Regras formais por ID |
| Prioridades 2A | Ordem P0 → P1 → P2 |

## 12.2 Saída avaliador (primeira escrita)

```typescript
interface EvaluationResult {
  sourceEventId: string;
  metricResults: Array<{
    metricId: string;
    classification: 'good' | 'ok' | 'bad';
    reason: string;
    alternativesConsidered: Card[];
  }>;
  overallClassification: 'good' | 'ok' | 'bad';
  overallReason: string;
}
```

**Nota:** `classification` / `reason` entram **aqui** pela primeira vez — não no logger (F3) nem no encoder (F4).

## 12.3 Pipeline Fase 5

1. Encoder **pós-decisão** (`encodeMode: post_decision`, `chosenCard` preenchido) → Player View para `(eventId, playerIndex)`
2. T01 legalidade (`chosenCard ∈ legalMoves`)
3. Para cada `metricContext` com `applicable && missingFields.length === 0`
4. Comparar `chosenCard` vs alternativas legais (fixtures 2B)
5. Emitir `EvaluationResult`; opcionalmente persistir num store analítico separado do log bruto

**Nota:** encode **pré-decisão** (`chosenCard: null`) **não** entra neste pipeline — reservado a bots / Fase 7.

**Ordem implementação (2A):** T01 → K02/K03 → SP09 → H13 → S08 → SP06 → K01.

## 12.4 Fase 6 e 7

- **Fase 6:** agrega `EvaluationResult` por jogador, métrica, variant
- **Fase 7:** mini-LLM recebe encode **pré-decisão** Player View + `metricContext`; avaliação heurística pós-jogo usa **pós-decisão** — nunca carta ilegal

---

## Decisões fechadas (Fase 4)

| Tema | Decisão |
|------|---------|
| Pré vs pós-decisão | `encodeMode` + `chosenCard null \| filled`; avaliador **só** pós-decisão |
| `mustPlayKingHeartsNow` | **P0** King; quatro condições documentadas §6.4 |
| Schema migration | Risco R8 — documentação futura; **não implementar** agora |

---

## Referências

- [FASE_3_LOGGER_DESIGN.md](FASE_3_LOGGER_DESIGN.md) — eventos, `roundPlayHistory`, logger v0
- [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) — 23 fixtures
- [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md) — P0 encoder fields
- [FASE_1_METRICAS.md](FASE_1_METRICAS.md) — catálogo métricas
- `frontend/src/types/game.ts` — tipos existentes

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Desenho inicial Fase 4 — schema 4.0.0, Engine/Player View |
| 1.1 | 2026-05-31 | encodeMode pre/post; mustPlayKingHeartsNow P0; R8 doc-only |
