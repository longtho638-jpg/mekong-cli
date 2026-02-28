# Phase 02: Agent Orchestration — LangGraph Wrapper

## Context Links
- [Research Report](research/researcher-01-agi-frameworks.md) — Mang 1: AI Agent Frameworks
- Existing: `src/core/orchestrator.py` (RecipeOrchestrator, 548 lines, Plan-Execute-Verify)
- Existing: `src/core/planner.py` (RecipePlanner, LLM-powered decomposition)
- Existing: `src/core/verifier.py` (RecipeVerifier, quality gates)
- Existing: `src/core/executor.py` (RecipeExecutor, multi-mode runner)
- Existing: `packages/core/vibe-agents/src/orchestrator.ts` (TS agent orchestrator)

## Parallelization
- **SONG SONG** voi Phase 01, 03, 04, 05
- File ownership: `src/core/orchestrator.py`, `src/core/planner.py`, `src/core/verifier.py`, `src/core/graph_engine.py` (NEW)
- KHONG cham: `src/core/memory.py` (Phase 01), `src/core/telemetry.py` (Phase 03), `apps/openclaw-worker/` (Phase 04), `apps/agencyos-web/` (Phase 05)

## Overview
- **Priority:** P1
- **Status:** pending
- **Mo ta:** Wrap existing Plan-Execute-Verify pipeline bang LangGraph stateful graph. KHONG rewrite — LangGraph lam orchestration layer ben ngoai, giu RecipePlanner/Executor/Verifier nguyen ven.

## Key Insights
- RecipeOrchestrator hien tai: linear pipeline, sequential step execution
- LangGraph cho phep: conditional branching, parallel nodes, state checkpointing, rollback
- Strategy: LangGraph StateGraph wrap existing classes, KHONG thay interface
- Giong pattern: Adapter/Facade — LangGraph la external orchestrator, goi internal classes
- LangGraph v1.0+ (stable Q4/2025): `langgraph>=0.2.0`

## Requirements

### Functional
- FR1: LangGraph StateGraph voi 4 nodes: Plan → Execute → Verify → Report
- FR2: Conditional edge: Verify FAIL → re-Plan (max 2 retries) hoac Rollback
- FR3: State checkpoint: persist graph state de resume sau crash
- FR4: Parallel step execution: steps khong co dependency chay dong thoi
- FR5: Backward-compat: `RecipeOrchestrator.run_from_goal()` van hoat dong nhu cu

### Non-functional
- NFR1: LangGraph overhead < 50ms per graph transition
- NFR2: Fallback: neu langgraph import fail → dung existing linear orchestrator
- NFR3: Graph visualization export (Mermaid) cho debug

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   src/core/graph_engine.py (NEW)             │
│                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │  PLAN    │────▶│ EXECUTE  │────▶│  VERIFY  │            │
│  │  node    │     │  node    │     │  node    │            │
│  └──────────┘     └──────────┘     └─────┬────┘            │
│       ▲                                   │                  │
│       │              ┌────────────────────┤                  │
│       │              │                    │                  │
│       │         PASS ▼              FAIL  ▼                  │
│       │    ┌──────────┐         ┌──────────┐               │
│       │    │  REPORT  │         │ ROLLBACK │               │
│       │    │  (end)   │         │  / RETRY │               │
│       │    └──────────┘         └─────┬────┘               │
│       │                               │                     │
│       └───────── retry_count < 2 ─────┘                     │
│                                                              │
│  State: { goal, recipe, step_results, retry_count, status }  │
└──────────────────────────────────────────────────────────────┘
         │
         ▼  (delegates to existing classes)
   ┌─────────────┐  ┌───────────────┐  ┌───────────────┐
   │RecipePlanner│  │RecipeExecutor │  │RecipeVerifier │
   │ (unchanged) │  │ (unchanged)   │  │ (unchanged)   │
   └─────────────┘  └───────────────┘  └───────────────┘
```

### State Schema
```python
class GraphState(TypedDict):
    goal: str
    context: Optional[PlanningContext]
    recipe: Optional[Recipe]
    step_results: list[StepResult]
    retry_count: int
    status: str  # "planning" | "executing" | "verifying" | "done" | "failed"
    errors: list[str]
```

## Related Code Files

### Modify
| File | Changes |
|------|---------|
| `src/core/orchestrator.py` | Add `use_graph=True` param, delegate to GraphEngine khi enabled |
| `src/core/planner.py` | Extract `plan()` return type cho graph node compatibility |
| `src/core/verifier.py` | Ensure `verify()` returns serializable result cho graph state |

### Create
| File | Purpose |
|------|---------|
| `src/core/graph_engine.py` | LangGraph StateGraph definition + nodes + edges |

## Implementation Steps

1. **Add langgraph dependency** vao `pyproject.toml`
   ```toml
   langgraph = ">=0.2.0"
   langchain-core = ">=0.3.0"  # required by langgraph
   ```

2. **Create `src/core/graph_engine.py`** (~150 lines)
   - Define `GraphState` TypedDict
   - Implement 4 node functions:
     - `plan_node(state)` → call `RecipePlanner.plan()`
     - `execute_node(state)` → call `RecipeExecutor.execute_step()` per step
     - `verify_node(state)` → call `RecipeVerifier.verify()`
     - `report_node(state)` → build OrchestrationResult
   - Conditional edge: verify → report (pass) | verify → plan (retry) | verify → rollback (max retries)
   - Build graph: `StateGraph(GraphState)`
   - Export: `GraphEngine` class voi `run(goal, context)` method

3. **Update `src/core/orchestrator.py`** (~30 lines change)
   - Add `use_graph: bool = False` param to `__init__`
   - In `run_from_goal()`:
     ```python
     if self.use_graph:
         try:
             from .graph_engine import GraphEngine
             engine = GraphEngine(planner=self.planner, verifier=self.verifier)
             return engine.run(goal, context)
         except ImportError:
             pass  # fallback to linear
     # existing linear pipeline
     ```
   - Keep ALL existing code unchanged as fallback

4. **Minor updates to planner.py** (~10 lines)
   - Ensure `plan()` returns picklable Recipe (for state serialization)

5. **Minor updates to verifier.py** (~10 lines)
   - Ensure `VerificationReport` is serializable

6. **Graph visualization** helper in graph_engine.py
   - `export_mermaid()` → return Mermaid string of current graph

## Todo List
- [ ] Add `langgraph`, `langchain-core` to pyproject.toml
- [ ] Create `src/core/graph_engine.py` voi StateGraph
- [ ] Implement plan_node, execute_node, verify_node, report_node
- [ ] Implement conditional edges (retry/rollback logic)
- [ ] Update `orchestrator.py` voi `use_graph` toggle
- [ ] Ensure planner.py output la serializable
- [ ] Ensure verifier.py output la serializable
- [ ] Add Mermaid export utility
- [ ] Test: graph run produce same result as linear pipeline
- [ ] Test: retry logic triggers on verification failure

## Success Criteria
- `RecipeOrchestrator(use_graph=True).run_from_goal("test goal")` → same result as `use_graph=False`
- Conditional retry: verify fail → re-plan max 2 times
- Rollback triggers khi retry exhausted
- `python3 -m pytest tests/test_orchestrator_integration.py` — ALL PASS
- Import error (no langgraph installed) → graceful fallback to linear

## Conflict Prevention
- **KHONG cham** `src/core/memory.py` (Phase 01 owns)
- **KHONG cham** `src/core/memory_client.py` (Phase 01 owns)
- **KHONG cham** `src/core/telemetry.py` (Phase 03 owns)
- **KHONG cham** `apps/openclaw-worker/` (Phase 04 owns)
- **KHONG cham** `apps/agencyos-web/` (Phase 05 owns)
- graph_engine.py la FILE MOI — khong conflict voi ai

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| LangGraph overhead lam cham pipeline | Benchmark: nếu >100ms overhead → disable graph, dung linear |
| langchain-core dependency bloat | Pin minimal version, khong import toan bo langchain |
| State serialization loi voi complex objects | Recipe/StepResult da la dataclass → asdict() de serialize |
| LangGraph API breaking change | Pin `langgraph>=0.2.0,<1.0.0` |

## Security Considerations
- Graph state khong chua secrets (only goal text, recipe steps, results)
- Checkpoint persistence: local file only (khong send to cloud)
- LLM calls van route qua Antigravity Proxy 9191 (khong thay doi)
