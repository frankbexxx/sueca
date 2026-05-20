# 🃏 Sueca Card Game - Web Application

> **✅ VERSION 1.0 (tag: v1.0)** - Fully functional game with AI, menus, and online deployment ready. **V2 em progresso na branch `v2-main`.**

A web-based implementation of the traditional Portuguese card game Sueca, built with React and TypeScript. Play against AI opponents or share with friends online!

## 🎮 Features

- **4-player game** (2 teams of 2 players) - You + Partner vs 2 AI opponents
- **Full game logic implementation** following traditional Sueca rules
- **Intelligent AI** with card tracking and strategic gameplay
- **Modern React + TypeScript** frontend
- **Responsive design** that works on desktop and mobile
- **Game controls**: Pause, Resume, Quit, Settings
- **Player customization**: Set your name
- **Online deployment** ready - Share with friends via URL
- **Two dealing methods**: Standard (Method A) and Dealer First (Method B)

## 📋 Game Rules

- **Players**: 4 players divided into 2 teams
- **Deck**: 40 cards (standard deck without 8, 9, 10, or jokers)
- **Objective**: Score 61 points or more out of 120 total points
- **Card Hierarchy** (weakest to strongest): 2 < 3 < 4 < 5 < 6 < Q < J < K < 7 < A
- **Card Points**:
  - Q (Queen): 2 points
  - J (Jack): 3 points
  - K (King): 4 points
  - 7: 10 points
  - A (Ace): 11 points
  - Other cards: 0 points
- **Gameplay**: 
  - Dealer plays first
  - Must follow suit when possible
  - Trump suit beats all other suits
  - First team to 4 victories wins the game

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🏗️ Build for Production

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `build` folder.

## 📦 Deployment - Partilhar com Amigos

**Produção (V2)**  
- Branch: `v2-main`  
- URL: `https://frontend-mu-five-18.vercel.app`  
- Vercel **Root Directory**: `frontend`  
- Deploy: a partir da **raiz do repo** (`vercel --prod`), não de `frontend/frontend`

### 🌐 Opção 1: Deploy Online (RECOMENDADO)

**Vercel (Mais Fácil):**
```bash
npm install -g vercel
vercel login
cd ~/projects/sueca   # raiz do repo; Root Directory na Vercel = frontend
vercel              # preview
vercel --prod       # produção
```

**Netlify (Alternativa):**
```bash
cd frontend
npm run build
# Arrastar pasta 'build' para: https://app.netlify.com/drop
```

### 💾 Opção 2: Build Local

```bash
cd frontend
npm run build
# Comprimir pasta 'build' e enviar para amigo
# Amigo abre 'index.html' no navegador
```

**📖 Guia Completo:** Ver [docs/DEPLOY.md](docs/DEPLOY.md) e [docs/RELEASE_CHECK.md](docs/RELEASE_CHECK.md).

**💡 Dica:** Toda documentação está organizada na pasta `docs/`. Ver `docs/INDEX.md` para índice completo.

## 🌳 Branches e Releases
- `v1.0` (tag) — versão estável congelada (V1)
- `v1-maintenance` — hotfixes para V1, se necessário
- `v2-main` — desenvolvimento ativo do SUECA 2.0
- Deploy preview: `vercel` a partir da raiz do repo
- Deploy produção: `vercel --prod` (alias `frontend-mu-five-18.vercel.app`)

## 📁 Project Structure

```
SUECA/
├── README.md              # Este ficheiro (documentação principal)
├── docs/                  # Toda documentação detalhada
│   ├── PROJECT_STATUS.md  # Estado atual do projeto
│   ├── ROADMAP.md         # Roadmap e milestones
│   ├── DEPLOY.md          # Guia de deploy
│   └── ...                # Outros guias
├── frontend/              # Código fonte React/TypeScript
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameMenu.tsx
│   │   │   └── ...
│   │   ├── models/        # Lógica do jogo
│   │   │   ├── Game.ts
│   │   │   └── Deck.ts
│   │   └── types/        # TypeScript types
│   ├── public/           # Assets públicos
│   └── package.json
├── assets/               # Imagens das cartas
├── archive/             # Arquivos de referência
└── rules.txt            # Regras do jogo
```

## 🎯 How to Play

1. **Set your name** in Settings (optional)
2. **Start the game** - Teams are chosen automatically
3. **Select a card** from your hand by clicking on it
4. **Click "Play Selected Card"** to play
5. **AI players** automatically play their turns
6. **Win tricks** by playing the highest card or trump
7. **First team to 4 victories** wins the match!

### Controls
- **⏸️ Pause**: Pause the game anytime
- **🚪 Quit**: Exit current game (with confirmation)
- **⚙️ Settings**: Change your name and view options

## 🛠️ Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **CSS3** - Modern styling with animations
- **Create React App** - Build tooling
- **Vercel** - Deployment platform

## 📚 Documentation

Toda a documentação detalhada está organizada na pasta `docs/`:

### 🎯 Começar Aqui
- **`docs/INDEX.md`** - Índice completo com descrições
- **`docs/QUICKSTART.md`** - Início rápido (3 passos)
- **`docs/COMO_PARTILHAR.md`** - Como partilhar o jogo

### 📊 Estado e Planeamento
- **`docs/PROJECT_STATUS.md`** - Estado atual e histórico completo
- **`docs/ROADMAP.md`** - Roadmap e próximos passos

### 🌐 Deploy
- **`docs/DEPLOY.md`** - Guia completo de deploy
- **`docs/RELEASE_CHECK.md`** - Checklist pós-deploy

**Ver `docs/INDEX.md` para navegação completa.**

## 🚀 Current Status

✅ **Fully Functional** - Game is complete and playable
✅ **Deployed Online** - Accessible via URL
✅ **AI Implemented** - Intelligent opponents with card tracking
✅ **UI Complete** - Modern interface with menus and controls

## 📝 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Enjoy playing Sueca! 🎮**


