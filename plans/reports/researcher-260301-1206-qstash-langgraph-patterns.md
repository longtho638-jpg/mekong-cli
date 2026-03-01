# QStash + LangGraph Pattern Analysis for Mekong CLI
**Report:** Researcher | **Date:** 2026-03-01 | **Duration:** 30min

---

## Executive Summary

Two open-source systems provide actionable patterns for enhancing mekong-cli's **Plan-Execute-Verify engine** and **task queue system**:

1. **Upstash QStash** — HTTP-based message queue optimized for serverless (retry, dedup, scheduling, webhooks)
2. **LangGraph** — Graph-based agent orchestration with persistent state (checkpointing, human-in-the-loop, branching)

**Recommendation:** Adopt 3 QStash patterns (dedup idempotency keys, exponential backoff retry, scheduling with cron) + 2 LangGraph patterns (StateGraph-like checkpointing, interrupt/resume for human oversight).

---

## Part 1: QStash Patterns (HTTP Message Queue)

### Pattern 1: Idempotent Message Delivery
**QStash Pattern:** Deduplication via `Deduplication-Id` header + signature verification

**How it works:**
- Client assigns unique `Deduplication-Id` to each message
- QStash stores mapping: ID → message hash
- Duplicate ID + same content = rejected silently
- Prevents double-processing in non-idempotent handlers

**Mekong Application:**
```python
# src/core/task_queue.py
@dataclass
class QueuedTask:
    task_id: str  # UUID per task
    dedup_key: str  # Hash of (goal + params)
    recipe_hash: str  # Content-based dedup

class TaskQueue:
    def publish(self, task: QueuedTask) -> str:
        # Check dedup_key in self.processed_tasks
        if dedup_key in self.processed_tasks:
            logger.info(f"Task {task_id} already processed")
            return self.processed_tasks[dedup_key]["result_id"]
        # Otherwise queue
        self.tasks.append(task)
```

**Impact:** Prevent Tôm Hùm from re-executing same mission on restart/heartbeat.

---

### Pattern 2: Exponential Backoff Retry with DLQ
**QStash Pattern:** Automatic retries with configurable delay expression + Dead Letter Queue for final failures

**How it works:**
- Message fails → retry with delay (configurable per attempt)
- Max retries (e.g., 5 attempts) → move to DLQ
- DLQ = separate queue for manual inspection
- Retry delay uses math functions + `retried` variable

**Mekong Application:**
```python
# src/core/executor.py
@dataclass
class RetryPolicy:
    max_retries: int = 5
    initial_delay_sec: int = 2
    backoff_multiplier: float = 1.5
    max_delay_sec: int = 300

class RecipeExecutor:
    async def execute_with_retry(self, step, policy: RetryPolicy):
        for attempt in range(policy.max_retries):
            try:
                result = await self._execute_step(step)
                return result
            except ExecutionError as e:
                if attempt == policy.max_retries - 1:
                    # Move to DLQ equivalent
                    self.dead_letter_queue.append({
                        "step": step,
                        "error": str(e),
                        "last_attempt": attempt
                    })
                    raise
                # Exponential backoff
                delay = min(
                    policy.initial_delay_sec * (policy.backoff_multiplier ** attempt),
                    policy.max_delay_sec
                )
                await asyncio.sleep(delay)
```

**Impact:** Resilient CLI that survives transient failures (network, LLM quota, file locks).

---

### Pattern 3: Scheduled Task Publishing (Cron)
**QStash Pattern:** `Upstash-Cron` header with IANA timezone support

**How it works:**
- Add cron expression to message header: `Upstash-Cron: "0 9 * * MON"`
- QStash evaluates in UTC (configurable via `CRON_TZ`)
- Automatically publishes recurring messages on schedule
- No separate scheduler needed

**Mekong Application:**
```python
# src/core/scheduler.py
@dataclass
class ScheduledTask:
    goal: str
    cron_expression: str  # "0 9 * * MON" = 9am Monday UTC
    timezone: str = "UTC"  # "America/New_York" supported
    task_id: str = field(default_factory=lambda: str(uuid4()))

class TaskScheduler:
    def schedule(self, task: ScheduledTask) -> str:
        # Store in persistent scheduler
        self.db.insert("scheduled_tasks", {
            "task_id": task.task_id,
            "goal": task.goal,
            "cron": f"CRON_TZ={task.timezone} {task.cron_expression}",
            "enabled": True,
        })
        # On server startup, register with cron daemon
        # (or use APScheduler for local daemon)
        return task.task_id
```

**Impact:** Auto-CTO loop in Tôm Hùm can schedule recurring "quality sweeps" (type safety, a11y audit, security scan).

---

### Pattern 4: Webhook Signature Verification
**QStash Pattern:** HMAC-SHA256 signature in `Upstash-Signature` header + public key rotation

**How it works:**
- QStash signs every webhook with current + next keys
- Receiver validates: `HMAC-SHA256(message, key)`
- Supports key rotation without downtime
- Prevent rogue webhook injection

**Mekong Application:**
```python
# apps/raas-gateway/webhook_handler.py
from qstash import Receiver

receiver = Receiver(
    signing_key=os.getenv("QSTASH_SIGNING_KEY"),
    next_signing_key=os.getenv("QSTASH_NEXT_SIGNING_KEY")
)

@app.post("/webhooks/task-completed")
async def on_task_completed(request: Request):
    body = await request.body()
    signature = request.headers.get("Upstash-Signature", "")

    try:
        # Throws if signature invalid
        message = receiver.verify(signature, body)
    except Exception as e:
        logger.error(f"Invalid signature: {e}")
        return {"error": "Invalid signature"}, 403

    # Process verified webhook
    task_id = message["task_id"]
    result = message["result"]
    # ...
```

**Impact:** Secure Tôm Hùm ↔ mekong-cli communication (Telegram bot can verify auth).

---

## Part 2: LangGraph Patterns (Agent Orchestration)

### Pattern 5: StateGraph-Based Checkpointing
**LangGraph Pattern:** Persistent state snapshots at every node with SqliteSaver

**How it works:**
- Define shared `State` (TypedDict): all agent data in one dict
- Checkpointer saves state after EVERY node execution (super-step)
- Resume from any checkpoint: "time travel" debugging
- Survives process crashes/restarts

**Mekong Application:**
```python
# src/core/orchestrator.py
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver

class RecipeState(TypedDict):
    goal: str
    recipe: Recipe  # Recipe object from planner
    plan_status: str  # "pending" | "planning" | "done"
    executed_steps: list[ExecutionResult]
    current_step_idx: int
    final_result: Optional[ExecutionResult]
    errors: list[str]
    verification_passed: bool
    checkpoints: list[str]  # For debugging

def plan_node(state: RecipeState) -> dict:
    """Plan phase: decompose goal → recipe"""
    recipe = planner.plan(state["goal"])
    return {
        "recipe": recipe,
        "plan_status": "done",
        "checkpoints": [*state["checkpoints"], f"plan_{recipe.id}"]
    }

def execute_node(state: RecipeState) -> dict:
    """Execute: run next step in recipe"""
    step_idx = state["current_step_idx"]
    if step_idx >= len(state["recipe"].steps):
        return {}  # No more steps

    step = state["recipe"].steps[step_idx]
    result = executor.execute(step)
    state["executed_steps"].append(result)

    return {
        "executed_steps": state["executed_steps"],
        "current_step_idx": step_idx + 1,
        "errors": state["errors"] + ([] if result.success else [result.error])
    }

def verify_node(state: RecipeState) -> dict:
    """Verify: validate results against criteria"""
    verification = verifier.verify(state["executed_steps"], state["recipe"].criteria)
    return {
        "verification_passed": verification.passed,
        "errors": state["errors"] + verification.issues,
        "checkpoints": [*state["checkpoints"], f"verify_{verification.id}"]
    }

# Build graph
builder = StateGraph(RecipeState)
builder.add_node("plan", plan_node)
builder.add_node("execute", execute_node)
builder.add_node("verify", verify_node)

builder.add_edge(START, "plan")
builder.add_edge("plan", "execute")
builder.add_edge("execute", "verify")
builder.add_edge("verify", END)

# Compile with checkpointer
memory = SqliteSaver.from_conn_string(".mekong/checkpoints.sqlite")
graph = builder.compile(checkpointer=memory)

# Usage
config = {"configurable": {"thread_id": "task_12345"}}
result = graph.invoke({"goal": "...", "recipe": None, ...}, config)
```

**Impact:**
- Resume interrupted tasks: `graph.invoke(..., config)` continues from last node
- Debug: inspect state at each checkpoint
- Audit trail: all plan/execute/verify stages logged

---

### Pattern 6: Interrupt + Human-in-the-Loop
**LangGraph Pattern:** `interrupt()` pauses at checkpoint; `Command(resume="...")` resumes with user input

**How it works:**
- Inside node: call `interrupt(message)` at decision point
- Graph pauses, returns to caller with state
- Caller (web UI, CLI) presents info to human
- Human approves/rejects → `Command(resume=approval)`
- Node restarts but skips interrupt on resume

**Mekong Application:**
```python
# src/core/orchestrator.py
from langgraph.types import interrupt, Command

def execute_with_approval(state: RecipeState) -> dict:
    """Execute but pause if confidence low"""
    step_idx = state["current_step_idx"]
    step = state["recipe"].steps[step_idx]

    # Execute with dry-run first
    dry_result = executor.execute(step, dry_run=True)

    if dry_result.confidence_score < 0.7:
        # Request human approval
        approval = interrupt({
            "message": f"Low confidence ({dry_result.confidence_score:.0%}) on step: {step.description}",
            "step": step.name,
            "suggested_action": dry_result.suggested_fix,
            "alternatives": dry_result.alternatives,
        })
        # If approval is rejected, raise exception
        if approval != "approved":
            return {"errors": [f"Step {step.name} rejected by human"]}

    # Execute for real
    result = executor.execute(step)
    return {
        "executed_steps": [*state["executed_steps"], result],
        "current_step_idx": step_idx + 1,
    }

# Resume from interrupt:
# (In Tôm Hùm daemon or web API)
config = {"configurable": {"thread_id": "task_12345"}}
graph_state = graph.get_state(config)
# Present to human, get approval
user_approval = wait_for_human_approval(graph_state)
# Resume
result = graph.invoke(Command(resume=user_approval), config)
```

**Impact:** CC CLI can pause before destructive actions (git force-push, db migration). Tôm Hùm can escalate risky tasks to Chairman (Antigravity).

---

### Pattern 7: Conditional Branching + Subgraphs
**LangGraph Pattern:** Conditional edges route to different nodes; subgraphs modularize agent teams

**How it works:**
- Edge function checks state → returns next node name
- Subgraph = nested StateGraph (e.g., code-review subgraph)
- Subgraph state inherits parent; can be invoked independently

**Mekong Application:**
```python
# src/core/orchestrator.py
def route_after_execution(state: RecipeState) -> str:
    """Route based on execution results"""
    if not state["executed_steps"]:
        return "execute"

    last_result = state["executed_steps"][-1]

    if not last_result.success:
        if last_result.is_retriable:
            return "execute"  # Retry
        else:
            return "verify"  # Skip to verification (may fail)

    if state["current_step_idx"] < len(state["recipe"].steps):
        return "execute"  # Next step
    else:
        return "verify"  # All steps done

# Subgraph: Code Review Team
class CodeReviewState(TypedDict):
    code_changes: str
    issues_found: list[dict]
    reviewer_comments: str
    approved: bool

def static_check_node(state: CodeReviewState) -> dict:
    # Type safety, lint
    issues = run_type_checker(state["code_changes"])
    return {"issues_found": issues}

def security_check_node(state: CodeReviewState) -> dict:
    # Security audit
    issues = run_security_scan(state["code_changes"])
    return {"issues_found": [*state["issues_found"], *issues]}

def human_review_node(state: CodeReviewState) -> dict:
    # Human approves or rejects
    comments = interrupt({"code": state["code_changes"], "issues": state["issues_found"]})
    return {"reviewer_comments": comments, "approved": comments == "approved"}

review_builder = StateGraph(CodeReviewState)
review_builder.add_node("static_check", static_check_node)
review_builder.add_node("security_check", security_check_node)
review_builder.add_node("human_review", human_review_node)
review_builder.add_edge(START, "static_check")
review_builder.add_edge("static_check", "security_check")
review_builder.add_edge("security_check", "human_review")
review_builder.add_edge("human_review", END)

review_graph = review_builder.compile(checkpointer=memory)

# Main orchestrator integrates review subgraph
def execute_with_review(state: RecipeState) -> dict:
    step = state["recipe"].steps[state["current_step_idx"]]
    result = executor.execute(step)

    # Run review subgraph
    review_config = {"configurable": {"thread_id": f"{state['checkpoints'][-1]}_review"}}
    review_result = review_graph.invoke({
        "code_changes": result.output,
        "issues_found": [],
        "approved": False
    }, review_config)

    return {
        "executed_steps": [*state["executed_steps"], result],
        "verification_passed": review_result["approved"],
    }

# Conditional edge
builder.add_conditional_edges("execute", route_after_execution)
```

**Impact:** Code review, testing, security audit can run as parallel subgraphs; agent teams modularized and testable.

---

## Integration Matrix: Mekong-CLI Enhancements

| Pattern | Source | Component | Change | Priority |
|---------|--------|-----------|--------|----------|
| Dedup idempotency keys | QStash | `task_queue.py` | Add `dedup_key` field | HIGH |
| Exponential backoff retry | QStash | `executor.py` | Enhance `RetryPolicy` class | HIGH |
| Cron scheduling | QStash | `scheduler.py` | New `TaskScheduler` class for auto-CTO | MEDIUM |
| Webhook sig verification | QStash | `raas-gateway/` | Secure Tôm Hùm callbacks | MEDIUM |
| StateGraph checkpointing | LangGraph | `orchestrator.py` | Refactor to StateGraph + SqliteSaver | HIGH |
| Interrupt/resume human-in-loop | LangGraph | `orchestrator.py` | Add `interrupt()` checkpoints before risky ops | MEDIUM |
| Conditional branching | LangGraph | `orchestrator.py` | Routing logic post-execution | MEDIUM |
| Subgraph composition | LangGraph | Agent system | Wrap code-review/test/security as subgraphs | LOW |

---

## Implementation Roadmap (Phases)

### Phase 1: Idempotency + Retry (Week 1-2)
- [ ] Add `dedup_key` to task model
- [ ] Implement exponential backoff in `RecipeExecutor`
- [ ] Test Tôm Hùm restart resilience

### Phase 2: Checkpointing (Week 2-3)
- [ ] Refactor `RecipeOrchestrator` → StateGraph pattern
- [ ] Add SqliteSaver to `.mekong/checkpoints.sqlite`
- [ ] Migrate task state to shared `RecipeState` dict
- [ ] Test time-travel debugging

### Phase 3: Human-in-the-Loop (Week 3-4)
- [ ] Add `interrupt()` checkpoint before risky steps (git push, db migration)
- [ ] Extend web API to handle pause/resume
- [ ] Integrate with CC CLI --interactive mode

### Phase 4: Scheduling + Subgraphs (Week 4-5)
- [ ] Implement cron-based task scheduler
- [ ] Wrap code-review, testing, security as StateGraph subgraphs
- [ ] Auto-CTO loop uses scheduler to trigger quality sweeps

---

## Unresolved Questions

1. **Thread ID Strategy:** How to map QStash message IDs ↔ LangGraph thread IDs? (Currently mismatch)
2. **Checkpointer Scale:** SqliteSaver suitable for 100+ concurrent missions? Or migrate to Postgres?
3. **Subgraph Error Handling:** If subgraph fails, does parent graph rollback automatically?
4. **Interrupt Timeout:** How long should Tôm Hùm wait for human approval before timeout?
5. **Dedup Storage:** Keep in-memory or persistent? Current MEMORY.md uses dict; need migration?

---

## Sources

- [Upstash QStash Retry Mechanism](https://upstash.com/docs/qstash/features/retry)
- [Upstash QStash Scheduling](https://upstash.com/docs/qstash/features/schedules)
- [GitHub - upstash/qstash-js](https://github.com/upstash/qstash-js)
- [LangGraph Graph API Overview](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [LangGraph Persistence with SqliteSaver](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [LangGraph Human-in-the-Loop with Interrupts](https://dev.to/jamesbmour/interrupts-and-commands-in-langgraph-building-human-in-the-loop-workflows-4ngl)
- [LangGraph Multi-Agent Orchestration Architecture Analysis 2025](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025)
