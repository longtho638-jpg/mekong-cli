# Phase 1: Constitutional Guardrails (Ethics & Safety)

## Context
Currently, `mission-dispatcher.js` executes any valid task file found in `tasks/`. We need a safety layer that evaluates the *intent* of the mission before execution, ensuring alignment with the Binh Phap Constitution (e.g., no data destruction, no unauthorized access, no harmful content).

## Goals
- Implement `lib/safety-guard.js` module.
- Integrate safety check into `mission-dispatcher.js` (pre-flight).
- Define "Constitutional Rules" for the LLM validator.

## Architecture
- **Input:** Raw mission text.
- **Validator:** Fast LLM call (e.g., Gemini Flash or local small model) via Proxy.
- **Output:** `SAFE` | `UNSAFE` | `NEEDS_CONFIRMATION`.

## Implementation Steps

1.  **Create `lib/safety-guard.js`**:
    -   Define `checkSafety(prompt)` function.
    -   Implement call to Antigravity Proxy (port 11436) with a specific system prompt enforcing Binh Phap ethics.
    -   Handle timeouts (fail-safe: if check fails, default to strict/block or warn).

2.  **Define Safety Constitution**:
    -   Create `config/safety-constitution.txt` (or embed in js).
    -   Rules:
        -   No mass deletion of files without backup.
        -   No exfiltration of secrets (API keys).
        -   No modification of `CLAUDE.md` or core rules without authorization.
        -   No execution of arbitrary binary code from untrusted sources.

3.  **Integrate with `mission-dispatcher.js`**:
    -   In `processQueue` or `executeTask`, call `checkSafety()`.
    -   If `UNSAFE`: Move mission to `tasks/rejected/`, log incident, alert Telegram.
    -   If `NEEDS_CONFIRMATION`: (Future) Pause and wait for user signal (for now, treat as rejected or log warning).

4.  **Testing**:
    -   Create "Red Team" missions (e.g., `mission_destroy_all.txt`).
    -   Verify they are blocked.

## Todo List
- [ ] Create `lib/safety-guard.js` skeleton.
- [ ] Implement Proxy client for safety check.
- [ ] Define Binh Phap Safety System Prompt.
- [ ] Update `mission-dispatcher.js` to use `safety-guard`.
- [ ] Create `tasks/rejected/` directory handling.
- [ ] Test with sample unsafe missions.
