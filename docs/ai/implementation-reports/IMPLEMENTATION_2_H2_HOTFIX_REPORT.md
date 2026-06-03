# IMPLEMENTATION_2 H2 HOTFIX — Relatório

**Data:** 2026-06-03  
**Base:** [IMPLEMENTATION_2_ROUND_HISTORY_REPORT.md](./IMPLEMENTATION_2_ROUND_HISTORY_REPORT.md)

---

## Causa raiz

Sueca `Game.getState()` devolve `{ ...this.state }` (cópia superficial). `currentTrick` partilha referência com o motor.

Fluxo antes do fix:

1. `getCurrentState()` → `stateBefore` com `currentTrick` vivo  
2. `playCard()` faz `push` na mesma array  
3. Logger usa `stateBefore` **já mutado**  
4. `isTrickJustClosed` exigia `stateBefore.currentTrick.length === 3` na 4.ª carta, mas length era **4** → TrickEnd nunca gravava  
5. `trickAfter` no evento de jogada ficava capped em **3** (snapshot pós-mutação)

---

## Alterações

| Ficheiro | Alteração |
|----------|-----------|
| `frontend/src/cardIntelligence/shared/clone.ts` | `cloneGameStateSnapshot()` — deep clone defensivo |
| `frontend/src/cardIntelligence/logger/playWithLogging.ts` | Snapshot **antes** de `playCard`; logger usa cópia pré-jogada |
| `frontend/src/cardIntelligence/history/trickEvents.ts` | `isTrickJustClosed` baseado em `stateAfter` (`waitingForTrickEnd` + 4 cartas) |
| `frontend/src/cardIntelligence/logger/playWithLogging.test.ts` | Regressão Sueca shallow + TrickEnd 4.ª carta |
| `frontend/src/cardIntelligence/history/trickEvents.test.ts` | Regressão `isTrickJustClosed` com trick mutado |

**Não alterados:** `Game.getState()`, motores, bots, `GameBoard`, regras.

---

## Testes

```bash
cd frontend
CI=true npm test -- --watchAll=false --testPathPattern=cardIntelligence
CI=true npm run build
```

**Resultado:** 9 suites, **28 tests** — PASS  
Build: **PASS**

---

## H2 — re-validação manual (Francisco)

Após `vercel --prod`:

1. Apagar IDB `cardIntelligenceLogs` (opcional)
2. Jogar 1+ vazas Sueca solo
3. Consola:

```javascript
indexedDB.open('cardIntelligenceLogs',1).onsuccess=e=>{
  e.target.result.transaction('events').objectStore('events').getAll().onsuccess=r=>{
    const all = r.target.result;
    console.log('chosenCard:', all.filter(x=>x.chosenCard).length);
    console.log('trick_end:', all.filter(x=>x.eventType==='trick_end').length);
    console.log('max trickAfter:', Math.max(...all.map(x=>x.trickAfter?.length??0)));
  };
};
```

Esperado: `trick_end ≥ 1`, `max trickAfter: 4`, ratio ~4 chosenCard por trick_end.

---

## Gameplay

Zero alteração de regras, scoring, bots ou UX. Logging fail-silent mantido; sem `await` no hot path.
