# 📱 Guia de Teste para Dispositivos Móveis

## 🎯 Objetivo
Garantir que o jogo Sueca funcione corretamente em dispositivos móveis Android e iOS.

## 📐 Tamanhos de Ecrã a Testar

### Android (Prioridade Alta)
- **360×800** - Tamanho comum (Galaxy S10, Pixel 4, etc.)
- **414×896** - Tamanho comum (iPhone 11, etc.)
- **375×667** - iPhone SE, iPhone 8
- **390×844** - iPhone 12/13/14

### Tablets (Prioridade Média)
- **768×1024** - iPad (portrait)
- **1024×768** - iPad (landscape)

## ✅ Checklist de Testes

### 1. Layout e Espaçamento
- [ ] **Mesa de jogo** visível completa (sem corte)
- [ ] **Mão do jogador Sul** totalmente visível (sem cortes)
- [ ] **Cartas da mão** sem sobreposição excessiva
- [ ] **Espaçamentos** adequados entre elementos
- [ ] **Scrolling** não necessário durante o jogo normal

### 2. Legibilidade
- [ ] **Scores (US/THEM)** legíveis e visíveis
- [ ] **Nome do dealer** legível
- [ ] **Trunfo** claramente visível
- [ ] **Nomes dos jogadores** legíveis
- [ ] **Informação da ronda** legível
- [ ] **Tamanhos de fonte** adequados (mínimo 14px para texto principal)

### 3. Botões e Interação
- [ ] **Botões ≥48px** de altura/largura (acessibilidade)
- [ ] **Área de toque** suficiente (padding adequado)
- [ ] **Botões "Play" e "Next"** facilmente clicáveis
- [ ] **Menu (☰)** acessível e funcional
- [ ] **Cartas clicáveis** sem dificuldade
- [ ] **Feedback visual** ao tocar (hover/active states)

### 4. Performance
- [ ] **Carregamento inicial** < 3 segundos
- [ ] **Animações suaves** (60fps quando possível)
- [ ] **Sem lag** ao jogar cartas
- [ ] **Transições** fluidas entre estados

### 5. Funcionalidades
- [ ] **Jogo completo** jogável do início ao fim
- [ ] **Menu funciona** corretamente (Pausar, Sair, Configurações)
- [ ] **Troca de idioma** funciona
- [ ] **Modais** abrem e fecham corretamente
- [ ] **Modo escuro** funciona

### 6. Multiplayer Online (Sueca)
- [ ] **Criar sala** — código de 5 letras visível e partilhável
- [ ] **Entrar com código** — joiner vê lugares e estado “Pronto”
- [ ] **Entrar no Jogo** — desactivado até `status: playing` ou state publicado
- [ ] **Sync** — joiner vê deal; jogada remota aparece no host; trick fecha alinhado
- [ ] **Sair MP → Jogar solo** — mesa **sem** bots/nomes herdados (ver `docs/FIREBASE_MULTIPLAYER.md`)
- [ ] **Continuar offline** — sessão MP guardada **não** retoma como solo
- [ ] **Dois browsers** — host + 1 humano remoto + bots (smoke test)

Ver checklist completo em [`docs/FIREBASE_MULTIPLAYER.md`](FIREBASE_MULTIPLAYER.md).

## 🔍 Problemas Conhecidos a Verificar

### Críticos
1. **UI desalinhada em Android** - Verificar alinhamento de elementos
2. **Mão do Sul com corte** - Verificar se cartas são cortadas
3. **Info ilegível** - Verificar tamanhos de fonte em mobile

### Tamanhos Específicos
- **360×800**: Verificar se tudo cabe na altura disponível
- **414×896**: Verificar largura e espaçamentos

## 🛠️ Ferramentas de Teste

### Chrome DevTools
1. Abrir DevTools (F12)
2. Clicar no ícone de dispositivo (Ctrl+Shift+M)
3. Selecionar dispositivo ou definir dimensões customizadas
4. Testar em diferentes orientações (portrait/landscape)

### Dispositivos Reais (Recomendado)
- Testar em Android real (Chrome/Samsung Internet)
- Testar em iOS real (Safari)

### Serviços Online
- BrowserStack (teste remoto)
- LambdaTest (teste remoto)

## 📝 Como Reportar Problemas

Ao encontrar um problema, documentar:
1. **Dispositivo/Emulador**: Ex: "Galaxy S10, Android 12, Chrome 120"
2. **Dimensões**: Ex: "360×800px"
3. **Orientação**: Portrait ou Landscape
4. **Problema**: Descrição clara do que não funciona
5. **Screenshot**: Se possível
6. **Passos para reproduzir**: Como chegar ao problema

## 🎯 Próximos Passos Após Testes

1. Documentar todos os problemas encontrados
2. Priorizar problemas críticos
3. Corrigir problemas de layout/legibilidade
4. Ajustar tamanhos de toque se necessário
5. Retestar após correções

---

**Última atualização**: Janeiro 2025
**Status**: Em teste

