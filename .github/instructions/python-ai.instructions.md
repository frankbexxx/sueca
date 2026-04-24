---
description: "Use when working with Python, the AI engine, or FastAPI backend. Covers SUECA AI architecture, move generation, heuristics, and API schemas."
applyTo: "sueca-ai/**/*.py"
---

# SUECA Python & AI Engine Guidelines

## Project Architecture

- **`engine/`** — Core AI: `movegen.py` (legal moves), `state.py` (game state), `heuristics.py` (evaluation)
- **`api/`** — FastAPI REST layer: `main.py` (routes), `schemas.py` (Pydantic models)
- **`tests/`** — Unit tests for engine logic (movegen, heuristics)

See `sueca-ai/README.md` for deployment architecture (Heroku/Procfile setup).

## Game State & Move Generation

### State Management (`engine/state.py`)
```python
# Game state is immutable; move generation returns new state
class GameState:
    """Represents a round/trick state"""
    cards_in_hand: list[Card]
    cards_played: list[Card]
    
    def is_valid_move(self, card: Card) -> bool:
        """Check move legality"""
        pass
```

### Move Generation (`engine/movegen.py`)
- **Canonical move order** — generate moves consistently for heuristic evaluation
- **Suit constraints** — honor requirement to follow suit when possible
- **Trump semantics** — trump beats non-trump; highest card of suit wins within non-trump plays
- **Test coverage** — use `tests/test_movegen.py` to validate edge cases

## Heuristics & Evaluation

### Heuristic Standards (`engine/heuristics.py`)
- **Positional evaluation** — prefer points (capturing cards with high values)
- **Lead advantage** — leading player has information advantage, penalize weak leads
- **Trump usage** — trumps are valuable; use heuristics to decide when to fall back with trump
- **Human-like play** — weight heuristics to balance aggressive capture vs. defensive play

### Testing Heuristics
```python
# Use test cases to validate heuristic behavior
from tests.test_heuristics_cases import test_cases

for test in test_cases:
    best_move = select_best_move(test.state, test.my_cards)
    assert best_move in test.expected_good_moves
```

## API & Schemas (`api/`)

### FastAPI Patterns
```python
# main.py — minimal routes, defer logic to engine
@app.post("/api/move")
async def choose_move(request: MoveRequest) -> MoveResponse:
    """Return best move for current state"""
    pass
```

### Pydantic Schemas (`schemas.py`)
```python
# Explicit validation
class Card(BaseModel):
    suit: str  # 'hearts', 'diamonds', 'clubs', 'spades'
    rank: str  # 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'
    
class GameStateRequest(BaseModel):
    my_cards: list[Card]
    cards_played: list[Card]
    trump_suit: str
```

## Code Style

- **Type hints** — all function signatures must include types
- **Docstrings** — use Google-style for engine functions
- **Constants** — card values, suit names in uppercase (`TRUMP_BOOST = 15`)
- **No global state** — engine functions are pure; FastAPI request context only

### Example
```python
def evaluate_move(state: GameState, card: Card) -> int:
    """
    Evaluate card play quality.
    
    Args:
        state: Current game state
        card: Card to evaluate
        
    Returns:
        Heuristic score (higher = better)
    """
    score = 0
    if state.is_trump(card):
        score += TRUMP_BOOST
    if state.captures_points(card):
        score += state.captured_points_value(card)
    return score
```

## Testing & Validation

Use `pytest`:
```bash
# Run all tests
pytest sueca-ai/tests/

# Run specific test
pytest sueca-ai/tests/test_movegen.py::test_suit_following
```

- **Engine tests** in `tests/` — validate movegen and heuristics
- **API tests** — manual via curl or Postman; see `docs/TEST_AI_QUICKSTART.md`

## Common Pitfalls

❌ Modifying GameState in-place (violates move generation contract)  
❌ Non-deterministic move selection when heuristics tie  
❌ Missing trump suit handling in heuristics  
❌ Blocking API calls (ensure JSON responses are quick)  
❌ Hardcoded card values instead of using constants
