# ROADMAP_AI — Suecão Card Intelligence

## Objectivo

Criar uma base global de inteligência para jogos de cartas no Suecão.

Isto não é apenas criar bots melhores.
O objectivo é transformar heurísticas, regras estratégicas e decisões de jogo em métricas explícitas, avaliáveis e reutilizáveis.

A mini-LLM será uma camada futura, construída sobre:

* métricas;
* logs;
* avaliação de decisões;
* memória;
* dados de partidas reais.

---

## Princípio base

A IA deve evoluir por fases:

1. Métricas estratégicas
2. Logger de partidas
3. Encoder de estado
4. Avaliador de decisões
5. Memória / aprendizagem
6. Mini-LLM local/fallback

A primeira fase não deve tentar criar uma LLM.
A primeira fase deve identificar e formalizar inteligência já existente.

---

## ROADMAP_INICIAL

Suecão actual

* logger de partidas
* encoder de estado
* avaliador de decisões
* memória/aprendizagem
* mini-LLM local/fallback

---

## ROADMAP_AI revisto

### Fase 0 — Inventário da inteligência existente

Objectivo:
identificar tudo o que já existe no projecto relacionado com decisão inteligente.

Especial foco na Sueca Hard AI.

Levantar:

* heurísticas existentes;
* métricas implícitas;
* regras estratégicas;
* lógica de escolha de cartas;
* tracking de cartas jogadas;
* sinais de parceiro;
* gestão de trunfos;
* protecção de cartas fortes;
* fallback AI;
* AI externa Sueca-only;
* diferenças entre AI interna e externa.

Resultado esperado:
uma lista explícita de métricas já existentes.

Exemplo:

* não jogar manilha antes de sair o ás do mesmo naipe;
* proteger cartas de valor;
* evitar desperdiçar trunfos;
* ajudar parceiro;
* contar cartas já jogadas.

---

### Fase 1 — Catálogo de métricas por jogo

Objectivo:
criar uma base mínima de inteligência para cada jogo.

Jogos:

* Sueca;
* Spades;
* Hearts;
* King.

Cada jogo deve ter:

* regras principais;
* objectivo estratégico;
* métricas de boa jogada;
* métricas de má jogada;
* contexto necessário para avaliar decisões;
* exemplos de decisões boas/más.

A Sueca serve como referência inicial.

---

### Fase 2 — Métricas mínimas para Spades, Hearts e King

Objectivo:
duplicar o nível mínimo de inteligência estratégica da Sueca para os outros jogos.

Não copiar regras da Sueca.
Criar métricas equivalentes por jogo.

Exemplos:

#### Spades

* cumprir bid;
* evitar bags desnecessários;
* proteger parceiro;
* gerir espadas altas;
* saber quando cortar;
* avaliar risco de overtrick;
* preservar cartas vencedoras.

#### Hearts

* evitar pontos;
* evitar dama de espadas;
* descartar cartas perigosas;
* controlar copas;
* detectar risco/oportunidade de shoot the moon;
* evitar ganhar vazas penalizantes.

#### King

* adaptar decisão ao contrato;
* evitar cartas penalizantes nos contratos negativos;
* maximizar vazas nos positivos;
* avaliar risco por sub-jogo;
* jogar de forma diferente em festa/leilão;
* respeitar fase actual do jogo.

---

### Fase 3 — Logger de partidas

Objectivo:
guardar decisões reais para análise futura.

Guardar localmente primeiro.

O logger deve capturar:

* jogo;
* ronda;
* jogador;
* tipo de jogador: humano, bot, remoto;
* mão antes da jogada;
* cartas legais;
* carta escolhida;
* estado da vaza;
* trunfo/contrato quando aplicável;
* cartas já jogadas;
* resultado da jogada;
* métricas aplicáveis;
* se a decisão foi boa, média ou má segundo avaliador heurístico.

Deve registar jogadas humanas e jogadas dos bots.

---

### Fase 4 — Encoder de estado

Objectivo:
converter o estado do jogo para um formato simples, estável e legível pela AI.

O encoder deve ser:

* por jogo;
* compatível com logs;
* compatível com avaliador;
* preparado para futura mini-LLM.

Deve evitar expor informação que o jogador não teria numa partida real.

---

### Fase 5 — Avaliador de decisões

Objectivo:
avaliar jogadas usando métricas explícitas.

O avaliador deve:

* validar se a jogada era legal;
* aplicar métricas do jogo;
* comparar contra alternativas;
* classificar decisão;
* justificar tecnicamente a avaliação;
* servir como base para treino futuro.

A explicação ao utilizador pode vir depois.
Nesta fase, a prioridade é avaliação interna.

---

### Fase 6 — Memória / aprendizagem

Objectivo:
guardar padrões simples antes de qualquer LLM.

Exemplos:

* decisões recorrentes boas/más;
* estilo de jogadores;
* erros frequentes;
* padrões por jogo;
* padrões por dificuldade;
* resultados por tipo de decisão.

Primeiro local.
Depois, se fizer sentido, exportável.

---

### Fase 7 — Mini-LLM local/fallback

Objectivo:
usar uma mini-LLM como camada de decisão e treino, não como substituta cega das regras.

A mini-LLM deve receber:

* estado codificado;
* cartas legais;
* métricas aplicáveis;
* histórico relevante;
* avaliação heurística;
* contexto do jogo.

A mini-LLM nunca deve escolher carta ilegal.
A decisão final deve continuar validada pelo motor de regras.

---

### Intervenção Impl 9 — Dev Seeded Game Lab (pós-Impl 8)

**ID:** `IMPLEMENTATION_9_DEV_SEEDED_GAME_LAB`

**Problema:** o pipeline Card Intelligence (Logger → Encoder → Evaluator → Memory → Debug → Mini-LLM mock) existe, mas validar cenários concretos só com partidas normais é lento — o shuffle é aleatório e situações como K♥ obrigatório, bag Spades, Q♠ Hearts ou manilha antes do Ás na Sueca raramente aparecem à primeira.

**Objectivo:** área **developer-only** (flag; invisível em produção por defeito) para:

* carregar cenários pré-construídos (alinhados a fixtures/métricas);
* gerar jogos com **seed fixa** e repetir sempre o mesmo baralho;
* escolher jogo (Sueca, Spades, Hearts, King) e cenário/métrica-alvo;
* simular avanço lógico sem depender de jogar manualmente até sair a situação;
* alimentar o pipeline: logs → encode → evaluate → memory → report → testes advisory LLM.

**Regras:** não altera regras de jogo, bots, nem gameplay normal. Dev-only.

**Ordem:** **após Impl 8** (Mini-LLM mock/advisory), **antes** de provider LLM real, Evaluator v1 alargado ou melhoria de bots.

Ver [IMPLEMENTATION_PLAN_AI.md](IMPLEMENTATION_PLAN_AI.md) §2 e §3.

---

## Regra arquitectural

A Card Intelligence deve ser uma camada acima dos bots existentes.

Os bots actuais não devem ser destruídos.

Cadeia desejada:

Card Intelligence
→ AI externa/local
→ heurísticas actuais
→ fallback primeira carta legal

---

## Resultado esperado do projecto

No fim, o Suecão deve ter:

* métricas explícitas de inteligência por jogo;
* logs estruturados;
* avaliador de decisões;
* base de aprendizagem;
* possibilidade de mini-LLM;
* bots melhores;
* análise de jogadas humanas e AI;
* fundação reutilizável para jogos de cartas.
