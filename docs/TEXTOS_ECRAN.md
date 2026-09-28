# Lista de Textos Exibidos no Ecrã

Este documento lista todos os textos que são exibidos na interface do jogo, organizados por componente e com o nome da variável correspondente.

---

## 📍 Landing Page (Página Inicial)

### Componente: `LandingPage.tsx`
- **Variável:** `t.landing.title`
  - PT: `"SUECÃO"`
  - EN: `"SUECÃO"`

- **Variável:** `t.landing.subtitle`
  - PT: `"Um jogo de Sueca"`
  - EN: `"A Sueca Game"`

- **Variável:** `t.landing.description`
  - PT: `"Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA ou em modo cooperativo com amigos ao redor da mesa."`
  - EN: `"Digital version of the classic Portuguese card game, designed to play solo against AI or cooperatively with friends around the table."`

- **Variável:** `t.landing.metaPlayers`
  - PT: `"4 JOGADORES"`
  - EN: `"4 PLAYERS"`

- **Variável:** `t.landing.metaTeams`
  - PT: `"2 equipas"`
  - EN: `"2 teams"`

- **Variável:** `t.landing.metaCards`
  - PT: `"40 cartas"`
  - EN: `"40 cards"`

- **Variável:** `t.landing.metaGames`
  - PT: `"4 jogos"`
  - EN: `"4 games"`

- **Variável:** `t.landing.tapHint`
  - PT: `"toque ou clique para começar a jogar"`
  - EN: `"tap or click to start playing"`

- **Variável:** `t.landing.credits`
  - PT: `"Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João."`
  - EN: `"Thanks to Cursor, Buga, Tico, Maria Francisca and Maria João."`

- **Variável:** `t.landing.copyright`
  - PT: `"Suecão · 2026"`
  - EN: `"Suecão · 2026"`
  - Nota (REL-LEGAL-01C): runtime mantém esta linha curta; copyright titular Francisco Bexiga está em `LICENSE` / `NOTICE`. Branding in-app “Suecão by OXS” → `REL-OXS-01`.

---

## ⚙️ Start Menu (Menu Inicial)

### Componente: `StartMenu.tsx`
- **Variável:** `t.startMenu.title`
  - PT: `"🃏 Sueca"`
  - EN: `"🃏 Sueca"`

- **Variável:** `t.startMenu.playerNames`
  - PT: `"Nomes dos Jogadores:"`
  - EN: `"Player Names:"`

- **Variável:** `t.startMenu.playerPlaceholder(index)` (função)
  - PT: `"Player ${index + 1}${index === 0 ? ' *' : ''}"`
  - EN: `"Player ${index + 1}${index === 0 ? ' *' : ''}"`

- **Variável:** `t.startMenu.aiDifficulty`
  - PT: `"Dificuldade da IA:"`
  - EN: `"AI Difficulty:"`

- **Variável:** `t.startMenu.difficultyEasy`
  - PT: `"Fácil"`
  - EN: `"Easy"`

- **Variável:** `t.startMenu.difficultyMedium`
  - PT: `"Médio"`
  - EN: `"Medium"`

- **Variável:** `t.startMenu.difficultyHard`
  - PT: `"Difícil"`
  - EN: `"Hard"`

- **Variável:** `t.startMenu.difficultyDescEasy`
  - PT: `"AI joga mais aleatoriamente"`
  - EN: `"AI plays more randomly"`

- **Variável:** `t.startMenu.difficultyDescMedium`
  - PT: `"AI usa estratégia básica"`
  - EN: `"AI uses basic strategy"`

- **Variável:** `t.startMenu.difficultyDescHard`
  - PT: `"AI usa estratégia avançada com coordenação"`
  - EN: `"AI uses advanced strategy with coordination"`

- **Variável:** `t.startMenu.dealingMethod`
  - PT: `"Método de Distribuição:"`
  - EN: `"Dealing Method:"`

- **Variável:** `t.startMenu.methodA`
  - PT: `"Método A (Standard)"`
  - EN: `"Method A (Standard)"`

- **Variável:** `t.startMenu.methodB`
  - PT: `"Método B (Dealer First)"`
  - EN: `"Method B (Dealer First)"`

- **Variável:** `t.startMenu.startGame`
  - PT: `"Iniciar Jogo"`
  - EN: `"Start Game"`

- **Variável:** `t.startMenu.advancedSettings`
  - PT: `"Configurações Avançadas"`
  - EN: `"Advanced Settings"`

- **Variável:** `t.startMenu.darkMode`
  - PT: `"Modo Escuro"`
  - EN: `"Dark Mode"`

- **Variável:** `t.startMenu.errorPlayer1Required`
  - PT: `"Por favor, insira um nome para o Player 1"`
  - EN: `"Please enter a name for Player 1"`

- **Hardcoded (botões de idioma):**
  - `"PT"` (no botão)
  - `"EN"` (no botão)
  - `"Português"` (title do botão PT)
  - `"English"` (title do botão EN)

---

## 🎮 Game Board (Tabuleiro do Jogo)

### Componente: `GameBoard.tsx`
- **Variável:** `t.gameBoard.us`
  - PT: `"NÓS"`
  - EN: `"US"`

- **Variável:** `t.gameBoard.them`
  - PT: `"ELES"`
  - EN: `"THEM"`

- **Variável:** `t.gameBoard.points`
  - PT: `"Pontos:"`
  - EN: `"Points:"`

- **Variável:** `t.gameBoard.games`
  - PT: `"Jogos:"`
  - EN: `"Games:"`

- **Variável:** `t.gameBoard.game`
  - PT: `"Jogo"`
  - EN: `"Game"`

- **Variável:** `t.gameBoard.dealing`
  - PT: `"Dar Cartas"`
  - EN: `"Dealing:"`

- **Variável:** `t.gameBoard.continue`
  - PT: `"Continuar"`
  - EN: `"Continue"`

- **Variável:** `t.gameBoard.aiExternal`
  - PT: `"AI Externa (Render)"`
  - EN: `"External AI (Render)"`

- **Variável:** `t.gameBoard.aiLocal`
  - PT: `"AI Local (fallback)"`
  - EN: `"Local AI (fallback)"`

---

## 🎯 Game Menu (Menu do Jogo)

### Componente: `GameMenu.tsx`
- **Hardcoded:** `"🃏 Sueca"` (título do jogo no menu)

- **Variável:** `t.gameMenu.player`
  - PT: `"Jogador:"`
  - EN: `"Player:"`

- **Variável:** `t.gameMenu.settings`
  - PT: `"Configurações"`
  - EN: `"Settings"`

- **Variável:** `t.gameMenu.playerNames`
  - PT: `"Nome dos Jogadores:"`
  - EN: `"Player Names:"`

- **Variável:** `t.gameMenu.aiDifficulty`
  - PT: `"Dificuldade da AI:"`
  - EN: `"AI Difficulty:"`

- **Variável:** `t.gameMenu.dealingMethod`
  - PT: `"Método de Distribuição:"`
  - EN: `"Dealing Method:"`

- **Variável:** `t.gameMenu.showGrid`
  - PT: `"Mostrar grelha (debug)"`
  - EN: `"Show grid (debug)"`

- **Variável:** `t.gameMenu.darkMode`
  - PT: `"Modo Escuro"`
  - EN: `"Dark Mode"`

- **Variável:** `t.gameMenu.thanks`
  - PT: `"🙏 Agradecimentos"`
  - EN: `"🙏 Thanks"`

- **Variável:** `t.gameMenu.gameControls`
  - PT: `"Controles do Jogo:"`
  - EN: `"Game Controls:"`

- **Variável:** `t.gameMenu.pause`
  - PT: `"Pausar"`
  - EN: `"Pause"`

- **Variável:** `t.gameMenu.resume`
  - PT: `"Retomar"`
  - EN: `"Resume"`

- **Variável:** `t.gameMenu.quit`
  - PT: `"Sair"`
  - EN: `"Quit"`

- **Variável:** `t.gameMenu.newGame`
  - PT: `"Novo Jogo"`
  - EN: `"New Game"`

- **Variável:** `t.gameMenu.save`
  - PT: `"Guardar"`
  - EN: `"Save"`

- **Variável:** `t.gameMenu.cancel`
  - PT: `"Cancelar"`
  - EN: `"Cancel"`

- **Variável:** `t.gameMenu.gameOver`
  - PT: `"Jogo Terminado"`
  - EN: `"Game Over"`

- **Variável:** `t.gameMenu.quitConfirm`
  - PT: `"Tem certeza que deseja sair do jogo atual?"`
  - EN: `"Are you sure you want to quit the current game?"`

- **Variável:** `t.gameMenu.difficultyChangeNote`
  - PT: `"⚠️ Alterar dificuldade e método apenas no menu inicial"`
  - EN: `"⚠️ Change difficulty and method only in the initial menu"`

- **Variável:** `t.gameMenu.active`
  - PT: `"Ativo"`
  - EN: `"Active"`

- **Variável:** `t.gameMenu.inactive`
  - PT: `"Inativo"`
  - EN: `"Inactive"`

- **Hardcoded (placeholders):**
  - `"Player ${idx + 1}"` (nos inputs de nome de jogador)

---

## 🎊 Game Start Modal (Modal de Início do Jogo)

### Componente: `GameStartModal.tsx`
- **Variável:** `tReplace('modals.gameReady', { round })`
  - PT: `"Jogo {round} Pronto!"`
  - EN: `"Game {round} Ready!"`

- **Variável:** `t.modals.trumpSuit`
  - PT: `"Carta de Trunfo"`
  - EN: `"Trump Suit:"`

- **Variável:** `t.modals.trumpNote`
  - PT: `"Esta carta de trunfo permanecerá visível durante todo o jogo"`
  - EN: `"This trump suit will remain visible throughout the game"`

- **Variável:** `t.modals.dealer`
  - PT: `"Distribuidor"`
  - EN: `"Dealer:"`

- **Variável:** `t.modals.startGame`
  - PT: `"Iniciar Jogo"`
  - EN: `"Start Game"`

---

## 🏁 Round End Modal (Modal de Fim de Jogo)

### Componente: `RoundEndModal.tsx`
- **Variável:** `tReplace('modals.roundComplete', { round })`
  - PT: `"Jogo {round} Completo!"`
  - EN: `"Game {round} Complete!"`

- **Variável:** `t.modals.gamePoints`
  - PT: `"Pontos do Jogo:"`
  - EN: `"Game Points:"`

- **Variável:** `t.modals.games`
  - PT: `"Jogos:"`
  - EN: `"Games:"`

- **Variável:** `tReplace('modals.continueToGame', { nextRound })`
  - PT: `"Continuar para Jogo {nextRound}"`
  - EN: `"Continue to Game {nextRound}"`

---

## 🎉 Game Over Modal (Modal de Fim de Partida)

### Componente: `GameOverModal.tsx`
- **Variável:** `t.modals.gamesComplete`
  - PT: `"🎉 Jogos Completos! 🎉"`
  - EN: `"🎉 Games Complete! 🎉"`

- **Variável:** `t.modals.won`
  - PT: `"Venceu!"`
  - EN: `"Won!"`

- **Variável:** `t.modals.finalGames`
  - PT: `"Jogos Finais:"`
  - EN: `"Final Games:"`

- **Variável:** `t.modals.dealingMethodNext`
  - PT: `"Dealing Method for Next Game:"` ⚠️ **EM INGLÊS APENAS**
  - EN: `"Dealing Method for Next Game:"`

- **Variável:** `t.modals.newGame`
  - PT: `"Start New Game"` ⚠️ **EM INGLÊS APENAS**
  - EN: `"Start New Game"`

---

## 📝 Credits Modal (Modal de Créditos)

### Componente: `CreditsModal.tsx`
⚠️ **ATENÇÃO:** Este componente contém textos HARDCODED em português e não está usando o sistema de traduções!

- **Hardcoded:** `"SUECÃO"` (título)
- **Hardcoded:** `"capa / animação"` (placeholder de imagem)
- **Hardcoded:** `"jpg · png · gif"` (formato de imagem)
- **Hardcoded:** `"Um jogo de Sueca"` (subtítulo)
- **Hardcoded:** `"Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA ou em modo cooperativo com amigos ao redor da mesa."` (descrição)
- **Hardcoded:** `"4 JOGADORES"` (meta)
- **Hardcoded:** `"2 equipas"` (meta)
- **Hardcoded:** `"40 cartas"` (meta)
- **Hardcoded:** `"4 jogos"` (meta)
- **Hardcoded:** `"Agradecimentos"` (título da seção)
- **Hardcoded:** `"Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João."` (texto de agradecimento)
- **Hardcoded:** `"Suecão · 2026"` (copyright curto; titular em LICENSE/NOTICE)
- **Hardcoded:** `"Fechar"` (aria-label do botão de fechar)

---

## 📊 Pente Visualization (Visualização de Pontos)

### Componente: `PenteVisualization.tsx`
⚠️ **ATENÇÃO:** Este componente contém textos HARDCODED em português e não está usando o sistema de traduções!

- **Hardcoded:** `"Total de Vitórias:"` (título da seção)
- **Hardcoded:** `"{pentes.length} jogo{pentes.length > 1 ? 's' : ''} completo{pentes.length > 1 ? 's' : ''}"` (info de jogos completos)

---

## 🔍 Outros Textos Encontrados

### Componente: `GameBoard.tsx`
- **Hardcoded (alt text):** `"SUECÃO - Capa do Jogo"` (imagem)
- **Hardcoded (aria-label):** `"Nome do jogador ${index + 1}"` (nos inputs)

### Componente: `StartMenu.tsx`
- **Hardcoded (aria-label):** `"Nome do jogador ${index + 1}"` (nos inputs)

### Componente: `GameMenu.tsx`
- **Hardcoded (aria-label):** `"Nome do jogador ${idx + 1}"` (nos inputs)

---

## ⚠️ Problemas Identificados

1. **CreditsModal.tsx** - Todos os textos estão hardcoded em português
2. **PenteVisualization.tsx** - Textos hardcoded em português
3. **GameStartModal.tsx** - `trumpNote` está apenas em inglês
4. **GameOverModal.tsx** - `dealingMethodNext` e `newGame` estão apenas em inglês
5. **GameMenu.tsx** - Título "🃏 Sueca" está hardcoded
6. Alguns `aria-label` estão hardcoded em português

---

## ✅ Alterações Realizadas

### Correções Aplicadas (2025-01-XX):
1. ✅ `t.gameBoard.us` - PT: "US" → "NÓS"
2. ✅ `t.gameBoard.them` - PT: "THEM" → "ELES"  
3. ✅ `t.gameBoard.dealing` - PT: "Dealing:" → "Dar Cartas"
4. ✅ `t.modals.trumpSuit` - PT: "Trump Suit:" → "Naipe de Trunfo"
5. ✅ `t.modals.dealer` - PT: "Dealer:" → "Distribuidor"
6. ✅ Ajustado `GameStartModal.tsx` para adicionar ":" após os labels (mantido para EN, removido no PT)

### Observações sobre Tamanho de Texto:
- **"Dar Cartas"** (9 caracteres) - ✅ Deve caber bem na caixa `.round-block` (min-width: 110px)
- **"Naipe de Trunfo"** (14 caracteres) - ✅ Deve caber bem em modais
- **"Distribuidor"** (12 caracteres) - ✅ Deve caber bem em modais
- **"NÓS"** e **"ELES"** - ✅ Textos curtos, sem problemas

Se algum texto não couber na caixa durante os testes, considerar reduzir:
- "Naipe de Trunfo" → "Trunfo" (se necessário)
- "Dar Cartas" → "Dar:" (se necessário, mas improvável)

---

## ✅ Recomendações Pendentes

✅ **TODAS AS RECOMENDAÇÕES FORAM IMPLEMENTADAS!**

1. ✅ **CreditsModal.tsx** - Todos os textos movidos para `translations.ts` (seção `credits`)
2. ✅ **PenteVisualization.tsx** - Todos os textos movidos para `translations.ts` (seção `pente`)
3. ✅ **Traduções corrigidas:**
   - ✅ `modals.trumpNote` - PT: "Este naipe de trunfo permanecerá visível durante todo o jogo"
   - ✅ `modals.dealingMethodNext` - PT: "Método de Distribuição para o Próximo Jogo:"
   - ✅ `modals.newGame` - PT: "Novo Jogo"
4. ✅ **Traduções para aria-label** - Adicionadas em `aria.playerNameInput` e `aria.closeButton`
5. ✅ **Título do GameMenu** - Movido para `gameMenu.title`

### Novas Seções Adicionadas ao `translations.ts`:
- `credits` - Todas as strings do modal de créditos
- `pente` - Strings da visualização de pontos (com função para pluralização)
- `aria` - Labels de acessibilidade para inputs e botões

### Componentes Atualizados:
- ✅ `CreditsModal.tsx` - Agora usa `useLanguage()` e todas as traduções
- ✅ `PenteVisualization.tsx` - Agora usa `useLanguage()` e traduções
- ✅ `GameMenu.tsx` - Usa `t.gameMenu.title` e `t.aria.playerNameInput()`
- ✅ `StartMenu.tsx` - Usa `t.aria.playerNameInput()`

Todos os textos hardcoded foram removidos e o jogo está totalmente bilingue! 🎉

