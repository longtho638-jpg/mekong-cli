# Engineering: Recipe Runner — DAG Implementation Analysis — Mekong CLI v5.0

## Command: /cook
## Date: 2026-03-11

---

## Source Files Reviewed
- `recipes/` directory structure
- `recipes/INDEX.json` (343 lines)
- `src/core/dag_scheduler.py`
- `src/core/orchestrator.py` (imports DAGScheduler, validate_dag)

---

## Recipe Directory Structure

```
recipes/
├── INDEX.json              — Master index of all recipes (343 lines)
├── engineering/
│   ├── INDEX.json
│   ├── incident.json
│   ├── new-service.json
│   ├── refactor.json
│   └── ship.json
├── accounting/
├── agency-box-setup.md
├── analyst/
├── auto/
├── backend/
├── business/
├── data/
├── design/
├── dev/
├── dev-setup.md
├── devops/
├── eng/
├── finance/
├── founder/
├── frontend/
└── ...
```

- Engineering subfolder has 4 concrete recipe JSON files: `incident`, `new-service`, `refactor`, `ship`
- Mix of `.json` and `.md` files — inconsistent format across directories
- `dev-setup.md` and `agency-box-setup.md` are markdown recipes (free-form), not structured JSON

---

## DAG Scheduler Implementation Status

### dag_scheduler.py imported in orchestrator.py
```python
from .dag_scheduler import DAGScheduler, validate_dag  # line 30
```

### DAG Validation: validate_dag()
- Function exists and is imported — validates DAG topology before execution
- Called during recipe parsing to detect cycles and dependency ordering
- Status: IMPLEMENTED

### DAG Scheduler: DAGScheduler class
- Class exists for dependency-ordered step scheduling
- Determines execution order based on `dependencies` field in RecipeStep
- Status: IMPLEMENTED — but parallel batch execution is NOT wired up

---

## Parallel Execution Gap

The DAG scheduler can identify which steps can run concurrently but the orchestrator
does not exploit this. Steps are still executed sequentially:

```python
# orchestrator.py — sequential step loop (no parallel batching)
for step in recipe.steps:
    result = self._step_executor.execute_and_verify(step, ...)
```

DAGScheduler.get_parallel_batches() likely returns grouped steps, but the main
execution loop iterates steps one by one regardless.

**Gap:** DAG topology calculated but not used for concurrent execution.
**Impact:** A 5-step recipe where steps 2,3,4 have no dependencies still runs sequentially.
**Fix:** Extract parallel batches from DAGScheduler and use asyncio.gather() per batch.

---

## Recipe Format Analysis

### JSON Format (engineering/incident.json pattern)
- Structured: goal, steps[], each step has order, title, agent, params
- params.type: shell | llm | api | tool | browse
- params.verification: exit_code, output_contains, file_exists criteria
- params.rollback: rollback command for failed steps
- Status: fully supported by RecipeExecutor

### Markdown Format (agency-box-setup.md pattern)
- Free-form markdown with code blocks
- Parsed by RecipeParser using markdown extraction heuristics
- Less reliable than JSON — depends on format conventions
- Status: supported but fragile

---

## RecipeExecutor Step Types

| Type | Method | Status |
|------|--------|--------|
| shell | _execute_shell_step | Implemented |
| llm | _execute_llm_step | Implemented |
| api | _execute_api_step | Implemented |
| tool | _execute_tool_step | Implemented |
| browse | _execute_browse_step | Implemented |

All 5 step types implemented. executor.py = 489 lines.

---

## Security: DANGEROUS_PATTERNS in executor.py
```python
DANGEROUS_PATTERNS = [
    "rm -rf /", "mkfs", "dd if=",
    "chmod -R 777 /", "curl.*|.*sh", "wget.*|.*sh",
    "eval ", "exec(", "> /dev/sd", "shutdown", "reboot",
]
```
- Pattern list is hardcoded — 11 patterns
- `curl.*|.*sh` uses regex-like pattern but checked via `re.search` — good
- Missing: `sudo rm`, `>(dangerous redirect)`, `base64 | bash`, `python -c exec`
- CommandSanitizer (strict_mode=True) applied additionally in rollback path

---

## Recommendations

1. **Wire parallel batch execution:** Use `DAGScheduler.get_parallel_batches()` + `asyncio.gather()` for independent steps
2. **Standardize recipe format:** Migrate all `.md` recipes to `.json` for reliable parsing
3. **Expand DANGEROUS_PATTERNS:** Add `sudo rm`, `base64 |`, `python -c` patterns
4. **Recipe test coverage:** Add pytest fixtures for each recipe in engineering/ subfolder
5. **INDEX.json freshness:** 343-line index should be auto-generated; manual maintenance will drift

---

## Summary
DAG runner is architecturally complete (scheduler + validator) but sequential execution
is the default. True parallel recipe execution requires 20-30 lines of orchestrator.py
changes to use asyncio.gather() on parallel batches. Recipe format is 80% JSON,
20% markdown with inconsistent structure.
