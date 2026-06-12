# AIDER_OLLAMA_VSCODE_WORKFLOW

## Objectivo

Usar VS Code + Ollama + Aider como ambiente alternativo ao Cursor para trabalhar no projecto com custos reduzidos.

A ideia é:

* VS Code = editor principal;
* Ollama = modelos locais;
* Aider = agente local que pode alterar código;
* Git = fonte de verdade;
* branch sandbox = zona segura;
* repo principal = só recebe alterações depois de revisão.

---

## Conceitos base

### Repo principal

É o repositório validado onde o trabalho final deve ficar.

Exemplo usado neste projecto:

```text
~/projects/sueca
```

No Windows pode ser outra pasta, por exemplo:

```text
E:\AI_SANDBOX\sueca-aider
```

### Sandbox

É uma cópia isolada do repo para experiências com AI.

A sandbox pode partir, gerar diffs maus ou ser apagada.

Nunca confiar nela como fonte final.

### Patch

É um ficheiro `.patch` gerado a partir de alterações feitas numa sandbox.

Serve para transportar alterações da sandbox para o repo principal.

---

## Placeholders usados neste documento

Substituir sempre os placeholders pelos valores reais.

```text
_REPO_URL_ = URL Git do repositório.
Exemplo: https://github.com/frankbexxx/sueca.git
Como encontrar: no repo já existente, correr `git remote -v`.

_SANDBOX_ROOT_ = pasta onde vão ficar sandboxes AI.
Exemplo Windows: E:\AI_SANDBOX
Exemplo Linux: ~/AI_SANDBOX

_SANDBOX_REPO_ = pasta da cópia sandbox do repo.
Exemplo Windows: E:\AI_SANDBOX\sueca-aider
Exemplo Linux: ~/AI_SANDBOX/sueca-aider

_BRANCH_BASE_ = branch principal de trabalho.
Exemplo: v2-main

_BRANCH_SANDBOX_ = branch temporária para Aider.
Exemplo: test/aider-debug-risk-hook

_MODEL_FAST_ = modelo local leve para análise/plano.
Exemplo: ollama/qwen2.5-coder:7b

_MODEL_MAIN_ = modelo local maior para implementação.
Exemplo: ollama/qwen3-coder:30b

_PATCH_FILE_ = caminho do patch gerado na sandbox.
Exemplo Windows: E:\AI_SANDBOX\aider-risk-hook.patch
Exemplo Linux: ~/AI_SANDBOX/aider-risk-hook.patch
```

---

## 1. Pré-requisitos

Instalar:

* Git
* VS Code
* Ollama
* Aider
* PowerShell no Windows ou terminal Linux

Confirmar:

```bash
git --version
code --version
ollama --version
aider --version
```

No Windows, se `aider` não existir depois de instalar:

```powershell
where.exe aider
```

O caminho esperado pode ser algo como:

```text
C:\Users\<user>\.local\bin\aider.exe
```

---

## 2. Confirmar URL do repo

Num repo existente:

```bash
git remote -v
```

Exemplo real:

```text
origin  https://github.com/frankbexxx/sueca.git (fetch)
origin  https://github.com/frankbexxx/sueca.git (push)
```

Neste caso:

```text
_REPO_URL_ = https://github.com/frankbexxx/sueca.git
```

---

## 3. Criar sandbox

### Windows

```powershell
cd E:\
mkdir AI_SANDBOX
cd AI_SANDBOX
git clone _REPO_URL_ sueca-aider
cd sueca-aider
```

Exemplo real:

```powershell
cd E:\
mkdir AI_SANDBOX
cd AI_SANDBOX
git clone https://github.com/frankbexxx/sueca.git sueca-aider
cd sueca-aider
```

### Linux

```bash
mkdir -p ~/AI_SANDBOX
cd ~/AI_SANDBOX
git clone _REPO_URL_ sueca-aider
cd sueca-aider
```

---

## 4. Preparar branch sandbox

Confirmar branch actual:

```bash
git branch
```

Se necessário, ir para a branch base:

```bash
git checkout _BRANCH_BASE_
git pull
```

Exemplo:

```bash
git checkout v2-main
git pull
```

Criar branch sandbox:

```bash
git checkout -b _BRANCH_SANDBOX_
```

Exemplo:

```bash
git checkout -b test/aider-debug-risk-hook
```

Confirmar:

```bash
git status --short
git branch -vv
git log --oneline -5
```

A working tree deve estar limpa.

---

## 5. Abrir VS Code na sandbox

```bash
code .
```

VS Code é usado como editor normal.

Não é obrigatório usar Copilot/Chat.

A fonte de verdade continua a ser o terminal:

```bash
git status --short
git diff
git log --oneline -5
```

---

## 6. Confirmar Ollama

Listar modelos:

```bash
ollama list
```

Modelos usados neste workflow:

```text
qwen2.5-coder:7b
qwen3-coder:30b
devstral:latest
gpt-oss:20b
```

Testar modelo leve:

```bash
ollama run qwen2.5-coder:7b "responde só: ok"
```

Se responder `ok`, Ollama está funcional.

Ver processos activos:

```bash
ollama ps
```

---

## 7. Instalar modelo novo no Ollama

Exemplo:

```bash
ollama pull qwen3-coder:30b
```

Confirmar:

```bash
ollama list
```

Regras:

* não instalar muitos modelos à toa;
* usar modelo leve para plano;
* usar modelo maior para código.

Sugestão:

```text
qwen2.5-coder:7b = plano/análise rápida
qwen3-coder:30b = implementação principal
devstral:latest = alternativa agentic
gpt-oss:20b = segunda opinião
```

---

## 8. Arrancar Aider em modo seguro

Nunca arrancar Aider sem estas flags:

```bash
aider --model _MODEL_FAST_ --no-auto-commits --no-dirty-commits
```

Exemplo leve:

```bash
aider --model ollama/qwen2.5-coder:7b --no-auto-commits --no-dirty-commits
```

Exemplo modelo principal:

```bash
aider --model ollama/qwen3-coder:30b --no-auto-commits --no-dirty-commits
```

Se aparecer aviso sobre `OLLAMA_API_BASE`, definir:

### PowerShell

```powershell
$env:OLLAMA_API_BASE="http://127.0.0.1:11434"
```

### Linux/macOS

```bash
export OLLAMA_API_BASE=http://127.0.0.1:11434
```

Depois repetir o comando do Aider.

---

## 9. Primeira configuração do Aider

Se o Aider perguntar:

```text
Add .aider* to .gitignore?
```

Responder:

```text
Y
```

Isto adiciona:

```gitignore
.aider*
```

Confirmar:

```bash
git diff -- .gitignore
```

Se for só `.aider*`, é seguro.

Commit opcional na sandbox:

```bash
git add .gitignore
git commit -m "chore: ignore aider files"
```

---

## 10. Regra principal dentro do Aider

Antes de qualquer tarefa:

```text
Não edites ficheiros.
Não faças commits.
Não executes testes.

Analisa apenas os ficheiros adicionados.
Produz plano antes de código.
```

Aider pode desobedecer e editar.

Se editar sem autorização:

```text
/undo
```

Depois:

```text
/exit
```

E confirmar fora do Aider:

```bash
git status --short
git log --oneline -3
```

---

## 11. Limpar contexto no Aider

Dentro do Aider:

```text
/clear
```

Usar isto antes de mudar de tarefa.

---

## 12. Adicionar ficheiros ao contexto

Não dar o repo todo.

Adicionar só o necessário.

Exemplo para debug risk hook:

```text
/add docs/ai/repo-review/rules/AIDER_SANDBOX_RULES.md
/add frontend/src/cardIntelligence/debug/debugConsole.ts
/add frontend/src/cardIntelligence/evaluator/mapLegalMoveRisks.ts
/add frontend/src/cardIntelligence/evaluator/types.ts
/add frontend/src/cardIntelligence/encoder/types.ts
```

---

## 13. Pedir plano antes de código

Prompt base:

```text
Não edites ficheiros.
Não faças commits.
Não executes testes.

Tarefa:
_NOME_DA_IMPLEMENTACAO_

Objectivo:
_DESCREVER_OBJECTIVO_

Scope permitido:
- _AREA_1_
- _AREA_2_

Fora de scope:
- UI
- GameBoard
- gameplay
- regras
- bots
- LLM production
- AdviceProvider
- memory
- storage
- reportFlow
- HumanReport
- novas métricas

Responde apenas com:
1. plano mínimo
2. ficheiros exactos a alterar/criar
3. riscos reais
4. testes mínimos
5. o que NÃO vais tocar
6. se precisas de mais ficheiros no contexto antes de planear
```

Exemplo real:

```text
Não edites ficheiros.
Não faças commits.
Não executes testes.

Tarefa:
IMPLEMENTATION_4_2_DEBUG_RISK_MAP_HOOK

Objectivo:
Criar um hook/helper debug para chamar mapLegalMoveRisks em dev, sem UI e sem integração de produção.

Scope permitido:
- debug/dev interno
- helper testável
- eventual window.__ciMapLegalRisks protegido por flag debug existente

Fora de scope:
- UI
- GameBoard
- gameplay
- regras
- bots
- LLM production
- AdviceProvider
- memory
- storage
- reportFlow
- HumanReport
- novas métricas

Responde apenas com:
1. plano mínimo
2. ficheiros exactos a alterar/criar
3. riscos reais
4. testes mínimos
5. o que NÃO vais tocar
6. se precisas de mais ficheiros no contexto antes de planear
```

---

## 14. Aprovar código

Só depois de aprovar o plano.

Prompt de implementação:

```text
Plano aprovado.

Podes editar apenas os ficheiros listados no plano.
Não faças commits.
Não executes testes sem pedir primeiro.
Não alteres ficheiros fora do scope.

Implementa a solução mínima.

No fim, reporta:
1. ficheiros alterados
2. o que mudou
3. testes que recomendas executar
4. riscos pendentes
5. confirmação do fora de scope
```

Mesmo com `--no-auto-commits`, confirmar depois:

```bash
git status --short
git diff
git log --oneline -3
```

---

## 15. Testar alterações

Executar testes manualmente fora do Aider.

Exemplo frontend:

```bash
cd frontend
CI=true npm test -- --testPathPattern=cardIntelligence/debug --watchAll=false
```

Ou evaluator:

```bash
cd frontend
CI=true npm test -- --testPathPattern=cardIntelligence/evaluator --watchAll=false
```

Voltar à raiz:

```bash
cd ..
```

---

## 16. Rever diff

Na sandbox:

```bash
git status --short
git diff
```

Ver ficheiros alterados:

```bash
git diff --name-only
```

Não aceitar se houver alterações fora do scope.

---

## 17. Commit na sandbox

Só depois de rever:

```bash
git add _FICHEIROS_
git commit -m "_MENSAGEM_DO_COMMIT_"
```

Exemplo:

```bash
git add frontend/src/cardIntelligence/debug/riskMapDebug.ts frontend/src/cardIntelligence/debug/riskMapDebug.test.ts
git commit -m "feat: add debug risk map hook"
```

---

## 18. Gerar patch

Na sandbox Windows:

```powershell
git diff origin/v2-main...HEAD > E:\AI_SANDBOX\aider-risk-hook.patch
```

Na sandbox Linux:

```bash
git diff origin/v2-main...HEAD > ~/AI_SANDBOX/aider-risk-hook.patch
```

Confirmar que o patch existe:

```bash
ls -lh _PATCH_FILE_
```

---

## 19. Aplicar patch no repo principal

No repo principal:

```bash
cd ~/projects/sueca
git status --short
```

Tem de vir vazio.

Aplicar patch:

```bash
git apply _PATCH_FILE_
```

Exemplo:

```bash
git apply ~/AI_SANDBOX/aider-risk-hook.patch
```

Confirmar:

```bash
git status --short
git diff
```

---

## 20. Testar no repo principal

Executar testes relevantes no repo principal.

Exemplo:

```bash
cd frontend
CI=true npm test -- --testPathPattern=cardIntelligence/debug --watchAll=false
cd ..
```

---

## 21. Commit final no repo principal

Só no repo principal validado:

```bash
git add _FICHEIROS_
git commit -m "_MENSAGEM_FINAL_"
git status --short
```

Exemplo:

```bash
git add frontend/src/cardIntelligence/debug
git commit -m "feat: add debug risk map hook"
git status --short
```

---

## 22. Regerar Repomix

No repo principal:

```bash
npx repomix --config repomix.config.json
```

O pack gerado deve estar ignorado pelo Git.

Confirmar:

```bash
git status --short
```

---

## 23. Review externa opcional

Usar Gemini CLI, ChatGPT, VS Code Chat ou outro reviewer para validar o resultado.

Prompt típico:

```text
MODO REVIEW ONLY.

Revê este micro-scope.
Não escrevas ficheiros.
Não executes testes.
Não faças commits.

Verifica:
1. se cumpre scope
2. riscos
3. regressões
4. se está pronto para próximo passo
```

Guardar relatório em:

```text
docs/ai/repo-review/reports/gemini/
docs/ai/repo-review/reports/cursor/
docs/ai/repo-review/reports/aider/
```

Conforme origem.

---

## 24. Quando usar cada ferramenta

### VS Code

Usar para:

* abrir ficheiros;
* editar manualmente;
* rever diffs;
* correr terminal;
* procurar no repo.

### Aider + Ollama

Usar para:

* implementar micro-scopes;
* editar poucos ficheiros;
* gerar código repetitivo;
* criar testes pequenos.

Não usar para:

* refactor amplo;
* mexer no repo inteiro;
* decisões arquitectónicas grandes sem review.

### Ollama directo

Usar para:

* perguntas rápidas;
* segunda opinião;
* explicar erro.

Exemplo:

```bash
ollama run qwen2.5-coder:7b "explica este erro: ..."
```

### Gemini CLI / outro reviewer

Usar para:

* review-only;
* validar arquitectura;
* validar plano;
* detectar riscos.

### Cursor

Reservar para:

* casos difíceis;
* implementação guiada quando tokens compensam;
* comparação final.

---

## 25. Comandos de emergência

Se Aider editou sem autorização:

```text
/undo
```

Se ainda houver alterações:

```bash
git status --short
git diff
```

Descartar alterações não commitadas na sandbox:

```bash
git restore .
```

Remover ficheiros untracked na sandbox:

```bash
git clean -fd
```

Atenção: `git clean -fd` apaga ficheiros não versionados. Usar só na sandbox.

Voltar à base remota na sandbox:

```bash
git reset --hard origin/v2-main
```

Atenção: apaga commits/alterações locais da branch actual. Usar só se souberes que é sandbox descartável.

---

## 26. Checklist antes de começar uma tarefa

```text
[ ] Estou na sandbox, não no repo principal.
[ ] Estou numa branch test/*.
[ ] git status --short está vazio.
[ ] Ollama responde.
[ ] Aider arranca com --no-auto-commits.
[ ] Contexto do Aider tem só ficheiros necessários.
[ ] Pedi plano antes de código.
[ ] Scope está claro.
```

---

## 27. Checklist antes de levar para o repo principal

```text
[ ] Diff revisto.
[ ] Sem alterações fora de scope.
[ ] Testes relevantes passaram na sandbox ou serão corridos no repo principal.
[ ] Patch gerado.
[ ] Repo principal está limpo.
[ ] Patch aplicado sem erro.
[ ] Testes relevantes passaram no repo principal.
[ ] Commit final feito no repo principal.
[ ] Repomix regenerado.
[ ] Relatório/review guardado se aplicável.
```

---

## Regra final

Aider pode escrever código, mas não é fonte de verdade.

A fonte de verdade é:

```text
git status
git diff
testes
review humana
commit final no repo principal
```
