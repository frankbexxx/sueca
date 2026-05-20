# SUECA GAME - PROJECT STATUS & REFERENCE

## 📋 RESUMO DO PROJETO

Este é um projeto de implementação do jogo de cartas Sueca em React/TypeScript, seguindo as regras validadas por um jogador português experiente.

**Tecnologias:**
- Frontend: React + TypeScript
- Localização: `frontend/src/`
- Ficheiros principais: `Game.ts`, `GameBoard.tsx`, `Deck.ts`, `game.ts` (types)

## 🚩 Estado Atual (Dez 2025)
- ✅ **Alpha v0.1.0-alpha COMPLETA** - Tag: `v0.1.0-alpha` (documentos arquivados)
- 🚀 **Beta v0.1.0-beta ATIVA** - Foco em testes, estabilidade e melhorias de UX
- V1 congelada em **tag `v1.0`** (branch de hotfix: `v1-maintenance`)
- Desenvolvimento V2 ativo em **branch `v2-main`**
- Produção: `https://frontend-mu-five-18.vercel.app` (deploy com `vercel --prod` a partir da **raiz do repo**; Vercel Root Directory = `frontend`)
- Preview manual: `vercel` na raiz do repo (gera URL temporária)
- Checklist pós-deploy: `docs/RELEASE_CHECK.md`
- Problema conhecido: **UI desalinhada em Android** (prioridade alta na Beta)
- Assets de cartas: `frontend/public/assets/cards2/` (UI Sueca); `cards1/` mantém baralho 52 cartas para variantes futuras
- SUECÂO multi-jogos: Spades/Hearts/King em protótipo — escondidos do selector por defeito (ver `gameMetadata.ts`)
- Limpezas: `frontend/build` (artefacto), `vercel.json` na raiz (usar apenas `frontend/vercel.json`)
- Roadmap da Beta: ver `docs/BETA_ROADMAP.md`
- UI mobile: cabeçalho e painéis suavizados, Show Grid reduzido (debug), trunfo minimalista (título + mini-carta), botões Play/Next abaixo da mesa.

---

## ✅ FASE 1 - CONCLUÍDA: Rotação Anti-horária

### Implementado:
- ✅ Rotação counterclockwise (anti-horária) em todo o jogo
- ✅ Regra da primeira vaza: jogador à direita do dealer começa, dealer joga por último
- ✅ Tracking do dealer (`dealerIndex` no GameState)
- ✅ Rotação do dealer entre rondas (anti-horária)

### Ficheiros modificados:
- `frontend/src/types/game.ts` - Adicionado `dealerIndex`, `isFirstTrick`
- `frontend/src/models/Game.ts` - Lógica de rotação implementada

---

## ✅ FASE 2 - CONCLUÍDA: Setup do Jogo

### Implementado:
- ✅ Escolha de equipas: cada jogador tira uma carta, maior com menor, restantes formam segunda equipa
- ✅ Escolha do dealer inicial: menor carta vira dealer (com desempate recursivo)
- ✅ Sentar jogadores: parceiros frente a frente
  - **IMPORTANTE**: "You" sempre no índice 0, "Partner" sempre no índice 2
  - Ordem garantida: [You, AI1, Partner, AI2]

### Ficheiros modificados:
- `frontend/src/models/Game.ts` - Métodos `chooseTeams()`, `chooseDealer()`, `seatPlayers()`
- `frontend/src/components/GameBoard.tsx` - UI mostra equipas e dealer

---

## ✅ FASE 3 - CONCLUÍDA: Método B de Distribuição

### Implementado:
- ✅ Método A (padrão): distribuição anti-horária, última carta define trunfo
- ✅ Método B: dealer recebe primeira carta (trunfo), depois 9 mais, restantes no sentido horário
- ✅ Após distribuição, rotação volta ao normal (anti-horária)
- ✅ UI para escolher método ao iniciar novo jogo

### Detalhes técnicos:
- Método A: Guarda última carta distribuída (40ª carta) como trunfo
- Método B: Cria cópia da primeira carta do dealer para exibição (original fica na mão)

### Ficheiros modificados:
- `frontend/src/types/game.ts` - Adicionado `DealingMethod`, `dealingMethod` no GameState
- `frontend/src/models/Game.ts` - Método `dealCards()` com suporte a ambos métodos
- `frontend/src/components/GameBoard.tsx` - UI para escolher método

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. Utilizador sempre é "You"
- ✅ Lógica de sentar jogadores garantida: "You" sempre índice 0
- ✅ Verificação por nome, não apenas índice
- ✅ "Partner" sempre índice 2 (frente a frente)

### 2. Carta de Trunfo Visível
- ✅ Trunfo sempre visível no ecrã (fora do game-header)
- ✅ Exibição destacada com borda dourada/laranja
- ✅ Mostra carta completa quando disponível, ou pelo menos o naipe
- ✅ Posicionado entre header e área de jogadores

### 3. Pausas no Jogo
- ✅ Pausa apenas na primeira ronda (round 1) para mostrar trunfo
- ✅ Pausa no fim do jogo para escolher novo jogo
- ✅ Rondas seguintes começam automaticamente
- ✅ Estados: `waitingForRoundStart`, `waitingForGameStart`

### 4. Correção do Método A
- ✅ Problema: Após distribuir 40 cartas, não sobra carta no baralho
- ✅ Solução: Guardar última carta distribuída e criar cópia para exibição

---

## 📁 ESTRUTURA DO CÓDIGO

### Ficheiros Principais:

**Types (`frontend/src/types/game.ts`):**
- `Suit`: 'clubs' | 'diamonds' | 'hearts' | 'spades'
- `Rank`: '2' | '3' | '4' | '5' | '6' | 'Q' | 'J' | 'K' | '7' | 'A'
- `Card`, `Player`, `GameState`
- `DealingMethod`: 'A' | 'B'
- `CARD_HIERARCHY`, `CARD_POINTS`

**Game Logic (`frontend/src/models/Game.ts`):**
- `Game` class - lógica principal do jogo
- `chooseTeams()` - escolha de equipas
- `chooseDealer()` - escolha do dealer (com desempate)
- `seatPlayers()` - sentar jogadores (You sempre índice 0)
- `dealCards()` - distribuição (Método A ou B)
- `playCard()` - jogar carta
- `evaluateTrick()` - avaliar vaza
- `startNewRound()` - nova ronda

**UI (`frontend/src/components/GameBoard.tsx`):**
- Componente principal React
- Exibe trunfo sempre visível
- Pausas para primeira ronda e fim de jogo
- Auto-play para AIs

**Deck (`frontend/src/models/Deck.ts`):**
- Baralho de 40 cartas (4 naipes × 10 cartas)
- Métodos: `shuffle()`, `deal()`, `peekLast()`, `getRemaining()`

---

## 🎮 REGRAS IMPLEMENTADAS

### Rotação:
- ✅ Sempre anti-horária (counterclockwise) durante jogo
- ✅ Primeira vaza: jogador à direita do dealer começa, dealer joga por último
- ✅ Vazas seguintes: vencedor da vaza anterior começa

### Distribuição:
- ✅ Método A: Uma carta por vez, anti-horária, última carta = trunfo
- ✅ Método B: Dealer recebe primeira carta (trunfo), depois 9 mais, restantes horário

### Setup:
- ✅ Escolha de equipas: maior carta com menor
- ✅ Escolha de dealer: menor carta
- ✅ Sentar: parceiros frente a frente

### Pontuação:
- ✅ A = 11, 7 = 10, K = 4, J = 3, Q = 2, outros = 0
- ✅ Score > 60 = WIN (1 ponto)
- ✅ Score > 90 = 2× WIN
- ✅ Score = 120 = FULL SWEEP (4× WIN)
- ✅ Score = 60 = TIE (próximo jogo vale dobro)
- ✅ Pente: primeiro a 4 pontos ganha

---

## ✅ FASE 4 - CONCLUÍDA: Base da nova UI

### Implementado:
- ✅ Layout de mesa (verde) com jogadores fora da mesa: You (Sul), Partner (N), AI1 (E), AI2 (W)
- ✅ Mão visível só do Sul (cartas estáticas em linha, espaçamento fixo); demais mostram apenas stack/contador
- ✅ Trunfo sempre visível no topo-direito; botões Play/Next no canto inferior direito
- ✅ Área de trick central; strip superior com scores US/THEM e info de round/dealer
- ✅ Overlay opcional de grelha para debug/colisão
- ✅ Cartas não sofrem animações/transform dinâmico (apenas z-index/borda/sombra)

### Ficheiros modificados:
- `frontend/src/components/GameBoard.tsx`
- `frontend/src/components/GameBoard.css`

---

## ✅ FASE 5 - CONCLUÍDA: Deck Cutting e Melhorias de AI

### Implementado:
- ✅ **Deck Cutting**: Método `cut()` adicionado ao `Deck.ts`
  - Corte aleatório aplicado antes de distribuir cartas
  - Segue as regras do Sueca (corte após baralhar)
- ✅ **AI Strategy Melhorada**: Nova estratégia inteligente para AI
  - **Ao liderar**: Joga a carta mais alta para tentar ganhar a vaza
  - **Ao seguir naipe**: Joga a carta mais baixa que ainda ganhe (para poupar cartas altas)
  - **Sem naipe**: Joga trunfo baixo se possível, guarda trunfos altos (A, 7, K)
  - **Estratégia de trunfos**: Guarda trunfos altos para mais tarde, só joga se tiver muitos
  - **Fallback inteligente**: Se não pode ganhar, joga a carta mais baixa

### Ficheiros modificados:
- `frontend/src/models/Deck.ts` - Adicionado método `cut()`
- `frontend/src/models/Game.ts` - Adicionado método `chooseAICard()` e aplicado corte antes de distribuir
- `frontend/src/components/GameBoard.tsx` - Atualizado para usar nova estratégia de AI

### Testes:
- ✅ Deck cutting testado e funcionando corretamente
- ✅ AI strategy testada e oferecendo desafio adequado
- ✅ Jogo completo testado sem erros

---

## 🔄 PRÓXIMAS FASES (NÃO IMPLEMENTADAS)

### Fase 6: Melhorias Adicionais de AI
- ⏳ Tracking de cartas jogadas (para AI mais inteligente)
- ⏳ Coordenação com parceiro (sinais básicos)
- ⏳ Contagem de cartas (probabilidades)

### Fase 7: Procedimentos Pré-jogo (Opcional)
- ⏳ Baralhar pelo jogador à direita do dealer (visual)
- ⏳ Cortar pelo parceiro do baralhador (visual)
- ⏳ (Prioridade baixa - pode ser opcional)

### Melhorias Futuras:
- ⏳ Menu lateral (start, stop, pause, quit)
- ⏳ Animações de cartas
- ⏳ Sons
- ⏳ Melhorias de responsividade para mobile
- ⏳ Multiplayer online

---

## 🐛 PROBLEMAS CONHECIDOS / RESOLVIDOS

### ✅ RESOLVIDO: Trunfo não aparecia
- **Causa**: No Método A, tentava pegar última carta do baralho após distribuir todas
- **Solução**: Guardar última carta distribuída e criar cópia para exibição

### ✅ RESOLVIDO: Utilizador não era sempre "You"
- **Causa**: Lógica de sentar jogadores não garantia posição fixa
- **Solução**: Método `seatPlayers()` garante You no índice 0, Partner no índice 2

### ✅ RESOLVIDO: Trunfo não visível
- **Causa**: Estava dentro do game-header, podia ser escondido
- **Solução**: Movido para fora do header, sempre visível

### ✅ RESOLVIDO: Cartas acumulando entre rondas
- **Causa**: `startNewRound()` não limpava as mãos dos jogadores antes de distribuir novas cartas
- **Solução**: Adicionado código para limpar todas as mãos antes de distribuir cartas
- **Impacto**: Rondas agora terminam corretamente após todas as vazas serem jogadas

---

## 📝 NOTAS IMPORTANTES

1. **Utilizador sempre "You"**: O código garante que "You" está sempre no índice 0, independentemente das equipas escolhidas.

2. **Trunfo sempre visível**: A carta de trunfo é exibida entre o header e a área de jogadores, sempre visível durante o jogo.

3. **Pausas**: Apenas na primeira ronda há pausa para mostrar trunfo. Rondas seguintes começam automaticamente.

4. **Método B**: Quando dealer recebe primeira carta como trunfo, uma cópia é criada para exibição (original fica na mão do dealer).

5. **Rotação**: Tudo é anti-horário EXCETO distribuição no Método B (que é horária apenas durante distribuição).

---

## 🚀 COMO CONTINUAR

Se precisar de continuar o desenvolvimento:

1. **Ler este ficheiro** para entender o estado atual
2. **Ler `rules.txt`** para regras completas do jogo
3. **Ler ficheiros principais** (`Game.ts`, `GameBoard.tsx`) para código atual
4. **Implementar Fase 4** se necessário (procedimentos pré-jogo)

---

## 📚 REFERÊNCIAS

- `rules.txt` - Regras completas validadas
- `OTHER.py` - Pseudocódigo de referência (Python)
- `frontend/src/models/Game.ts` - Lógica principal
- `frontend/src/components/GameBoard.tsx` - Interface do utilizador

---

---

## ✅ FASE 6 - CONCLUÍDA: Tracking de Cartas e Melhorias de UI

### Implementado:
- ✅ **Tracking de Cartas Jogadas**: Sistema completo de rastreamento
  - Cartas jogadas são registadas em `playedCards` no GameState
  - Reset automático a cada nova ronda
  - Métodos auxiliares: `hasCardBeenPlayed()`, `getPlayedCardsCount()`, `getPlayedTrumpsCount()`
- ✅ **AI Strategy Melhorada com Tracking**:
  - AI usa cartas jogadas para tomar decisões mais inteligentes
  - Sabe quais cartas altas já saíram
  - Prefere cartas que provavelmente ganham
  - Lidera estrategicamente com naipes que tem muitas cartas
- ✅ **Sistema de Menu Completo**:
  - Componente `GameMenu` criado
  - Botões: Pausar/Retomar, Sair, Configurações
  - Painel de configurações expansível
  - Design responsivo e moderno
- ✅ **Nome do Jogador**:
  - Input para definir nome personalizado
  - Nome exibido no menu
  - Persiste durante o jogo
- ✅ **Funcionalidades de Controle**:
  - **Pause/Resume**: Pausa o jogo completamente
  - **Quit**: Sai do jogo atual (com confirmação)
  - **Novo Jogo**: Reinicia com novo jogo
- ✅ **UI Reorganizada**:
  - Menu no topo (área própria)
  - Mesa mantida intacta (sem alterações)
  - Header com scores (área própria)
  - Overlay de pause quando pausado
  - Layout responsivo

### Ficheiros modificados:
- `frontend/src/types/game.ts` - Adicionado `playedCards`, `isPaused`, `playerName`
- `frontend/src/models/Game.ts` - Tracking de cartas, métodos pause/resume, AI melhorada
- `frontend/src/components/GameBoard.tsx` - Integração com menu, pause, nome do jogador
- `frontend/src/components/GameMenu.tsx` - Novo componente de menu
- `frontend/src/components/GameMenu.css` - Estilos do menu

---

## ✅ FASE 7 - CONCLUÍDA: Deploy para Produção

### Implementado:
- ✅ **Deploy para Vercel**: Jogo online e acessível
- ✅ **Correções de Caminhos**: Imagens funcionam em produção
- ✅ **Configuração de Build**: Otimizada para produção
- ✅ **Tratamento de Erros**: Melhor handling para produção

### URL de Produção:
- `https://frontend-mu-five-18.vercel.app`

---

**Última atualização**: Dezembro 2025 - Alpha v0.1.0-alpha completa, Beta iniciada
**Estado**: ✅ **ALPHA COMPLETA** - Jogo completo, código limpo e refatorado, pronto para Beta

