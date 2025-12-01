# Sueca Card Game - Web Application

> **⚠️ ALPHA VERSION** - This is the initial release and starting point for future development. Features and gameplay may change in future versions.

A web-based implementation of the traditional Portuguese card game Sueca, built with React and TypeScript.

## 🎮 Features

- **4-player game** (2 teams of 2 players)
- **Full game logic implementation** following traditional Sueca rules
- **Modern React + TypeScript** frontend
- **Responsive design** that works on desktop and mobile
- **Card images support** using existing card assets
- **AI opponents** for single-player experience

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

## 📦 Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

### Netlify

1. Build the project:
```bash
cd frontend
npm run build
```

2. Drag and drop the `build` folder to [Netlify Drop](https://app.netlify.com/drop)

### GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
"homepage": "https://yourusername.github.io/sueca",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. Deploy:
```bash
npm run deploy
```

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── GameBoard.tsx
│   │   └── GameBoard.css
│   ├── models/
│   │   ├── Deck.ts
│   │   └── Game.ts
│   ├── types/
│   │   └── game.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── package.json
└── tsconfig.json
```

## 🎯 How to Play

1. You are Player 1 (Team 1) with your Partner (Player 3)
2. Click on a card from your hand to select it
3. Click "Play Selected Card" to play it
4. AI players will automatically play their cards
5. The game continues until one team reaches 4 victories

## 🛠️ Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **CSS3** - Styling with modern features
- **Create React App** - Build tooling

## 📝 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!


