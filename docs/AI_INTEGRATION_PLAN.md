# 🤖 Plano de Integração e Melhorias da IA - Próxima Sessão

**Data:** Próxima sessão de desenvolvimento  
**Objetivo:** Integrar IA externa em produção, melhorar heurísticas e explorar machine learning

---

## 📋 Estado Atual

### ✅ O que já existe:
- **Serviço FastAPI** (`sueca-ai/`) com endpoint `/play`
- **Heurística básica** implementada (`engine/heuristics.py`)
- **Cliente frontend** (`frontend/src/services/aiClient.ts`)
- **Integração parcial** no `GameBoard.tsx` (fallback para IA local)
- **Testes básicos** (`tests/test_heuristics_cases.py`)

### 🔍 Funcionalidades atuais da heurística:
- Seguir naipe quando possível
- Tentar ganhar com carta mais baixa possível
- Evitar gastar 7 se Ás do naipe não saiu
- Cortar com trunfo baixo quando necessário
- Descartar cartas baixas quando não pode ganhar

---

## 🎯 Tarefas para Próxima Sessão

### 1. Deploy e Integração em Produção ⭐⭐⭐ (Prioridade Alta)

#### 1.1 Deploy do Serviço Python
- [ ] Escolher plataforma (Render/Fly.io/Railway/Cloud Run)
- [ ] Configurar variáveis de ambiente
- [ ] Fazer deploy do serviço FastAPI
- [ ] Testar endpoint `/health` e `/play` em produção
- [ ] Configurar CORS para origem do Vercel (produção)

#### 1.2 Configuração no Frontend
- [ ] Adicionar `REACT_APP_AI_SERVICE_URL` no Vercel (variável de ambiente)
- [ ] Testar integração com serviço em produção
- [ ] Implementar toggle "Usar IA externa" nas Configurações (opcional)
- [ ] Adicionar indicador visual quando IA externa está ativa
- [ ] Implementar timeout e retry logic no cliente

#### 1.3 Validação e Testes
- [ ] Testar jogo completo com IA externa
- [ ] Verificar fallback para IA local se serviço indisponível
- [ ] Testar em diferentes cenários (início, meio, fim de jogo)

---

### 2. Melhorias de Heurística ⭐⭐ (Prioridade Média)

#### 2.1 Proteções Adicionais
- [ ] **Evitar gastar K/Q se Ás não saiu** (quando não ganha garantidamente)
  - Implementar tracking de cartas altas por naipe
  - Só jogar K/Q se Ás já saiu ou se ganha o trick
  
- [ ] **Melhor escolha de descarte**
  - Priorizar descartar cartas mais fracas primeiro
  - Evitar descartar cartas que podem ser úteis mais tarde
  - Considerar valor das cartas (pontos) ao descartar

#### 2.2 Estratégia de Vazas
- [ ] **Micro-simulações de vazas**
  - Avaliar valor da vaza vs custo da carta
  - Decidir se vale a pena gastar carta alta para ganhar
  - Considerar cartas restantes na mão

- [ ] **Conservação de trunfo**
  - Guardar trunfo alto para vazas importantes
  - Usar trunfo baixo para cortar quando necessário
  - Evitar gastar todo o trunfo cedo

#### 2.3 Tracking de Cartas
- [ ] **Melhor tracking de cartas jogadas**
  - Manter histórico completo de todas as cartas jogadas
  - Calcular probabilidades de cartas restantes
  - Usar informação para decisões melhores

#### 2.4 Seguir Naipe Inteligente
- [ ] **Sempre seguir naipe quando possível** (regra básica)
- [ ] **Escolher melhor carta do naipe**
  - Se pode ganhar: jogar carta mais baixa que ganha
  - Se não pode ganhar: jogar carta mais baixa (descartar)
  - Considerar se parceiro pode ganhar

---

### 3. Machine Learning e Aprendizado ⭐ (Prioridade Baixa - Exploratório)

#### 3.1 Coleta de Dados
- [ ] **Sistema de logging de jogadas**
  - Logar todas as decisões da IA (carta escolhida, razão, contexto)
  - Logar resultado do trick (quem ganhou, pontos)
  - Logar resultado final do jogo (quem ganhou, pontuação)

- [ ] **Estrutura de dados para ML**
  - Definir features relevantes (mão, trick, histórico, trunfo)
  - Criar dataset estruturado
  - Armazenar em formato adequado (JSON, CSV, ou banco de dados)

#### 3.2 Modelo de Aprendizado (Futuro)
- [ ] **Análise de padrões**
  - Identificar jogadas que resultam em vitórias
  - Analisar erros comuns da heurística atual
  - Criar métricas de performance

- [ ] **Modelo de reforço (Reinforcement Learning)**
  - Definir recompensas (ganhar trick = +1, perder = -1, ganhar jogo = +10)
  - Treinar modelo com histórico de jogos
  - Comparar performance vs heurística

- [ ] **Modelo supervisionado (Supervised Learning)**
  - Treinar com jogos de jogadores experientes
  - Aprender padrões de jogadas vencedoras
  - Validar com testes

#### 3.3 Integração de ML (Futuro)
- [ ] **API para modelo treinado**
  - Endpoint `/play-ml` que usa modelo treinado
  - Fallback para heurística se modelo não disponível
  - Comparação A/B entre heurística e ML

---

### 4. Melhorias Técnicas ⭐⭐

#### 4.1 Performance
- [ ] **Cache de decisões**
  - Cache de jogadas legais
  - Cache de cálculos de heurística
  - Reduzir tempo de resposta

- [ ] **Otimização de código**
  - Profiling do código Python
  - Otimizar funções mais lentas
  - Melhorar estrutura de dados

#### 4.2 Debugging e Observabilidade
- [ ] **Logging estruturado**
  - Logs detalhados de decisões
  - Métricas de performance
  - Erros e exceções

- [ ] **Endpoint de debug**
  - `/play-debug` que retorna razão detalhada
  - Mostrar todas as opções consideradas
  - Explicar decisão final

#### 4.3 Testes
- [ ] **Expandir testes unitários**
  - Mais casos de teste para heurística
  - Testes de edge cases
  - Testes de integração

- [ ] **Testes de performance**
  - Medir tempo de resposta
  - Testar com diferentes tamanhos de estado
  - Validar escalabilidade

---

## 📊 Estrutura de Dados para ML (Futuro)

### Features para Modelo:
```python
{
  "hand": ["AS", "KD", "5C", ...],  # 10 cartas
  "trick": ["2S", "3S"],             # Cartas no trick atual
  "trump": "S",                      # Naipe trunfo
  "played": ["AS", "KD", ...],       # Cartas já jogadas
  "history": [[...], [...]],         # Tricks anteriores
  "round_score": {"team1": 45, "team2": 30},  # Pontuação atual
  "trick_number": 3,                 # Número do trick (1-10)
  "position": "lead" | "follow",     # Posição no trick
  "team": 1 | 2,                     # Equipa do jogador
}
```

### Labels (Supervised Learning):
```python
{
  "best_play": "AS",                 # Carta ideal (de jogador experiente)
  "trick_won": True,                 # Se ganhou o trick
  "round_won": True,                 # Se ganhou a ronda
  "game_won": True                   # Se ganhou o jogo
}
```

---

## 🔄 Fluxo de Trabalho Sugerido

### Fase 1: Deploy e Integração (2-3 horas)
1. Deploy do serviço Python
2. Configuração no Vercel
3. Testes básicos de integração
4. Validação em produção

### Fase 2: Melhorias de Heurística (3-4 horas)
1. Implementar proteções adicionais
2. Melhorar estratégia de vazas
3. Expandir tracking de cartas
4. Testes e validação

### Fase 3: Preparação para ML (1-2 horas)
1. Sistema de logging
2. Estrutura de dados
3. Coleta inicial de dados
4. Análise preliminar

---

## 📝 Notas Importantes

### Decisões Técnicas:
- **Plataforma de Deploy:** Avaliar custo vs performance (Render tem tier gratuito)
- **Formato de Dados:** JSON para simplicidade inicial
- **ML Framework:** Começar com scikit-learn, evoluir para TensorFlow/PyTorch se necessário

### Prioridades:
1. **Primeiro:** Deploy e integração funcionando
2. **Segundo:** Melhorias de heurística (impacto imediato)
3. **Terceiro:** Preparação para ML (investimento futuro)

### Métricas de Sucesso:
- IA externa funcionando em produção
- Heurística melhorada (mais vitórias, menos erros)
- Sistema de logging ativo
- Base de dados de jogadas iniciada

---

## 🚀 Próximos Passos Imediatos

1. **Começar com deploy** - escolher plataforma e fazer deploy
2. **Testar integração** - validar que tudo funciona
3. **Melhorar heurística** - implementar proteções mais inteligentes
4. **Preparar logging** - sistema básico para coletar dados

---

**Última atualização:** Dezembro 2025

