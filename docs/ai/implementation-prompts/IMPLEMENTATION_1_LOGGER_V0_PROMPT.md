# IMPLEMENTATION_1_LOGGER_V0 — Prompt de implementação

**ID:** `IMPLEMENTATION_1_LOGGER_V0`  
**Plano pai:** [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md)  
**Design base:** [FASE_3_LOGGER_DESIGN.md](../FASE_3_LOGGER_DESIGN.md)  
**Data:** 2026-05-31  
**Scope desta prompt:** guia **executável** para o Cursor implementar Logger v0 — **não implementar neste passo**.

**Princípio v0:** logger **simples, passivo e robusto**. Prioridade = registar jogadas reais **sem alterar gameplay**. **Não bloquear** por multiplayer joiner, `aiSource` perfeito, ou `TrickEnd` completo.

---

## Instruções para o agente implementador

1. Ler esta prompt **completa** antes de editar código.
2. Implementar **apenas** o escopo §2; recusar scope creep (§3).
3. Código novo **só** em `frontend/src/cardIntelligence/` — **não** mexer em `frontend/src/ai/`.
4. Hook **mínimo** em `GameBoard.tsx` — uma função central; fail-silent.
5. **Zero** avaliação: `classification: "unknown"`, `reason: null` sempre.
6. No fim, entregar **relatório final** conforme §14.

---

# 1. Objectivo da implementação

Criar a **primeira camada real** da Card Intelligence: um **logger passivo** que regista cada **jogada de carta** (`CardDecisionLogEvent`, schema **3.0.0**) em storage local (IndexedDB), sem alterar gameplay, sem classificar jogadas, sem chamar avaliador/encoder/LLM.

**Metáfora:** logger = **gravador** — grava o que aconteceu; o juiz (Fase 5) vem depois.

**Checkpoint humano H1** ([IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) §8): Francisco valida eventos numa partida real antes de Impl 2.

---

# 2. Escopo exacto

## 2.1 Dentro do escopo

| Item | Detalhe |
|------|---------|
| Módulo | `frontend/src/cardIntelligence/` (criar árvore inicial) |
| Evento | **`CardDecisionLogEvent`** por carta jogada (play) |
| Schema | `schemaVersion: '3.0.0'` conforme FASE_3 §3.1 |
| Classificação | `classification: 'unknown'` **literal fixo**; `reason: null` **literal fixo** |
| Storage | IndexedDB database `cardIntelligenceLogs`; fallback localStorage minimal/dev |
| Serviço | `CardIntelligenceLogger` + `logCardDecision(...)` central |
| IDs | Helpers `createEventId()`, `getOrCreateSessionId()`, `getOrCreateGameId()` |
| Histórico | `roundPlayHistory` — acumulador **em memória por sessão**; snapshot em cada evento (refinado Impl 2) |
| Hook | Pós-`playCard` **bem-sucedido** — solo/local + **host** multiplayer |
| Variants | Sueca, Spades, Hearts, King |
| `variantFields` | Campos **brutos mínimos** extraíveis de `GameState` / `variantState` sem alterar motor |
| `metricsCandidateIds` | Tags **heurísticas simples** (lista de IDs string) — sugestivo, não veredicto |
| `fixtureCandidateIds` | Opcional v0: `[]` ou match superficial por variant |
| `source` | `'live_game'` para jogadas reais |
| `aiSource` | **`null`** v0 (P1: `internal` / `external` / `fallback` / `mini_llm`) |
| Testes | Vitest unit + regressão logger on/off |
| Tipos TrickEnd | **Preparar** interface `TrickEndEvent` em types (documentada) — **sem** emitir/persistir completo |

## 2.2 Campos mínimos do evento (prioridade implementação)

**Obrigatórios v0:**

- Identidade: `eventId`, `gameId`, `sessionId`, `timestamp`, `schemaVersion`
- Jogo: `variant`, `mode`, `contract`, `roundIndex`, `trickIndex` (`number | null` se gap), `turnIndex`
- Jogador: `playerIndex`, `playerType`, `difficulty`
- Decisão: `handBefore`, `legalMoves`, `chosenCard`
- Vaza: `trickBefore`, `trickAfter`, `trumpSuit`, `ledSuit`, `currentWinnerBefore`, `currentWinnerAfter`
- Histórico: `roundPlayHistory` (snapshot)
- Score: `scoreBefore`, `scoreAfter` (`ScoreSnapshot.raw` espelhando `GameState.scores` + `variantState` relevante)
- Tags: `metricsCandidateIds`, `fixtureCandidateIds`
- Fixos: `classification: 'unknown'`, `reason: null`
- Meta: `source`, `aiSource: null`
- `variantFields`: subconjunto P0 bruto por jogo (§6.3)

**Derivados complexos** (`acesSeen`, `bidMet`, `playerVoidInference`, etc.): **omitir ou stub v0** — Impl 2/3 preenchem; não bloquear logger.

## 2.3 Comportamento runtime

```typescript
// Contrato documental — implementar equivalente
async function logCardDecision(input: LogCardDecisionInput): Promise<void>;
```

- **Fire-and-forget:** `void logCardDecision(...).catch(() => {})` — nunca await bloqueante no UI thread crítico.
- **Fail-silent:** erro IDB → log `console.warn` em dev; **não** afectar `playCard`.
- **Idempotência:** guard opcional por `(gameId, roundIndex, trickIndex, turnIndex, playerIndex)`.

## 2.4 Decisões fechadas (v1.1)

| Tema | Decisão |
|------|---------|
| **`trickIndex`** | Vazas **já iniciadas** na ronda/mão actual; **0-based**; incrementa ao começar nova vaza. Se motor sem campo fiável → `null` + gap no relatório |
| **`mode`** | 1) `contractId` / `variantState`; 2) `gameConfig.mode`; 3) `null`. **Não inventar** contrato |
| **Multiplayer** | **Joiner = skip v0**. Só solo/local + host (se host claro) |
| **AI fallback** | Logar **sempre** carta **efectiva** jogada. `aiSource: null` v0 |
| **Testes IDB** | `fake-indexeddb` se setup leve; senão mock do storage adapter |
| **TrickEnd** | Types only — não bloquear Impl 1 |

---

# 3. Fora de escopo

| Fora | Motivo / fase |
|------|----------------|
| Avaliador F5 | Impl 5 |
| Encoder F4 | Impl 3 |
| Memória F6 | Impl 6 |
| Mini-LLM F7 | Impl 8 |
| `TrickEndEvent` persistido / completo | Impl 2 |
| `GameStartEvent`, `RoundStartEvent`, `BidEvent`, `PassCardsEvent`, etc. | P0 F3 auxiliar — **não** Impl 1 (excepto types esboço) |
| Export JSONL UI | Impl 7 |
| Backend / sync | Proibido |
| Alterar `frontend/src/ai/*`, strategies, `heuristics.py` | Bots intactos |
| Alterar regras `Game.ts`, scoring, legality | Proibido |
| Preencher `classification` / `reason` | Proibido |
| Chamar avaliador no hook | Proibido |
| Multiplayer joiner | **Skip v0** — fora de escopo |
| `REACT_APP_CARD_INTELLIGENCE_DEBUG` UI | Impl 7 — **não** nesta impl |
| Retenção LRU / purge 50 partidas | P1 — stub policy OK |

---

# 4. Ficheiros prováveis a criar

```
frontend/src/cardIntelligence/
├── shared/
│   ├── ids.ts                          # createEventId, sessionId, gameId
│   ├── types/
│   │   ├── cards.ts                    # Card, Suit (re-export ou alias de game.ts)
│   │   ├── logEvents.ts                # CardDecisionLogEvent, RoundPlayEntry, ScoreSnapshot
│   │   ├── trickEndEvent.ts            # TrickEndEvent — types only, Impl 2
│   │   └── variantLogFields.ts         # SuecaLogFields | Spades | Hearts | King
│   └── storage/
│       ├── indexedDb.ts                # openDB, isAvailable
│       ├── logStore.ts                 # appendEvent, getEventsByGameId
│       └── logStore.localStorage.ts    # fallback minimal
├── logger/
│   ├── CardIntelligenceLogger.ts
│   ├── buildCardDecisionEvent.ts
│   ├── buildCardDecisionEvent.test.ts
│   ├── roundHistorySession.ts
│   ├── extractLegalMoves.ts
│   ├── extractVariantFields.ts
│   ├── resolveTrickIndex.ts            # v0: vazas iniciadas; null se gap
│   ├── resolveMode.ts                  # contractId → gameConfig → null
│   ├── suggestMetricCandidates.ts
│   ├── logStore.test.ts              # ou em shared/storage/
│   └── index.ts
└── index.ts                            # barrel cardIntelligence
```

**Barrel export:** `frontend/src/cardIntelligence/index.ts` — exportar só `logCardDecision` (+ types se necessário para testes).

---

# 5. Ficheiros prováveis a alterar

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/components/GameBoard.tsx` | Hook mínimo pós-`playCard` success (humano ~L667; AI ~L549/L557) |
| `frontend/src/config/features.ts` | Flag opcional `CARD_INTELLIGENCE_LOGGER_ENABLED` (ver §8) |

**Não alterar** (salvo import do hook):

- `frontend/src/ai/**`
- `frontend/src/models/Game.ts` regras
- `*Strategy.ts`

**Tendência futura:** mover hook para adapter boundary — **não** refactorizar agora.

---

# 6. Tipos / schemas a criar

## 6.1 Alinhamento com código existente

Reutilizar tipos de `frontend/src/types/game.ts`:

- `Card`, `Suit`, `GameVariant`, `PlayerType`, `AIDifficulty`, `GameState`

**Não duplicar** enums incompatíveis — importar ou re-exportar.

## 6.2 `CardDecisionLogEvent` (schema 3.0.0)

Implementar interface conforme [FASE_3_LOGGER_DESIGN.md](../FASE_3_LOGGER_DESIGN.md) §3.1.

**Validação runtime v0 (zod ou função manual):**

- `classification === 'unknown'`
- `reason === null`
- `chosenCard` ∈ `legalMoves` (por `id` ou suit+rank)
- `schemaVersion === '3.0.0'`

## 6.3 `variantFields` mínimos v0

| Variant | Campos brutos mínimos |
|---------|----------------------|
| Sueca | `partnerIndex: (playerIndex + 2) % 4`, `teamIndex` |
| Spades | `playerBid`, `teamBid`, `spadesBroken` — de `variantState` se presente |
| Hearts | `heartsBroken`, `passDirection` — de `variantState` |
| King | `contractId`, `contractType`, `festaPhase`, `noTrump`, `syntheticMode` |

Campos **derivados** (D) da F3 §5: **não** implementar v0 unless trivial one-liner.

## 6.4 `RoundPlayEntry`

```typescript
interface RoundPlayEntry {
  roundIndex: number;
  trickIndex: number;
  turnIndex: number;      // 0–3 posição na vaza
  playerIndex: number;
  card: Card;
}
```

Acumulador de sessão: após cada evento, append `{ ... }` e copiar array para `roundPlayHistory` do evento.

## 6.5 `TrickEndEvent` (preparado, não implementar)

```typescript
/** @deprecated Impl 2 — types only */
interface TrickEndEvent {
  eventType: 'trick_end';
  eventId: string;
  gameId: string;
  sessionId: string;
  schemaVersion: '3.0.0';
  // ... FASE_3 §4
}
```

---

# 7. Serviço local de logging

## 7.1 API pública

```typescript
// frontend/src/cardIntelligence/logger/index.ts

export interface LogCardDecisionInput {
  gameAdapter: GameAdapter;
  stateBefore: GameState;
  playerIndex: number;
  cardIndex: number;
  /** Opcional — resolve `mode` (prioridade 2) */
  gameConfigMode?: string | null;
  /** 'live_game' default */
  source?: 'live_game' | 'replay' | 'fixture' | 'test';
}

export function logCardDecision(input: LogCardDecisionInput): Promise<void>;

export function resetLoggerSessionForTests(): void; // test only
```

## 7.2 `CardIntelligenceLogger`

Responsabilidades:

1. Resolver `sessionId` / `gameId` (persistir meta em IDB `sessions` store).
2. Calcular `roundIndex`, `trickIndex`, `turnIndex` a partir de `GameState` + variant conventions.
3. Extrair `legalMoves` **antes** da jogada (índices legais → `Card[]`).
4. Construir evento via `buildCardDecisionEvent`.
5. Validar invariantes (§6.2).
6. Persistir via `logStore.appendEvent`.
7. Actualizar acumulador `roundHistorySession`.

## 7.3 Mapeamento índices e `mode`

| Campo | Regra v0 (fechada) |
|-------|-------------------|
| `roundIndex` | `gameState.round` (normalizar **0-based** se motor 1-based) |
| `trickIndex` | **Nº de vazas já iniciadas** na ronda/mão actual; **começa em 0**; incrementa quando começa nova vaza. Implementação sugerida: contador de sessão incrementado quando `turnIndex === 0` e nova vaza (ou derivar de histórico acumulado). Se jogo não expõe dado fiável → **`null`** — documentar gap no relatório §14 |
| `turnIndex` | `stateBefore.currentTrick.length` antes do play (**0–3**) |
| `mode` | **Ordem:** (1) `contractId` / campo relevante em `variantState`; (2) `gameConfig.mode` se passado ao logger/hook; (3) **`null`**. Não inventar contrato |
| `contract` | King: `contractId` de `variantState` se existir; senão `null` |
| `trickBefore` | `[...stateBefore.currentTrick]` |
| `trickAfter` | `[...trickBefore, chosenCard]` |
| `handBefore` | `[...stateBefore.players[playerIndex].hand]` |
| `chosenCard` | Carta **efectiva** na mão antes do play (`handBefore[cardIndex]`) — inclui path AI fallback |
| `scoreBefore` / `scoreAfter` | snapshot antes; pós-play `getCurrentState()` só para score (sem re-entrar hook) |

**Nota:** capturar `stateBefore` **antes** de `playCard`; pós-play ler state só para `scoreAfter` / winners se necessário.

## 7.4 `metricsCandidateIds` v0

Heurística **tag-only** (não avaliar):

- Sueca: `['S08','S12','S16','T01']` se aplicável superficialmente
- Spades: incluir `'SP09'` se `variantState` indicar bid met (se indisponível, omitir)
- Hearts: `['H11','H13','H01']`
- King: `['K00','K02','K03','T01']`
- Sempre incluir `'T01'` como candidata transversal

**OK v0:** lista conservadora fixa por variant — refinar Impl 3/5.

---

# 8. Storage local

## 8.1 IndexedDB (principal)

Conforme FASE_3 §8.1:

| Aspecto | Valor |
|---------|-------|
| Database | `cardIntelligenceLogs` |
| Version | `1` |
| Stores | `sessions`, `events` |
| Key `events` | `eventId` |
| Indexes | `gameId`, `sessionId`, `timestamp` |

```typescript
interface LogSessionMeta {
  sessionId: string;
  gameId: string;
  variant: GameVariant;
  startedAt: string;
  endedAt: string | null;
  eventCount: number;
  schemaVersion: '3.0.0';
  source: 'live_game';
  isMultiplayer: boolean;
}
```

## 8.2 localStorage fallback

- Activar **só** se `indexedDB` indisponível (SSR, test env, private mode edge).
- Guardar **últimos N eventos** (ex.: 50) serializados — dev/minimal.
- **Não** substituir IDB quando disponível.

## 8.3 Feature flag logger

Em `frontend/src/config/features.ts`:

```typescript
export const CARD_INTELLIGENCE_LOGGER_ENABLED =
  process.env.REACT_APP_CARD_INTELLIGENCE_LOGGER !== 'false';
```

- Default: **enabled** (logger passivo útil para H1).
- Desactivar via `REACT_APP_CARD_INTELLIGENCE_LOGGER=false` para A/B regressão.

**Separado** de `REACT_APP_CARD_INTELLIGENCE_DEBUG` (export UI — Impl 7).

---

# 9. Hook mínimo de captura de decisão

## 9.1 Regra

**Uma** função central — **não** espalhar `logCardDecision` por componentes.

## 9.2 Onde chamar (`GameBoard.tsx`)

Criar helper local ou import:

```typescript
import { logCardDecision } from '../cardIntelligence';

function capturePlayDecision(
  gameAdapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
): void {
  if (!CARD_INTELLIGENCE_LOGGER_ENABLED) return;
  void logCardDecision({ gameAdapter, stateBefore, playerIndex, cardIndex }).catch(() => {});
}
```

**Pontos de integração v0:**

| Fluxo | Momento |
|-------|---------|
| Humano host/solo | Após `playCard` success (~L667) |
| AI `chooseAndPlay` | Após `playCard` success (~L549) ou fallback legal (~L557) — carta **efectiva** |
| Multiplayer joiner | **Skip v0** — não chamar `capturePlayDecision` |

## 9.3 Padrão obrigatório

```typescript
const stateBefore = gameAdapter.getCurrentState();
const success = gameAdapter.playCard(stateBefore, playerIndex, cardIndex);
if (success) {
  capturePlayDecision(gameAdapter, stateBefore, playerIndex, cardIndex);
  // ... UI existente
}
```

**Proibido:** alterar ordem de `playCard` / sons / `afterHostMutation` — inserir **depois** do success, sem await.

## 9.4 `playerType` / `difficulty`

| Campo | Regra |
|-------|-------|
| `playerType` | `players[i].type ?? 'human'`; AI seats → `'ai'`; remote → `'remote'` |
| `difficulty` | `gameState.aiDifficulty` se `playerType === 'ai'`; senão `null` |

---

# 10. Regras de segurança

| # | Regra |
|---|-------|
| S1 | **Não** alterar resultado de `playCard` |
| S2 | **Não** await logger no hot path |
| S3 | **Não** classificar — `unknown` / `null` fixos |
| S4 | **Não** invocar avaliador / encoder / LLM |
| S5 | **Não** mexer em `frontend/src/ai/` |
| S6 | **Não** backend / sync |
| S7 | Fail-silent — erros só `console.warn` em dev |
| S8 | **Não** duplicar `gameSessionStorage` / `gameHistoryStorage` |
| S9 | Deep-clone cartas/mãos ao serializar — evitar mutação por referência |
| S10 | Logger desactivável via flag para testes A/B |

---

# 11. Testes mínimos

## 11.1 Unitários

| Ficheiro | Casos |
|----------|-------|
| `buildCardDecisionEvent.test.ts` | Monta evento a partir de `GameState` mock; `classification`/`reason` fixos; `chosenCard ∈ legalMoves` |
| `logStore.test.ts` | Mock adapter preferido; `fake-indexeddb` só se setup existente/leve |
| `roundHistorySession.test.ts` | 2 jogadas → history length 2 no 2.º evento |
| `ids.test.ts` | UUID format eventId |

## 11.2 Integração leve

| Caso | Assert |
|------|--------|
| Logger disabled | `CARD_INTELLIGENCE_LOGGER_ENABLED=false` → zero writes |
| Fail storage | Mock reject → play flow não lança |

## 11.3 Regressão gameplay

| Caso | Assert |
|------|--------|
| Logger on/off | Mesma sequência de `playCard` num adapter mock → mesmo `GameState` final |
| Avaliador ausente | Nenhum import de `evaluator/` |

## 11.4 Storage tests (decisão fechada)

- **Preferência:** mock simples do `logStore` interface (append/read) — zero deps novas.
- **`fake-indexeddb`:** permitido se o projecto já tiver padrão compatível **sem** refactor grande de Vitest setup.
- Se adicionar `fake-indexeddb` obrigar a mexer muito → **defer** e manter mock.

## 11.5 Comando
```bash
cd frontend && npm test -- --run cardIntelligence
```

---

# 12. Critérios de sucesso

| # | Critério |
|---|----------|
| C1 | Pasta `frontend/src/cardIntelligence/` criada; **zero** alterações em `frontend/src/ai/` |
| C2 | Jogada real (humano ou AI) gera evento IDB com `schemaVersion: '3.0.0'` |
| C3 | **100%** eventos com `classification: 'unknown'` e `reason: null` |
| C4 | `chosenCard` sempre ∈ `legalMoves` |
| C5 | Partida completa **4 variants** gera eventos (smoke manual ou test) |
| C6 | Logger on/off — **mesmo** resultado de jogo |
| C7 | Testes Vitest verdes |
| C8 | TrickEnd types existem; **nenhum** TrickEnd persistido |
| C9 | Checkpoint **H1** pronto para Francisco |

---

# 13. Riscos

| # | Risco | Mitigação |
|---|-------|-----------|
| R1 | Hook altera timing / race | Fire-and-forget; stateBefore antes play |
| R2 | `trickIndex` incorrecto / null | Regra §7.3; gaps documentados; corrigir Impl 2 |
| R3 | IDB quota | v0 sem purge OK; monitor event count |
| R4 | Referência mutável em evento | Deep clone arrays |
| R5 | Multiplayer joiner | **Skip v0** — by design |
| R6 | Scope creep variantFields derivados | Só brutos mínimos §6.3 |
| R7 | Acidentalmente preencher classification | Test assert + code review |
| R8 | Duplicar eventos | Dedup key opcional |

---

# 14. Relatório final esperado após implementação

Após código, entregar markdown (chat ou `docs/ai/implementation-reports/IMPLEMENTATION_1_LOGGER_V0_REPORT.md`) com:

1. **Ficheiros criados** (lista completa)
2. **Ficheiros alterados** (diff summary)
3. **Hook** — onde exactamente em `GameBoard.tsx`
4. **Fórmulas** — `trickIndex`, `roundIndex`, `turnIndex`
5. **Storage** — IDB stores criados; fallback testado?
6. **Testes** — comando + resultados
7. **Smoke manual** — variant testada, N eventos gerados
8. **Gaps** para Impl 2 (`TrickEnd`, history cross-game)
9. **Confirmação** — zero avaliação; zero alteração bots/regras
10. **Checkpoint H1** — pedir validação Francisco

---

# Dúvidas documentadas — resolvidas (v1.1)

| # | Tema | Decisão fechada |
|---|------|-----------------|
| 1 | `trickIndex` cross-game | Vazas iniciadas na ronda; 0-based; `null` + gap se motor não fiável (§7.3) |
| 2 | Multiplayer joiner | **Skip v0** — solo/local + host only (§9.2) |
| 3 | Campo `mode` | `variantState`/`contractId` → `gameConfig.mode` → `null`; não inventar (§7.3) |
| 4 | `fake-indexeddb` CI | Mock adapter primeiro; fake-indexeddb se setup leve (§11.4) |
| 5 | AI fallback | Carta **efectiva** sempre; `aiSource: null` v0; P1 mapeia internal/external/fallback |

---

## Referências

- [IMPLEMENTATION_PLAN_AI.md](../IMPLEMENTATION_PLAN_AI.md) — Impl 1, decisões v1.1
- [FASE_3_LOGGER_DESIGN.md](../FASE_3_LOGGER_DESIGN.md) — schema 3.0.0
- [FASE_4_ENCODER_DESIGN.md](../FASE_4_ENCODER_DESIGN.md) — consumidor futuro de logs
- [FASE_5_AVALIADOR_DESIGN.md](../FASE_5_AVALIADOR_DESIGN.md) — **não** invocar
- [FASE_2A_PRIORIDADES_METRICAS.md](../FASE_2A_PRIORIDADES_METRICAS.md) — metric IDs
- [PHASE0_INVENTORY.md](../PHASE0_INVENTORY.md) — gaps `playedCards`

---

## Histórico

| Versão | Data | Nota |
|--------|------|------|
| 1.0 | 2026-05-31 | Prompt executável Logger v0 |
| 1.1 | 2026-05-31 | Decisões fechadas: trickIndex, mode, joiner skip, IDB tests, AI fallback |
