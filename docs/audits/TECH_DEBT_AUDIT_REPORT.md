# TECH_DEBT_AUDIT_REPORT

Data: 2026-05-31  
Modo: Fase B completa (Agent mode — correções P2 aplicadas)

## Comandos executados

| Comando | Resultado |
|---------|-----------|
| `cd frontend && npx tsc --noEmit` | ✅ exit 0 |
| `cd frontend && CI=true npm test -- --watchAll=false` | ✅ 66 suites, 359 tests |
| `cd backend && node --check src/server.js && npm test` | ✅ 1/1 |
| `cd frontend && npm run build` | ✅ Compiled successfully |

## Achados por severidade

| Nível | Contagem | IDs |
|-------|----------|-----|
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 4 | A01–A04 (corrigidos) |
| P3 | 5 | A05–A09, A13 (não corrigidos) |
| WONTFIX | 2 | A10–A11 |

## Ficheiros alterados

| Ficheiro | ID | Alteração |
|----------|-----|-----------|
| `frontend/src/components/GameBoard.tsx` | A01 | `void chooseAndPlay().catch(...)` — rejection tratada com `console.warn` |
| `frontend/src/components/screens/OnlineScreen.tsx` | A02 | `.catch(() => {})` em `fetchSessionState` — fail-safe silencioso |
| `frontend/src/cardIntelligence/encoder/spadesEncoder.ts` | A03 | `[...playsInTrick].sort(...)` (2 locais) — sem mutar `roundPlayHistory` |
| `frontend/src/cardIntelligence/memory/memoryQueries.ts` | A04 | `[...results].sort(...)` — sem mutar array do store |

## Ficheiros criados

- `docs/audits/TECH_DEBT_ATTACK_PLAN.md`
- `docs/audits/TECH_DEBT_AUDIT_REPORT.md` (este ficheiro)

## Alterações feitas (A01–A04)

### A01 — Runtime (P2)

`chooseAndPlay()` era invocado sem `.catch()`. Agora usa `void chooseAndPlay().catch(...)` com warn alinhado ao padrão existente em `tryExternal`.

### A02 — Runtime (P2)

`fetchSessionState(...).then(...)` no efeito `waiting-joiner` agora inclui `.catch(() => {})` para evitar rejection silenciosa sem alterar UX (poll de background).

### A03 — Mutação (P2)

`spadesEncoder.ts` ordenava `playsInTrick` in-place via `.filter()` sobre `event.roundPlayHistory`. Substituído por spread antes de `.sort()` em ambos os locais (linhas ~48 e ~69).

### A04 — Mutação (P2)

`queryMemory` ordenava `results` in-place. Substituído por `[...results].sort(...)`.

## Achados P3 não corrigidos

| ID | Cat. | Ficheiro | Motivo |
|----|------|----------|--------|
| A05 | Tipagem | `useLanguage.ts:32` | `any` em `tReplace` — sem risco runtime; fora do escopo P2 |
| A06 | CI/Gap | `tsconfig.json` | Testes excluídos do tsc — documentar; CI extra opcional |
| A07 | Card Intel | `logFailureTelemetry.ts` | Warn só em dev — decisão produto |
| A08 | Ghost export | `cardIntelligence/index.ts` | `capturePlayDecision` — API pública intencional? |
| A09 | Lógica/UI | `GameBoard.tsx:712,726` | Empates em stats — ambíguo, não motor |
| A13 | Lint | `package.json` | Sem `npm run lint` — documentar |

## WONTFIX

| ID | Ficheiro | Motivo |
|----|----------|--------|
| A10 | `backend/server.js:12` | JWT_SECRET default dev — risco ops se deploy sem env; documentar, não mudar código |
| A11 | `GameBoard.tsx:813` | `eslint-disable exhaustive-deps` — intencional (`kingPtFestaKey`) |

## Confirmação de escopo

- **Zero alteração intencional de gameplay**, regras de jogo, bots ou UI/UX.
- Apenas hardening defensivo: promises tratadas e sorts imutáveis.
- Card Intelligence: A12 verificado OK (debug/LLM gated; memory ingest só offline).

## Testes pós-correção

```bash
cd frontend && npx tsc --noEmit                    # ✅
cd frontend && CI=true npm test -- --watchAll=false # ✅ 359/359
cd backend && node --check src/server.js && npm test # ✅ 1/1
cd frontend && npm run build                        # ✅ Compiled successfully
```

## Resultado final

Baseline verde em typecheck, testes e build. Quatro correções P2 aplicadas (A01–A04). Nenhuma alteração de gameplay. Riscos remanescentes documentados em P3/WONTFIX acima.

## Próxima ronda (opcional)

- Adicionar `npm run typecheck` script espelhando CI
- Avaliar telemetria mínima para `recordLogFailure` em prod (A07)
- Confirmar se `capturePlayDecision` permanece API pública (A08)
