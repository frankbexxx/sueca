# Repo Review Rules

Este directório contém as regras operacionais para revisão externa do repositório e implementação controlada.

---

## Rules

### GEMINI_REVIEW_ONLY.md

Define que Gemini CLI é usado apenas como revisor externo.

Pode ler, analisar e produzir relatórios/prompts.
Não pode alterar ficheiros, executar testes, instalar packages ou fazer commits.

---

### CURSOR_IMPLEMENTATION_RULES.md

Define que Cursor deve produzir plano antes de implementar.

A implementação só deve avançar depois de aprovação humana do scope.

---

### REPO_REVIEW_LAYER_RULES.md

Define que o repositório deve ser analisado por camadas.

Evita packs gigantes e obriga a escolher o contexto certo antes de consultar AI externa.

---

## Fluxo recomendado

1. Escolher a camada de análise.
2. Gerar pack Repomix focado.
3. Enviar para Gemini em modo REVIEW ONLY.
4. Validar conclusões.
5. Criar prompt para Cursor.
6. Cursor produz plano antes de código.
7. Aprovar plano.
8. Implementar.
9. Testar.
10. Commitar.

---

## Regra prática

Terminal e `git status --short` são a fonte de verdade.

A UI do editor pode falhar, atrasar refresh ou mostrar estado antigo.
