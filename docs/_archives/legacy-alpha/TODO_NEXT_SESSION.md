# 📋 TODO - Próxima Sessão: Limpeza e Refatoração

**Objetivo:** Limpar e refatorar o código para um commit limpo e profissional.

**Prioridade:** Alta (antes de commit/push)  
**Estimativa:** 2-3 horas

---

## 🧹 Limpeza de Código

### 1. Remover Código Morto e Não Utilizado
- [ ] Verificar se `PenteVisualization` ainda é necessário (agora que removemos a estrutura visual)
  - Se não for usado, remover componente e CSS
  - Se for usado apenas para texto simples, considerar renomear para `GamesVisualization`
- [ ] Verificar variáveis não utilizadas
- [ ] Remover imports não utilizados
- [ ] Remover funções/comentários obsoletos

### 2. Renomear Variáveis e Componentes (Opcional)
- [ ] Considerar renomear `PenteVisualization` → `GamesVisualization` (se mantido)
- [ ] Considerar renomear `completedPentes` → `completedGames` (variável interna)
- [ ] Verificar se há outras referências a "pente" em nomes de variáveis/comentários

### 3. Limpar Comentários
- [ ] Remover comentários obsoletos
- [ ] Atualizar comentários que mencionam "pente" para "jogos"
- [ ] Garantir que comentários estão atualizados e corretos
- [ ] Adicionar JSDoc onde falta documentação importante

---

## 🔧 Refatoração

### 4. Organizar GameBoard.tsx
- [ ] Verificar se o ficheiro está muito grande (>1000 linhas)
  - Se sim, considerar extrair lógica para hooks customizados
  - Extrair funções auxiliares para ficheiros separados
- [ ] Agrupar funções relacionadas
- [ ] Melhorar nomes de funções se necessário

### 5. Melhorar Estrutura de Componentes
- [ ] Verificar se há lógica duplicada entre componentes
- [ ] Extrair constantes mágicas para constantes nomeadas
- [ ] Verificar se há estilos inline que deveriam estar no CSS

### 6. TypeScript e Tipos
- [ ] Verificar se todos os tipos estão bem definidos
- [ ] Remover `any` types se existirem
- [ ] Adicionar tipos explícitos onde faltam
- [ ] Verificar interfaces e garantir que estão completas

---

## 🐛 Correções e Melhorias

### 7. Verificar Linter Errors
- [ ] Executar linter e corrigir todos os warnings/errors
- [ ] Verificar se há problemas de acessibilidade
- [ ] Verificar se há problemas de performance (re-renders desnecessários)

### 8. Consistência de Código
- [ ] Verificar consistência de formatação (espaços, tabs, etc.)
- [ ] Verificar consistência de nomes (camelCase, PascalCase, etc.)
- [ ] Verificar se todos os componentes seguem o mesmo padrão

### 9. Remover Debug Code
- [ ] Verificar se há `console.log` esquecidos
- [ ] Verificar se há `debugger` statements
- [ ] Verificar se há código de debug comentado

---

## 📝 Documentação

### 10. Atualizar Documentação
- [ ] Atualizar README.md se necessário
- [ ] Atualizar PROJECT_STATUS.md com mudanças recentes
- [ ] Verificar se todos os TODOs antigos estão atualizados
- [ ] Documentar mudanças importantes (de "Pente" para "Jogos")

---

## 🧪 Verificações Finais

### 11. Testes Manuais
- [ ] Testar fluxo completo do jogo
- [ ] Verificar se todas as funcionalidades ainda funcionam
- [ ] Testar em mobile (Android) se possível
- [ ] Verificar se não há regressões

### 12. Preparação para Commit
- [ ] Verificar git status (ver o que vai ser commitado)
- [ ] Organizar commits lógicos (se necessário, múltiplos commits)
- [ ] Escrever mensagem de commit descritiva
- [ ] Verificar se não há ficheiros temporários ou de debug

---

## 📋 Checklist de Limpeza Específica

### GameBoard.tsx
- [ ] ✅ `handlePlayCard` - JÁ REMOVIDO (função não usada)
- [ ] ⚠️ **REMOVER** variável `canPlay` na linha ~566 (não é mais usada após remover botão Play Card)
- [ ] ⚠️ **REMOVER** comentário obsoleto sobre "Play Card button" (linhas ~559-565)
- [ ] Verificar variável local `canPlay` na linha ~267 (usada em `handleCardClick` - OK, manter)
- [ ] Verificar se há código duplicado
- [ ] Verificar se estilos inline podem ser movidos para CSS
- [ ] Verificar se `PenteVisualization` ainda é necessário (agora é apenas texto simples)
- [ ] ⚠️ Remover `showSeparator` prop (não é usado após remover estrutura SVG do PenteVisualization)

### PenteVisualization.tsx
- [ ] Decidir se mantém ou remove (agora é apenas texto simples)
- [ ] Se mantém, considerar renomear para `GamesVisualization`
- [ ] Se remove, atualizar imports no GameBoard

### CSS Files
- [ ] Verificar se há classes CSS não utilizadas
- [ ] Verificar se há estilos duplicados
- [ ] Organizar CSS por seções lógicas

### Types/Interfaces
- [ ] Verificar se `completedPentes` deveria ser `completedGames` (interno)
- [ ] Verificar se todos os tipos estão corretos após mudanças

---

## 🎯 Prioridades

1. **Alta Prioridade:**
   - Remover código morto (funções não usadas)
   - Corrigir linter errors
   - Remover console.log/debugger
   - Atualizar comentários obsoletos

2. **Média Prioridade:**
   - Refatorar GameBoard.tsx se muito grande
   - Renomear componentes se necessário
   - Melhorar organização de código

3. **Baixa Prioridade:**
   - Renomear variáveis internas (completedPentes → completedGames)
   - Extrair hooks customizados
   - Melhorias de documentação

---

## 📝 Notas

- **Não quebrar funcionalidade:** Todas as refatorações devem manter a funcionalidade atual
- **Testar após cada mudança:** Garantir que nada quebrou
- **Commits pequenos:** Se possível, fazer commits incrementais por área
- **Mensagens de commit claras:** Descrever o que foi feito e porquê

---

**Última atualização:** Dezembro 2025  
**Status:** Pendente - Preparação para commit limpo
