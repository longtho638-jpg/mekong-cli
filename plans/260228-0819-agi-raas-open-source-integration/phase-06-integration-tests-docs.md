# Phase 06: Integration Tests & Documentation

## Context Links
- [Phase 01](phase-01-memory-vector-layer.md) — Memory/Qdrant
- [Phase 02](phase-02-agent-orchestration-langgraph.md) — LangGraph
- [Phase 03](phase-03-observability-langfuse.md) — Langfuse
- [Phase 04](phase-04-self-healing-engine.md) — Aider bridge
- [Phase 05](phase-05-agent-marketplace-registry.md) — Marketplace UI
- Existing tests: `tests/test_memory.py`, `tests/test_telemetry.py`, `tests/test_orchestrator_integration.py`, `tests/test_self_healing.py`
- Existing docs: `docs/` directory

## Parallelization
- **SEQUENTIAL** — chay SAU Phase 01-05 tat ca hoan thanh
- File ownership: `tests/test_memory_qdrant.py` (NEW), `tests/test_langgraph.py` (NEW), `tests/test_langfuse.py` (NEW), `tests/test_aider_bridge.py` (NEW), `docs/agi-integration.md` (NEW)
- KHONG modify existing test files — chi tao NEW test files

## Overview
- **Priority:** P2
- **Status:** pending (blocked by Phase 01-05)
- **Mo ta:** Integration tests cross-cutting tat ca 5 phase truoc. Verify toan bo AGI pipeline hoat dong end-to-end. Update docs.

## Key Insights
- Existing test suite: 62 tests, ~2.5min run time
- Tests phai chay OFFLINE (khong can Qdrant/Langfuse Docker running)
- Strategy: mock external services, test integration logic
- Docs can update: `docs/system-architecture.md`, `docs/agi-integration.md` (NEW)

## Requirements

### Functional
- FR1: Test Mem0/Qdrant facade: add → search → fallback chain
- FR2: Test LangGraph engine: graph run → same result as linear pipeline
- FR3: Test Langfuse facade: trace → span → generation → JSON backup
- FR4: Test Aider bridge: spawn mock → parse output → timeout handling
- FR5: End-to-end: goal → graph orchestrate → memory record → trace log
- FR6: Documentation: architecture diagram, setup guide, API reference

### Non-functional
- NFR1: All tests pass without external services (mock/stub)
- NFR2: Total new test run time < 30s
- NFR3: Docs trong markdown, compatible voi existing docs/ structure

## Architecture

```
tests/
├── test_memory.py               # EXISTING (khong modify)
├── test_telemetry.py            # EXISTING (khong modify)
├── test_orchestrator_integration.py  # EXISTING (khong modify)
├── test_self_healing.py         # EXISTING (khong modify)
│
├── test_memory_qdrant.py        # NEW — Phase 01 integration
├── test_langgraph.py            # NEW — Phase 02 integration
├── test_langfuse.py             # NEW — Phase 03 integration
└── test_aider_bridge.py         # NEW — Phase 04 integration

docs/
├── system-architecture.md       # UPDATE — add AGI layer section
└── agi-integration.md           # NEW — setup guide + API reference
```

## Related Code Files

### Modify
| File | Changes |
|------|---------|
| `docs/system-architecture.md` | Them section AGI Integration Layer |

### Create
| File | Purpose |
|------|---------|
| `tests/test_memory_qdrant.py` | Mem0 facade + Qdrant provider tests |
| `tests/test_langgraph.py` | GraphEngine state transitions tests |
| `tests/test_langfuse.py` | Observability facade + dual-write tests |
| `tests/test_aider_bridge.py` | Aider bridge spawn + timeout tests |
| `docs/agi-integration.md` | AGI integration setup guide + API reference |

## Implementation Steps

### 1. test_memory_qdrant.py (~100 lines)

```python
# Test cases:
class TestMemoryFacade:
    def test_add_and_search_with_qdrant(self):
        """Mock Qdrant, verify facade routes to Mem0 provider"""

    def test_fallback_yaml_when_qdrant_down(self):
        """Qdrant unavailable → YAML store used"""

    def test_memory_hierarchy_user_session(self):
        """user_id format: agent_name:session_id"""

    def test_backward_compat_memory_store(self):
        """MemoryStore.record() + .query() still work"""

    def test_provider_health_check(self):
        """get_provider_status() returns correct state"""
```

### 2. test_langgraph.py (~120 lines)

```python
class TestGraphEngine:
    def test_graph_produces_same_result_as_linear(self):
        """GraphEngine.run() output == RecipeOrchestrator.run_from_goal()"""

    def test_conditional_retry_on_verify_fail(self):
        """Verify fail → retry plan max 2 times"""

    def test_rollback_after_max_retries(self):
        """3rd verify fail → rollback triggered"""

    def test_state_serialization(self):
        """GraphState fully serializable (asdict)"""

    def test_graceful_fallback_no_langgraph(self):
        """ImportError → linear pipeline used"""

    def test_mermaid_export(self):
        """export_mermaid() returns valid Mermaid string"""
```

### 3. test_langfuse.py (~80 lines)

```python
class TestObservabilityFacade:
    def test_trace_creates_langfuse_and_json(self):
        """Dual-write: Langfuse trace + JSON file"""

    def test_generation_records_token_usage(self):
        """record_llm_call() tracks model, tokens, cost"""

    def test_fallback_json_when_langfuse_down(self):
        """Langfuse unavailable → JSON write continues"""

    def test_trace_hierarchy(self):
        """Trace → Span → Generation nesting correct"""

    def test_per_tenant_isolation(self):
        """user_id tag set correctly on traces"""
```

### 4. test_aider_bridge.py (~80 lines)

```python
class TestAiderBridge:
    def test_aider_available_check(self):
        """isAiderAvailable() detects installed/not installed"""

    def test_try_aider_fix_success(self):
        """Mock aider process → fix applied → success=true"""

    def test_try_aider_fix_timeout(self):
        """Aider exceeds 5min → process killed → success=false"""

    def test_extract_affected_files(self):
        """Parse error log → extract file paths"""

    def test_m1_thermal_blocks_aider(self):
        """Overheating → skip aider → return early"""

    def test_max_attempts_fallback(self):
        """2 failed attempts → success=false, fallback to mission"""
```

### 5. docs/agi-integration.md (~150 lines)

```markdown
# AGI Integration Guide

## Prerequisites
- Docker (for Qdrant + Langfuse)
- pipx (for Aider)
- Python 3.9+

## Quick Start
1. Start infrastructure: docker compose -f docker/docker-compose.agi.yml up -d
2. Install Aider: pipx install aider-chat
3. Configure env: copy .env.agi.example → .env

## Architecture Overview
[Mermaid diagram showing all 5 layers]

## Memory Layer (Mem0 + Qdrant)
- Config: MEMORY_PROVIDER=mem0|neural|yaml
- API: memory_facade.add() / .search() / .forget()

## Orchestration (LangGraph)
- Config: RecipeOrchestrator(use_graph=True)
- Graph: Plan → Execute → Verify → Report/Retry

## Observability (Langfuse)
- Dashboard: http://localhost:3100
- Config: LANGFUSE_HOST, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY

## Self-Healing (Aider)
- Config: .aider.conf.yml
- Trigger: auto-cto-pilot Phase 3 verify

## Marketplace
- URL: /dashboard/marketplace
- Data source: /raas/registry/ API

## Troubleshooting
[Common issues and fixes]
```

### 6. Update docs/system-architecture.md

Them section:
```markdown
## AGI Integration Layer (v2026.2.28)

| Component | Tool | Package |
|-----------|------|---------|
| Memory | Mem0 + Qdrant | packages/memory/ |
| Orchestration | LangGraph | src/core/graph_engine.py |
| Observability | Langfuse | packages/observability/ |
| Self-Healing | Aider | apps/openclaw-worker/lib/aider-bridge.js |
| Marketplace | Next.js | apps/agencyos-web/app/dashboard/marketplace/ |
```

### 7. Docker compose aggregate

Create `docker/docker-compose.agi.yml`:
```yaml
# Includes: Qdrant + Langfuse + Langfuse-DB
# Single command: docker compose -f docker/docker-compose.agi.yml up -d
```

## Todo List
- [ ] Create `tests/test_memory_qdrant.py`
- [ ] Create `tests/test_langgraph.py`
- [ ] Create `tests/test_langfuse.py`
- [ ] Create `tests/test_aider_bridge.py`
- [ ] Run full test suite: `python3 -m pytest` — ALL PASS
- [ ] Create `docs/agi-integration.md`
- [ ] Update `docs/system-architecture.md`
- [ ] Create `docker/docker-compose.agi.yml` (aggregate)
- [ ] Create `.env.agi.example` template
- [ ] Verify: agencyos-web marketplace page build pass

## Success Criteria
- `python3 -m pytest tests/test_memory_qdrant.py tests/test_langgraph.py tests/test_langfuse.py tests/test_aider_bridge.py` — ALL PASS
- `python3 -m pytest` (full suite) — ALL PASS, no regressions
- `docker compose -f docker/docker-compose.agi.yml up -d` — all services healthy
- `docs/agi-integration.md` covers setup + API + troubleshooting
- `pnpm --filter agencyos-web build` — 0 errors

## Conflict Prevention
- Tat ca test files la NEW — khong modify existing tests
- docs/agi-integration.md la NEW file
- docs/system-architecture.md: chi APPEND section cuoi — khong modify existing content
- docker/docker-compose.agi.yml: NEW file, reference Phase 01+03 compose files

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Phase 01-05 chua xong khi bat dau Phase 06 | STRICT dependency: Phase 06 chi start sau 01-05 ALL completed |
| Mock khong phan anh real behavior | Integration test voi Docker services trong CI (optional) |
| Test flaky do timing | Use deterministic mocks, khong rely on real timers |
| Docs outdated nhanh | Link docs to source code, auto-generated sections where possible |

## Security Considerations
- Test files khong chua secrets (mock env vars)
- .env.agi.example: placeholder values only, KHONG real keys
- Docker compose: localhost binding only (khong expose ports)
