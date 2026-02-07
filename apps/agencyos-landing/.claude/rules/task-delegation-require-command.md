# Task Delegation Requirement: Command Mandatory

> **Strict Enforcement Protocol**: Prevents ambiguous or unguided task execution.

## ⛔ Rule: NO COMMAND = NO ACTION

Any task delegation from Antigravity, external orchestrators, or users **MUST** explicitly use a ClaudeKit Slash Command (e.g., `/plan`, `/cook`, `/review`, `/test`).

### ❌ REJECTED PATTERNS
- "Fix the bug in the parser" (Ambiguous strategy)
- "Implement the login feature" (Ambiguous workflow)
- "Check the code" (Ambiguous scope)

### ✅ ACCEPTED PATTERNS
- "**/fix** the bug in the parser"
- "**/cook** implement the login feature"
- "**/review** check the code"
- "**/plan** new architecture for X"

## 🚨 ENFORCEMENT RESPONSE

If a task is received without a leading `/command`, you **MUST** immediately respond with:

```
ERROR: Task rejected. Use a ClaudeKit /command (e.g. /plan, /cook, /review) to define the workflow strategy.
```

## Why this matters?
- **/plan**: Triggers deep research and architectural thinking.
- **/cook**: Triggers atomic implementation steps.
- **/fix**: Triggers root cause analysis.
- **Raw text**: Triggers nothing, leading to shallow, low-quality responses.

**Compliance is MANDATORY.**
