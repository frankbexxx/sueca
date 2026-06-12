# AIDER_SANDBOX_RULES

## Objectivo

Usar Aider como agente de código local/free com Ollama, mas apenas em ambiente sandbox.

Aider pode ser usado para propor e aplicar alterações pequenas, mas nunca deve trabalhar directamente no repositório principal validado sem revisão humana.

---

## Regra principal

Aider só deve ser usado em branch sandbox e com auto-commits desligados.

Comando obrigatório:

```powershell
aider --model ollama/qwen3-coder:30b --no-auto-commits --no-dirty-commits
```

Alternativa leve para análise rápida:

```powershell
aider --model ollama/qwen2.5-coder:7b --no-auto-commits --no-dirty-commits
```

---

## Estrutura recomendada

Repo principal validado:

```text
Ubuntu: ~/projects/sueca
```

Repo sandbox AI:

```text
Windows: E:\AI_SANDBOX\sueca-aider
```

O repo sandbox pode receber alterações experimentais.

O repo principal só deve receber patches revistos.

---

## Branches

Nunca trabalhar em `v2-main` directamente com Aider.

Usar sempre branch sandbox:

```powershell
git checkout -b test/aider-nome-do-scope
```

Exemplo:

```powershell
git checkout -b test/aider-debug-risk-hook
```

---

## Regras de segurança

Aider não pode:

* fazer push;
* trabalhar directo em `v2-main`;
* alterar ficheiros fora do scope aprovado;
* mexer em UI, GameBoard, gameplay, regras, bots, LLM production ou storage sem autorização explícita;
* criar commits automáticos;
* instalar packages;
* fazer refactor amplo;
* tocar em ficheiros sensíveis sem estarem adicionados ao contexto.

---

## Antes de usar Aider

Confirmar sempre:

```powershell
git status --short
git branch -vv
git log --oneline -5
ollama list
aider --version
```

A working tree deve estar limpa antes de começar.

---

## Uso controlado

Adicionar ao contexto apenas os ficheiros necessários.

Exemplo:

```text
/add frontend/src/cardIntelligence/debug/debugConsole.ts
/add frontend/src/cardIntelligence/evaluator/mapLegalMoveRisks.ts
/add frontend/src/cardIntelligence/evaluator/types.ts
/add frontend/src/cardIntelligence/encoder/types.ts
```

Não dar o repo inteiro como contexto.

---

## Plano antes de código

Antes de qualquer edição, pedir:

```text
Não edites ficheiros ainda.
Não faças commits.
Não executes testes.

Analisa apenas os ficheiros adicionados.

Produz:
1. plano mínimo
2. ficheiros exactos a alterar/criar
3. riscos reais
4. testes mínimos
5. confirmação do fora de scope
```

Só depois de aprovação humana pode editar.

---

## Depois de cada resposta do Aider

Verificar imediatamente:

```powershell
git status --short
git diff
git log --oneline -3
```

Se o Aider editou sem autorização:

```text
/undo
```

Depois:

```text
/exit
```

E confirmar:

```powershell
git status --short
git log --oneline -3
```

---

## Commits

Mesmo com `--no-auto-commits`, o commit deve ser manual.

Antes de commit:

```powershell
git diff
```

Commit só se o diff estiver limpo e dentro do scope.

Exemplo:

```powershell
git add <ficheiros>
git commit -m "feat: add debug risk map hook"
```

---

## Transferir para o repo principal

Não fazer merge directo da branch sandbox para o repo principal.

Gerar patch:

```powershell
git diff origin/v2-main...HEAD > E:\AI_SANDBOX\aider-risk-hook.patch
```

No Ubuntu:

```bash
cd ~/projects/sueca
git status --short
git apply /path/to/aider-risk-hook.patch
git status --short
```

Depois testar e commitar no Ubuntu.

---

## Modelos

Modelo principal para implementação:

```text
ollama/qwen3-coder:30b
```

Modelo leve para plano/análise:

```text
ollama/qwen2.5-coder:7b
```

Modelos alternativos:

```text
ollama/devstral:latest
ollama/gpt-oss:20b
```

---

## Regra anti-confiança

Aider funciona, mas não é tão obediente como Cursor em modo “plano apenas”.

Se editar sem aprovação, usar `/undo`.

Nunca assumir que “não edites” será respeitado.

---

## Checklist final

Antes de levar algo para o Ubuntu:

* `git status --short` limpo ou só alterações esperadas;
* `git diff` revisto;
* sem alterações fora de scope;
* sem commits automáticos indesejados;
* patch gerado;
* patch aplicado no Ubuntu;
* testes relevantes executados no Ubuntu;
* commit final feito no Ubuntu.
