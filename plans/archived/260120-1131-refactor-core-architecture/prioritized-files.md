# Prioritized Refactoring File List

> Generated: 2026-01-20
> Status: Ready for implementation

## Priority Legend

| Priority | Description | Action |
|----------|-------------|--------|
| P0 | Critical - Blocks go-live | Immediate refactor |
| P1 | High - Significant debt | Refactor in current sprint |
| P2 | Medium - Code smell | Refactor when touching file |
| P3 | Low - Nice to have | Backlog |

---

## P0 - Critical (Files > 300 lines)

| # | File | Lines | Action | Phase |
|---|------|-------|--------|-------|
| 1 | `antigravity/infrastructure/opentelemetry/tracer.py` | 599 | Split into 4 modules | 1 |
| 2 | `antigravity/infrastructure/opentelemetry/processors.py` | 586 | Split into 4 modules | 1 |
| 3 | `antigravity/infrastructure/opentelemetry/exporters.py` | 525 | Split into 4 modules | 1 |
| 4 | `antigravity/core/ml/models.py` | 327 | Split by domain | 2 |
| 5 | `antigravity/core/agent_swarm/engine.py` | 327 | Verify modularization | 2 |
| 6 | `antigravity/infrastructure/scale.py` | 317 | Split into modules | 2 |
| 7 | `antigravity/core/revenue/ai.py` | 314 | Extract strategies | 2 |
| 8 | `antigravity/cli/__init__.py` | 308 | Extract sub-modules | 5 |

---

## P1 - High (Files 250-300 lines)

| # | File | Lines | Action | Phase |
|---|------|-------|--------|-------|
| 9 | `antigravity/platform/data_moat.py` | 266 | Split data/analytics | 2 |
| 10 | `antigravity/core/registry.py` | 261 | Extract helpers | 2 |
| 11 | `antigravity/infrastructure/opentelemetry/__init__.py` | 260 | Simplify exports | 1 |
| 12 | `antigravity/core/control/analytics.py` | 257 | Extract reporters | 2 |
| 13 | `antigravity/core/checkpointing.py` | 254 | Split save/restore | 2 |
| 14 | `cli/entrypoint.py` | 251 | Extract command groups | 5 |
| 15 | `antigravity/core/algorithm/ml_engine.py` | 250 | Extract strategies | 2 |

---

## P2 - Medium (Files 200-250 lines)

| # | File | Lines | Action | Phase |
|---|------|-------|--------|-------|
| 16 | `antigravity/core/control/circuit_breaker.py` | 248 | Extract helpers | 4 |
| 17 | `antigravity/core/hooks_manager.py` | 246 | Extract validators | 4 |
| 18 | `antigravity/core/ml/inference.py` | 246 | Extract utilities | 2 |
| 19 | `antigravity/core/agent_memory/system.py` | 240 | Extract indexer | 4 |
| 20 | `antigravity/core/vibe_workflow.py` | 238 | Extract steps | 4 |
| 21 | `antigravity/infrastructure/opentelemetry/tracing_agent.py` | 236 | Extract operations | 1 |
| 22 | `antigravity/core/control/feature_flags.py` | 236 | Extract storage | 4 |
| 23 | `antigravity/core/autonomous_mode.py` | 234 | Extract handlers | 4 |
| 24 | `antigravity/core/knowledge/search_engine.py` | 230 | Extract indexer | 4 |
| 25 | `antigravity/infrastructure/opentelemetry/span.py` | 230 | Extract serializer | 1 |

---

## Type Safety Issues (P1)

| # | File | Issue | Action |
|---|------|-------|--------|
| 1 | `core/headless.py` | `Dict[str, Any]` returns | Add TypedDict |
| 2 | `core/agent_memory/system.py` | `context: Dict[str, Any]` | Add ContextDict |
| 3 | `core/agent_orchestrator/engine.py` | `Dict[str, Any]` returns | Add StatsDict |
| 4 | `core/hooks_manager.py` | Multiple Any params | Add HookContext type |
| 5 | `core/sales_pipeline.py` | `Dict[str, Any]` returns | Add PipelineStats |
| 6 | `core/swarm/coordinator.py` | `payload: Any` | Add PayloadType |

---

## DRY Violations (P2)

| Pattern | Occurrences | Fix |
|---------|-------------|-----|
| `get_stats() -> Dict[str, Any]` | 20+ | StatsMixin |
| `_engine = None; def get_engine()` | 5+ | singleton_factory |
| JSON persistence pattern | 8+ | BasePersistence |
| Logging setup | 15+ | configure_logging() |

---

## Quick Reference Commands

```bash
# Find files by line count
find antigravity cli -name "*.py" -exec wc -l {} \; | sort -rn | head -30

# Find Any type usage
grep -r "Any" antigravity/core --include="*.py" | wc -l

# Find get_stats duplicates
grep -r "def get_stats" antigravity --include="*.py" | wc -l

# Run tests
pytest tests/ -v

# Type check
mypy antigravity/ --ignore-missing-imports
```

---

## Execution Order

1. **Phase 1**: Files 1-3, 11, 21, 25 (OpenTelemetry)
2. **Phase 2**: Files 4-7, 9-10, 12-15 (Core Engines)
3. **Phase 3**: Type safety issues (6 files)
4. **Phase 4**: Files 16-25 + DRY violations
5. **Phase 5**: Files 8, 14 (CLI)
6. **Phase 6**: Testing all changes
7. **Phase 7**: Documentation and delivery
