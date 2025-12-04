# SUECA GAME - PROJECT STATUS & REFERENCE

## 📋 RESUMO DO PROJETO

Este é um projeto de implementação do jogo de cartas Sueca em React/TypeScript, seguindo as regras validadas por um jogador português experiente.

**Tecnologias:**
- Frontend: React + TypeScript
- Localização: `frontend/src/`
- Ficheiros principais: `Game.ts`, `GameBoard.tsx`, `Deck.ts`, `game.ts` (types)

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

## ✅ FASE 4 - CONCLUÍDA: Redesign da Interface do Jogo

### Implementado:
- ✅ Layout de mesa fixo: jogador humano sempre no Sul (South)
- ✅ Nomeação de equipas: "US vs THEM" (US = equipa com "You")
- ✅ Posições fixas: You (South), Partner (North), AI 1 (East), AI 2 (West)
- ✅ Cartas em leque compacto (fan style) para todos os jogadores
- ✅ Orientação das cartas baseada na posição do jogador:
  - South: cartas viradas para sul (normal)
  - North: cartas viradas para norte (180°)
  - East: cartas viradas para este (90°)
  - West: cartas viradas para oeste (-90°)
- ✅ Indicador de dealer sem mover posições dos jogadores
- ✅ Sistema de hover melhorado: cartas não se movem, apenas mudam z-index
- ✅ Área de trick centralizada na mesa
- ✅ Visual de mesa circular com superfície verde

### Ficheiros modificados:
- `frontend/src/components/GameBoard.tsx` - Redesign completo do layout
- `frontend/src/components/GameBoard.css` - Estilos de mesa e cartas
- `frontend/src/models/Game.ts` - Garantir You e Partner sempre na equipa US

---

## 🔄 PRÓXIMAS FASES (NÃO IMPLEMENTADAS)

### Fase 5: Procedimentos Pré-jogo
- ⏳ Baralhar pelo jogador à direita do dealer
- ⏳ Cortar pelo parceiro do baralhador
- ⏳ (Prioridade baixa - pode ser opcional)

### Melhorias Futuras:
- ⏳ Menu lateral (start, stop, pause, quit)
- ⏳ Animações de cartas
- ⏳ Sons
- ⏳ Melhorias de responsividade para mobile

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

**Última atualização**: Após implementação das Fases 1, 2, 3, 4 e correções de bugs.
**Estado**: Funcional com interface melhorada, pronto para testar e continuar desenvolvimento.

