# 📋 TODO - Próxima Sessão

## 🎯 Objetivo
Finalizar alterações de UI para publicação Android e commit das mudanças pendentes.

---

## ✅ Alterações Já Feitas (não commitadas)

### Sistema de Traduções (i18n)
- ✅ `frontend/src/i18n/translations.ts` criado (PT/EN)
- ✅ `frontend/src/i18n/useLanguage.ts` criado (hook)
- ✅ Componentes atualizados para usar traduções:
  - GameBoard, GameMenu, StartMenu, LandingPage
  - RoundEndModal, GameStartModal, GameOverModal

### UI Improvements
- ✅ OXS/publisher removido (LandingPage, CreditsModal)
- ✅ Cores atualizadas para cobre (#d4a574)
- ✅ Copyright adicionado após agradecimentos
- ✅ Trunfo sem brilho (vermelho e preto)

---

## 📝 Ações Pendentes

### 1. Commit das Alterações de i18n
- [ ] Adicionar `frontend/src/i18n/translations.ts` ao git
- [ ] Commit de todos os componentes atualizados com traduções
- [ ] Verificar se há traduções faltando ou incorretas

### 2. Limpeza
- [ ] Adicionar `__pycache__` ao `.gitignore` (se não estiver)
- [ ] Decidir sobre ficheiros de teste (CSV, XLSX, DOCX) - adicionar ao gitignore ou remover

### 3. Testes
- [ ] Testar troca de idioma (PT ↔ EN) em todos os componentes
- [ ] Verificar se todas as strings estão traduzidas
- [ ] Testar build de produção

### 4. Deploy
- [ ] Fazer build final
- [ ] Deploy no Vercel
- [ ] Testar em produção

---

## 🔍 Verificações Rápidas

- [ ] Build compila sem erros
- [ ] Sem warnings de linter
- [ ] Todas as traduções funcionam
- [ ] UI em cobre está correta
- [ ] Copyright aparece corretamente

---

**Última atualização**: Dezembro 2025  
**Status**: Pendente - Commit de alterações i18n e finalização
