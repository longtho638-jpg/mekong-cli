---
description: description: ⚡⚡⚡ Start coding & testing an existing plan
---

# Claudekit Command: /code

> Imported from claudekit-engineer

**MUST READ** `CLAUDE.md` then **THINK HARDER** to start working on the following plan follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules:
<plan>$ARGUMENTS</plan>


## Step 0: Plan Detection & Phase Selection

**If `$ARGUMENTS` is empty:**
1. Find latest `plan.md` in `./plans` | `find ./plans -name "plan.md" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-`
2. Parse plan for phases and status, auto-select next incomplete (prefer IN_PROGRESS or earliest Planned)

**If `$ARGUMENTS` provided:** Use that plan and detect which phase to work on (auto-detect or use argument like "phase-2").

**After detecting plan path:** Extract plan folder (parent directory of phase file) and set active plan:
```bash
node $HOME/.claude/scripts/set-active-plan.cjs {plan-folder}
```
Example: `plans/260108-1418-custom-domain-refactor/phase-01-database.md` → run `node $HOME/.claude/scripts/set-active-plan.cjs plans/260108-1418-custom-domain-refactor`

**Output:** `✓ Step 0: [Plan Name] - [Phase Name]`

**Subagent Pattern (use throughout):**
```
Task(subagent_type="[type]", prompt="[task description]", description="[brief]")
```


## Step 1: Analysis & Task Extraction

Read plan file completely. Map dependencies between tasks. List ambiguities or blockers. Identify required skills/tools and activate from catalog. Parse phase file and extract actionable tasks.

**TodoWrite Initialization & Task Extraction:**
- Initialize TodoWrite with `Step 0: [Plan Name] - [Phase Name]` and all command steps (Step 1 through Step 6)
- Read phase file (e.g., phase-01-preparation.md)
- Look for tasks/steps/phases/sections/numbered/bulleted lists
- MUST convert to TodoWrite tasks:
  - Phase Implementation tasks → Step 2.X (Step 2.1, Step 2.2, etc.)
  - Phase Testing tasks → Step 3.X (Step 3.1, Step 3.2, etc.)
  - Phase Code Review tasks → Step 4.X (Step 4.1, Step 4.2, etc.)
- Ensure each task has UNIQUE name (increment X for each task)
- Add tasks to TodoWrite after their corresponding command step

**Output:** `✓ Step 1: Found [N] tasks across [M] phases - Ambiguities: [list or "none"]`

Mark Step 1 complete in TodoWrite, mark Step 2 in_progress.


## Step 3: Testing

Write tests covering happy path, edge cases, and error cases. Call `tester` subagent: "Run test suite for plan phase [phase-name]". If ANY tests fail: STOP, call `debugger` subagent: "Analyze failures: [details]", fix all issues, re-run `tester`. Repeat until 100% pass.

**Testing standards:** Unit tests may use mocks for external dependencies (APIs, DB). Integration tests use test environment. E2E tests use real but isolated data. Forbidden: commenting out tests, changing assertions to pass, TODO/FIXME to defer fixes.

**Output:** `✓ Step 3: Tests [X/X passed] - All requirements met`

**Validation:** If X ≠ total, Step 3 INCOMPLETE - do not proceed.

Mark Step 3 complete in TodoWrite, mark Step 4 in_progress.


## Step 5: Finalize

**Prerequisites:** User approved in Step 4 (verified above).

1. **STATUS UPDATE - BOTH MANDATORY - PARALLEL EXECUTION:**
- **Call** `project-manager` sub-agent: "Update plan status in [plan-path]. Mark plan phase [phase-name] as DONE with timestamp. Update roadmap."
- **Call** `docs-manager` sub-agent: "Update docs for plan phase [phase-name]. Changed files: [list]."

2. **ONBOARDING CHECK:** Detect onboarding requirements (API keys, env vars, config) + generate summary report with next steps.

3. **AUTO-COMMIT (after steps 1 and 2 completes):**
- Run only if: Steps 1 and 2 successful + User approved + Tests passed
- Auto-stage, commit with conventional commit message based on actual changes

**Validation:** Steps 1 and 2 must complete successfully. Step 3 (auto-commit) runs only if conditions met.

Mark Step 5 complete in TodoWrite.

**Phase workflow finished. Ready for next plan phase.**

