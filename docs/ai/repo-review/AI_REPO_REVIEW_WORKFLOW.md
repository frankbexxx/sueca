# AI Repo Review Workflow

Fluxo para usar uma AI externa como revisora do repo, sem a deixar implementar directamente.

## Objectivo

Usar AI externa para:

* ler contexto do repo;
* produzir relatórios;
* detectar lacunas;
* gerar prompts para Cursor;
* validar melhorias depois da implementação.

A AI externa não deve alterar ficheiros, correr testes, instalar pacotes ou fazer commits.

---

## Estrutura usada

```text
docs/ai/repo-review/
├── AI_REPO_REVIEW_WORKFLOW.md
├── packs/
│   └── generated/
├── prompts/
└── reports/
    └── gemini/
```

O directório `packs/generated/` é ignorado no git.

---

## Requirements

Linux / Ubuntu:

```bash
node -v
npm -v
git --version
```

Versões usadas:

```text
Node v22.22.3
npm 10.9.8
git 2.53.0
```

Se o Repomix pedir Node >=22, actualizar via `fnm`:

```bash
fnm install 22.22.3
fnm use 22.22.3
fnm default 22.22.3
```

---

## Repomix

Testar:

```bash
npx repomix@latest --version
```

Gerar pack lean:

```bash
npx repomix --config repomix.config.json
```

Output esperado:

```text
docs/ai/repo-review/packs/generated/ai-decisions-context.md
```

Este ficheiro não deve ser commitado.

---

## repomix.config.json

O pack actual inclui apenas contexto relevante para Card Intelligence:

```text
docs/ai/active/**
frontend/src/cardIntelligence/**
```

E exclui:

```text
docs/ai/archive/**
docs/ai/repo-review/packs/generated/**
```

Objectivo: reduzir ruído e evitar dar o repo inteiro à AI.

---

## Gemini CLI

Instalar:

```bash
npm install -g @google/gemini-cli
```

Confirmar:

```bash
gemini --version
which gemini
```

Abrir:

```bash
gemini
```

Escolhas iniciais:

```text
Trust folder: Don't trust
Auth: Sign in with Google
```

Motivo: usar Gemini como revisor externo, sem carregar configs/hooks/agents locais.

---

## Regra base para Gemini

Usar sempre em modo **REVIEW ONLY**.

```text
MODO DE TRABALHO: REVIEW ONLY

Objectivo:
Actua apenas como revisor externo do repositório.
O teu trabalho é ler, analisar e produzir relatórios/prompts.
Não és agente de implementação.

PERMITIDO:
- Ler ficheiros.
- Listar ficheiros e pastas.
- Usar comandos apenas de leitura:
  cat, sed -n, head, tail, grep, find, wc, ls, git status, git diff --stat, git diff -- ficheiro.
- Analisar código.
- Produzir relatórios Markdown.
- Produzir prompts para Cursor.
- Apontar riscos, inconsistências e dúvidas.

PROIBIDO:
- Alterar ficheiros.
- Criar ficheiros.
- Apagar ficheiros.
- Mover ficheiros.
- Fazer commits.
- Fazer git add, git commit, git push, git checkout, git reset.
- Executar testes.
- Executar npm scripts.
- Instalar packages.
- Fazer refactor.
- Aplicar patches.
- Corrigir código directamente.

COMANDOS PROIBIDOS:
rm, mv, cp, touch, mkdir, npm install, npm run, pnpm, yarn, git add, git commit, git push, git reset, git checkout, git clean, sed -i, perl -pi.

Se precisares de uma acção proibida, não a executes: propõe a acção para validação humana.
Se não tiveres informação suficiente, diz exactamente o que falta.
```

---

## Fluxo normal

### 1. Gerar pack

```bash
npx repomix --config repomix.config.json
```

### 2. Abrir Gemini

```bash
gemini
```

### 3. Dar tarefa dirigida

Exemplo:

```text
Lê o pack actualizado:

@docs/ai/repo-review/packs/generated/ai-decisions-context.md

Pergunta concreta:
O HumanReport/reportFlow contém informação suficiente para uma AI externa avaliar uma jogada como boa/média/má sem consultar estado interno do React?

Produz relatório Markdown curto.
Não edites ficheiros.
Não escrevas código.
Não executes testes.
```

### 4. Rever resposta

Classificar:

```text
bom para orientar
não implementar sem validação factual
```

### 5. Pedir validação curta ao Cursor

Antes de implementar, pedir ao Cursor:

```text
Verifica apenas, sem alterar ficheiros.
Confirma se a conclusão da Gemini é correcta.
Produz tabela curta com campos existentes/em falta.
```

### 6. Só depois implementar

Cursor implementa apenas scope aprovado.

### 7. Testar e commit

Depois da implementação:

```bash
git status --short
git diff --stat
```

Commit exemplo:

```bash
git add frontend/src/cardIntelligence/debug/reportFlow
git commit -m "feat: enrich human reports with play context"
```

### 8. Regenerar pack

```bash
npx repomix --config repomix.config.json
git status --short
```

O pack gerado deve continuar fora do git.

### 9. Validar com Gemini

Pedir nova revisão curta com o pack actualizado.

---

## Baseline validada

Relatório guardado:

```text
docs/ai/repo-review/reports/gemini/REPORTFLOW_BASELINE_REVIEW.md
```

Conclusão da baseline:

```text
HumanReport suficiente para auditoria externa de jogadas individuais.
```

Campos agora presentes no HumanReport:

```text
chosenCard
hand
legalMoves
currentTrick
ledSuit
trumpSuit
trickPosition
visiblePlayedCards
betterAlternatives
equivalentAlternatives
```

---

## Commits feitos nesta fase

```text
docs: reorganize AI documentation and add repo review workflow
feat: include evaluation alternatives in human reports
feat: enrich human reports with play context
docs: add Gemini reportFlow baseline review
```

---

## Notas

* Não usar o Gemini como implementador.
* Não usar `Trust parent folder`.
* Não confiar em relatórios Gemini sem validação factual.
* Preferir análises pequenas e dirigidas.
* Uma camada de cada vez.
* Packs grandes demais reduzem foco.
* O pack gerado não deve ser versionado.
