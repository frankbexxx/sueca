# SUECÂO Global Expansion Plan

## Visão geral
Este plano define a evolução da base atual de SUECA para um framework modular chamado SUECÂO. O objetivo é suportar o jogo original e adicionar três jogos extras (Spades, Hearts e King placeholder) mantendo um núcleo reutilizável para decks, regras e IA.

## Fases principais
1. ✅ Arquitetura modular de jogo - COMPLETA
2. ✅ Implementação dos jogos - COMPLETA  
3. ✅ UI e multiplayer genéricos - COMPLETA

## 1. Arquitetura modular de jogo
- Definir um modelo de cartas e baralho reutilizável para 52 cartas.
- Criar interfaces de jogo genéricas: GameState, TrickEngine, ScoringEngine, GameAdapter e GameVariant.
- Refatorar o motor atual de Sueca para usar o modelo genérico e manter regras separadas.
- Garantir que o core não dependa de frontend ou de regras específicas de um jogo.
- Preparar um ponto de extensão para King placeholder com metadados e fluxo de jogo.

## 2. Implementação dos jogos
- Implementar Spades com baralho de 52 cartas, bidding obrigatório, espadas como trunfo e pontuação de contrato/bags.
- Implementar Hearts com passagem de cartas, proibição de copas antes de serem quebradas, contagem de pontos por copas e rainha de espadas, e tiro da lua.
- Criar King como módulo placeholder com metadados, fluxo de 13 vazas e regras de inicialização, sem forçar regras detalhadas ainda.
- Reusar a mesma infraestrutura de deck, classificação de cartas e avaliação de vazas.

## 3. UI e multiplayer genéricos
- ✅ Criar seleção de jogo no frontend com nomenclatura assertiva e marca SUECÂO.
- ✅ Desenvolver um GameBoard genérico que consuma módulos de jogo diferentes e renderize estado abstrato.
- ✅ Construir componentes de mesa, mãos e vazas que aceitam modelos genéricos de jogo (GameInfo, TrickArea, PlayerHand, GameScores, GameActions).
- ✅ Garantir que a sessão multiplayer funciona para qualquer jogo suportado, com status de conexão e turnos.
- ✅ Manter a identidade do jogo e a mascote Buga visíveis no fluxo.

## 4. IA e personalidades
- Criar sistema de IA por persona com nomes e estilos distintos (por exemplo, Buga).
- Definir perfis de dificuldade e heurísticas por persona, separados das regras do jogo.
- Implementar adaptadores de IA que podem ser usados em Sueca, Spades e Hearts.
- Planejar a expansão futura para IAs específicas por jogo.

## 5. Documentação e entrega
- Guardar o plano global em `docs/plan/PLAN_GLOBAL.md`.
- Guardar prompts de implementação em `docs/plan/prompts/implementation-prompts.md`.
- Documentar a nova estrutura de pastas, padrões de design e convenções de nomenclatura.
- Incluir verificações e testes básicos para engine, regras e IA.

## Estrutura de documentação proposta
- `docs/plan/PLAN_GLOBAL.md`
- `docs/plan/prompts/implementation-prompts.md`

## Sugestões e questões adicionais
- Priorizar refatoração da engine primeiro para reduzir retrabalho.
- Confirmar se King deve incluir modos individual e duplas em fases posteriores.
- Avaliar se o backend FastAPI deve expor APIs genéricos por jogo ou manter endpoints específicos.
- Definir se a marca SUECÂO deve ser usada como umbrella para todos os jogos.
