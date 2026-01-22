# Phase 1: Infrastructure Layer Refactoring (P0 - Critical)

> **Priority:** P0 - CRITICAL
> **Status:** COMPLETED
> **Effort:** 4h
> **Completed:** 2026-01-20

## Overview

The `antigravity/infrastructure/opentelemetry/` module contains the largest files in the codebase. These must be split to comply with the 200-line limit.

## Key Insights

- `tracer.py` (599 lines) contains: DistributedTracer class, agent management, span operations, export logic
- `processors.py` (586 lines) contains: multiple processor loop factories, batch processing
- `exporters.py` (525 lines) contains: multiple exporter implementations

## Requirements

### Functional
- Maintain exact same public API
- All existing tests must pass
- No behavior changes

### Non-Functional
- Each new file <= 200 lines
- Clear separation of concerns
- Proper `__all__` exports

## Architecture

### tracer.py (599 lines) -> Split into:

```
opentelemetry/
  tracer/
    __init__.py          # Re-exports DistributedTracer
    core.py              # DistributedTracer class (main logic)
    agent_manager.py     # Agent registration and management
    span_operations.py   # Span creation, finishing, tracing methods
    export_handler.py    # Export callback and related logic
```

### processors.py (586 lines) -> Split into:

```
opentelemetry/
  processors/
    __init__.py          # Re-exports factory functions
    span_processor.py    # create_span_processor_loop
    metrics_processor.py # create_metrics_processor_loop
    export_processor.py  # create_export_processor_loop
    base.py              # Shared utilities and types
```

### exporters.py (525 lines) -> Split into:

```
opentelemetry/
  exporters/
    __init__.py          # Re-exports all exporters
    jaeger.py            # Jaeger exporter
    otlp.py              # OTLP exporter
    prometheus.py        # Prometheus exporter
    base.py              # Base exporter class
```

## Related Code Files

### Files to Modify
- `antigravity/infrastructure/opentelemetry/__init__.py`

### Files to Create
- `antigravity/infrastructure/opentelemetry/tracer/__init__.py`
- `antigravity/infrastructure/opentelemetry/tracer/core.py`
- `antigravity/infrastructure/opentelemetry/tracer/agent_manager.py`
- `antigravity/infrastructure/opentelemetry/tracer/span_operations.py`
- `antigravity/infrastructure/opentelemetry/tracer/export_handler.py`
- `antigravity/infrastructure/opentelemetry/processors/__init__.py`
- `antigravity/infrastructure/opentelemetry/processors/span_processor.py`
- `antigravity/infrastructure/opentelemetry/processors/metrics_processor.py`
- `antigravity/infrastructure/opentelemetry/processors/export_processor.py`
- `antigravity/infrastructure/opentelemetry/processors/base.py`
- `antigravity/infrastructure/opentelemetry/exporters/__init__.py`
- `antigravity/infrastructure/opentelemetry/exporters/jaeger.py`
- `antigravity/infrastructure/opentelemetry/exporters/otlp.py`
- `antigravity/infrastructure/opentelemetry/exporters/prometheus.py`
- `antigravity/infrastructure/opentelemetry/exporters/base.py`

### Files to Delete (after migration)
- `antigravity/infrastructure/opentelemetry/tracer.py`
- `antigravity/infrastructure/opentelemetry/processors.py`
- `antigravity/infrastructure/opentelemetry/exporters.py`

## Implementation Steps

1. [x] Create `tracer/` directory structure
2. [x] Extract agent management logic to `agent_manager.py`
3. [x] Extract span operations to `span_operations.py`
4. [x] Extract export handler to `export_handler.py`
5. [x] Create `core.py` with main DistributedTracer class
6. [x] Create `tracer/__init__.py` with re-exports
7. [x] Repeat for `processors/` module
8. [x] Repeat for `exporters/` module
9. [x] Update parent `__init__.py`
10. [x] Run tests: `pytest tests/test_opentelemetry.py`
11. [x] Verify line counts: `wc -l` on all new files

## Todo List

- [x] Backup original files
- [x] Create tracer/ directory
- [x] Split tracer.py into 4 modules
- [x] Create processors/ directory
- [x] Split processors.py into 4 modules
- [x] Create exporters/ directory
- [x] Split exporters.py into 4 modules
- [x] Update __init__.py exports
- [x] Run pytest
- [x] Verify all files <= 200 lines

## Success Criteria

- [x] All new files <= 200 lines
- [x] `pytest tests/test_opentelemetry.py` passes 100%
- [x] No import errors
- [x] Same public API maintained

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking imports | Keep old files as aliases until verified |
| Circular imports | Use TYPE_CHECKING for type hints |
| Test failures | Run tests after each file split |

## Security Considerations

- No secrets exposed
- No new dependencies added

## Next Steps

After Phase 1:
- Proceed to Phase 2 (Core Engines)
- Update documentation
