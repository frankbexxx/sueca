# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Copy Assets
Copy the card images to the public folder so they're accessible:

**Windows:**
```powershell
xcopy /E /I assets frontend\public\assets
```

**Mac/Linux:**
```bash
cp -r assets frontend/public/
```

### Step 2: Install Dependencies
```bash
cd frontend
npm install
```

### Step 3: Run the Game
```bash
npm start
```

The game will open automatically in your browser at `http://localhost:3000`

## 🎮 How to Play

1. You are **Player 1** (Team 1) - you play with **Partner** (Player 3)
2. **AI 1** and **AI 2** are on Team 2
3. Click on a card from your hand to select it
4. Click **"Play Selected Card"** to play
5. AI players will automatically play their turns
6. The game continues until one team reaches 4 victories

## 📦 Build for Production

```bash
cd frontend
npm run build
```

The optimized build will be in the `frontend/build` folder, ready for deployment!

## 🌐 Deploy

### Vercel (Easiest)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `cd frontend && vercel`
3. Follow the prompts

### Netlify
1. Build: `cd frontend && npm run build`
2. Drag the `build` folder to [Netlify Drop](https://app.netlify.com/drop)

Enjoy playing Sueca! 🃏


