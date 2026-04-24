---
description: "Use when working with TypeScript, React components, or frontend code. Covers SUECA frontend patterns, component structure, hooks, and styling practices."
applyTo: "frontend/**/*.{ts,tsx}"
---

# SUECA TypeScript & React Guidelines

## Component Structure

- **Functional components only** — all components in `frontend/src/components/` are functions
- **One component per file** — match filename to component name (e.g., `GameBoard.tsx` for `GameBoard`)
- **CSS co-location** — pair each component with its `.css` file (e.g., `GameBoard.tsx` + `GameBoard.css`)
- **Props interfaces** — define component props as interfaces, not inline types

### Example
```typescript
// GameBoard.tsx
interface GameBoardProps {
  gameState: Game;
  onMove: (move: Move) => void;
}

export function GameBoard({ gameState, onMove }: GameBoardProps) {
  return <div className="game-board">...</div>;
}
```

## Hooks & State Management

- **Custom hooks** in `frontend/src/hooks/` — reusable logic for sound, language, game state
- **useLanguage hook** — always use for i18n; never hardcode Portuguese strings
- **useSound hook** — centralized audio management; check if audio is enabled before playing

### Example
```typescript
// In components
const { language, setLanguage } = useLanguage();
const { playSound } = useSound();
```

## Styling Conventions

- **CSS Modules or plain CSS** — each component has its own file
- **BEM naming** — block__element--modifier (e.g., `game-board__card--active`)
- **No inline styles** — all styling in `.css` files
- **Responsive design** — mobile-first; test with `50_mobile_viewport.csv` reference

## Imports & Organization

```typescript
// 1. React & external libraries
import React from 'react';
import { useEffect, useState } from 'react';

// 2. Internal components & hooks
import { GameMenu } from './GameMenu';
import { useLanguage } from '../hooks/useLanguage';

// 3. Types & constants
import { Game } from '../models/Game';
import { gameConstants } from '../constants/gameConstants';

// 4. Styles
import './GameBoard.css';
```

## Types & Constants

- **Models** in `frontend/src/models/` — `Game.ts`, `Deck.ts` (business logic)
- **Types** in `frontend/src/types/` — reusable TypeScript interfaces
- **Constants** in `frontend/src/constants/` — game rules, UI limits, configuration
- **No magic numbers** — all constants should be named and documented

## Testing

- Use `yarn test` to run tests
- Test components in isolation; mock game logic
- Refer to `docs/TESTING.md` for full test guidelines

## Common Pitfalls

❌ Hardcoded strings in JSX (internationalization required)  
❌ Inline styles or style tags in components  
❌ Large monolithic components (split into UI + logic)  
❌ Passing game logic to components (keep in models)  
❌ Missing event handlers for user actions
