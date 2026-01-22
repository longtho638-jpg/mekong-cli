# Phase 3: Type Safety Enhancement (P1 - High)

> **Priority:** P1 - HIGH
> **Status:** in_progress
> **Effort:** 3h

## Overview

Eliminate `Any` types from public APIs and establish consistent type patterns across the codebase.

## Key Insights

Current type issues:
- 20+ files use `Dict[str, Any]` in public methods
- Inconsistent return types: `Dict`, `dict`, `Dict[str, Any]`
- Missing TypedDict definitions for complex return values
- No Protocol classes for shared interfaces

## Requirements

### Functional
- All public APIs must have explicit types
- No behavior changes

### Non-Functional
- Zero `Any` in public method signatures
- TypedDict for complex dictionaries
- Protocol classes for shared interfaces

## Architecture

### New Type Definitions

Create `antigravity/core/types/`:

```
types/
  __init__.py              # Re-exports all types
  stats.py                 # StatsDict, MetricsDict
  responses.py             # APIResponse, ErrorResponse
  config.py                # ConfigDict, SettingsDict
  protocols.py             # HasStats, Serializable, etc.
```

### Protocol Classes

```python
# protocols.py
from typing import Protocol, Dict

class HasStats(Protocol):
    """Protocol for objects that provide statistics."""
    def get_stats(self) -> 'StatsDict': ...

class Serializable(Protocol):
    """Protocol for serializable objects."""
    def to_dict(self) -> Dict[str, object]: ...

class Configurable(Protocol):
    """Protocol for configurable objects."""
    def configure(self, config: 'ConfigDict') -> None: ...
```

### TypedDict Definitions

```python
# stats.py
from typing import TypedDict, Optional

class StatsDict(TypedDict):
    timestamp: float
    total_count: int
    success_count: int
    error_count: int
    avg_duration: float

class MetricsDict(TypedDict):
    active_agents: int
    total_tasks: int
    throughput: float
    error_rate: float
```

## Files to Modify

### High Priority (Public APIs)
1. `antigravity/core/agent_orchestrator/engine.py` - `get_stats()` return type
2. `antigravity/core/agent_memory/system.py` - context parameter
3. `antigravity/core/hooks_manager.py` - hook context types
4. `antigravity/core/sales_pipeline.py` - pipeline breakdown types
5. `antigravity/core/swarm/coordinator.py` - payload types

### Medium Priority (Internal APIs)
6. `antigravity/core/vibe_ide.py`
7. `antigravity/core/vibe_workflow.py`
8. `antigravity/core/unified_dashboard.py`
9. `antigravity/core/control/analytics.py`
10. `antigravity/core/control/enhanced.py`

## Implementation Steps

1. [x] Create `types/` directory
2. [x] Define StatsDict TypedDict
3. [x] Define MetricsDict TypedDict
4. [x] Create HasStats Protocol
5. [x] Update `get_stats()` methods to use StatsDict
6. [x] Replace `Dict[str, Any]` with specific TypedDicts
7. [ ] Add type: ignore comments only where truly necessary
8. [ ] Run mypy type checking
9. [x] Verify no regressions

## Todo List

- [x] Create antigravity/core/types/ module
- [x] Define StatsDict and MetricsDict
- [x] Define HasStats, Serializable protocols
- [x] Update 10 highest-priority files
- [ ] Run mypy --strict on modified files
- [ ] Document any remaining Any types with justification

## Success Criteria

- [ ] Zero `Any` in public method signatures
- [ ] TypedDict for all dict return types
- [ ] mypy passes with no errors
- [ ] All tests pass

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking runtime behavior | TypedDict is runtime-compatible |
| Too strict types | Use Union types where needed |
| mypy false positives | Selective type: ignore with reason |

## Commands

```bash
# Check type coverage
mypy antigravity/core --strict --ignore-missing-imports

# Check specific file
mypy antigravity/core/agent_orchestrator/engine.py --strict
```

## Next Steps

After Phase 3:
- Proceed to Phase 4 (DRY Violations)
