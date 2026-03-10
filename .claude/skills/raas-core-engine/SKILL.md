# RaaS Core Engine SDK

Recipe-as-a-Service core engine — recipe parser, supervisor loop, agent orchestration.

## Khi nào dùng

- Extend core engine (planner, executor, verifier, orchestrator)
- Tạo agent mới trong `src/agents/`
- Tích hợp LLM client hoặc perception layer
- Debug Plan-Execute-Verify pipeline

## Architecture

```
@agencyos/raas-core
├── .              → shared/index.js    (foundation utilities)
├── ./perception   → perception/index.js (NLU/intention detection)
├── ./vibe         → vibe/index.js      (VIBE ecosystem integrations)
├── ./bmad         → bmad/index.js      (Binh Phap workflow logic)
└── ./agents       → vibe-agents/index.js (agent orchestration)
```

## Plan-Execute-Verify Pattern (Core DNA)

```python
# 1. PLAN — LLM decomposes goal into recipe
recipe = RecipePlanner(llm_client).plan(goal)

# 2. EXECUTE — Multi-mode runner
for task in recipe.tasks:
    result: ExecutionResult = RecipeExecutor().execute(task)
    # Modes: shell | llm | api
    # Self-healing: AI-corrects failed shell commands
    # Retry with exponential backoff

# 3. VERIFY — Validate against criteria
verification = RecipeVerifier().verify(result, criteria)
if not verification.passed:
    RecipeOrchestrator().rollback(step)
```

## Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `RecipePlanner` | `src/core/planner.py` | LLM task decomposition |
| `RecipeExecutor` | `src/core/executor.py` | Multi-mode runner → ExecutionResult |
| `RecipeVerifier` | `src/core/verifier.py` | Quality gates + validation |
| `RecipeOrchestrator` | `src/core/orchestrator.py` | Coordination + rollback |
| `LLMClient` | `src/core/llm_client.py` | OpenAI-compatible via proxy |
| `IntentClassifier` | `src/core/nlu.py` | Goal → recipe matching |

## Agent Base Pattern

```python
# All agents inherit AgentBase
class MyAgent(AgentBase):
    def plan(self, task): ...     # Decompose
    def execute(self, plan): ...  # Run
    def verify(self, result): ... # Validate
```

## Existing Agents

| Agent | Operations |
|-------|-----------|
| `GitAgent` | status, diff, log, commit, branch |
| `FileAgent` | find, read, tree, stats, grep |
| `ShellAgent` | Shell command execution |
| `LeadHunter` | Company/CEO lead discovery |
| `ContentWriter` | Content generation |
| `RecipeCrawler` | Recipe file discovery |

## Key Rules

- Type hinting required for all functions
- Docstring for every class and public method
- File size < 200 lines
- Tests in `tests/test_*.py` (62 tests, ~2.5min)
- LLM calls route through Antigravity Proxy (port 9191)
