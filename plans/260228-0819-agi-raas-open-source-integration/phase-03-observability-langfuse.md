# Phase 03: Observability & Telemetry — Langfuse

## Context Links
- [Research Report](research/researcher-01-agi-frameworks.md) — Mang 3: RaaS Platform Tools
- Existing: `src/core/telemetry.py` (TelemetryCollector, 129 lines, JSON trace to disk)
- Existing: `apps/openclaw-worker/lib/mission-journal.js` (mission telemetry)
- Existing: `apps/openclaw-worker/lib/agi-score-calculator.js` (5-dimension scoring)
- Existing: `apps/openclaw-worker/lib/token-tracker.js` (token usage tracking)

## Parallelization
- **SONG SONG** voi Phase 01, 02, 04, 05
- File ownership: `packages/observability/` (NEW), `src/core/telemetry.py`
- KHONG cham: `src/core/memory.py` (Phase 01), `src/core/orchestrator.py` (Phase 02), `apps/openclaw-worker/lib/auto-cto-pilot.js` (Phase 04), `apps/agencyos-web/` (Phase 05)

## Overview
- **Priority:** P0
- **Status:** pending
- **Mo ta:** Tich hop Langfuse self-hosted lam agent observability platform. Track: LLM calls, token cost, latency, trace hierarchy (goal → steps → LLM calls). Thay the JSON-on-disk telemetry hien tai.

## Key Insights
- TelemetryCollector hien tai: ghi JSON file, khong co dashboard, khong track cost
- Langfuse: MIT license, self-hosted Docker, OTel-compatible, cost tracking, prompt management
- Langfuse Python SDK: decorator-based tracing (`@observe`), zero-friction integration
- RaaS revenue tracking: per-tenant token usage → billing integration (Polar.sh)
- Langfuse co built-in dashboard UI → khong can build custom observability UI

## Requirements

### Functional
- FR1: Langfuse trace moi `run_from_goal()` call: goal → steps → LLM calls hierarchy
- FR2: Token cost tracking per LLM call (input/output tokens, model name)
- FR3: Per-tenant trace isolation (user_id tag in Langfuse)
- FR4: Latency tracking per step va per LLM call
- FR5: Backward-compat: TelemetryCollector van ghi JSON file song song

### Non-functional
- NFR1: Langfuse self-hosted via Docker Compose (PostgreSQL + Langfuse server)
- NFR2: Trace overhead < 10ms per span (async flush)
- NFR3: Graceful degradation: Langfuse down → fallback JSON telemetry
- NFR4: Package publishable: `packages/observability/`

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              packages/observability/                   │
│                                                        │
│  ┌─────────────────────┐  ┌───────────────────────┐  │
│  │ langfuse_provider.py│  │ trace_decorator.py    │  │
│  │ (Langfuse SDK wrap) │  │ (@observe shortcuts)  │  │
│  └──────────┬──────────┘  └───────────┬───────────┘  │
│             │                          │               │
│  ┌──────────▼──────────────────────────▼───────────┐  │
│  │          observability_facade.py                  │  │
│  │  start_trace() / end_trace() / record_llm()      │  │
│  │  Dual-write: Langfuse + JSON file                 │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
         │
         ▼
   src/core/telemetry.py
   (update TelemetryCollector to delegate to facade)
```

### Trace Hierarchy
```
Trace (goal: "deploy app")
  └── Span (step 1: "Install deps")
       └── Generation (LLM call: planner decomposition)
  └── Span (step 2: "Build project")
       └── Generation (LLM call: self-healing correction)
  └── Span (step 3: "Run tests")
  └── Score (success_rate: 100%, total_cost: $0.05)
```

### Langfuse Self-Hosted Stack
```
docker-compose:
  langfuse-server:    port 3100 (web UI + API)
  langfuse-postgres:  port 5433 (metadata storage)
```

## Related Code Files

### Modify
| File | Changes |
|------|---------|
| `src/core/telemetry.py` | Delegate to observability_facade, keep JSON write as backup |

### Create
| File | Purpose |
|------|---------|
| `packages/observability/__init__.py` | Package exports |
| `packages/observability/langfuse_provider.py` | Langfuse SDK wrapper: init, trace, span, generation |
| `packages/observability/trace_decorator.py` | `@traced` decorator cho functions |
| `packages/observability/observability_facade.py` | Unified API, dual-write Langfuse + JSON |
| `packages/observability/pyproject.toml` | Package deps (langfuse>=2.0.0) |
| `docker/langfuse/docker-compose.yml` | Langfuse self-hosted config |

## Implementation Steps

1. **Tao package skeleton** `packages/observability/` voi `pyproject.toml`
   - deps: `langfuse>=2.0.0`
   - Python 3.9+ compat

2. **Implement langfuse_provider.py** (~90 lines)
   - `LangfuseProvider` class:
     - `__init__(host, public_key, secret_key)` — env var defaults
     - `start_trace(name, user_id, metadata)` → Langfuse trace
     - `start_span(trace, name)` → Langfuse span
     - `record_generation(span, model, input, output, usage)` → Langfuse generation
     - `end_trace(trace, status)` → flush
     - `score(trace, name, value)` → quality score
   - Env vars: `LANGFUSE_HOST`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`

3. **Implement trace_decorator.py** (~40 lines)
   - `@traced(name="step_name")` decorator
   - Auto-creates span, measures duration, records errors
   - Uses context var to find parent trace

4. **Implement observability_facade.py** (~80 lines)
   - `ObservabilityFacade` singleton
   - `start_trace()` → create Langfuse trace + legacy ExecutionTrace
   - `record_step()` → Langfuse span + legacy StepTrace
   - `record_llm_call()` → Langfuse generation + counter
   - `finish_trace()` → flush Langfuse + write JSON
   - Try/except: Langfuse fail → log warning, JSON write continues

5. **Update src/core/telemetry.py** (~40 lines change)
   - Import ObservabilityFacade
   - `TelemetryCollector.start_trace()` → `facade.start_trace()`
   - `TelemetryCollector.record_step()` → `facade.record_step()`
   - `TelemetryCollector.record_llm_call()` → `facade.record_llm_call()`
   - `TelemetryCollector.finish_trace()` → `facade.finish_trace()`
   - Keep all existing JSON write logic as fallback

6. **Docker Compose** cho Langfuse self-hosted
   ```yaml
   services:
     langfuse-server:
       image: langfuse/langfuse:2
       ports: ["3100:3000"]
       environment:
         DATABASE_URL: postgresql://langfuse:langfuse@langfuse-db:5432/langfuse
         NEXTAUTH_SECRET: ${LANGFUSE_NEXTAUTH_SECRET}
         SALT: ${LANGFUSE_SALT}
     langfuse-db:
       image: postgres:16-alpine
       ports: ["5433:5432"]
       volumes: ["langfuse_data:/var/lib/postgresql/data"]
   ```

7. **Env config** — them vao `.env.example`
   ```
   LANGFUSE_HOST=http://localhost:3100
   LANGFUSE_PUBLIC_KEY=pk-...
   LANGFUSE_SECRET_KEY=sk-...
   ```

## Todo List
- [ ] Tao `packages/observability/` package skeleton
- [ ] Implement `langfuse_provider.py`
- [ ] Implement `trace_decorator.py`
- [ ] Implement `observability_facade.py`
- [ ] Update `src/core/telemetry.py` (delegate to facade)
- [ ] Tao `docker/langfuse/docker-compose.yml`
- [ ] Them env vars vao `.env.example`
- [ ] Test: Langfuse trace visible trong UI
- [ ] Test: JSON file van duoc ghi khi Langfuse down
- [ ] Test: token cost tracking chinh xac

## Success Criteria
- Langfuse Docker start thanh cong, UI accessible tai `http://localhost:3100`
- `TelemetryCollector.start_trace()` tao Langfuse trace + JSON backup
- LLM generation tracking: model name, tokens, cost hien thi trong Langfuse
- Graceful fallback: stop Langfuse container → JSON telemetry van hoat dong
- `python3 -m pytest tests/test_telemetry.py` — ALL PASS
- Per-tenant isolation: traces filter by user_id trong Langfuse UI

## Conflict Prevention
- **KHONG cham** `src/core/memory.py` (Phase 01 owns)
- **KHONG cham** `src/core/orchestrator.py` (Phase 02 owns)
- **KHONG cham** `apps/openclaw-worker/lib/auto-cto-pilot.js` (Phase 04 owns)
- **KHONG cham** `apps/agencyos-web/` (Phase 05 owns)
- mission-journal.js: Phase 03 KHONG modify — Phase 06 se bridge

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Langfuse Docker nang (PostgreSQL) tren M1 16GB | Limit postgres max_connections=20, shared_buffers=128MB |
| Langfuse SDK async flush lam mat data khi crash | Enable sync flush cho critical traces, async cho normal |
| Token cost calculation sai | Cross-validate voi Antigravity Proxy usage logs |
| Langfuse breaking API update | Pin `langfuse>=2.0.0,<3.0.0` |

## Security Considerations
- Langfuse localhost only (khong expose port 3100 ra public)
- NEXTAUTH_SECRET va SALT trong .env (khong commit)
- Trace data khong chua user PII — chi goal text va metrics
- Public/secret key pair cho Langfuse API auth
