# 📋 TODO: Menu Inicial (StartMenu)

**Objetivo:** Implementar menu inicial que aparece ao carregar a app, ao sair do jogo e ao terminar uma ronda de 4 vitórias.

**Prioridade:** Alta  
**Complexidade:** Média  
**Estimativa:** 3-4 horas

---

## 🎯 Objetivos

1. Criar componente `StartMenu` que aparece antes do jogo começar
2. Permitir configurar 4 nomes de players (preparação para multiplayer)
3. Permitir escolher dificuldade da IA
4. Persistir configurações em localStorage
5. Mostrar menu ao terminar jogo e ao clicar "Sair"
6. Manter configurações limitadas durante o jogo

---

## 📝 Tarefas Detalhadas

### Fase 1: Criar Componente StartMenu ⭐⭐⭐

#### 1.1 Criar ficheiro `StartMenu.tsx`
- [ ] Criar `frontend/src/components/StartMenu.tsx`
- [ ] Criar interface `StartMenuProps` com:
  - `onStartGame: (config: GameConfig) => void`
  - `darkMode: boolean`
  - `onDarkModeChange: (darkMode: boolean) => void`
- [ ] Estado local para formulário:
  - `playerNames: string[]` (4 nomes)
  - `aiDifficulty: AIDifficulty`
  - `dealingMethod: DealingMethod`
- [ ] Carregar valores de localStorage como defaults
- [ ] Guardar valores em localStorage ao alterar

#### 1.2 Criar ficheiro `StartMenu.css`
- [ ] Estilo de overlay/modal (fundo semi-transparente)
- [ ] Card centralizado com:
  - Fundo branco/escuro (conforme dark mode)
  - Border radius
  - Box shadow
  - Padding adequado
- [ ] Título "🃏 Sueca" (grande, centralizado)
- [ ] Estilos para inputs de nomes
- [ ] Estilos para dropdown de dificuldade
- [ ] Botão "Iniciar Jogo" (grande, verde, destacado)
- [ ] Link "Configurações Avançadas"
- [ ] Animações de entrada/saída (fade in/out)
- [ ] Responsive design (mobile e desktop)

#### 1.3 Estrutura do Formulário
- [ ] Campo "Nome Player 1" (obrigatório, focado por padrão)
- [ ] Campo "Nome Player 2" (opcional, default "Player 2")
- [ ] Campo "Nome Player 3" (opcional, default "Player 3")
- [ ] Campo "Nome Player 4" (opcional, default "Player 4")
- [ ] Dropdown "Dificuldade da IA":
  - Opções: Fácil, Médio, Difícil
  - Descrição de cada nível
- [ ] Radio buttons ou dropdown "Método de Distribuição":
  - Opção A (Standard)
  - Opção B (Dealer First)
- [ ] Checkbox "Modo Escuro" (opcional, pode estar em "Configurações Avançadas")
- [ ] Botão "Iniciar Jogo" (grande, verde)
- [ ] Validação: pelo menos Player 1 deve ter nome

---

### Fase 2: Integração com GameBoard ⭐⭐⭐

#### 2.1 Modificar `GameBoard.tsx`
- [ ] Adicionar estado `showStartMenu: boolean` (inicial: `true`)
- [ ] Adicionar estado `gameStarted: boolean` (inicial: `false`)
- [ ] Modificar inicialização do `Game`:
  - Não criar `Game` no `useState` inicial
  - Criar apenas quando `showStartMenu = false` e `gameStarted = true`
- [ ] Criar função `handleStartGame(config: GameConfig)`:
  - Recebe configurações do StartMenu
  - Atualiza `playerNames`, `aiDifficulty`, `dealingMethod`
  - Cria novo `Game` com essas configurações
  - Define `showStartMenu = false`, `gameStarted = true`
  - Guarda configurações em localStorage
- [ ] Modificar `handleQuit`:
  - Define `showStartMenu = true`, `gameStarted = false`
  - Não destrói o jogo (pode manter para possível "Retomar")
- [ ] Modificar lógica de `isGameOver`:
  - Quando jogo termina, definir `showStartMenu = true`, `gameStarted = false`

#### 2.2 Renderização Condicional
- [ ] Se `showStartMenu = true`:
  - Renderizar `<StartMenu />`
  - Não renderizar mesa de jogo
- [ ] Se `showStartMenu = false`:
  - Renderizar `<GameBoard />` normalmente
  - Renderizar `<GameMenu />` normalmente

---

### Fase 3: Persistência de Dados ⭐⭐

#### 3.1 localStorage Keys
- [ ] `sueca-player-names`: `string[]` (array de 4 nomes)
- [ ] `sueca-ai-difficulty`: `'easy' | 'medium' | 'hard'`
- [ ] `sueca-dealing-method`: `'A' | 'B'`
- [ ] `sueca-dark-mode`: `'true' | 'false'` (já existe)

#### 3.2 Funções de Persistência
- [ ] Criar `utils/localStorage.ts` (opcional) ou funções inline:
  - `loadGameConfig(): GameConfig | null`
  - `saveGameConfig(config: GameConfig): void`
  - `loadPlayerNames(): string[]`
  - `savePlayerNames(names: string[]): void`
- [ ] Carregar valores no `StartMenu` ao montar
- [ ] Guardar valores sempre que alterados
- [ ] Valores padrão se localStorage vazio:
  - `['Player 1', 'Player 2', 'Player 3', 'Player 4']`
  - `'medium'`
  - `'A'`

---

### Fase 4: Modificar GameMenu (Configurações Limitadas) ⭐⭐

#### 4.1 Durante o Jogo
- [ ] Manter botão "Configurações" (⚙️) visível
- [ ] No painel de configurações:
  - **Permitir alterar:**
    - Nomes dos players (já funciona)
    - Modo escuro
    - Grelha de debug
  - **Não permitir alterar:**
    - Dificuldade da IA (desabilitado ou escondido)
    - Método de distribuição (desabilitado ou escondido)
- [ ] Adicionar mensagem: "Alterar dificuldade e método apenas no menu inicial"

#### 4.2 Botão "Sair"
- [ ] Modificar comportamento:
  - Ao clicar "Sair" → volta ao `StartMenu`
  - Define `showStartMenu = true`, `gameStarted = false`
  - Mantém configurações (não perde nomes, etc.)

---

### Fase 5: Animações e UX ⭐

#### 5.1 Transições
- [ ] Animação de fade in quando `StartMenu` aparece
- [ ] Animação de fade out quando `StartMenu` desaparece
- [ ] Transição suave entre menu e jogo
- [ ] Evitar "flash" de conteúdo durante transição

#### 5.2 Feedback Visual
- [ ] Botão "Iniciar Jogo" com hover effect
- [ ] Validação visual de campos obrigatórios
- [ ] Mensagem de erro se Player 1 vazio
- [ ] Loading state ao iniciar jogo (opcional)

---

## 🔧 Estrutura de Código

### Interface GameConfig
```typescript
interface GameConfig {
  playerNames: string[];
  aiDifficulty: AIDifficulty;
  dealingMethod: DealingMethod;
}
```

### StartMenu Component
```typescript
<StartMenu
  onStartGame={(config) => handleStartGame(config)}
  darkMode={darkMode}
  onDarkModeChange={setDarkMode}
/>
```

### GameBoard State
```typescript
const [showStartMenu, setShowStartMenu] = useState(true);
const [gameStarted, setGameStarted] = useState(false);
const [game, setGame] = useState<Game | null>(null);
```

---

## 📐 Design do StartMenu

### Layout Desktop
```
┌─────────────────────────────────────┐
│                                     │
│         🃏 Sueca                     │
│                                     │
│  Nome Player 1: [____________]      │
│  Nome Player 2: [____________]      │
│  Nome Player 3: [____________]      │
│  Nome Player 4: [____________]      │
│                                     │
│  Dificuldade: [Médio ▼]            │
│  Método: [A ○] [B ○]                │
│                                     │
│     [  Iniciar Jogo  ]              │
│                                     │
│  Configurações Avançadas            │
│                                     │
└─────────────────────────────────────┘
```

### Layout Mobile
- Mesma estrutura, mas:
  - Card mais estreito
  - Inputs full-width
  - Botão "Iniciar Jogo" full-width
  - Texto menor se necessário

---

## ✅ Critérios de Aceitação

- [ ] Menu aparece ao carregar app
- [ ] Menu aparece ao terminar jogo (4 vitórias)
- [ ] Menu aparece ao clicar "Sair" durante jogo
- [ ] 4 campos de nome funcionam e persistem
- [ ] Dificuldade da IA funciona e persiste
- [ ] Método de distribuição funciona e persiste
- [ ] Botão "Iniciar Jogo" cria jogo com configurações
- [ ] Configurações limitadas durante jogo (dificuldade/método não alteráveis)
- [ ] Animações suaves de transição
- [ ] Responsive design funciona em mobile e desktop
- [ ] Valores persistem entre sessões (localStorage)

---

## 🚨 Pontos de Atenção

1. **Estado do Game:**
   - Não criar `Game` no `useState` inicial
   - Criar apenas quando utilizador clica "Iniciar"
   - Gerir estado `null` vs `Game` instance

2. **Sincronização:**
   - Garantir que `gameState` é atualizado quando `game` é criado
   - Evitar erros quando `game` é `null`

3. **Persistência:**
   - Validar dados do localStorage antes de usar
   - Tratar casos de dados corrompidos ou ausentes
   - Valores padrão sensatos

4. **Transições:**
   - Evitar renderizar jogo e menu ao mesmo tempo
   - Usar CSS transitions para animações suaves
   - Testar em diferentes browsers

5. **Mobile:**
   - Garantir que menu é usável em ecrãs pequenos
   - Inputs devem ser fáceis de usar em touch
   - Botões com tamanho adequado (≥48px)

---

## 📝 Notas de Implementação

### Ordem Sugerida:
1. Criar `StartMenu.tsx` e `StartMenu.css` (estrutura básica)
2. Implementar formulário e validação
3. Adicionar persistência (localStorage)
4. Integrar com `GameBoard.tsx` (estados e lógica)
5. Modificar `GameMenu.tsx` (configurações limitadas)
6. Adicionar animações e polish
7. Testar todos os fluxos

### Dependências:
- `localStorage` API (já disponível)
- Estados React (`useState`, `useEffect`)
- TypeScript interfaces

### Ficheiros a Criar/Modificar:
- ✅ Criar: `frontend/src/components/StartMenu.tsx`
- ✅ Criar: `frontend/src/components/StartMenu.css`
- ✅ Modificar: `frontend/src/components/GameBoard.tsx`
- ✅ Modificar: `frontend/src/components/GameMenu.tsx`
- ⚠️ Opcional: `frontend/src/utils/localStorage.ts`

---

## 🎨 Exemplo de Código

### StartMenu.tsx (Estrutura Base)
```typescript
export const StartMenu: React.FC<StartMenuProps> = ({
  onStartGame,
  darkMode,
  onDarkModeChange
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('sueca-player-names');
    return saved ? JSON.parse(saved) : ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  });
  
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>(() => {
    return (localStorage.getItem('sueca-ai-difficulty') as AIDifficulty) || 'medium';
  });
  
  const handleStart = () => {
    if (!playerNames[0]?.trim()) {
      alert('Por favor, insira um nome para o Player 1');
      return;
    }
    
    const config: GameConfig = {
      playerNames: playerNames.map(n => n.trim() || `Player ${index + 1}`),
      aiDifficulty,
      dealingMethod: 'A' // ou do state
    };
    
    // Guardar em localStorage
    localStorage.setItem('sueca-player-names', JSON.stringify(playerNames));
    localStorage.setItem('sueca-ai-difficulty', aiDifficulty);
    
    onStartGame(config);
  };
  
  return (
    <div className="start-menu-overlay">
      <div className="start-menu-card">
        {/* Formulário aqui */}
      </div>
    </div>
  );
};
```

---

**Última atualização:** Dezembro 2025  
**Status:** Pendente  
**Próximo passo:** Criar componente StartMenu.tsx

