# CURSOR_IMPLEMENTATION_RULES

## Objectivo

Garantir que o Cursor só implementa depois de existir plano claro e scope aprovado.

Cursor pode implementar código, mas nunca deve saltar directamente para alterações grandes sem primeiro explicar o plano.

---

## Regra principal

Antes de qualquer implementação, Cursor deve produzir um plano curto.

O plano deve dizer:

- objectivo;
- ficheiros prováveis;
- fora de scope;
- riscos;
- testes a executar.

Só depois de aprovação humana deve implementar.

---

## Permitido

- Ler código.
- Fazer análise técnica.
- Produzir plano.
- Produzir prompt de implementação.
- Implementar alterações aprovadas.
- Criar/alterar testes necessários.
- Executar testes relevantes.
- Produzir relatório final.

---

## Proibido sem aprovação explícita

- Refactor amplo.
- Alterar regras de jogo.
- Alterar gameplay.
- Alterar schemas/versionamento.
- Alterar UI fora do pedido.
- Mexer em ficheiros fora do scope.
- Fazer commits.
- Fazer push.
- Apagar ficheiros.
- Reorganizar pastas.
- Instalar packages.
- Alterar configuração global do projecto.

---

## Regra de scope

Cada implementação deve ser pequena e isolada.

Se durante a implementação surgir nova lacuna:

- não expandir automaticamente;
- documentar a lacuna;
- propor próximo passo separado.

---

## Regra de relatório final

No fim, Cursor deve reportar:

- ficheiros alterados;
- resumo do que mudou;
- testes executados;
- resultado dos testes;
- confirmação do que não foi alterado;
- próximos riscos ou pendências.

---

## Prompt base

```text
Antes de implementar, produz primeiro um plano curto.

Inclui:
1. objectivo
2. ficheiros prováveis
3. fora de scope
4. riscos
5. testes a executar

Não alteres ficheiros ainda.
Depois espero aprovação humana.

---

## Prompt de implementação aprovado

Plano aprovado.

Implementa exactamente o scope descrito.
Não expandas o scope.
Não faças refactor amplo.
Não alteres regras, gameplay, schemas ou UI fora do pedido.
Executa apenas os testes relevantes.
No fim, produz relatório curto com ficheiros alterados e testes executados.
