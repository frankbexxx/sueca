# SUECÂO Implementation Prompts

## Prompt 1: Modular Game Engine
Desenvolve um motor de jogo de cartas modular para SUECÂO que seja compatível com múltiplos jogos. Define tipos para cartas, baralhos de 52 cartas, naipes, rankings e regras de vaza. Cria interfaces limpas para `GameAdapter`, `TrickEngine` e `ScoringEngine`. Refatora o motor atual de Sueca para esta arquitetura.

## Prompt 2: Spades e Hearts
Implementa o jogo Spades com leilão de bids, regra de espadas como trunfo, e pontuação de contrato mais bags. Implementa o jogo Hearts com passagem de cartas, proibição de copas antes de serem quebradas, contagem de pontos por copas e rainha de espadas, e tratamento de tiro da lua.

## Prompt 3: King placeholder
Cria um módulo King placeholder com metadados, fluxo de 13 vazas e estrutura de mãos negativas/positivas. Define stubs para regras de trunfo, leilão, pontuação e o King de copas. Deixa espaço claro para implementação futura sem bloquear o motor.

## Prompt 4: UI genérico e seleção de jogos
Constrói uma interface de seleção de jogos e um `GameBoard` reutilizável que pode renderizar estados de Sueca, Spades, Hearts e King. Cria componentes de mesa, mão e vaza que aceitam modelos genéricos. Mantém a marca SUECÂO e Buga como tema central.

## Prompt 5: IA com personalidades
Desenha um sistema de IA por personagem com nomes e estilos distintos. Implementa Buga como primeira persona, e define como cada persona escolhe jogadas e responde a dificuldades. Separa esta lógica de heurística do motor de regras e da UI.

## Prompt 6: Documentação e testes
Gera documentação clara para o plano global e para cada fase de implementação. Inclui um checklist de testes unitários e de integração para engine, regras e multiplayer. Usa nomenclatura assertiva e modularidade como linha condutora.
