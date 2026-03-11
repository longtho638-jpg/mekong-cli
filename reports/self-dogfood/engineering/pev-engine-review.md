# Engineering: PEV Engine Review — Mekong CLI v5.0

## Command: /review
## Date: 2026-03-11

---

## Source Files
- `src/core/orchestrator.py` — 1022 lines (coordinator)
- `src/core/planner.py` — 659 lines (PLAN phase)
- `src/core/executor.py` — 489 lines (EXECUTE phase)
- `src/core/verifier.py` — 482 lines (VERIFY phase)
- Total PEV engine: 2652 lines

---

## Architecture Overview

```
RecipePlanner.plan(goal) → Recipe
    ↓
RecipeOrchestrator.run(recipe)
    ↓ (for each step)
StepExecutor.execute_and_verify(step)
    ├── RecipeExecutor.execute_step(step) → ExecutionResult
    │       ├── _execute_shell_step()
    │       ├── _execute_llm_step()
    │       ├── _execute_api_step()
    │       ├── _execute_tool_step()
    │       └── _execute_browse_step()
    └── RecipeVerifier.verify(result, criteria) → VerificationReport
    
If failed:
    ├── Self-healing: LLM corrects command → re-execute
    └── RollbackHandler.rollback()
```

---

## PLAN Phase: RecipePlanner (659 lines)

### Strengths
- Keyword-based agent routing (9 categories in AGENT_KEYWORDS dict)
- URL auto-detection via `_URL_PREFIXES` tuple
- LLM-based task decomposition with fallback to rule-based parsing
- `PlanningContext` dataclass carries constraints, project_info, available_agents
- `VerificationCriteria` dataclass per step (exit_code, file_exists, output_contains)

### Issues
- 659 lines — violates 200-line file limit
- Single LLM decomposition attempt with no retry on parse failure (exception swallowed)
- `AGENT_KEYWORDS` dict is hardcoded — adding new agents requires code change
- No planning cache — identical goals re-plan from scratch each time

---

## EXECUTE Phase: RecipeExecutor (489 lines)

### Strengths
- 5 execution modes: shell, llm, api, tool, browse
- `DANGEROUS_PATTERNS` list blocks destructive commands
- `CommandSanitizer` applied in rollback path
- `ExecutionResult` dataclass provides structured output (exit_code, stdout, stderr, output_files)

### Issues
- 489 lines — violates 200-line file limit
- `subprocess.run()` is synchronous — blocks event loop
- DANGEROUS_PATTERNS list has 11 entries — limited coverage (see security report)
- No timeout parameter for shell steps — hanging commands block forever
- `_execute_browse_step()` and `_execute_tool_step()` implementations not reviewed

---

## VERIFY Phase: RecipeVerifier (482 lines)

### Strengths
- Rich verification criteria: exit_code, file_exists, file_not_exists,
  output_contains, output_not_contains, custom_checks
- `VerificationStatus` enum: PASSED, FAILED, WARNING, SKIPPED
- `VerificationCheck` dataclass with expected/actual comparison
- `VerificationReport.summary` property generates human-readable summary
- `strict_mode` flag for production vs development verification

### Issues
- 482 lines — violates 200-line file limit
- `custom_checks` appear to be shell commands run as verification — security concern
  if criteria come from untrusted recipe input
- No async verification support

---

## Self-Healing Mechanism (orchestrator.py ~lines 125-183)

When a shell step fails (exit_code != 0) AND llm_client is available:
1. Build prompt: "This command failed: {cmd}. Error: {stderr}. Suggest fix."
2. LLM generates corrected command
3. Re-execute corrected command
4. If corrected command succeeds: `self_healed = True`

This is a sophisticated capability. Issues:
- Synchronous LLM call blocks during healing (300ms-2s)
- No limit on correction attempts (single retry only — acceptable)
- Reflection hint from past failures is consulted (good pattern)
- Healing prompt limited to 500 chars of stderr — may truncate useful error context

---

## Rollback Mechanism (orchestrator.py ~lines 207-248)

`RollbackHandler.rollback()` iterates completed steps in reverse:
- Reads `params.rollback` command from step definition
- Sanitizes rollback command via `CommandSanitizer(strict_mode=True)`
- Blocks unsafe rollback commands with logged reason

Issues:
- Rollback is optional (params.rollback field) — most recipe steps likely have no rollback
- No transactional guarantee — partial rollback is possible if rollback step itself fails
- No rollback for LLM/API step types (only shell rollback supported)

---

## DAG Integration

```python
from .dag_scheduler import DAGScheduler, validate_dag
```

DAGScheduler and validate_dag imported but parallel batch execution not wired.
Current execution: sequential regardless of step dependencies.
DAG validation runs before execution (detects cycles) — useful safeguard.

---

## Telemetry Integration

TelemetryCollector integrated at step level:
```python
if self.telemetry:
    self.telemetry.record_step(
        step_order, title, duration, exit_code, self_healed, agent
    )
```
Per-step metrics recorded. `self_healed` flag tracked — enables healing success rate reporting.

---

## Event Bus Integration

`get_event_bus()` imported — events published to EventBus during orchestration.
Allows decoupled subscribers (SSE gateway, telemetry, logging) to react to execution events.

---

## File Size Summary

| File | Lines | Limit | Violation |
|------|-------|-------|-----------|
| orchestrator.py | 1022 | 200 | 5.1x over |
| planner.py | 659 | 200 | 3.3x over |
| executor.py | 489 | 200 | 2.4x over |
| verifier.py | 482 | 200 | 2.4x over |

All 4 PEV engine files exceed the 200-line limit.

---

## Recommendations

1. **Split all 4 files** to comply with 200-line limit
2. **Async subprocess** in executor.py — use asyncio.create_subprocess_exec
3. **Add shell step timeout** — `subprocess.run(timeout=30)` minimum
4. **Wire parallel batch execution** from DAGScheduler
5. **Plan caching** — hash(goal) → cached Recipe for repeated identical goals
6. **Make AGENT_KEYWORDS configurable** via YAML/JSON for extensibility
7. **Async LLM client** for self-healing to avoid blocking event loop
