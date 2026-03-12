# PEV Engine Architecture
**Plan → Execute → Verify** | v2.1 | 2026-03-12 | Mekong CLI v5.0

---

## 1. Overview

Core execution runtime. Natural-language goal → structured recipe → step execution via dispatch mode → quality verification. Failure path: LLM self-heal → retry → rollback → replan failed branch only.

---

## 2. Architecture Diagram

```
User Input
  │
  ▼
RecipeOrchestrator
  NLU.parse() → RecipePlanner.plan() → WorkflowState
  ├─ has deps? → DAGScheduler (ThreadPoolExecutor)
  └─ no deps?  → sequential loop
                      ↓
              StepExecutor.execute_and_verify()
                RecipeExecutor  →  RecipeVerifier
                fail(shell)     →  LLM self-heal → retry
                fail(still)     →  RollbackHandler
  Success → AGI v2: reflection→world_model→code_evolution→vector_memory
```

---

## 3. Data Flow

```
Goal (string)
  [1] NLU.parse() → intent
  [2] RecipePlanner.plan()
       _detect_step_type(): URL→browse, tool kw→tool, refactor→evolve
       no LLM: _rule_based_decompose()   LLM: _llm_decompose() → JSON
       → Recipe{steps[], dependencies[], metadata{dag_enabled}}
  [3] validate_dag() Kahn's algo → cycle? flatten sequential
  [4] per step: execute_step() → verify(result, criteria)
       shell: CommandSanitizer → subprocess(300s)
       llm: LLMClient.chat()   api: requests   tool: ToolRegistry   browse: BrowserAgent
       pass→next  fail(shell)→LLM rewrite→retry once→rollback
  [5] AGI v2 post-loop (success only, non-blocking, errors swallowed)
```

---

## 4. Data Models

```python
# parser.py
class RecipeStep:  order, title, description, agent, params, dependencies: list[int]
class Recipe:      name, description, steps, metadata, display

# verifier.py
class ExecutionResult:     exit_code, stdout, stderr, output_files, metadata, error
class VerificationCheck:   name, status: VerificationStatus, message, expected, actual
class VerificationReport:  passed, checks, warnings, errors, summary(property)

# orchestrator.py
class StepResult:          step, execution, verification, retry_count, self_healed: bool
class OrchestrationResult: status, recipe, step_results, total/completed/failed_steps,
                           warnings, errors, success_rate(property)

class OrchestrationStatus(Enum): SUCCESS | FAILED | PARTIAL | ROLLED_BACK
class VerificationStatus(Enum):  PASSED | FAILED | WARNING | SKIPPED
class TaskComplexity(Enum):      SIMPLE | MODERATE | COMPLEX
```

---

## 5. Execution Modes (`executor.py`)

Dispatch via `step.params["type"]`. Routing is Planner's job, not Executor's.

| Mode | Backend | Key params |
|------|---------|-----------|
| `shell` | `subprocess.run(shlex.split, timeout=300)` | `command`, `timeout`, `retry`, `rollback` |
| `llm` | `LLMClient.chat(messages)` | `prompt`, `system`, `model` |
| `api` | `requests.request(method, url, timeout=30)` | `method`, `url`, `headers`, `body` |
| `tool` | `ToolRegistry().execute(tool_name, args)` | `tool_name`, `tool_args` |
| `browse` | `BrowserAgent.(check_status\|get_links\|analyze_page)` | `url`, `action` |

Shell path: quick pattern check → `CommandSanitizer(strict_mode=True)` → `subprocess.run(shlex.split)`. LLM offline → exit_code=0, stdout=`[SKIPPED]`.

---

## 6. DAG Scheduling (`dag_scheduler.py`, 218 lines)

```
DAGScheduler(steps, max_workers=4):
  execute_all(executor_fn):
    ThreadPoolExecutor loop:
      get_ready_steps()  → all deps in _completed
      submit to pool     → as_completed() → mark_completed or mark_failed
      mark_failed(order) → _cancel_downstream() BFS transitive cancellation

validate_dag(steps):  Kahn's topological sort
  visited != len(nodes) → return error string → planner flattens to sequential
```

`_completed/_failed/_cancelled` sets guarded by `threading.Lock`.

---

## 7. Self-Healing & Rollback

**Self-heal** (shell steps only, one attempt):
1. Query `reflection.get_strategy_suggestion()` for prior-failure hints (optional)
2. Prompt LLM: corrected command only, no explanation
3. Re-sanitize healed cmd → execute → `StepResult.self_healed = True` on pass

**Rollback** (`RollbackHandler`):
- Iterates `step_results` reversed, skips non-passed
- `step.params["rollback"]` → `CommandSanitizer(strict_mode=True)` → `subprocess(timeout=30)`
- Failures are warnings (best-effort); sets `OrchestrationStatus.ROLLED_BACK`

---

## 8. Verification System (`verifier.py`, 483 lines)

**Standard checks:** `exit_code` exact · `file_exists/not_exists` via `Path.exists()` · `output_contains/not_contains` regex (fallback substring, case-insensitive on stdout+stderr) · `custom_checks` (string: exit=0; dict `{command, expected_output}`: substring match, 30s timeout)

**Quality gates** (`verify_quality_gates`): scan stdout+stderr for:

| Gate | Pattern | Pass condition |
|------|---------|----------------|
| `tech_debt` | `TODO\|FIXME` | not found |
| `clean_logs` | `console\.log\|print\(` | not found |
| `type_safety` | `: any\|: Any` | not found |
| `security` | `vulnerabilit\|critical\|high severity` | not found |

`strict_mode=True` (default): WARNING status blocks progress.

---

## 9. Security (`command_sanitizer.py`, 279 lines)

Applied at 3 points: shell execution · rollback · custom verification checks.

```
DANGEROUS_PATTERNS (always block):
  injection: ; | || && ` $() ${}
  filesystem: rm/ rm* redirect-to-root
  network: curl|wget piped to sh
  privilege: sudo su chmod chown
  scheduling: nohup at cron
  env: export VAR= unset

SUSPICIOUS_PATTERNS (warn; block in strict_mode):
  eval exec python-c node-e /dev/tcp nc base64-d ../ >.
```

`subprocess.run(shlex.split(cmd))` — no `shell=True`. LLM-generated commands re-sanitized before execution.

---

## 10. AGI v2 Post-Loop

Runs after success; errors never affect `OrchestrationResult`.

| Module | Role |
|--------|------|
| `reflection` | Step pattern analysis, agent score updates, self-heal hints |
| `world_model` | Filesystem diff, project knowledge graph |
| `code_evolution` | Refactoring suggestions from execution patterns |
| `vector_memory` | Embed recipe → `~/.mekong/recipes/` for similarity reuse |
| `collaboration` | Multi-agent coordination review, bottleneck detection |

---

## 11. Extension Points

| Goal | Action |
|------|--------|
| New exec mode | `_execute_<mode>_step()` + case in `execute_step()` + entry in `AGENT_KEYWORDS` |
| New agent | `src/agents/my_agent.py` extends `AgentBase` + register in `AGENT_REGISTRY` |
| New verify check | Field on `VerificationCriteria` + `verify_<name>()` + call in `verify()` |
| New quality gate | `_run_custom_check({...})` in `verify_quality_gates()` |
| Custom retry | `RecipeOrchestrator(retry_policy=RetryPolicy(...))` |

---

## 12. Configuration

```bash
export LLM_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY=sk-or-v1-...
export LLM_MODEL=anthropic/claude-sonnet-4
# Fallback: OpenRouter→DashScope→DeepSeek→Anthropic→OpenAI→Google→Ollama→Offline
```

| Setting | Default | Override |
|---------|---------|---------|
| Shell timeout | 300s | `step.params["timeout"]` |
| DAG workers | 4 | `MEKONG_DAG_WORKERS` env |
| Self-heal / Rollback | on | `--no-selfheal` / `--no-rollback` |
| Health endpoint | `:9192` | `RecipeOrchestrator(health_port=N)` |

---

## 13. File Reference

| File | Lines | Role |
|------|-------|------|
| `src/core/parser.py` | — | Markdown recipe → dataclasses |
| `src/core/planner.py` | 660 | Decomposition, routing, DAG build, replan |
| `src/core/executor.py` | 490 | Step dispatch: shell/llm/api/tool/browse |
| `src/core/verifier.py` | 483 | Criteria checks, quality gates |
| `src/core/orchestrator.py` | 1049 | Coordinator, self-heal, rollback, AGI post-loop |
| `src/core/dag_scheduler.py` | 218 | Parallel execution, Kahn's cycle detection |
| `src/core/command_sanitizer.py` | 279 | Pattern-based shell security |
| `src/core/llm_client.py` | — | Universal LLM endpoint (3-var config) |
| `src/core/agent_base.py` | — | AgentBase plan/execute/verify interface |

*Docs impact: major — source-accurate rewrite.*
