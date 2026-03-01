# Research Report: AGI Platform Architecture Patterns 2025-2026

**Date:** 2026-03-01 | **Scope:** Task orchestration, survey-as-input, webhook reliability, event-driven agents, self-healing — mapped to Python CLI AGI platform.

---

## 1. Task Orchestration (CrewAI / AutoGen / LangGraph)

**Dominant pattern 2026: Hierarchical + Agent-as-a-Tool recursion.**

| Framework | Decomposition | Coordination |
|-----------|--------------|--------------|
| LangGraph | State-graph DAG + Conditional Edges | Supervisor node → workers |
| CrewAI | Manager Agent assigns Tasks | Sequential/Hierarchical Process |
| AutoGen | GroupChatManager selects speaker | Planner agent as callable tool |
| Semantic Kernel | Director (MagenticOne) delegates | Function-calling pipeline |

**Key patterns:**
- **Agent-as-a-Tool**: Specialized agents registered as tools in a parent agent's toolset — enables recursive delegation without custom routing code.
- **LangGraph State Reducers**: Global state schema where each node emits a delta (append, not overwrite) — enables time-travel debugging, checkpointing, and rollback.
- **Instruction Fog rule**: Max 4-5 tools per agent; prefer 5 focused agents over 1 "god agent" with 20 tools.
- **MCP (Model Context Protocol)**: 2026 standard for tool integration — strict Pydantic JSON schemas, idempotency keys on side-effectful tools.
- **Cost budgets**: Assign token budgets per sub-task; kill cyclic graph loops on budget exhaustion.

**Mapping to mekong-cli `Plan-Execute-Verify`:**
- `RecipePlanner` = LangGraph-style DAG decomposition; each step gets explicit context from prior `ExecutionResult`
- `RecipeOrchestrator` implements Supervisor pattern; routes to `GitAgent`, `FileAgent`, `ShellAgent`, etc.
- Add idempotency keys to all `RecipeExecutor` side-effectful steps to prevent duplicate actions on retry.

---

## 2. Survey/Form as Agent Input

**Pattern: Structured human input → Pydantic model → dynamic agent configuration.**

**Configuration flows:**
- **Persona-as-a-Service**: Form fields (`industry`, `tone`, `expertise`) → Jinja2 prompt template injection. Fully replaces static system prompts.
- **Tool-mounting via preferences**: Form checkbox ("use real-time data?") determines which tools are registered on agent init. Clean separation: no tools baked into agent class.
- **Constraint guardrails**: Negative constraint list (e.g., "max 200 words", "no jargon") injected as explicit formatting rules.
- **Few-shot from examples**: User provides good/bad examples in form → injected as few-shot blocks dynamically.

**Human-in-the-Loop (HITL) patterns:**
- **Confidence-based escalation**: Secondary "Evaluator" agent scores output; below threshold → pause, send review form to human, feed correction back as next iteration.
- **Review-and-Approve gate**: Agent writes "DRAFT" status; notification triggers human "Correction Form"; correction re-enters agent loop as context. State machine: `DRAFT → REVIEW → APPROVED/REJECTED`.
- **LangGraph Breakpoints**: Explicit interrupt nodes in graph for sensitive tool calls (destructive ops, payments, external sends).

**Mapping to mekong-cli:**
- `RecipePlanner` can accept a `SurveyConfig` Pydantic model as input → dynamic goal decomposition based on user-selected constraints.
- HITL gate: `RecipeVerifier` emits `NEEDS_REVIEW` status instead of pass/fail when confidence < threshold.

---

## 3. Webhook Reliability Patterns

**Stack: FastAPI + Taskiq (async-native) + PostgreSQL + Redis.**

**At-least-once delivery:**
- Every outbound webhook write includes `idempotency_key` (UUID) stored in Redis (TTL = 48h). Receiver deduplicates before processing.
- Delivery attempts logged to PostgreSQL with status (`PENDING`, `DELIVERED`, `FAILED`, `DLQ`).

**Retry with exponential backoff + jitter:**
- Formula: `delay = min(2^attempt + random_jitter, MAX_DELAY)`. Prevents thundering herd on shared endpoints.
- Python: `backoff` library or Celery `autoretry_for` with `retry_backoff=True`.
- Max attempts: 5-10 over 24-48h window.

**Dead Letter Queue (DLQ):**
- After N failed retries → move to `webhook_failed` table or dedicated DLQ queue.
- Expose `/webhooks/replay/{id}` endpoint for manual re-drive.
- Alert on DLQ size > threshold.

**Circuit breaker (downstream protection):**
- Per-subscriber circuit: CLOSED → OPEN after consecutive failures → HALF-OPEN after cooldown.
- Python: `aiobreaker` (async) wraps delivery task; opens circuit if subscriber returns 5xx or times out.
- Prevents hammering a dead endpoint across the retry window.

**Signature security:**
- `HMAC-SHA256(payload, shared_secret)` → `X-Hub-Signature-256` header.
- Fetch-before-process option: notify with ID only; receiver calls back to fetch payload (mitigates stale data + large payloads).

**Mapping to mekong-cli webhook engine:**
- Each `RecipeExecutor` webhook step wraps delivery in circuit breaker + idempotency check.
- `telemetry.py` records delivery attempt, status, latency per webhook call.
- DLQ = failed step table in `.mekong/memory.yaml` or SQLite sidecar.

---

## 4. Event-Driven Agent Communication

**Direction: REST between agents → Pub/Sub event bus.**

**Preferred 2026 stack:**
- **NATS Jetstream**: Low-latency, lightweight, built-in persistence. Best for local/embedded agent buses.
- **Redis Streams**: Zero-infra option if Redis already present. Consumer groups enable competing consumers.
- **Apache Pulsar**: Enterprise multi-tenancy, geo-replication (overkill for single-node CLI).

**Pub/Sub pattern:**
- Each agent publishes typed events (`TaskCompleted`, `TaskFailed`, `AgentHandoff`) to topic.
- Subscribed agents react independently — Audit Agent, Cost Tracker, Telemetry can all subscribe to `TaskCompleted` without `RecipeExecutor` knowing.
- Reduces coupling from O(n²) point-to-point to O(n) bus topology.

**Actor Model (stateful agents):**
- Each agent = Actor with private mailbox + sequential message processing. No shared state → no race conditions.
- Python: `Pykka` or `Thespian`. Best for long-lived agents (e.g., `LeadHunter` with session state).
- Stateless worker agents (e.g., `ShellAgent`) → pure message passing, no actor overhead.

**Mapping to mekong-cli:**
- `orchestrator.py` currently couples executor → verifier directly. Introduce lightweight event bus (Redis Streams or simple asyncio Queue) for decoupled agent communication.
- `telemetry.py` subscribes to all agent events for cost + trace tracking without modifying core agents.

---

## 5. Self-Healing Patterns

**2026 pattern: Monitor-Executor-Doctor triad.**

**Auto-recovery:**
- **Monitor-Executor-Doctor**: Executor runs task; Monitor detects anomaly (exit code, timeout, repeated action); Doctor agent analyzes logs, rewrites step, retries.
- **Systematic Backtracking (MIT EnCompass)**: On contradiction, agent undoes last 3 steps and reroutes. Maps to `orchestrator.py` rollback logic.
- `tenacity` library: retry decorator with exponential backoff + circuit breaker condition.

**Circuit breaker for agents:**
- Break loop if agent repeats identical action ≥ 3 times (hallucination spiral detection).
- Break on token cost > budget threshold.
- Break on wall-clock timeout per step.

**Graceful degradation:**
- Model fallback chain: `claude-opus-4-6` → `gemini-3-flash` → rule-based heuristic → HITL trigger.
- Static fallback: pre-computed results for known goal patterns (stored in `memory.yaml`).

**Causal Memory Graph (advanced):**
- Store Cause→Effect pairs from failures. On new failure, query graph for similar failure node, retrieve resolution edge. Agents learn from system-wide failures, not just own session.
- Lightweight: JSON-based in `.mekong/memory.yaml` for CLI; upgrade to SQLite graph query if > 1k events.

**Sandboxing self-healing code execution:**
- Any auto-corrected shell command must run in subprocess with resource limits (`resource.setrlimit`, timeout via `subprocess.run(timeout=N)`).
- For code-rewriting agents: Docker sandbox via `docker run --rm --network none`.

**Mapping to mekong-cli:**
- `RecipeVerifier` failure → trigger Doctor subroutine in `RecipeOrchestrator` (already has rollback; add LLM-guided retry).
- Add hallucination loop detection: track last 3 `ExecutionResult` hashes; break if identical.
- `telemetry.py` = lightweight causal memory; record `(goal, failed_step, resolution)` tuples.

---

## Architecture Summary: Pattern Map to mekong-cli

```
RecipePlanner       ← LangGraph-style DAG + SurveyConfig Pydantic input
RecipeExecutor      ← Tool-calling with idempotency keys + circuit breaker wrapper
RecipeVerifier      ← Confidence scoring + HITL gate (NEEDS_REVIEW status)
RecipeOrchestrator  ← Supervisor + Monitor-Executor-Doctor + backtracking
telemetry.py        ← Pub/Sub subscriber for all agent events (cost, trace)
WebhookEngine       ← FastAPI + Taskiq + Redis idempotency + aiobreaker DLQ
AgentCommunication  ← asyncio.Queue (now) → Redis Streams (scale)
Memory              ← Causal failure graph in .mekong/memory.yaml
```

**Recommended additions (priority order):**
1. Idempotency keys on all side-effectful executor steps (prevent duplicate git commits, webhook sends)
2. Hallucination loop detector in orchestrator (3-step hash comparison)
3. Circuit breaker around webhook delivery (`aiobreaker`)
4. HITL gate in verifier (emit `NEEDS_REVIEW` for low-confidence results)
5. Redis Streams event bus for decoupled telemetry subscription

---

## Unresolved Questions

1. Is Redis available in target deployment environment, or must event bus be in-process (asyncio.Queue)?
2. What is acceptable HITL latency? Async notification (email/Telegram) vs. blocking interactive prompt?
3. Should DLQ be file-based (`.mekong/dlq/`) or requires separate SQLite table?
4. Causal memory graph: JSON file sufficient at current scale, or should it use SQLite from day one?
5. MCP tool integration: are existing `GitAgent`, `FileAgent`, `ShellAgent` tools being exposed as MCP servers for external consumption?
