# REPO_REVIEW_LAYER_RULES

## Objectivo

Evitar dar o repo inteiro à AI externa sem necessidade.

A revisão deve ser feita por camadas, com packs pequenos e focados.

---

## Regra principal

Nunca começar por pack completo do repo.

Antes de gerar contexto para AI, escolher a camada certa.

---

## Camadas recomendadas

### 1. AI / Decisões

Usar quando a pergunta for sobre:

- Card Intelligence
- logger
- encoder
- evaluator
- memory
- mini-LLM
- reportFlow
- métricas de decisão

Inclui normalmente:

```text
frontend/src/cardIntelligence/**
docs/ai/active/**
2. Engine / Regras

Usar quando a pergunta for sobre:

regras dos jogos
legalidade das jogadas
motores Sueca / Spades / Hearts / King
scoring
contratos
trick logic

Inclui normalmente:

frontend/src/models/**
frontend/src/ai/**
docs/rules/**
docs/ai/active/specs/**
3. UI

Usar quando a pergunta for sobre:

componentes
layout
CSS
temas
UX
menus
responsivo

Inclui normalmente:

frontend/src/components/**
frontend/src/styles/**

4. Docs / Histórico

Usar quando a pergunta for sobre:

roadmap
estado do projecto
relatórios
decisões passadas
inventário

Inclui normalmente:

docs/ai/active/**
docs/ai/repo-review/reports/**

Não incluir archive salvo necessidade explícita.

5. Full repo

Usar só quando:

a pergunta atravessa várias áreas;
há bug difícil de localizar;
uma análise por camada falhou;
é necessário mapear dependências globais.

Full repo é excepção, não regra.

Regras de pack

Cada pack deve ter:

nome claro;
scope explícito;
exclusões óbvias;
output em docs/ai/repo-review/packs/generated/;
ficheiro gerado ignorado pelo git.
Regras de exclusão

Excluir por defeito:

node_modules/**
dist/**
build/**
coverage/**
docs/ai/archive/**
docs/ai/repo-review/packs/generated/**
*.log
Regra anti-ruído

Se o pack passar de tamanho razoável, dividir.

Sinais de pack demasiado grande:

muitos ficheiros irrelevantes no Top 5;
docs antigas dominam tokens;
CSS domina quando a pergunta não é UI;
reports/prompts dominam quando a pergunta é código.
Fluxo correcto
Definir pergunta.
Escolher camada.
Gerar pack.
Pedir análise review-only.
Validar conclusão com Cursor ou leitura humana.
Só depois implementar.
Regra de commit

Commitar:

configs;
rules;
prompts úteis;
relatórios finais úteis.

Não commitar:

packs gerados;
outputs temporários;
relatórios experimentais fracos;
dumps completos do repo.
