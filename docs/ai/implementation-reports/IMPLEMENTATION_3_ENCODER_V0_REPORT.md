# IMPLEMENTATION_3_ENCODER_V0 — Relatório final

**ID:** `IMPLEMENTATION_3_ENCODER_V0`  
**Prompt:** [IMPLEMENTATION_3_ENCODER_V0_PROMPT.md](../implementation-prompts/IMPLEMENTATION_3_ENCODER_V0_PROMPT.md)  
**Data:** 2026-06-04  
**Estado:** implementação concluída — **H3 pendente** (validação manual Francisco)

---

## 1. Ficheiros criados

### `frontend/src/cardIntelligence/encoder/`

| Ficheiro | Função |
|----------|--------|
| `types.ts` | `EncodedDecisionState` 4.0.0, contexts, variant encodings, `EngineViewNotSupportedError` |
| `trickHelpers.ts` | Winner Sueca/standard, `canWinCheaply` helpers read-only |
| `encodeDecisionState.ts` | Router + `createTestLogEvent` |
| `suecaEncoder.ts` | P0 Sueca + `cutRisk` / `canCutWithLowestTrump` |
| `spadesEncoder.ts` | P0 Spades — cadeia variantState → histórico → null |
| `heartsEncoder.ts` | P0 Hearts |
| `kingEncoder.ts` | P0 King contrato-first |
| `metricContext.ts` | Política 7C incremental |
| `*.test.ts` | 6 suites de testes |

### `frontend/src/cardIntelligence/shared/`

| Ficheiro | Função |
|----------|--------|
| `kingObligations.ts` | `mustPlayKingHeartsNow`, `kingHeartsPlayedInHistory`, `cannotLeadHearts` |
| `kingObligations.test.ts` | 4 condições K02 |

---

## 2. Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `history/historySelectors.ts` | `sevensSeenFromPlays` (4A) |
| `history/historySelectors.test.ts` | Teste sevens |
| `cardIntelligence/index.ts` | Exports 8A: `encodeDecisionState`, `EncodedDecisionState`, `EncoderInput`, `createTestLogEvent` |

**Não alterados:** `playWithLogging.ts`, `GameBoard.tsx`, bots, motores `*Game.ts`, avaliador, memória, UI.

---

## 3. Resumo técnico

- **Entrada:** `CardDecisionLogEvent` (+ `TrickEndEvent?` opcional).
- **Saída:** `EncodedDecisionState` schema **4.0.0**; log permanece **3.0.0**.
- **Defaults:** `viewType: 'player'`, `encodeMode: 'post_decision'`, `sourceOfTruth: 'log'`.
- **Engine View:** stub — `throw EngineViewNotSupportedError` salvo `allowEngineView: true` (testes).
- **Player View:** só `handBefore`, `roundPlayHistory`, campos visíveis; `excludedFields` inclui `opponentHands`, `deckRemaining`, `confirmedVoids`.
- **metricContext:** T01 sempre; listas P0 por variant; `applicable` + `missingFields` — **sem** classification/reason.
- **King K02:** `shared/kingObligations.ts` — duplicação read-only mínima (sem editar `KingPtGame`).
- **Spades tricks:** lê `scoreBefore.raw.variantState.spades`; fallback derivar vitórias de `roundPlayHistory`; null + missingFields se ambos falham.
- **Encoder não corre no hot path** — zero imports em gameplay.

Decisões incorporadas: **1A 2A 3B 4A 5C 6A 7C 8A 9C 10A**.

---

## 4. Campos null / gaps por variant

| Variant | Nullable v0 | Motivo |
|---------|-------------|--------|
| Sueca | `partnerWinning`, `canWinCheaply`, `cutRisk` | Trick vazio ou sem trunfo |
| Spades | `playerTricks`, `bags`, `teamTricks` | Tricks incrementam em `finishTrick`; snapshot pode faltar |
| Hearts | `trickIsSafeAndPointless` | Sem winner conhecido |
| King | `contractPenaltiesInTrick`, `penaltyMap` parcial | Sem TrickEnd / contrato desconhecido |
| Todos | `memoryContext.aggregates` | Stub Impl 6 |

---

## 5. Testes

```bash
cd frontend
CI=true npm test -- --watchAll=false --testPathPattern=cardIntelligence
CI=true npm run build
```

| Resultado | Detalhe |
|-----------|---------|
| **Test suites** | 16 passed |
| **Tests** | 46 passed (28 Impl 1–2 + 18 encoder/king/sevens) |
| **Build** | PASS |

Cobertura mínima prompt:

- Encode básico Sueca 4.0.0
- Player View leak
- Sueca trunfo/parceiro/sevens/cutRisk
- Spades bid/needTricks/bidMet
- Hearts Q♠/pontos/perigo
- King `mustPlayKingHeartsNow` true/false
- metricContext T01 + sem classification
- pre/post `chosenCard`
- Engine View stub

---

## 6. Confirmação gameplay

- Nenhuma alteração a regras, scoring, bots ou UX.
- `grep encodeDecisionState frontend/src` — só `encoder/`, `index.ts`, testes.
- Encoder **não** invocado em `playWithLogging` / `GameBoard`.

---

## 7. Confirmação Player View

- Output contém apenas mão do decisor (`handBefore`).
- `hiddenInformationPolicy.excludedFields` lista campos omitidos.
- Sem arrays de cartas adversárias não jogadas.
- Output **não** inclui `classification`, `reason`, `good`/`medium`/`bad`.

---

## 8. H3 — checklist manual (Francisco)

Validar em **solo ou host local** (multiplayer joiner continua gap):

1. [ ] Exportar ou inspecionar `CardDecisionLogEvent` de IndexedDB após partida.
2. [ ] Em consola dev/test: `encodeDecisionState({ event })` — campos fazem sentido.
3. [ ] Sueca: `acesSeenBySuit`, `partnerIndex`, `trumpSuit` coerentes com mesa.
4. [ ] Spades: `needTricks`, `bidMet`, `spadesBroken` — ou null documentado se tricks só pós-Continue.
5. [ ] King negativo `no_king_hearts`: `mustPlayKingHeartsNow` true na 1.ª oportunidade legal.
6. [ ] Confirmar que partida normal **não** chama encoder (sem regressão UX).

**Como testar rapidamente (dev):**

```javascript
import { encodeDecisionState } from './cardIntelligence';
// event = CardDecisionLogEvent from IDB
const encoded = encodeDecisionState({ event });
console.log(encoded.variantEncoding, encoded.metricContext);
```

---

## 9. Gaps para Impl 4 / 5

| Gap | Impl |
|-----|------|
| Golden fixtures 2B | Impl 4 |
| Avaliador P0 | Impl 5 |
| Engine View completa | P2 |
| Voids inferidos, moon Hearts | P1+ |
| Multiplayer logs incompletos | MP-v0 |
| Hook encoder pós-partida / offline batch | Impl 5/7 |

---

## 10. Issues deferidos

| ID | Item |
|----|------|
| MP-v0 | `applyHostAction` — jogadas remotas sem log |
| H1-D1 | React `GameActions` |
| P2 | Engine View produção |

---

## 11. Referências

- [IMPLEMENTATION_3_ENCODER_V0_PROMPT.md](../implementation-prompts/IMPLEMENTATION_3_ENCODER_V0_PROMPT.md)
- [IMPLEMENTATION_2_ROUND_HISTORY_REPORT.md](./IMPLEMENTATION_2_ROUND_HISTORY_REPORT.md) §8–9
- [FASE_4_ENCODER_DESIGN.md](../FASE_4_ENCODER_DESIGN.md)
