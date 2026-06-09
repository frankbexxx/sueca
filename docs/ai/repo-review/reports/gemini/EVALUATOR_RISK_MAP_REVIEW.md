Relatório de Revisão - IMPLEMENTATION_4_1_EVALUATOR_RISK_MAP

  Veredicto: APROVADO

  A implementação cumpre integralmente os requisitos do micro-scope, estabelecendo uma fundação sólida para a análise comparativa de riscos sem comprometer a integridade do avaliador principal.

  ---

  1. O que está correcto

   * Separação de Responsabilidades: A criação de evaluateHypotheticalMove como um entry-point distinto para estados pre_decision evita a "poluição" da lógica de produção (evaluateDecision), que agora impõe
     rigorosamente o modo post_decision.
   * Mapeamento de Riscos: mapLegalMoveRisks implementa correctamente a transformação de legalMoves em LegalMoveRiskEntry, preservando a ordem original das cartas (entries) enquanto disponibiliza uma visão
     ordenada por risco (sortedByRisk).
   * Lógica de Ranking: O uso de getClassificationRiskRank e a ordenação descrescente (worst-first) em sortedByRisk estão alinhados com a necessidade de identificar rapidamente as jogadas mais perigosas.
   * Surgical Refactoring: A extracção de runMetricEvaluation permitiu a partilha de código entre a avaliação real e a hipotética, garantindo que ambas beneficiam das mesmas métricas e critérios de
     agregação.
   * Tratamento de Excepções: Jogadas ilegais são tratadas explicitamente via illegalResult(), devolvendo uma classificação bad com a métrica T01 activada.
   * Testes: A cobertura em mapLegalMoveRisks.test.ts é excelente, validando desde a preservação da ordem até ao comportamento de estados de codificação incorrectos.

  2. Possíveis riscos/regressões

   * Ferramentas de Debug: O impacto em ferramentas que usam evaluateDecision foi mitigado pela actualização do ciEncode para usar post_decision por omissão em logs. O risco de quebra em ferramentas
     externas (como scripts de análise legacy) é minimizado pela clareza do erro (unknown com missingFields: ['encodeMode']).
   * Performance: Para mãos com muitas jogadas legais, o mapeamento executa N avaliações completas. No entanto, dado que as métricas actuais são baseadas em heurísticas leves, o impacto no tempo de resposta
     do UI/Debug deve ser desprezável.

  3. Melhorias pequenas

   * Eficiência no BestEntry: Em mapLegalMoveRisks.ts, como sortedByRisk já está ordenado (Worst -> Best), o bestEntry poderia ser obtido via sortedByRisk[sortedByRisk.length - 1] em vez de um reduce,
     embora o impacto seja mínimo.
   * Documentação Interna: Os JSDocs em evaluateHypotheticalMove são claros ao avisar que não se trata de uma "relaxação" do avaliador principal, o que ajuda na manutenção futura.

  4. Prontidão para 4.2 (Debug Hook)

  A implementação está pronta para seguir para o micro-scope 4.2. A estrutura de dados devolvida por mapLegalMoveRisks fornece toda a informação necessária para alimentar visualizações de risco no GameBoard
  ou no AdviceProvider em modo debug.

