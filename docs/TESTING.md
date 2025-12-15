# 🧪 Guia de Testes

Este documento consolida todas as informações sobre testes do projeto SUECA.

---

## 📋 Testes da Fase 1 - Rotação Anti-horária

### Alterações Implementadas

#### ✅ Rotação Anti-horária (Counterclockwise)
- Todas as jogadas após a primeira vaza seguem rotação anti-horária
- Rotação: Player 0 → Player 1 → Player 2 → Player 3 → Player 0

#### ✅ Regra da Primeira Vaza
- **Jogador à direita do dealer começa** a primeira vaza
- **Dealer joga por último** na primeira vaza apenas
- Ordem na primeira vaza (se dealer = Player 0):
  - Player 1 → Player 2 → Player 3 → Player 0 (dealer)

#### ✅ Tracking do Dealer
- Dealer é rastreado em `gameState.dealerIndex`
- Dealer roda anti-horariamente a cada nova ronda

### Como Testar Rotação

1. **Iniciar o jogo**
   - O servidor deve estar a correr em `http://localhost:3000`
   - Verificar que o jogo inicia corretamente

2. **Verificar Primeira Vaza**
   - Observar que o jogador à direita do dealer (Player 1) começa
   - Verificar que o dealer (Player 0) joga por último na primeira vaza
   - Confirmar que a ordem é: Player 1 → Player 2 → Player 3 → Player 0

3. **Verificar Vazas Seguintes**
   - Após a primeira vaza, o vencedor da vaza anterior deve começar
   - Verificar que a rotação é anti-horária (para a direita)
   - Confirmar que todos os jogadores jogam na ordem correta

4. **Verificar Rotação do Dealer**
   - Após completar uma ronda (10 vazas), verificar que o dealer muda
   - Novo dealer deve ser o jogador à direita do dealer anterior
   - Primeira vaza da nova ronda deve começar com o jogador à direita do novo dealer

### Checklist de Rotação

- [ ] Primeira vaza começa com jogador à direita do dealer
- [ ] Dealer joga por último na primeira vaza
- [ ] Vazas seguintes seguem rotação anti-horária
- [ ] Vencedor da vaza anterior começa a próxima vaza
- [ ] Dealer roda corretamente entre rondas
- [ ] Não há erros no console do navegador

---

## 🧪 Testes de Funcionalidades

### Teste 1: Deck Cutting
**Objetivo**: Verificar que o corte está funcionando

**Passos**:
1. Iniciar um novo jogo
2. Observar a distribuição de cartas
3. Verificar que as cartas são diferentes a cada jogo (corte aleatório)

**Resultado Esperado**: 
- Cartas distribuídas corretamente (10 por jogador)
- Distribuição varia entre jogos (devido ao corte)

### Teste 2: AI Strategy - Liderando
**Objetivo**: Verificar que AI joga carta alta ao liderar

**Passos**:
1. Iniciar jogo
2. Aguardar que uma AI lidere uma vaza
3. Observar qual carta a AI joga

**Resultado Esperado**:
- AI joga uma das cartas mais altas da mão quando lidera

### Teste 3: AI Strategy - Seguindo Naipe
**Objetivo**: Verificar que AI joga estrategicamente ao seguir

**Passos**:
1. Jogar uma carta média (ex: 5 de copas)
2. Observar o que a AI joga quando tem cartas do mesmo naipe
3. Verificar se joga carta baixa vencedora ou mais baixa

**Resultado Esperado**:
- Se pode ganhar: joga carta mais baixa que ainda ganhe
- Se não pode ganhar: joga carta mais baixa

### Teste 4: AI Strategy - Trunfos
**Objetivo**: Verificar que AI guarda trunfos altos

**Passos**:
1. Observar quando AI tem trunfos
2. Verificar se guarda trunfos altos (A, 7, K)
3. Verificar se joga trunfos baixos quando apropriado

**Resultado Esperado**:
- AI não joga trunfos altos desnecessariamente
- AI joga trunfos baixos quando não tem naipe de saída
- AI joga trunfos altos apenas quando necessário para ganhar

### Teste 5: Jogo Completo
**Objetivo**: Verificar que o jogo funciona end-to-end

**Passos**:
1. Jogar uma partida completa
2. Verificar que não há erros
3. Verificar que a AI joga de forma mais inteligente que antes

**Resultado Esperado**:
- Jogo completa sem erros
- AI oferece mais desafio
- Pontuação e vazas funcionam corretamente

---

## 📱 Testes Mobile (SUECA 2.0)

### Checklist de Smoke Mobile

Para cada build que toque em UI, verificar:

- [ ] Abrir em 360×800 e 414×896: verificar mão do Sul, header/placar, trunfo, botões/menu
- [ ] Jogar 1 ronda completa: sem cortes/overlaps, botões utilizáveis
- [ ] Confirmar hit targets (toques ~48px) e ausência de scroll lateral indesejado
- [ ] Registar device/viewport/data/resultado (pass/fail)

### Testes Mínimos por Milestone

**M1 - Estabilidade Mobile/Android:**
- Smoke mobile (play 1 jogo completo)
- Verificar colisões/legibilidade
- Teste manual em devtools + 1 dispositivo real

**M2 - Polimento de UI:**
- Revisão visual rápida (contrast, estados de botão)
- Regressão básica de jogo

**M3 - Feedback & Telemetria:**
- Validar envio de feedback e captura de erros em 1 fluxo completo

---

## 📝 Notas Gerais

- O corte é aplicado automaticamente antes de cada distribuição
- A estratégia da AI é mais conservadora (guarda cartas altas)
- A AI agora tenta ganhar vazas quando possível
- Trunfos altos são guardados para situações importantes

## 🐛 Possíveis Problemas a Observar

1. **AI muito conservadora**: Se a AI guardar demais, pode perder vazas importantes
2. **Corte não visível**: O corte acontece automaticamente, não há feedback visual
3. **Performance**: Verificar se a estratégia não torna o jogo muito lento
4. **Layout mobile**: Verificar colisões e sobreposições em diferentes tamanhos de ecrã

## ✅ Próximos Passos de Testes

- Ajustar dificuldade da AI se necessário
- Adicionar tracking de cartas jogadas (para AI ainda mais inteligente)
- Considerar adicionar feedback visual do corte (opcional)
- Testes automatizados com pytest (IA Python)

