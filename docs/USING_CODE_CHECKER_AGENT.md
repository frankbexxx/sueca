# Using the Code Checker & Purpose Analyzer Agent

The **Code Checker & Purpose Analyzer** is a specialized Copilot agent designed to review your code, identify issues, and suggest improvements. This guide explains how to use it effectively.

## What It Does

The Code Checker & Purpose Analyzer:
- **Reviews code for bugs** — identifies logic errors, edge cases, and unsafe patterns
- **Analyzes code purpose** — explains what the code is intended to do and why it matters
- **Checks quality** — evaluates readability, complexity, and maintainability
- **Flags security & performance issues** — highlights vulnerabilities and optimization opportunities
- **Validates documentation** — checks for missing docstrings, comments, and type hints
- **Suggests improvements** — provides concrete, actionable fixes with explanations

## How to Invoke the Agent

### In VS Code Chat

1. Open the **Copilot Chat** panel (Ctrl+L or Cmd+L)
2. Click the **Agent selector** (⚙️ icon or dropdown) at the top of the chat
3. Search for or select **"Code Checker & Purpose Analyzer"**
4. Type your code review request and press Enter

### Example Invocation

```
@Code Checker & Purpose Analyzer
Check the GameBoard.tsx component for bugs and explain what it's doing
```

## Use Cases & Examples

### 1. Review Complex Game Logic

```
Check src/models/Game.ts for bugs and explain what it's doing
```

**What the agent will do:**
- Read the Game model and related files (Deck, rules)
- Identify any logic errors in game state management
- Explain the game flow and scoring system
- Suggest improvements to error handling and edge cases

---

### 2. Audit Heuristic Evaluation

```
Review engine/heuristics.py for correctness and explain the AI decision-making approach
```

**What the agent will do:**
- Examine heuristic scoring logic
- Check for off-by-one errors or incorrect trump handling
- Explain what makes a move "good" according to the heuristics
- Suggest optimizations or fixes for edge cases

---

### 3. Security Check on API

```
Check sueca-ai/api/schemas.py for security and validation issues
```

**What the agent will do:**
- Review Pydantic model validation
- Identify missing input sanitization
- Check for type mismatches or bounds issues
- Suggest safer validation patterns

---

### 4. Documentation Audit

```
Review this React component for documentation gaps and code clarity
```

```typescript
// Paste your component here
export function GameMenu({ onStartGame, onSettings }) {
  // ...
}
```

**What the agent will do:**
- Check for missing TypeScript types (Props interface)
- Identify undocumented parameters
- Flag unclear logic that needs comments
- Suggest better naming or structure

---

### 5. Compare Two Implementations

```
I have two ways to implement move validation. Which is better, and why?

Option A: [paste code]

Option B: [paste code]

Check both for correctness, performance, and maintainability.
```

## What to Expect in the Output

The agent will provide a structured report:

### 1. **Purpose Summary**
Clear explanation of what the code does and why it matters in the SUECA context.

```
Purpose: This component manages the game board UI, rendering cards in play and enabling player moves.
It communicates with the Game model via props and delegates game logic to parent component.
```

### 2. **Issues Found**
Organized by category and severity:

```
## Logic Issues (Critical)
- Missing null check on gameState.cards_in_hand (line 45)
- Incorrect suit comparison: 'hearts' vs 'H' mismatch (line 62)

## Code Quality (Suggestions)
- Function is 150+ lines; consider extracting CardRenderer component
```

### 3. **Suggested Improvements**
Concrete code changes with explanations:

```typescript
// ❌ Before
if (card.suit === 'H') { ... }  // Unclear abbreviation

// ✅ After
if (card.suit === 'hearts') { ... }  // Matches schema definition
```

### 4. **Risk Assessment**
Warnings about breaking changes or dependencies:

```
⚠️ If you change this, update the AI engine's card comparison logic in movegen.py
```

## Best Practices

### 1. **Provide Context**
Include related files so the agent understands the full picture:

```
📄 Context: This is part of the move validation system.
Also check: src/models/Game.ts, engine/movegen.py

Review this move validation logic for correctness...
```

### 2. **Be Specific**
Vague requests get generic feedback. Be clear about what you're checking:

```
✅ "Check this heuristic for incorrect trump handling and scoring bugs"
❌ "Is this code good?"
```

### 3. **Ask Follow-up Questions**
If the initial review identifies issues, ask for clarification:

```
I see the null check issue you mentioned. What's the safest way to handle 
undefined cardState in React?
```

### 4. **Review the Suggestions**
The agent may suggest improvements—evaluate them in your context:

```
You suggested splitting this component. Would that affect the animation transitions?
```

## Integrating Agent Output

Once the agent identifies issues, you can:

1. **Copy suggested code** directly if it matches your conventions
2. **Have the agent write code** — ask it to implement the fix
3. **Validate suggestions** — ensure they align with SUECA patterns
4. **Update your code** — make edits and ask for re-review if needed

### Example Workflow

```
1. Agent: "Found 3 issues in GameBoard.tsx"
2. You: "Can you provide the fixed code for issue #2?"
3. Agent: "Here's the corrected function with null checks..."
4. You: "Thanks. How should we test this change?"
5. Agent: "Add a test case that verifies null handling..."
```

## When to Use This Agent

| Scenario | Use This Agent? |
|----------|---|
| Reviewing logic-heavy code (game rules, AI) | ✅ Yes |
| Checking API contracts and validation | ✅ Yes |
| Auditing security-sensitive code | ✅ Yes |
| Evaluating code quality and maintainability | ✅ Yes |
| Finding performance bottlenecks | ✅ Yes |
| General coding questions | ❌ Use default agent |
| Creating new components from scratch | ❌ Use default agent |
| Debugging runtime errors | ❓ Maybe—give it the error first |

## Troubleshooting

### Agent doesn't find the issue I mentioned
- **Cause**: Missing context about related code
- **Fix**: Paste relevant files or explain the code flow

### Agent suggests changes that break other code
- **Cause**: Not aware of broader dependencies
- **Fix**: Tell the agent about related systems (e.g., "This connects to the API")

### Output is too verbose or not detailed enough
- **Cause**: Default formatting
- **Fix**: Ask for a specific format: "Give me a concise summary" or "Explain in detail"

## Related Resources

- **Code Checker Agent**: [.github/agents/code-checker.agent.md](.github/agents/code-checker.agent.md)
- **TypeScript/React Guidelines**: [.github/instructions/typescript-react.instructions.md](.github/instructions/typescript-react.instructions.md)
- **Python/AI Guidelines**: [.github/instructions/python-ai.instructions.md](.github/instructions/python-ai.instructions.md)
- **SUECA Project Overview**: [docs/README.md](README.md)
- **Testing Strategy**: [docs/TESTING.md](TESTING.md)

---

**Happy code reviewing! 🔍**
