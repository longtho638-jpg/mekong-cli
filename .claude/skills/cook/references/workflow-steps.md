# Unified Workflow Steps

All modes share core steps with mode-specific variations.

## Step 0: Intent Detection & Setup

1. Parse input with `intent-detection.md` rules
2. Log detected mode: `✓ Step 0: Mode [X] - [reason]`
3. If mode=code: detect plan path, set active plan
4. Initialize TodoWrite with workflow steps

**Output:** `✓ Step 0: Mode [interactive|auto|fast|parallel|no-test|code] - [detection reason]`

## Step 1: Research (skip if fast/code mode)

**Interactive/Auto:**
- Spawn multiple `researcher` agents in parallel
- Use `/scout:ext` or `scout` agent for codebase search
- Keep reports ≤150 lines

**Parallel:**
- Optional: max 2 researchers if complex

**Output:** `✓ Step 1: Research complete - [N] reports gathered`

## Step 2: Planning

**Interactive/Auto/No-test:**
- Use `planner` agent with research context
- Create `plan.md` + `phase-XX-*.md` files

**Fast:**
- Use `/plan:fast` with scout results only
- Minimal planning, focus on action

**Parallel:**
- Use `/plan:parallel` for dependency graph + file ownership matrix

**Code:**
- Skip - plan already exists
- Parse existing plan for phases

**Output:** `✓ Step 2: Plan created - [N] phases`

## Step 3: Implementation

**All modes:**
- Execute phase tasks sequentially (Step 3.1, 3.2, etc.)
- Use `ui-ux-designer` for frontend
- Use `ai-multimodal` for image assets
- Run type checking after each file

**Parallel mode:**
- Launch multiple `fullstack-developer` agents
- Respect file ownership boundaries
- Wait for parallel group before next

### Discovered Work (beads projects)

When `CK_BEADS_AVAILABLE=1` and you discover issues during implementation:

**What to file:**
- Bugs in existing code
- Missing edge cases
- Technical debt
- Security concerns
- Performance issues

**How to file immediately:**
```bash
# 1. Create the discovered work item
bd create "{brief description}" -t {bug|task|doc} -p {0-2}

# 2. Link to current task (capture discovery context)
bd dep add {new-id} {current-id} --type discovered-from

# 3. Continue main implementation (don't block)
```

**Priority guide:**
- P0: Critical security/data loss bugs
- P1: High-impact bugs, blocking issues
- P2: Medium bugs, tech debt (default for discovered work)

**Don't:**
- Add to mental queue (will be forgotten)
- Wait until end of session
- Create separate TODO.md files
- File trivial issues (typos, minor style)

**Output:** `✓ Step 3: Implemented [N] files - [X/Y] tasks complete`

## Step 4: Testing (skip if no-test mode)

**All modes (except no-test):**
- Write tests: happy path, edge cases, errors
- Use `tester` agent
- If failures: `debugger` → fix → repeat
- **Forbidden:** fake mocks, commented tests, changed assertions

**Output:** `✓ Step 4: Tests [X/X passed]`

## Step 5: Code Review

**Interactive/Parallel/Code/No-test:**
- Use `code-reviewer` agent
- Interactive cycle (max 3): see `review-cycle.md`
- Requires user approval

**Auto:**
- Auto-approve if score≥9.5 AND 0 critical
- Auto-fix critical (max 3 cycles)
- Escalate to user after 3 failed cycles

**Fast:**
- Simplified review, no fix loop
- User approves or aborts

**Output:** `✓ Step 5: Review [score]/10 - [Approved|Auto-approved]`

## Step 6: Finalize

**All modes:**
1. `project-manager` + `docs-manager` subagents in parallel
2. Onboarding check (API keys, env vars)
3. Auto-commit via `git-manager` subagent
4. **Beads sync** (if `CK_BEADS_AVAILABLE=1`)

### Beads Sync (automatic)

If beads available, run automatically:
```bash
bd sync  # Persist task state to git
```

**Error handling:**
- If sync fails: log warning, continue finalization
- Don't block session end on beads errors
- Silent skip if beads not available

**Auto mode:** Continue to next phase automatically
**Others:** Ask user before next phase

**Output:** `✓ Step 6: Finalized - Status updated - Committed - Beads synced`

## Mode-Specific Flow Summary

```
interactive: 0 → 1 → 2 → 3 → 4 → 5(user) → 6
auto:        0 → 1 → 2 → 3 → 4 → 5(auto)  → 6 → next phase
fast:        0 → skip → 2(fast) → 3 → 4 → 5(simple) → 6
parallel:    0 → 1? → 2(parallel) → 3(multi-agent) → 4 → 5(user) → 6
no-test:     0 → 1 → 2 → 3 → skip → 5(user) → 6
code:        0 → skip → skip → 3 → 4 → 5(user) → 6
```

## Critical Rules

- Never skip steps without mode justification
- Mark TodoWrite tasks as complete immediately
- One task in_progress at a time
- All step outputs follow format: `✓ Step [N]: [status] - [metrics]`
