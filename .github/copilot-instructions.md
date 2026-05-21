# SUECA Project Guidelines

**SUECA** is a multiplayer Portuguese card game implemented as a web app (React/TypeScript frontend + Python FastAPI AI engine).

## Project Structure

- **`frontend/`** — React/TypeScript web app (game, menus, UI)
- **`sueca-ai/`** — Python AI engine (move generation, heuristics) + FastAPI backend
- **`docs/`** — Complete documentation, guides, and status
- **`arquivo/`** — Card images, icons, game assets

Detailed architecture: [docs/ESTRUTURA_PROJETO.md](docs/ESTRUTURA_PROJETO.md)

## Core Conventions

### Frontend (TypeScript/React)
- **Functional components** with co-located CSS files
- **Custom hooks** for reusable logic (sound, language, game state)
- **useLanguage hook** — always use for text; never hardcode strings
- **Models not UI** — game logic lives in `models/`, not components
- **BEM naming** for CSS; responsive mobile-first design

See [.github/instructions/typescript-react.instructions.md](.github/instructions/typescript-react.instructions.md) for full guidelines.

### Backend (Python AI Engine)
- **Immutable GameState** — move generation returns new state, never modifies
- **Canonical move ordering** — consistent, reproducible move generation
- **Type hints required** — all function signatures must be fully typed
- **Pure engine** — `engine/` has no I/O; FastAPI wraps it for HTTP
- **Heuristics tested** — validate AI reasoning with test cases in `tests/`

See [.github/instructions/python-ai.instructions.md](.github/instructions/python-ai.instructions.md) for full guidelines.

## Key Commands

### Frontend
```bash
cd frontend
yarn install      # Install dependencies
yarn start        # Dev server (http://localhost:3000)
yarn build        # Production build
yarn test         # Run tests
```

### Backend
```bash
cd sueca-ai
pip install -r requirements.txt  # Install dependencies
python -m uvicorn api.main:app --reload  # Dev server (http://localhost:8000)
pytest tests/     # Run tests
```

### Deployment
- Frontend: Vercel (see `docs/DEPLOY.md`)
- Backend: Heroku with Procfile (see `docs/DEPLOY_AI_PRODUCTION.md`)

## Important Resources

| Resource | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/STATUS.md](docs/STATUS.md) | Current project state |
| [docs/INDEX.md](docs/INDEX.md) | Documentation index |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Setup and first run |
| [docs/TESTING.md](docs/TESTING.md) | Testing strategy |
| [rules.txt](rules.txt) | Official SUECA game rules |

## Code Standards

**Version**: Node.js 18+, Python 3.10+  
**React**: 18.x  
**FastAPI**: 0.115+  
**TypeScript**: 4.9+  

## When to Use Code Checker & Purpose Analyzer

Use the **Code Checker & Purpose Analyzer** agent to review:
- Complex game logic (move validation, trick resolution)
- Heuristic evaluation (AI decision-making quality)
- API contracts (request/response schemas)
- Documentation gaps or ambiguous code

Simply ask: _"Check this [file] for bugs and explain what it's doing"_

---

**Last updated**: April 2026  
See [CHANGELOG.md](CHANGELOG.md) for recent changes.
