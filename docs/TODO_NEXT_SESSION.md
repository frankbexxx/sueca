# 📋 TODO - Próxima Sessão

## 🎯 Prioridade 1: Disposição das Cartas no Android

### ✅ Status: RESOLVIDO E TESTADO
**Opção A implementada e funcionando**: Detecção de mobile no JavaScript com inversão de posições. Testado com sucesso no Android.

### Problema Identificado
No Android, as cartas jogadas aparecem em posições invertidas:
- **Sul joga** → carta aparece na frente do **Norte** (deveria ser Sul)
- **Este joga** → carta aparece na frente de **Oeste** (deveria ser Este)  
- **Norte joga** → carta aparece na frente do **Sul** (deveria ser Norte)
- **Oeste joga** → carta aparece na frente do **Este** (deveria ser Oeste)

### Tentativas Anteriores
- ❌ CSS media query com inversão simples (não funcionou)
- ❌ Inversão Norte↔Sul, Este↔Oeste (não funcionou completamente)
- ✅ **JavaScript com detecção de mobile** (implementado e testado com sucesso)

### Abordagens a Testar

#### Opção A: Detectar Mobile e Inverter no JavaScript
- Modificar `getTablePosition()` para detectar mobile
- Retornar posição invertida quando em mobile
- **Vantagem**: Controle total, fácil de ajustar
- **Desvantagem**: Precisa detectar mobile corretamente

#### Opção B: CSS com Detecção de Orientação
- Usar `@media (orientation: portrait)` ou `landscape`
- Aplicar inversão apenas na orientação problemática
- **Vantagem**: CSS puro, sem JavaScript
- **Desvantagem**: Pode não ser orientação o problema

#### Opção C: Mapeamento Específico por Viewport
- Detectar largura/altura específica do Android
- Criar mapeamento customizado para essas dimensões
- **Vantagem**: Muito específico
- **Desvantagem**: Pode não funcionar em todos os dispositivos

#### Opção D: Repensar Layout Completamente
- Mudar a forma como as cartas são posicionadas
- Usar flexbox/grid com ordem diferente no mobile
- **Vantagem**: Solução mais robusta
- **Desvantagem**: Mudança maior

### Plano de Ação
1. ✅ Verificar se o problema é orientação (portrait vs landscape)
2. ✅ Testar detecção de mobile no JavaScript
3. ✅ Implementar solução escolhida (Opção A)
4. ✅ **Testar em dispositivo Android real** (TESTADO E FUNCIONANDO)
5. ✅ Solução validada - não é necessário rollback

### Código Modificado
- ✅ `frontend/src/components/GameBoard.tsx` - função `getTablePosition()` modificada
  - Adicionada função `isMobileDevice()` para detectar dispositivos móveis
  - Implementada inversão de posições (South↔North, East↔West) quando em mobile
  - Detecção baseada em User Agent e largura de tela (≤768px)

---

## 📝 Tudo o Resto

### GUI - Melhorias Pendentes
- [ ] Posição das cartas ao serem jogadas (melhorar animação/posicionamento)
- [ ] Outras melhorias de GUI mencionadas anteriormente

### IA Externa / Produção
- [ ] Deploy do serviço Python (Render/Fly/Railway/Cloud Run)
- [ ] Configurar `REACT_APP_AI_SERVICE_URL` no Vercel
- [ ] Ajustar CORS no serviço Python para origem final
- [ ] Opcional: toggle "Usar IA externa" nas Configurações

### Heurística IA
- [ ] Proteções adicionais: evitar gastar K/Q se Ás do naipe não saiu
- [ ] Melhor escolha de descarte (descartar cartas mais fracas primeiro)
- [ ] Micro-simulações ou heurística de vaza

### Testes
- [ ] Adicionar mais casos de teste pytest (corte/overtrump, descarte seguro)
- [ ] Opcional: permitir ver motivo da jogada no frontend (debug)

### Mobile Polish
- [ ] Afinar espaçamentos finais
- [ ] Pequenas animações de seleção/play

### Deploys
- [ ] Serviço Python: escolher provider e fazer deploy
- [ ] Front: validar em dispositivo após mudanças

---

## 🔍 Notas para Investigação

### Sobre o Problema das Cartas no Android
- Verificar se o problema ocorre em todos os navegadores Android (Chrome, Firefox, etc.)
- Verificar se ocorre apenas em portrait ou também em landscape
- Verificar dimensões exatas do viewport quando o problema ocorre
- Considerar se há alguma transformação CSS global afetando o container

### Informações Úteis
- Screenshot do problema: `image/README/1765573360568.png`
- Comportamento observado: Oeste não muda, Este sobrepõe Oeste, Norte↔Sul trocados

---

**Última atualização:** Dezembro 2025

