# 🗺️ Roadmap do Projeto SUECA

Este documento consolida o planeamento e próximos passos do projeto.

---

## 🚀 SUECA 2.0 — Roadmap Curto

### Contexto
- V1 congelada em `v1.0` (hotfixes em `v1-maintenance`)
- V2 em desenvolvimento em `v2-main`
- Produção: `https://frontend-mu-five-18.vercel.app` (`vercel --prod` a partir de `frontend`)
- Problema nº1: UI desalinhada em Android/mobile

### Milestones

#### M0 — Kickoff ✅ (Concluído)
- Branches/tag criadas
- Deploy prod ativo

#### M1 — Estabilidade Mobile/Android (Prioridade Alta)
- Responsividade 360×800 e 414×896: mão do Sul sem corte/colisão
- Info (scores/dealer/trunfo) legível
- Tamanhos de toque ≥48px, espaçamentos fluidos (rem/%)
- Smoke-test manual em mobile (devtools + 1 dispositivo real)
- Checklist anexado a release

#### M2 — Polimento de UI + Design Tokens
- Paleta/tokens (cores, espaçamentos, raio) aplicados em botões, mesa, menu
- Estados claros de botões (ativo/desativado/hover/focus)
- Layout do menu/placar consistente em mobile e desktop

#### M3 — Feedback & Telemetria Leve
- Botão de feedback simples (mailto/form)
- Captura mínima de erros de UI (console/error boundary) sem PII
- Indicador de conectividade/reload leve se necessário

### Backlog (Posterior)
- Animações leves de cartas; sons
- Melhorias adicionais de AI; multiplayer
- Otimizações de performance e offline/reconnect

### Processo
- Board Kanban com WIP baixo (To Do / In Progress / Done)
- Branches curtas a partir de `v2-main`
- Preview com `vercel`
- Produção apenas via `vercel --prod` (a partir de `frontend`)

### Testes Mínimos por Milestone
- **M1**: Smoke mobile (play 1 jogo completo), verificar colisões/legibilidade
- **M2**: Revisão visual rápida (contrast, estados de botão), regressão básica de jogo
- **M3**: Validar envio de feedback e captura de erros em 1 fluxo completo

---

## 📋 Próximos Passos Detalhados

> **📖 Plano Detalhado de IA:** Ver `docs/AI_INTEGRATION_PLAN.md` para plano completo de integração, melhorias e machine learning da IA.

### Prioridade Alta ⭐⭐⭐

#### 1. IA Externa / Produção
- [ ] Definir `REACT_APP_AI_SERVICE_URL` no front (env) apontando para o endpoint Python (depois de deploy)
- [ ] Opcional: toggle "Usar IA externa" nas Configurações para fallback local fácil
- [ ] Ajustar CORS no serviço Python para a origem final
- [ ] Deploy do serviço Python (Render/Fly/Railway/Cloud Run)

#### 2. UI/UX Básica — Precisão e Colisões
- [ ] Ajustar posicionamento fino dos assentos (N/E/W) e mão do Sul
- [ ] Validar sobreposição (grid/boxes); evitar colisão mão/caixa de info
- [ ] Melhorar contraste/legibilidade de infos (nomes, scores)

#### 3. Interação Mão do Sul
- [ ] Hover/seleção estável, sem mover cartas
- [ ] Testar jogabilidade (cliques) e acessibilidade mínima (cursor/estado)

### Prioridade Média ⭐⭐

#### 4. Heurística IA (Próximos Incrementos)
- [ ] Proteções adicionais: evitar gastar K/Q se Ás do naipe não saiu (quando não ganha)
- [ ] Melhor escolha de descarte (descartar cartas mais fracas/baixas primeiro)
- [ ] Micro-simulações ou heurística de vaza (valor da vaza > custo da carta)

#### 5. Testes e Integração
- [ ] Manter pytest na IA; adicionar mais casos (sobre corte/overtrump com trunfo alto, descarte seguro)
- [ ] No front, opcional: permitir ver motivo da jogada (para debug) ou logar no console

#### 6. Painel Lateral Simples (Opcional)
- [ ] Mostrar nomes, equipa, dealer/current turn
- [ ] Espaço para mensagens/log (futuro)

### Prioridade Baixa ⭐

#### 7. Mobile Polish (se houver tempo)
- [ ] Afinar espaçamentos finais se necessário
- [ ] Pequenas animações de seleção/play

#### 8. Melhorias de GUI
- [ ] Posição das cartas ao serem jogadas (melhorar animação/posicionamento)
- [ ] **Hardcoding de Breakpoints Específicos** (Estratégia Futura)
  - Implementar ~20 breakpoints específicos para principais dispositivos do mercado
  - Estrutura híbrida: breakpoints específicos + media queries genéricas como fallback
  - Organização por categoria (phones pequenos, phones grandes, tablets, etc.)
  - Priorizar 5-10 dispositivos mais comuns inicialmente
  - Exemplos: iPhone SE (375px), iPhone 12/13/14 (390px), Samsung Galaxy S21 (412px), etc.
  - Benefícios: controle preciso de posicionamento, testes isolados, comportamento previsível

---

## 📝 Plano para Próxima Sessão

### Lembrete Inicial
- Perguntar: "Francisco, tinhas qualquer coisa para melhorar na GUI?"

### Tarefas Imediatas
1. **IA Externa / Produção**
   - Deploy do serviço Python
   - Configurar variável de ambiente no Vercel
   - Testar integração

2. **Heurística IA**
   - Implementar proteções adicionais
   - Melhorar escolha de descarte
   - Adicionar micro-simulações

3. **Testes**
   - Adicionar mais casos de teste pytest
   - Opcional: mostrar motivo da jogada no frontend

4. **Mobile Polish**
   - Afinar espaçamentos finais
   - Adicionar animações de seleção/play

5. **Deploys**
   - Serviço Python: escolher provider e fazer deploy
   - Front: validar em dispositivo após mudanças

---

## 🎯 Estado Atual

### ✅ Concluído
- Jogo funcional (4 jogadores, 2 equipas, regras implementadas)
- UI nova base: mesa verde, jogadores fora da mesa, mão visível só do Sul
- Trunfo sempre visível; botões Play/Next fixos
- Strip superior com scores/round/dealer
- Grid de debug opcional
- Deploy Vercel configurado
- Marcador de vez (ícone ⚡)
- Trunfo minimalista com cores (vermelho/preto)
- Cartas com versões "2" para figuras (J, Q, K)

### 🚧 Em Progresso
- Responsividade mobile
- Integração com IA Python externa

### 📋 Planeado
- Ver milestones acima

---

**Última atualização:** Dezembro 2025

