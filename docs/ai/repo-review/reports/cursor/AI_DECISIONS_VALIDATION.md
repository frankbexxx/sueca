Validação técnica — relatório Gemini vs código actual
Base: frontend/src/cardIntelligence/ (leitura só).

1. Gaps confirmados
Gap	Evidência no código
Live Decision Bridge (pre_decision + evaluator)
encodeDecisionState suporta pre_decision (chosenCard: null). buildMiniLLMInput usa pre_decision. Mas evaluateDecision rejeita encodeMode !== 'post_decision' e chosenCard === null → devolve unknown. Não há caminho live humano→evaluator antes da jogada.
Simulação de alternativas (todas as legalMoves)
evaluateDecision avalia uma carta (chosenCard). betterAlternatives vêm de métricas individuais (ex. K03 sugere 1 alt), não de sweep sistemático. equivalentAlternatives = legais − escolhida − better — sem avaliar cada movimento.
Desalinhamento neededFields ↔ evaluators
metricContext.ts define neededFields; metricEvaluators.ts acede a campos via helpers (suecaEnc, kingEnc, etc.) sem contrato cruzado. Drift = applicable: false / missingFields silencioso.
Storage pressure (IndexedDB)
IndexedDbLogStore só faz put; sem retention/cleanup. Cada evento inclui roundPlayHistory completo (buildCardDecisionEvent.ts).
Context bloat (LLM)
sanitizeEncodedStateForPrompt limita chaves, mas envia visiblePlayedCards integral + metricContext completo. Sem selector de relevância histórica.
2. Gaps parcialmente existentes
Gap	O que já existe	O que falta
Proactive Risk Mapping
Métricas P0 com betterAlternatives pontuais; buildMiniLLMInput lista legalMoves no prompt; validateLLMOutput valida legalidade/hand
Mapa comparativo heurístico por movimento antes de LLM
Conflito de autoridade LLM ↔ evaluator
validateLLMOutput: índice legal, carta na mão, fallback
Não chama evaluateDecision sobre a carta sugerida pelo LLM
reasonShort pedagógico
metricNameHuman em metricContext; HumanReport com play context + alternatives
reasonShort continua técnico; sem camada de tradução pedagógica
Pipeline reativo
playWithLogging pós-jogada; evaluateStoredPlay offline; reportFlow enriquecido (hand, legais, trick, histórico)
Avaliação em tempo real no ciclo de decisão humana
LLM readiness
getMiniLLMAdvice, providers, evaluatorHints (top 5), memoryContext (top 3)
Hints vêm de avaliação post_decision de eventos guardados, não do estado actual
Nota: GameBoard só importa playCardAndLogDecision — logging sidecar, zero advice.

3. Gaps prematuros ou fora de scope agora
Item Gemini	Porquê
AdviceProvider + integração GameBoard
Não existe AdviceProvider. Sem infra evaluator multi-move + pre_decision, a UI seria casca vazia. Scope futuro.
Feedback visual antes de confirmar carta
Depende de bridge + UI. Explicitamente fora do pedido actual.
H16-OK smoke King
Track bot King (ai/games/king/), não Card Intelligence. Importante no roadmap geral, mas não é pré-requisito da camada AI/Decisões.
Camada pedagógica completa
Nice-to-have; não bloqueia logging/evaluator/LLM.
4. Ficheiros prováveis por gap
Gap	Ficheiros
Pre_decision evaluator
evaluator/evaluateDecision.ts, evaluator/types.ts, encoder/encodeDecisionState.ts
Risk mapping / alternativas
evaluator/evaluateDecision.ts (novo helper), evaluator/aggregateResults.ts, possivelmente evaluator/evalHelpers.ts
neededFields sync
encoder/metricContext.ts, evaluator/metricEvaluators.ts, encoder/metricContext.test.ts
LLM authority
llm/getMiniLLMAdvice.ts, llm/validateLLMOutput.ts, llm/buildMiniLLMInput.ts
Context bloat
llm/promptTemplate.ts, encoder/encodeDecisionState.ts, novo selector em llm/ ou encoder/
Storage retention
shared/storage/logStore.ts, shared/storage/indexedDb.ts, logger/CardIntelligenceLogger.ts
Bridge (fase 2)
logger/extractLegalMoves.ts, novo módulo advice/ ou evaluator/, não GameBoard.tsx na fase 1
Pedagógico
debug/reportFlow/formatHumanReport.ts ou nova camada copy/
5. Ordem recomendada
Evaluator hypothetical — permitir avaliar qualquer carta legal sobre estado pre_decision (sem UI).
Legal move risk map — sweep de legalMoves → ranking/heurística (Proactive Risk Mapping interno).
neededFields guard — teste ou lint que cruza MetricDef.neededFields com campos usados nos evaluators.
LLM authority gate — pós-LLM, evaluateDecision na carta sugerida; downgrade se bad.
Context selector — truncar/seleccionar visiblePlayedCards e memória para prompt.
Storage policy — retention por gameId/idade em IndexedDB.
Pedagógico — camada de copy no HumanReport (opcional).
Bridge + AdviceProvider + GameBoard — só depois de 1–4 estáveis em devLab/debug.
6. Primeiro micro-scope implementável
evaluateLegalMove + mapLegalMoveRisks (só evaluator/debug)

Relaxar evaluateDecision para aceitar encodeMode: 'pre_decision' quando chosenCard é hipotético (carta da lista legalMoves).
Novo helper: dado EncodedDecisionState + legalMoves[] → array { card, classification, reasonShort, metricResults }.
Expor em devLab/debug console (__ciMapLegalRisks) — zero UI, zero gameplay, zero regras.
Entregável verificável: correr num cenário LAB existente e ver mapa de risco por carta legal.

7. Fora de scope explícito
Alterar regras de jogo / motores (Game.ts, *Game.ts, bots).
Alterar gameplay ou fluxo de jogada.
UI / GameBoard / feedback visual.
AdviceProvider completo.
Integração LLM em produção para humanos.
H16 smoke King (track paralelo).
Novas métricas P0 — só infra sobre as existentes.
8. Riscos
Risco	Mitigação no plano
Sweep N×métricas lento (4–13 legais × ~20 métricas)
Limitar a métricas applicable; cache encode; só P0 activas
pre_decision sem chosenCard quebra T01
T01 exige carta; avaliar hipótese explícita, não null
Regressão evaluator strict
Manter path post_decision intacto; testes golden/fixtures
LLM gate demasiado agressivo
Gate advisory only; fallback preservado
Retention apaga dados de debug
Política configurável; export JSONL antes de purge
Gemini mistura bot King com Card Intelligence
Separar tracks no plano de execução
9. Testes necessários
Micro-scope	Testes
pre_decision hypothetical
evaluateDecision.test.ts: estado pre_decision + carta legal → não unknown
Risk map
Novo mapLegalMoveRisks.test.ts: fixture com 2+ legais → rankings distintos; K03 alt detectada
Regressão post_decision
Fixtures golden + evaluatorSynthetic.test.ts verdes
neededFields guard
Teste que, por métrica P0, campos em neededFields existem no encode de fixture aplicável
LLM authority (fase 4)
getMiniLLMAdvice.test.ts: carta LLM bad → fallback ou warning
Context selector (fase 5)
promptTemplate.test.ts: histórico longo truncado
Storage (fase 6)
logStore.test.ts: após N eventos, purge mantém últimos K
DevLab smoke
runScenario ou novo comando debug com output de risk map
Veredicto sobre o Gemini: arquitectura sólida — correcto. Gaps críticos 1 e 2 — confirmados no código. Gaps não críticos — confirmados. Riscos — válidos; mitigações parciais já existem (allowlist prompt, fallback LLM, cap localStorage 50). Recomendação AdviceProvider+GameBoard — prematura como primeiro passo; o micro-scope acima é o ponto de entrada alinhado com as tuas regras.
