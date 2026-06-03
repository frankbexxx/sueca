# Fase 3 — Logger de Partidas e Decisões (desenho)

Documento de saída da **Fase 3** do [ROADMAP_AI](ROADMAP_AI.md).

**Base:** [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md) · [FASE_1_METRICAS.md](FASE_1_METRICAS.md) · [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md) · [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md)  
**Data:** 2026-05-31  
**Scope:** desenho documental — **sem implementação**, **sem código**, **sem backend**.

---

## Frase-guia

| Papel | Metáfora | Responsabilidade |
|-------|----------|------------------|
| **Logger** | Gravador | Regista contexto da decisão |
| **Avaliador (Fase 5)** | Juiz | Classifica boa / média / má |

O logger **não avalia**. Apenas grava o suficiente para o juiz decidir depois.

---

# 1. Resumo

A Card Intelligence evolui por camadas documentadas:

```
Fase 2A (prioridades P0–P3)
    ↓
Fase 2B (23 fixtures activos)
    ↓
Fase 3 (logger)          ← este documento
    ↓
Fase 4 (encoder de estado — perspectiva jogador vs engine)
    ↓
Fase 5 (avaliador — preenche classification + reason)
```

**Objectivo do logger:** guardar **cada decisão** (jogada de carta, bid, pass, leilão, etc.) com contexto completo para responder, **a posteriori**:

- O que o jogador **podia** fazer (`legalMoves`)
- O que **escolheu** (`chosenCard` ou acção equivalente)
- **Em que contexto** (vaza, contrato, score, histórico visível)
- Que **métricas** poderiam aplicar-se (`metricsCandidateIds`)
- Que **fixtures** 2B são comparáveis (`fixtureCandidateIds`)
- Se a decisão **pode ser avaliada** no futuro (`evaluable: boolean` derivado)

**Persistência inicial:** local (IndexedDB ou equivalente no browser), exportável para JSONL. Sem backend nesta fase.

**Referência código existente (inventário Fase 0):** `GameState` em `frontend/src/types/game.ts`, `gameSessionStorage`, `gameHistoryStorage` — padrões de persistência local já usados no Suecão; o logger Card Intelligence é **camada nova**, não substitui save de partida.

---

# 2. O que o logger NÃO faz

| Não faz | Porquê |
|---------|--------|
| Decidir se a jogada é boa, média ou má | Papel do avaliador (Fase 5) |
| Alterar gameplay, regras ou UI de mesa | Observador passivo |
| Alterar heurísticas ou bots | Bots continuam independentes |
| Chamar LLM ou AI externa | Fase 7 |
| Substituir `gameSessionStorage` / resume | Sessão de jogo ≠ log analítico |
| Preencher `classification` ou `reason` | **Não pertencem ao logger v0** — ver §3.4 |
| Enviar dados a servidor | Fora de scope Fase 3 |
| Guardar campos sem uso avaliável | Ver secção 6 e riscos |

---

# 3. Evento base: `CardDecisionLogEvent`

Um evento por **decisão de carta** (play). Bids, passes e leilão usam eventos auxiliares (secção 4), mas partilham identificadores de sessão.

## 3.1 Schema documental (v1)

Tipos em notação TypeScript **documental** — não é código a implementar.

```typescript
/** schemaVersion: "3.0.0" — desenho Fase 3 */
interface CardDecisionLogEvent {
  // --- Identidade ---
  eventId: string;              // UUID v4
  gameId: string;               // partida (várias rondas)
  sessionId: string;            // sessão browser / multiplayer
  timestamp: string;            // ISO 8601

  // --- Jogo e fase ---
  variant: 'sueca' | 'spades' | 'hearts' | 'king';
  mode: string | null;          // ex.: preset king-pt-normal, king-simplified
  contract: string | null;      // contractId King; null noutros jogos
  roundIndex: number;           // 0-based ronda dentro da partida
  trickIndex: number;           // 0-based vaza dentro da ronda
  turnIndex: number;            // 0–3 posição dentro da vaza (quem jogou 1º..4º)

  // --- Jogador ---
  playerIndex: number;          // 0–3 seat
  playerType: 'human' | 'ai' | 'remote';
  difficulty: 'easy' | 'medium' | 'hard' | null;  // null se human/remote

  // --- Decisão (bruto) ---
  handBefore: Card[];           // mão do decisor antes da jogada
  legalMoves: Card[];           // cartas legais neste momento
  chosenCard: Card;             // carta aplicada (deve ∈ legalMoves)

  // --- Vaza (bruto + derivado) ---
  trickBefore: Card[];          // cartas já na vaza antes desta jogada
  trickAfter: Card[];           // trickBefore + chosenCard
  trumpSuit: Suit | null;
  ledSuit: Suit | null;         // naipe da 1.ª carta do trick; null se líder desta jogada
  currentWinnerBefore: number | null;  // playerIndex; null se trick vazio
  currentWinnerAfter: number | null;   // após chosenCard

  // --- Histórico genérico (P0 — não depender de GameState.playedCards) ---
  roundPlayHistory: RoundPlayEntry[];  // snapshot até este momento na ronda

  // --- Score (snapshot) ---
  scoreBefore: ScoreSnapshot;
  scoreAfter: ScoreSnapshot;

  // --- Tags para avaliador (logger v0) ---
  metricsCandidateIds: string[];   // ex.: ["S08", "T04"] — sugestão, não veredicto
  fixtureCandidateIds: string[];   // ligação Fase 2B

  // --- Placeholders Fase 5 (NÃO preencher no logger v0) ---
  classification: 'unknown';       // literal fixo — só Fase 5 altera
  reason: null;                    // literal fixo — só Fase 5 altera

  // --- Meta ---
  source: 'live_game' | 'replay' | 'fixture' | 'test';
  aiSource: null;                  // P1: 'internal' | 'external' | 'fallback' | 'human'
  schemaVersion: '3.0.0';

  // --- Extensões por jogo (secção 5) ---
  variantFields: SuecaLogFields | SpadesLogFields | HeartsLogFields | KingLogFields;
}

interface Card {
  suit: 'clubs' | 'diamonds' | 'hearts' | 'spades';
  rank: string;
  id: string;
}

interface ScoreSnapshot {
  /** Forma depende do variant — espelho simplificado de GameState.scores + variantState */
  raw: Record<string, unknown>;
}

/** Histórico de cartas jogadas na ronda — mantido pelo logger, todos os variants */
interface RoundPlayEntry {
  roundIndex: number;
  trickIndex: number;
  turnIndex: number;
  playerIndex: number;
  card: Card;
}
```

## 3.2 Regras do evento base

| Regra | Detalhe |
|-------|---------|
| `roundPlayHistory` | Snapshot **por evento**; logger acumula a partir dos próprios `CardDecisionLogEvent` + `TrickEndEvent` — **não** depender de `GameState.playedCards` (hoje só Sueca) |
| `partnerIndex` | Sueca / Spades: `(playerIndex + 2) % 4`; Hearts / King: `null` (sem parceiro) |
| `chosenCard` | Deve ser legal; se motor aplicou fallback, registar carta **efectiva** + flag opcional `appliedViaFallback: true` (campo futuro P1) |
| `metricsCandidateIds` | Lista **sugestiva** (tags), não veredicto; avaliador pode ignorar |
| `fixtureCandidateIds` | IDs documentais Fase 2B; matching exacto opcional na Fase 5 |
| Ordem temporal | `timestamp` + `(roundIndex, trickIndex, turnIndex)` definem ordem |
| Multiplayer | `playerType: 'remote'` para joiner; host grava todas as decisões |

## 3.3 Logger v0 vs campos reservados (Fase 5)

`classification` e `reason` **não pertencem ao domínio do logger v0**.

| Campo | Logger v0 | Fase 5 (avaliador) |
|-------|-----------|---------------------|
| `classification` | Literal **`"unknown"`** — nunca outro valor | `good` · `ok` · `bad` (ou equivalente) |
| `reason` | Literal **`null`** — nunca string | Texto curto justificando a classificação |
| `metricsCandidateIds` | Sim — tags sugestivas | Pode confirmar, filtrar ou ignorar |

**Porquê estão no schema:** compatibilidade JSONL export/import — mesma linha evolui na Fase 5 **sem mudar shape**; o avaliador **escreve por cima** numa cópia analítica ou num store derivado, não o logger em tempo real.

**Proibido no logger v0:** heurísticas que preencham `classification` ou `reason` «provisoriamente».

## 3.4 Cardinalidade

- **1 evento** por carta jogada × 4 jogadores × N vazas × M rondas
- Sueca ~10 tricks × 4 × rondas → ~40 eventos/ronda
- Estimativa partida completa: **500–2000** eventos CardDecision (4 jogos, variável)

---

# 4. Eventos auxiliares

Eventos partilham `gameId`, `sessionId`, `variant`, `schemaVersion`. Campo `eventType` distingue tipos na exportação JSONL.

| Evento | Quando ocorre | Dados mínimos | Jogos | Prioridade |
|--------|---------------|---------------|-------|------------|
| **GameStartEvent** | Início de partida | `gameId`, `variant`, `mode`, `playerNames[]`, `playerTypes[]`, `difficulty`, `dealerIndex`, `isMultiplayer` | Todos | **P0** |
| **RoundStartEvent** | Nova ronda / mão distribuída | `roundIndex`, `dealerIndex`, `trumpSuit`, `handsHash` (opcional), `variantState` | Todos | **P0** |
| **TrickStartEvent** | Líder definido, trick vazio | `roundIndex`, `trickIndex`, `trickLeader` | Todos | P1 |
| **TrickEndEvent** | 4.ª carta jogada, vaza fechada | `roundIndex`, `trickIndex`, `trickCards[]`, `trickWinner`, `trickPoints`; actualiza histórico sessão | Todos | **P0** |
| **BidEvent** | Cada bid Spades (incl. nil) | `playerIndex`, `bid`, `blindNil`, `teamBidAfter` | Spades | **P0** |
| **PassCardsEvent** | Pass Hearts completo | `playerIndex`, `passDirection`, `passedCards[3]`, `receivedCards[3]` | Hearts | **P0** |
| **AuctionEvent** | Licitação / pass / counter King festa | `beneficiary`, `bidder`, `bidType`, `bidValue`, `auctionPhase` | King | P2 |
| **ContractSelectedEvent** | Contrato activo definido | `contractId`, `contractType`, `festaPhase`, `trumpSuit`, `noTrump` | King | **P0** |
| **GameEndEvent** | Fim de partida | `finalScores`, `winner`, `roundsPlayed` | Todos | **P0** |

### 4.1 Esboços documentais

**BidEvent (P0 — Spades, fixture SP01):**

```typescript
interface BidEvent {
  eventType: 'bid';
  eventId: string;
  gameId: string;
  sessionId: string;
  timestamp: string;
  roundIndex: number;
  playerIndex: number;
  playerType: PlayerType;
  difficulty: AIDifficulty | null;
  handAtBid: Card[];           // 13 cartas
  bid: number;                 // 0 = nil
  blindNil: boolean;
  playerBidEstimate?: number;  // derivado interno bot, opcional debug
  teamBids: [number, number];  // após fase completa
  source: Source;
  schemaVersion: '3.0.0';
}
```

**PassCardsEvent (P0 — Hearts, fixtures H05, H11):**

```typescript
interface PassCardsEvent {
  eventType: 'pass_cards';
  // ... identidade ...
  roundIndex: number;
  playerIndex: number;
  passDirection: 'left' | 'right' | 'across' | 'none';  // none = 2ª ronda+
  passedCards: Card[];
  receivedCards: Card[];
  handBefore: Card[];
  handAfter: Card[];
}
```

**ContractSelectedEvent (P0 — King, fixtures K00–K03):**

```typescript
interface ContractSelectedEvent {
  eventType: 'contract_selected';
  roundIndex: number;
  contractId: string;          // ex.: no_hearts, no_last_two, festa_positive
  contractType: 'negative' | 'positive' | 'festa' | 'nulos';
  festaPhase: 'auction' | 'play' | 'negotiation' | null;
  trumpSuit: Suit | null;
  noTrump: boolean;
  syntheticMode: boolean;      // king-simplified
}
```

**AuctionEvent (P2 — diferido, arquivo Fase 2B):**

```typescript
interface AuctionEvent {
  eventType: 'auction';
  // beneficiary, action: pass | bid | accept | counter | force_8
  // scoreboard snapshot
}
```

---

# 5. Campos específicos por jogo (`variantFields`)

Extensão de `CardDecisionLogEvent`. Campos marcados **(D)** = derivados (secção 6).

## 5.1 Sueca

| Campo | Tipo | Bruto/D | Uso avaliador |
|-------|------|---------|---------------|
| `partnerIndex` | number \| null | D | S19, T05 — Sueca/Spades: `(playerIndex + 2) % 4`; null noutros |
| `teamIndex` | 1 \| 2 | B | score equipa |
| `playedCardsImportant` | Card[] | D | S10 — subset Ás/7/trunfo/pontos |
| `acesSeen` | Record<Suit, boolean> | D | S16 |
| `manilhasSeen` | Card[] | D | S10, S16 |
| `trumpCardsSeen` | Card[] | D | S12, S05 |
| `teamPointsInTrick` | number | D | valor vaza equipa |
| `partnerWinningBefore` | boolean | D | S19 |
| `playerVoidInference` | Record<Suit, 'unknown' \| 'likely' \| 'confirmed'> | D | S08, S25 |
| `trumpControlEstimate` | number | D | S09 Hard — opcional P1 |

**Histórico:** derivar `acesSeen`, `manilhasSeen`, etc. de `roundPlayHistory` — **não** de `GameState.playedCards` (gap Fase 0: só Sueca actualiza esse campo).

## 5.2 Spades

| Campo | Tipo | Bruto/D | Uso avaliador |
|-------|------|---------|---------------|
| `playerBid` | number | B | SP01 pós-mão |
| `teamBid` | number | B | SP05, SP09 |
| `opponentBid` | number | D | SP14 |
| `playerTricks` | number | D | após trick |
| `teamTricks` | number | D | SP09, T06 |
| `opponentTricks` | number | D | SP14 |
| `bags` | number | D | SP09, SP11 |
| `spadesBroken` | boolean | B/D | regras lead |
| `nilStatus` | 'none' \| 'nil' \| 'blind_nil' | B | SP03 P2 |
| `needTricks` | number | D | SP05, SP08 |
| `bidMet` | boolean | D | SP09 |
| `opponentHighBidThreat` | boolean | D | SP14 — bid adversário ≥ 8 |

## 5.3 Hearts

| Campo | Tipo | Bruto/D | Uso avaliador |
|-------|------|---------|---------------|
| `heartsBroken` | boolean | B/D | H08 |
| `queenSpadesPlayed` | boolean | D | H11 |
| `queenSpadesOwnerKnown` | number \| null | D | H11 — seat se saiu |
| `heartsTakenByPlayer` | number[] | D | H10 |
| `pointsTakenByPlayer` | number[] | D | H01 |
| `pointsInTrick` | number | D | H13, H01 |
| `moonCandidatePlayer` | number \| null | D | H10 |
| `moonStillPossible` | boolean | D | H10 |
| `passDirection` | string | B | contexto ronda |
| `passedCards` | Card[] | B | H05 — do PassCardsEvent |

## 5.4 King

| Campo | Tipo | Bruto/D | Uso avaliador |
|-------|------|---------|---------------|
| `contractId` | string | B | K00, K01 |
| `contractType` | string | B | K00 |
| `festaPhase` | string \| null | B | K06 P2 |
| `beneficiary` | number \| null | B | festa |
| `auctionState` | object \| null | B | P2 |
| `trumpSuit` | Suit \| null | B | duplicado global OK |
| `noTrump` | boolean | B | nulos |
| `kingHeartsPlayed` | boolean | D | K02 |
| `kingHeartsHolderKnown` | number \| null | D | K02 pós-jogo |
| `penaltyCardsVisible` | Card[] | D | K01 |
| `penaltyMap` | Record<string, number> | D | K01, T08 |
| `isLastTwoPhase` | boolean | D | K10 — tricks 8–12 |
| `trickNumberForLastTwo` | number | D | K10 — 1-based trick |
| `nulosMode` | boolean | B | K12 |
| `syntheticMode` | boolean | B | K11 |
| `contractPenaltiesInTrick` | number | D | K01 slough errado |

---

# 6. Dados derivados

## 6.1 Definições

| Tipo | Descrição | Exemplos |
|------|-----------|----------|
| **Bruto** | Valor directo do motor / UI no instante da decisão | `handBefore`, `legalMoves`, `chosenCard`, `trickBefore`, bids declarados, snapshot `roundPlayHistory` |
| **Derivado** | Calculado a partir de bruto + histórico | `legalMoves`, `currentWinnerBefore`, `acesSeen`, `bidMet`, `pointsInTrick` |

## 6.2 Política de gravação

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Gravar bruto + derivados chave** | Debug fácil; export legível; avaliador v0 rápido | Log maior; risco duplicação inconsistente |
| **Só bruto** | Log menor; single source of truth | Avaliador recalcula tudo; mais bugs de divergência |

**Recomendação Fase 3:** gravar **bruto obrigatório** + **derivados P0** (tabela abaixo). Derivados P1+ podem ser recalculados na Fase 5 se `schemaVersion` permitir migração.

### Derivados P0 a persistir no evento

| Derivado | Fórmula / fonte |
|----------|-----------------|
| `legalMoves` | `getLegalIndices` / `canPlayCard` |
| `currentWinnerBefore/After` | regras de trick do variant |
| `ledSuit` | 1.ª carta de `trickBefore` ou `chosenCard` se líder |
| `acesSeen` | Sueca: scan `roundPlayHistory` + `trickBefore` |
| `bidMet` | Spades: `teamTricks >= teamBid` |
| `needTricks` | Spades: `max(0, teamBid - teamTricks)` |
| `pointsInTrick` | Hearts: Q♠=20, ♥=10 por carta no trick |
| `partnerWinningBefore` | Sueca: winner == partnerIndex |
| `contractPenaltiesInTrick` | King: mapa contrato × cartas no trick |
| `metricsCandidateIds` | Tagging leve por regras (ex.: se `bidMet` → incluir SP09) |

### Derivados recalculáveis (opcional omitir no v1)

- `playerVoidInference` (Hard)
- `trumpControlEstimate` (S09)
- `moonCandidatePlayer` (inferência)

---

# 7. Privacidade / perspectiva do jogador

## 7.1 Dois níveis de verdade

| Nível | Quem vê | Conteúdo |
|-------|---------|----------|
| **Engine (omnisciente)** | Logger local, debug, export admin | Todas as mãos se disponíveis no host; estado completo `GameState` |
| **Perspectiva jogador** | Encoder Fase 4, treino futuro | Só cartas vistas + inferência permitida na mesa real |

## 7.2 Regras documentais

1. **Logger v0:** grava **engine completo** localmente (todas as mãos disponíveis no host, `roundPlayHistory`, etc.) — análise e debug no dispositivo.
2. Flag `perspective: 'engine' | 'player'` — **P1**; v0 omite ou fixa implicitamente `engine`.
3. **Fase 4 (encoder):** separa visão real do jogador vs omnisciente — **não** misturar no export de treino.
4. Multiplayer joiner: log local parcial; host canonical para export unificado.

## 7.3 Marcação para Fase 4

| Campo logger | Omnisciente? | Encoder jogador |
|--------------|--------------|-----------------|
| `handBefore` (decisor) | sim | sim |
| `handBefore` (outros) | sim no host | **não** |
| `roundPlayHistory` / trick | sim | sim |
| `legalMoves` | sim | sim |
| `acesSeen` | sim | sim (cartas vistas) |
| `playerVoidInference` | sim | sim (inferência, não fact) |

---

# 8. Local storage e export

## 8.1 Armazenamento local (desenho)

| Aspecto | Decisão |
|---------|---------|
| **API preferida** | IndexedDB (`cardIntelligenceLogs` database) |
| **Fallback** | `localStorage` só para índice/metadata; eventos grandes em IDB |
| **Object stores** | `sessions`, `events`, `exports` (metadata) |
| **Chave evento** | `eventId` |
| **Índices** | `[gameId]`, `[sessionId]`, `[variant]`, `[timestamp]` |
| **Referência** | Padrão similar a `gameHistoryStorage` / `gameSessionStorage` |

## 8.2 Estrutura de sessão

```typescript
interface LogSessionMeta {
  sessionId: string;
  gameId: string;
  variant: GameVariant;
  startedAt: string;
  endedAt: string | null;
  eventCount: number;
  schemaVersion: '3.0.0';
  source: Source;
  isMultiplayer: boolean;
}
```

## 8.3 Rotação e limpeza

| Política | Valor sugerido |
|----------|----------------|
| Retenção máxima | 50 partidas ou 30 dias (configurável) |
| Tamanho máximo IDB | ~50 MB alerta; purge LRU |
| Purge manual | Settings → «Apagar logs Card Intelligence» |
| Não misturar | Logs CI separados de save/resume de jogo |

## 8.4 Export JSONL

Formato: **uma linha JSON por evento**, ordem cronológica.

```jsonl
{"eventType":"game_start","gameId":"...","schemaVersion":"3.0.0",...}
{"eventType":"card_decision","eventId":"...","classification":"unknown","reason":null,...}
{"eventType":"trick_end",...}
```

| Export | Fase | Filtro |
|--------|------|--------|
| Partida completa | P0 | `gameId` |
| Por jogador | P1 | `playerIndex` + `playerType` |
| Por métrica | P2 | eventos onde `metricsCandidateIds` contém ID |
| Por fixture 2B | P2 | `fixtureCandidateIds` |
| Só decisões humanas | P1 | `playerType === 'human'` |

**Sem backend Fase 3:** export via download browser (`Blob` + `URL.createObjectURL`).

---

# 9. Integração futura

Documentação de **pontos de gancho** — não implementar agora.

## 9.1 Fluxo de uma jogada de carta

```
[UI / AI escolhe carta]
        ↓
  LOGGER: CardDecisionLogEvent (antes de apply)
        — handBefore, legalMoves, trickBefore, variantFields
        ↓
  Motor: applyPlayCard / adapter.playCard
        ↓
  LOGGER: patch trickAfter, scoreAfter, currentWinnerAfter (ou evento separado pós-play P1)
        ↓
  [Trick completo?] → TrickEndEvent
```

## 9.2 Mapa de ficheiros (referência Fase 0)

| Local | Momento | O quê registar |
|-------|---------|----------------|
| `GameAdapter.playCard` / variant games | Antes + depois apply | CardDecisionLogEvent |
| `GameBoard` — clique humano | Antes apply | idem, `playerType: human` |
| `aiClient` / `SuecaStrategy` / `*PlayStrategy` | Antes apply AI | `playerType: ai`, `difficulty` |
| `SpadesBidEstimator` / bid UI | Bid phase | BidEvent |
| `HeartsPassStrategy` / pass modal | Após pass confirmado | PassCardsEvent |
| `KingAuctionStrategy` / festa modal | Licitação | AuctionEvent (P2) |
| `KingPtGame` — início ronda negativa/festa | Contract set | ContractSelectedEvent |
| `applyHostAction` (multiplayer host) | Host aplica acção remota | Todas as decisões; `remote` vs `human` |
| `multiplayerClient` joiner | Opcional: log local parcial | Só perspectiva local |
| Replay / testes | Inject | `source: replay \| fixture \| test` |

## 9.3 Princípios de integração

1. **Não bloquear** gameplay — log assíncrono (`queueMicrotask` / `requestIdleCallback`).
2. **Falha silenciosa** — erro de log nunca impede jogada.
3. **Host authoritative** em multiplayer — uma fonte de verdade por `gameId`.
4. **Origem da decisão (`aiSource`, P1):** `'internal'` · `'external'` · `'fallback'` · `'human'` — humanos e remotos usam `'human'`; fallback = `playFirstLegal`; external = Sueca HTTP. v0: `aiSource: null`.

---

# 10. Relação com Fase 2B

Fixtures activos: [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) (23). Campos **mínimos** do logger para avaliação posterior.

## 10.1 Transversais

| Fixture | IDs | Campos logger mínimos |
|---------|-----|------------------------|
| Jogada legal | T01 | `legalMoves`, `chosenCard`, `variant` |
| Ganhar barato condicional | T04 | `trickBefore`, `currentWinnerBefore`, `variant`, `pointsInTrick` / `teamPointsInTrick`, `variantFields.needTricks` (Spades) |
| Jogar baixo para perder | T06 | `bidMet`, `teamTricks`, `contractId`, `trick` winner |

## 10.2 Sueca

| Fixture | ID | Campos mínimos |
|---------|-----|----------------|
| Ganhar mínima | S08 | `trickBefore`, `legalMoves`, `trumpSuit`, `playerVoidInference`, `turnIndex` |
| Manilha / Ás | S16 | `acesSeen`, `chosenCard.rank`, liderança (`trickBefore.length === 0`) |
| Parceiro vaza segura | S19 | `partnerWinningBefore`, `partnerIndex`, `currentWinnerBefore` |
| Trunfo mínimo | S12 | `trumpSuit`, `legalMoves`, `trickBefore`, winners |
| Destrunfar | S25 | `partnerIndex`, `playerVoidInference`, `trumpCardsSeen`, liderança |

## 10.3 Spades

| Fixture | ID | Campos mínimos |
|---------|-----|----------------|
| Bid conservador | SP01 | **BidEvent:** `handAtBid`, `bid`; pós-mão: tricks vs bid |
| Proteger parceiro | SP06 | `currentWinnerBefore`, `partnerIndex` (seat+2), `legalMoves` |
| Evitar bags | SP09 | `bidMet`, `teamTricks`, `teamBid`, `bags` |
| Espada mínima | SP08 | `legalMoves`, `needTricks`, `spadesBroken` |
| Quebrar bid 8+ | SP14 | `opponentHighBidThreat`, `bidMet`, score snapshot |

## 10.4 Hearts

| Fixture | ID | Campos mínimos |
|---------|-----|----------------|
| Evitar pontos | H01 | `pointsInTrick`, `pointsTakenByPlayer` |
| Pass perigosos | H05 | **PassCardsEvent:** `passedCards`, `handBefore/After` |
| Limpar perigo | H13 | `pointsInTrick === 0`, `currentWinnerBefore === playerIndex` |
| Q♠ perigo | H11 | `queenSpadesPlayed`, carta escolhida rank/suit |
| Bloquear moon | H10 | `moonStillPossible`, `heartsTakenByPlayer`, `moonCandidatePlayer` |

## 10.5 King

| Fixture | ID | Campos mínimos |
|---------|-----|----------------|
| Contrato first | K00 | `contractId`, `contractType`, `penaltyMap` |
| K♥ obrigatório | K02 | `kingHeartsPlayed`, led ♥, `legalMoves`, first-opportunity flag |
| Não puxar copas | K03 | `ledSuit`, `legalMoves`, carta ♥ jogada voluntariamente |
| Slough negativo | K01 | `contractId`, `penaltyMap`, `contractPenaltiesInTrick` |
| Duas últimas t11 | K10 | `isLastTwoPhase`, `trickNumberForLastTwo`, `trickIndex` |

---

# 11. Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | Log demasiado grande (mobile) | IDB quota, performance | Derivados selectivos; TrickEnd em vez de TrickStart; purge LRU |
| R2 | Estado omnisciente contamina treino | Encoder aprende mãos adversárias | Flag `perspective`; export filtrado Fase 4 |
| R3 | Decisões humanas não captadas | Avaliador enviesado para AI | Hook explícito em `GameBoard` clique; `playerType: human` |
| R4 | Bids / pass / leilão omitidos | SP01, H05, K06 não avaliáveis | Eventos auxiliares P0 na mesma pipeline |
| R5 | Campos inexistentes no código | Logger grava `null` / omite | Inventariar gaps vs `variantState`; schemaVersion bump |
| R6 | Sueca externa vs interna | Logs inconsistentes | `aiSource`: internal \| external \| fallback \| human (P1); tag T02 opcional |
| R7 | Multiplayer host/joiner | Duplicados ou buracos | Host canonical; joiner log opcional reduzido |
| R8 | Performance UI | Lag em mesa | Log async; batch IDB writes |
| R9 | `metricsCandidateIds` confundido com veredicto | Falsa sensação de avaliação | Nomenclatura + `classification: unknown` fixo |
| R10 | Divergência derivado vs recálculo | Avaliador inconsistente | Testes golden com fixtures 2B |

**Gaps código conhecidos (Fase 0):** `GameState.playedCards` só Sueca — **logger contorna** com `roundPlayHistory`; `partnerSignals` sem schema — logger não depende até formalização.

---

# 12. Decisões fechadas (validação)

| Tema | Decisão |
|------|---------|
| `classification` / `reason` no logger | **Não pertencem ao logger v0.** Schema inclui placeholders; valores fixos `"unknown"` / `null`; **só Fase 5 preenche**. Correcção vs menção antiga na Fase 2A. |
| `GameState.playedCards` | Logger mantém **`roundPlayHistory` genérico** por evento; não depender do campo Sueca-only. |
| `partnerIndex` | Sueca / Spades: **`(playerIndex + 2) % 4`**; derivado no log. |
| Omnisciente vs jogador | **v0:** log engine completo local. **`perspective`:** P1. Encoder Fase 4 filtra export. |
| `aiSource` | **P1:** `internal` · `external` · `fallback` · `human`. v0: `null`. |

---

# 13. Próxima fase

## Fase 4 — Encoder de estado

| Entrada | Saída |
|---------|--------|
| `CardDecisionLogEvent` + histórico sessão | Vector / JSON **perspectiva jogador** |
| Campos P0 Fase 2A | Máscara legal, contrato, trick resumido |

Encoder **não** duplica logger — **lê** eventos e projeta visão permitida. Resolver risco R2.

Prioridade encoder (herdada 2A): Sueca `acesSeen`, Spades `needTricks`, Hearts `trickPoints`, King `contractId` + `penaltyMap`.

## Fase 5 — Avaliador de decisões

| Entrada | Saída |
|---------|--------|
| Log Fase 3 + fixture Fase 2B + encoder Fase 4 | `classification: good \| ok \| bad`, `reason: string`, `metricIds[]` |

Pipeline: **T01 legal** → métricas P0 → comparar alternativas legais → **primeira escrita** de `classification` e `reason` (ausentes no logger v0 excepto placeholders).

Ordem implementação (2A): **T01 → K02/K03 → SP09 → H13 → S08 → SP06 → K01**.

---

## Referências

- [ROADMAP_AI.md](ROADMAP_AI.md) — Fase 3 roadmap
- [FASE_2A_PRIORIDADES_METRICAS.md](FASE_2A_PRIORIDADES_METRICAS.md) — campos P0/P1
- [FASE_2B_FIXTURES_METRICAS.md](FASE_2B_FIXTURES_METRICAS.md) — 23 fixtures
- [PHASE0_INVENTORY.md](PHASE0_INVENTORY.md) — `GameState`, G01 legal moves
- `frontend/src/types/game.ts` — tipos existentes

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Desenho inicial Fase 3 — schema 3.0.0 |
| 1.1 | 2026-05-31 | Logger v0: classification/reason fixos; roundPlayHistory; partnerIndex; aiSource P1 |
