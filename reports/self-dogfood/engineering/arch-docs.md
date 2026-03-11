# Architecture Documentation — ADRs
Generated: 2026-03-11

## System Architecture Overview

```
┌─────────────────────────────────────────────┐
│  CLI / Dashboard (user-facing)              │
│  mekong cook/fix/plan • /v1/* HTTP          │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────▼──────────┐
     │  API Gateway        │  FastAPI + JWT auth + MCU quota check
     │  src/core/gateway/  │  HTTP 402 on zero balance
     │  src/api/           │  Polar.sh webhook receiver
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │  PEV Engine         │  Plan → Execute → Verify loop
     │  src/core/          │
     │  planner.py         │  LLM task decomposition (DAG output)
     │  executor.py        │  shell/LLM/API execution per step
     │  verifier.py        │  quality gates (exit codes, assertions)
     │  orchestrator.py    │  coordinates PEV + rollback (1022 lines — REFACTOR)
     └─────────┬──────────┘
               │
  ┌────────────▼─────────────────────┐
  │  Agent Layer  src/agents/        │
  │  GitAgent  FileAgent  ShellAgent │
  │  RecipeCrawler  LeadHunter       │
  └────────────┬─────────────────────┘
               │
     ┌─────────▼──────────┐
     │  LLM Router         │  src/core/llm_client.py
     │  7 providers        │  Universal 3-var endpoint
     │  + OfflineProvider  │  Fallback chain
     └────────────────────┘
```

---

## ADR-001: PEV Engine Design

**Date:** 2025-Q4
**Status:** Accepted

**Context:** Need reliable task execution with quality guarantees for autonomous agent workflows.

**Decision:** Plan-Execute-Verify (PEV) 3-phase pipeline where each phase is independent and testable:
- **Plan** — LLM decomposes goal into ordered DAG of steps
- **Execute** — each step runs in isolation (shell/LLM/API)
- **Verify** — each step result checked against quality gates before proceeding

**Consequences:**
- Rollback is deterministic: if verify fails, undo executed steps in reverse order
- Each phase independently unit-testable (`test_planner.py`, `test_executor.py`, `test_verifier.py`)
- Overhead: 3 LLM calls minimum per goal (plan + n-steps + verify)
- Trade-off accepted: reliability > speed for agent workflows

---

## ADR-002: DAG Scheduler for Parallel Execution

**Date:** 2025-Q4
**Status:** Accepted

**Context:** Multi-step tasks often have independent sub-tasks that can run concurrently (e.g. "create 3 API endpoints" has no inter-dependency).

**Decision:** Represent execution plan as a DAG. Steps with no dependencies on pending steps run in parallel via `asyncio.gather`. Steps declare explicit `depends_on` list.

**Consequences:**
- 2–4x speedup for independent step sets
- DAG validation at plan time catches cycles before execution begins
- Added complexity in orchestrator for dependency tracking
- `dag_scheduler.py` is separate module — independently testable

---

## ADR-003: Universal LLM Router (3-var Pattern)

**Date:** 2025-Q4
**Status:** Accepted

**Context:** Users have different LLM provider preferences and budget constraints. Hard-coding OpenAI creates vendor lock-in.

**Decision:** Universal 3-variable config pattern:
```bash
LLM_BASE_URL=<any openai-compatible endpoint>
LLM_API_KEY=<provider api key>
LLM_MODEL=<model name>
```
With automatic fallback chain: OpenRouter → AgentRouter → Qwen → DeepSeek → Anthropic → OpenAI → Gemini → Ollama → OfflineProvider.

**Consequences:**
- Any OpenAI-compatible provider works out of the box
- OfflineProvider enables fully local operation (zero API cost)
- Fallback chain adds resilience but can mask misconfiguration
- Import time: 1.13s (acceptable for CLI use)

---

## ADR-004: SQLite for Multi-Tenant State

**Date:** 2026-Q1
**Status:** Accepted (with review trigger)

**Context:** Need tenant/credit/mission persistence. PostgreSQL adds operational complexity for early-stage product.

**Decision:** SQLite at `/data/tenants.db` on Fly.io persistent volume. Fly.io volume provides persistence across restarts.

**Consequences:**
- Zero operational overhead (no separate DB service)
- Works locally and on Fly.io identically
- Single-writer limitation: acceptable for current load (<100 RPS)
- **Review trigger:** migrate to PostgreSQL when concurrent writes exceed SQLite limits or when horizontal scaling is needed

---

## ADR-005: 5-Layer Command Cascade

**Date:** 2025-Q3
**Status:** Accepted

**Context:** Business users (founders, managers) need different command vocabularies than engineers. Flat command list of 289 commands is unusable.

**Decision:** Organize all commands into 5 hierarchical layers mirroring company org structure:
1. Founder (strategic)
2. Business (operations)
3. Product (management)
4. Engineer (technical)
5. Ops (maintenance)

**Consequences:**
- Commands are discoverable by role (`mekong founder/annual`)
- Each layer has distinct MCU cost profile (Founder commands cost more, run less often)
- Namespace collisions prevented by layer prefix
- CLAUDE.md and README use 5-layer pyramid as primary mental model

---

## ADR-006: Polar.sh as Sole Payment Provider

**Date:** 2026-Q1
**Status:** Accepted — Non-negotiable

**Decision:** Polar.sh Standard Webhooks only. No Stripe, no PayPal.

**Rationale:** Global rule (`payment-provider.md`). PayPal removed from codebase in prior commits. Stripe references in `deployment-guide.md` are stale and should be removed.

**Consequences:**
- Simpler billing surface (one provider)
- `POLAR_*` env vars required; `STRIPE_*`/`PAYPAL_*` must be removed
