# Phase 2: Self-Correction (Proactive Logic Repair)

## Context
`mission-recovery.js` currently handles infrastructure errors (400, context overflow). It does not handle *logical* failures (e.g., "build failed", "tests failed", "file not found"). We need a feedback loop that analyzes the *result* of a mission and retries with a modified strategy.

## Goals
- Enhance `ExecutionResult` to capture semantic failure reasons.
- Implement `lib/strategy-optimizer.js`.
- Create a retry loop with strategy modification in `brain-process-manager.js`.

## Architecture
- **Feedback Loop:** Execute -> Result (Stderr/Stdout) -> Analyze -> Refine Strategy -> Retry.
- **Strategy Optimizer:** LLM-based analysis of *why* it failed and *how* to fix the prompt/approach.

## Implementation Steps

1.  **Analyze Execution Results**:
    -   Update `runMission` to return structured error data (not just success/fail).
    -   Detect common logical errors: `SyntaxError`, `TypeScript Error`, `Test Failed`, `FileNotFound`.

2.  **Create `lib/strategy-optimizer.js`**:
    -   Function `optimizeStrategy(originalPrompt, errorOutput, attemptCount)`.
    -   Uses LLM to generate a *correction* or *hint* to append to the original prompt.
    -   Example: If "FileNotFound", hint: "Double check the file path, use `find` to locate it first."

3.  **Implement Retry Loop**:
    -   In `mission-dispatcher.js`, wrap execution in a loop (max 3 retries).
    -   If failure is "Recoverable" (Logical):
        -   Call `optimizeStrategy`.
        -   Update prompt with hint.
        -   Retry.
    -   If failure is "Terminal" (Safety, Auth): Stop.

4.  **Testing**:
    -   Create a "broken" mission (e.g., fix a file that doesn't exist).
    -   Verify the system tries to find the file or correct the path in subsequent attempts.

## Todo List
- [ ] Analyze `brain-process-manager.js` return values for logical errors.
- [ ] Implement `lib/strategy-optimizer.js` with LLM analysis.
- [ ] Update `mission-dispatcher.js` with retry logic loop.
- [ ] Test with a deliberately failing mission (e.g., syntax error fix).
