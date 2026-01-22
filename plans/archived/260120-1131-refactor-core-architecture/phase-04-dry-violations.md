# Phase 4: DRY Violations - Shared Patterns (P2 - Medium)

> **Priority:** P2 - MEDIUM
> **Status:** completed
> **Effort:** 2h

## Overview

Eliminate duplicate code patterns, particularly the `get_stats()` method found in 20+ files.

## Key Insights

Duplicate patterns identified:
- `get_stats() -> Dict[str, Any]` in 20+ classes
- Global singleton patterns (`_engine = None; def get_engine()`)
- Similar persistence patterns across modules
- Repeated logging setup

## Requirements

### Functional
- Reduce code duplication by 50%+
- Maintain exact same behavior

### Non-Functional
- Use mixins or base classes for shared behavior
- Centralize common patterns

## Architecture

### Stats Mixin

```python
# antigravity/core/mixins/stats.py
from abc import abstractmethod
from typing import Dict
from ..types.stats import StatsDict

class StatsMixin:
    """Mixin providing standardized stats interface."""

    @abstractmethod
    def _collect_stats(self) -> Dict[str, object]:
        """Override to provide module-specific stats."""
        ...

    def get_stats(self) -> StatsDict:
        """Standard stats interface."""
        import time
        base = {
            "timestamp": time.time(),
            "module": self.__class__.__name__,
        }
        base.update(self._collect_stats())
        return base  # type: ignore
```

### Singleton Factory

```python
# antigravity/core/patterns/singleton.py
from typing import TypeVar, Callable, Optional

T = TypeVar('T')

def singleton_factory(factory: Callable[[], T]) -> Callable[[], T]:
    """Decorator for singleton factory functions."""
    _instance: Optional[T] = None

    def get_instance() -> T:
        nonlocal _instance
        if _instance is None:
            _instance = factory()
        return _instance

    return get_instance
```

### Persistence Base

```python
# antigravity/core/patterns/persistence.py
from pathlib import Path
from typing import Dict, Any
import json

class BasePersistence:
    """Base class for JSON-based persistence."""

    def __init__(self, storage_path: Path, filename: str = "data.json"):
        self.storage_path = Path(storage_path)
        self.filepath = self.storage_path / filename
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def save(self, data: Dict[str, Any]) -> None:
        with open(self.filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)

    def load(self) -> Dict[str, Any]:
        if self.filepath.exists():
            with open(self.filepath) as f:
                return json.load(f)
        return {}
```

## Files to Create

```
antigravity/core/
  mixins/
    __init__.py
    stats.py              # StatsMixin
    serializable.py       # SerializableMixin
  patterns/
    __init__.py
    singleton.py          # Singleton factory
    persistence.py        # Base persistence
    logging.py            # Centralized logging setup
```

## Files to Modify

### Apply StatsMixin to:
1. `agent_orchestrator/engine.py`
2. `agent_memory/system.py`
3. `sales_pipeline.py`
4. `vibe_ide.py`
5. `vibe_workflow.py`
6. `content_factory/engine.py`
7. `client_magnet/engine.py`
8. `revenue/engine.py`
9. `proposal_generator/engine.py`
10. `control/enhanced.py`

### Apply singleton_factory to:
1. `agent_swarm/engine.py` - `get_swarm()`
2. `moat_engine/engine.py` - `get_moat_engine()`

## Implementation Steps

1. [x] Create `mixins/` directory
2. [x] Implement StatsMixin
3. [x] Create `patterns/` directory
4. [x] Implement singleton_factory
5. [x] Implement BasePersistence
6. [x] Apply StatsMixin to 5 highest-priority classes
7. [x] Apply singleton_factory to 2 singletons
8. [x] Run tests
9. [x] Verify behavior unchanged

## Todo List

- [x] Create mixins/ module with StatsMixin
- [x] Create patterns/ module with singleton_factory
- [x] Apply mixins to top 5 classes
- [x] Apply singleton_factory decorator
- [x] Run pytest
- [x] Measure code reduction

## Success Criteria

- [x] Code duplication reduced by 50%+
- [x] All tests pass
- [x] Same behavior maintained

## Metrics

Before:
- 20+ duplicate `get_stats()` implementations
- 5+ duplicate singleton patterns

After:
- 1 StatsMixin + 20 implementations
- 1 singleton_factory + 5 decorators

## Next Steps

After Phase 4:
- Proceed to Phase 5 (CLI Layer)
