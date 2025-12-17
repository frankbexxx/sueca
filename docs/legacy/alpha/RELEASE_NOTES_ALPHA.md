# 🎉 Release Notes - Alpha v0.1.0-alpha

**Data de Release**: Dezembro 2025  
**Versão**: 0.1.0-alpha  
**Status**: ✅ Completa

---

## 🎮 O que é o Sueca Card Game?

Um jogo de cartas tradicional português implementado em React + TypeScript. Joga contra 3 oponentes AI em equipas de 2, seguindo as regras clássicas do Sueca.

---

## ✨ Features Principais

### 🎯 Jogo Completo
- **4 jogadores** (Tu + Parceiro vs 2 AI)
- **Lógica completa** seguindo regras tradicionais do Sueca
- **Dois métodos de distribuição** (A: Standard, B: Dealer First)
- **Sistema de pontuação** completo (pontos, jogos, pente)

### 🤖 AI Inteligente
- **Tracking de cartas** - AI sabe quais cartas já foram jogadas
- **Estratégia inteligente** - Decisões baseadas no estado do jogo
- **3 níveis de dificuldade** (Easy, Medium, Hard)
- **Fallback para serviço externo** (opcional)

### 🎨 Interface Moderna
- **Design responsivo** - Funciona em desktop e mobile
- **Dark mode** - Tema escuro opcional
- **Modais bem estruturados** - Round end, Game start, Game over
- **Feedback visual** - Cartas selecionadas, vazas visíveis, scores atualizados

### ⚙️ Controles
- **Pausar/Retomar** - Controla o jogo quando quiseres
- **Sair** - Sai do jogo com confirmação
- **Configurações** - Personaliza nomes, dificuldade AI, método de distribuição
- **Novo Jogo** - Reinicia facilmente

---

## 🔧 Melhorias Técnicas

- ✅ Código limpo e refatorado
- ✅ Componentes modulares (modais extraídos)
- ✅ Constantes centralizadas
- ✅ TypeScript sem `any` types
- ✅ CSS organizado e reutilizável
- ✅ Sem erros de linter

---

## 🐛 Bugs Corrigidos

- ✅ Trunfo não aparecia no Método A
- ✅ Utilizador não era sempre "You"
- ✅ Problemas de visibilidade do trunfo
- ✅ Cartas acumulando entre rondas
- ✅ Problemas de gestão de estado

---

## 📦 Deploy

**URL de Produção**: https://frontend-mu-five-18.vercel.app

O jogo está online e acessível para partilhar com amigos!

---

## 🚀 Próximos Passos (Beta)

A fase Beta focará em:
- 🧪 Testes (unitários, integração, E2E)
- 🐛 Correção de bugs (especialmente Android)
- ⚡ Performance (otimizações, code splitting)
- ♿ Acessibilidade (ARIA labels, navegação por teclado)
- 🎨 Melhorias de UX (animações, feedback visual)

Ver `docs/BETA_ROADMAP.md` para detalhes completos.

---

## 📚 Documentação

Toda a documentação está na pasta `docs/`:
- `PROJECT_STATUS.md` - Estado atual do projeto
- `BETA_ROADMAP.md` - Plano para a Beta
- `ALPHA_TO_BETA.md` - Guia de transição
- `CHANGELOG.md` - Histórico de mudanças

---

## 🙏 Agradecimentos

Obrigado por testares o Sueca Card Game! Feedback é sempre bem-vindo.

---

**Versão**: 0.1.0-alpha  
**Data**: Dezembro 2025  
**Status**: ✅ Alpha Completa - Beta em progresso
