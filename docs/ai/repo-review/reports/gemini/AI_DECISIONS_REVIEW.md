O relatório de revisão da camada AI / Decisões do Card Intelligence foca-se na arquitetura implementada em frontend/src/cardIntelligence/.

  1. Veredicto Geral
  A arquitetura é excecionalmente sólida e modular. O design "sidecar" (que observa o jogo sem interferir com o motor de regras) garante que a inteligência pode evoluir, ser testada e até falhar sem quebrar
  a experiência de jogo. A separação entre Encoder (preparação), Evaluator (julgamento) e Memory (acumulação) está pronta para suportar LLMs e sistemas de aprendizagem contínua.

  2. O que já está sólido
   * Isolamento de Variantes: Encoders específicos para King, Spades, Sueca e Hearts garantem que a lógica de cada jogo é respeitada individualmente.
   * Pipeline de Auditoria: O fluxo Logger -> Storage -> ReportFlow permite uma rastreabilidade completa de cada decisão.
   * Métricas P0: O catálogo de métricas de legalidade e obrigações fundamentais (ex: K02 para King, S08 para Sueca) está bem mapeado e implementado heuristicamente.
   * Estrutura para LLM: O buildMiniLLMInput já unifica estado encodado, dicas do avaliador (evaluatorHints) e contexto de regras, reduzindo a integração de LLM a um simples pedido de API/Provider.
   * Agregação de Memória: O sistema de badRate e tendências por métrica e sujeito já está funcional no IndexedDB.

  3. Gaps Críticos
   * Live Decision Bridge: O sistema atual é predominantemente reativo (avalia após a jogada ou via proxy). Falta uma ponte robusta na UI (GameBoard) que invoque o evaluateDecision em modo pre_decision para
     fornecer feedback visual antes do utilizador confirmar a carta.
   * Simulação de Alternativas: O evaluateDecision avalia a carta escolhida. Para um "Advice" real, o sistema deve ser capaz de avaliar todas as legalMoves em paralelo e comparar os seus riscos relativos
     para sugerir a melhor jogada heuristicamente antes de recorrer ao LLM.

  4. Gaps Não Críticos
   * Sincronismo de Metadados: Os neededFields (em metricContext.ts) e a lógica real da métrica (em metricEvaluators.ts) são definidos em ficheiros diferentes. Alterar a lógica de uma métrica pode causar um
     erro silencioso de "dados insuficientes" se o contexto não for atualizado.
   * Tom Pedagógico: As reasonShort são técnicas ("Puxou copas com alternativa"). Falta uma camada de tradução para linguagem natural pedagógica no formatHumanReport.

  5. Riscos para Logging/Memory/LLM
   * Context Bloat (LLM): Enviar o histórico completo de jogadas e todos os agregados de memória para o LLM pode exceder janelas de contexto em jogos longos (especialmente King). É necessário um seletor de
     "relevância histórica".
   * Storage Pressure: O uso extensivo de roundPlayHistory em cada evento no IndexedDB pode crescer rapidamente. Falta uma política de retenção/cleanup para logs antigos.
   * Conflito de Autoridade: O risco do LLM sugerir uma jogada que o evaluator heurístico classifica como bad. O sistema de validByEngine + evaluatorHints como restrição é vital.

  6. Próximo Passo Recomendado
  Finalizar o Smoke Test (H16-OK) para o King e, em seguida, implementar o "Proactive Risk Mapping". Isto consiste em expandir o avaliador para processar todas as jogadas legais no estado atual, gerando um
  mapa de "Segurança vs Risco" que a UI possa consumir para mostrar avisos em tempo real.

  7. Natureza do Próximo Passo
  Código: Criar o AdviceProvider que unifica evaluator + memory + llm e integrá-lo no ciclo de renderização do GameBoard para humanos.

  ---
  Revisão concluída com base nos ficheiros de frontend/src/cardIntelligence/ e no plano de implementação v1.6.
