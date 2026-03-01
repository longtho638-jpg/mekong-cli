# Binh Phap Ch.2 作戰: QStash Architecture → Mekong-CLI RaaS AGI

> "Binh quý thắng, bất quý cửu" — Speed is the essence

## Status: PLANNED
## Branch: master

---

## QStash Key Concepts Learned

| QStash Concept | Description |
|---|---|
| **Durable Steps** | `context.run()` — each step persists result, survives cold starts |
| **Sleep/Wait** | `context.sleep()`, `context.sleepUntil()`, `context.waitForEvent()` |
| **Parallel Execution** | Independent steps run concurrently |
| **DLQ (Dead Letter Queue)** | Failed messages → DLQ after retry exhaustion |
| **Failure Functions** | Custom logic on workflow failure |
| **HTTP-based** | All communication via HTTP callbacks |
| **Non-retryable Errors** | 489 status code = skip retries |
| **Workflow-to-Workflow** | `context.invoke()` for chained workflows |

---

## Mapping: QStash → Mekong-CLI

| QStash | Mekong-CLI Current | Enhancement |
|---|---|---|
| `serve()` | `RecipeOrchestrator.run_from_goal()` | Add durable state persistence |
| `context.run()` | `RecipeExecutor.execute_step()` | Add step result caching + resume |
| `context.sleep()` | `Scheduler` (basic) | Add workflow-level sleep/pause |
| `context.call()` | `_execute_api_step()` | Add callback-based async HTTP |
| DLQ | None | Add failed mission queue |
| Retry policy | Basic retry in orchestrator | Add configurable retry with backoff |
| `context.cancel()` | `governance.py` halt | Unify cancellation API |
| Workflow-to-Workflow | Tôm Hùm dispatch | Add `context.invoke()` pattern |
| Parallel steps | `swarm.py` | Integrate with PEV pipeline |

---

## Phases

### Phase 1: Durable Step Execution (Core)
- **File**: `src/core/durable_step_store.py` (NEW)
- Add step result persistence to disk (`.mekong/step-results/`)
- On resume: skip completed steps, resume from last failure
- Survives CLI crash/restart — like QStash cold start resilience

### Phase 2: Dead Letter Queue
- **File**: `src/core/dead_letter_queue.py` (NEW)
- Failed missions after N retries → `.mekong/dlq/`
- DLQ viewer: `mekong dlq list`, `mekong dlq retry <id>`
- Failure callback function support

### Phase 3: Workflow Sleep/Wait Primitives
- **File**: `src/core/scheduler.py` (EDIT)
- Add `workflow_sleep(step_name, duration)` to orchestrator
- Add `workflow_wait_for_event(event_type)` — pause until EventBus signal
- Persist wait state to `.mekong/pending-waits/`

### Phase 4: Configurable Retry Policy
- **File**: `src/core/orchestrator.py` (EDIT)
- Add `RetryPolicy` dataclass (max_retries, backoff_type, non_retryable_errors)
- Support 489-equivalent: mark specific errors as non-retryable
- Exponential backoff with jitter

### Phase 5: Workflow Invocation Chain
- **File**: `src/core/orchestrator.py` (EDIT)
- Add `invoke_workflow(goal, context)` — trigger sub-workflow from step
- Return result to parent workflow
- Enable Tôm Hùm → CLI → sub-CLI chaining

---

## Success Criteria
- [ ] Steps survive crash + resume from last completed
- [ ] Failed missions go to DLQ after retries exhausted
- [ ] Orchestrator supports sleep/wait primitives
- [ ] Retry policy is configurable per recipe
- [ ] Sub-workflow invocation works end-to-end
- [ ] All 62 existing tests still pass
- [ ] New tests for each phase (target: +20 tests)
