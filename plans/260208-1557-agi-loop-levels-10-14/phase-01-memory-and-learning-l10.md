# Phase 01: Memory & Learning (Level 10)

## Context Links
- [AGI Roadmap](../../plans/agi-roadmap-levels-10-14.md)
- [Orchestrator](../../src/core/orchestrator.py) — hook point for recording executions
- [EventBus](../../src/core/event_bus.py) — add MEMORY_RECORDED, PATTERN_DETECTED events
- [Telemetry](../../src/core/telemetry.py) — pattern reference for disk persistence
- [Gateway](../../src/core/gateway.py) — add /memory/* endpoints
- [Main CLI](../../src/main.py) — add `memory` sub-app

## Overview
- **Priority:** P1
- **Status:** pending
- **Version:** v0.7.0
- **Description:** Add long-term memory and learning to Mekong. Record every execution outcome, query history, detect failure patterns, and suggest fixes based on past experience.

## Key Insights
- Telemetry already writes to `.mekong/telemetry/` — memory uses same pattern but `.mekong/memory.yaml`
- Orchestrator's `run_from_goal()` is the hook point — record result after execution completes
- FIFO eviction at 500 entries keeps memory bounded
- PatternAnalyzer needs no ML — simple frequency counting + time bucketing suffices

## Requirements

### Functional
- Record goal, status, timestamp, duration, error summary, recipe used after each execution
- Query memory by goal pattern (substring match)
- Calculate success rate per goal pattern
- Get last failure for a goal pattern
- Suggest fix based on historical failures
- Detect patterns: repeated failures, time-of-day correlations
- Persist to `.mekong/memory.yaml`, max 500 entries FIFO
- Gateway endpoints: GET /memory/recent, /memory/stats, /memory/search
- CLI: `mekong memory list|stats|clear`

### Non-Functional
- Memory file load < 100ms for 500 entries
- No external dependencies (PyYAML already available)
- Thread-safe for gateway concurrent requests

## Architecture

```
Orchestrator.run_from_goal()
    └─> MemoryStore.record(entry)
            └─> EventBus.emit(MEMORY_RECORDED)
                    └─> PatternAnalyzer.on_memory_recorded()
                            └─> EventBus.emit(PATTERN_DETECTED) [if pattern found]
```

Data flow: Orchestrator -> MemoryStore -> YAML disk -> PatternAnalyzer -> EventBus

## Related Code Files

### Create
| File | Lines | Purpose |
|------|-------|---------|
| `src/core/memory.py` | ~150 | MemoryEntry dataclass + MemoryStore class |
| `src/core/learner.py` | ~100 | PatternAnalyzer class |
| `tests/test_memory.py` | ~120 | MemoryStore tests |
| `tests/test_learner.py` | ~80 | PatternAnalyzer tests |

### Modify
| File | Change |
|------|--------|
| `src/core/event_bus.py` | Add `MEMORY_RECORDED`, `PATTERN_DETECTED` to EventType enum |
| `src/core/orchestrator.py` | Import MemoryStore, record after `run_from_goal()` completes |
| `src/core/gateway.py` | Add /memory/* endpoints, Pydantic models, VERSION bump to 0.7.0 |
| `src/core/__init__.py` | Export MemoryEntry, MemoryStore, PatternAnalyzer |
| `src/main.py` | Add `memory` Typer sub-app, version bump to 0.7.0 |

## Implementation Steps

### 1. Add EventType entries (src/core/event_bus.py)

Add to `EventType` enum:
```python
MEMORY_RECORDED = "memory_recorded"
PATTERN_DETECTED = "pattern_detected"
```

### 2. Create MemoryStore (src/core/memory.py)

```python
@dataclass
class MemoryEntry:
    """Single execution memory record."""
    goal: str
    status: str  # "success" | "failed" | "partial" | "rolled_back"
    timestamp: float = field(default_factory=time.time)
    duration_ms: float = 0.0
    error_summary: str = ""
    recipe_used: str = ""

class MemoryStore:
    """Long-term execution memory with YAML persistence."""
    MAX_ENTRIES: int = 500

    def __init__(self, store_path: Optional[str] = None) -> None: ...
    def record(self, entry: MemoryEntry) -> None: ...
    def query(self, goal_pattern: str) -> List[MemoryEntry]: ...
    def get_success_rate(self, goal_pattern: str = "") -> float: ...
    def get_last_failure(self, goal_pattern: str = "") -> Optional[MemoryEntry]: ...
    def suggest_fix(self, goal: str) -> str: ...
    def recent(self, limit: int = 20) -> List[MemoryEntry]: ...
    def stats(self) -> Dict[str, Any]: ...
    def clear(self) -> None: ...
    def _load(self) -> None: ...
    def _save(self) -> None: ...
    def _evict(self) -> None: ...  # FIFO when > MAX_ENTRIES
```

Key behaviors:
- `record()` appends entry, calls `_evict()`, calls `_save()`, emits `MEMORY_RECORDED` via EventBus
- `query()` filters entries where `goal_pattern` is substring of `entry.goal` (case-insensitive)
- `get_success_rate()` returns float 0-100, empty pattern = global rate
- `suggest_fix()` looks at last 5 failures with similar goal, returns error_summary patterns
- `stats()` returns `{"total": int, "success_rate": float, "top_goals": List[str], "recent_failures": int}`

### 3. Create PatternAnalyzer (src/core/learner.py)

```python
@dataclass
class Pattern:
    """A detected execution pattern."""
    pattern_type: str  # "repeated_failure" | "time_correlation" | "recipe_effectiveness"
    description: str
    confidence: float  # 0.0-1.0
    data: Dict[str, Any] = field(default_factory=dict)

class PatternAnalyzer:
    """Analyzes memory entries to detect patterns and suggest improvements."""

    def __init__(self, memory_store: MemoryStore) -> None: ...
    def analyze_failures(self) -> List[Pattern]: ...
    def get_recipe_effectiveness(self) -> Dict[str, float]: ...
    def get_time_patterns(self) -> List[Pattern]: ...
    def on_memory_recorded(self, event: Event) -> None: ...  # EventBus subscriber
```

Key behaviors:
- `analyze_failures()` groups entries by goal, finds goals with >3 consecutive failures -> Pattern
- `get_recipe_effectiveness()` returns {recipe_name: success_rate} dict
- `get_time_patterns()` buckets executions into 4 time slots (0-6, 6-12, 12-18, 18-24), reports best slot
- `on_memory_recorded()` auto-subscribes to EventBus, runs lightweight analysis, emits `PATTERN_DETECTED` if new pattern

### 4. Hook Orchestrator (src/core/orchestrator.py)

In `RecipeOrchestrator.__init__()`:
```python
from .memory import MemoryStore, MemoryEntry
self.memory = MemoryStore()
```

At end of `run_from_goal()`, before `return result`:
```python
entry = MemoryEntry(
    goal=goal,
    status=result.status.value,
    duration_ms=(time.time() - start_time) * 1000,
    error_summary="; ".join(result.errors[:3]) if result.errors else "",
    recipe_used=result.recipe.name if result.recipe else "",
)
self.memory.record(entry)
```

Add `start_time = time.time()` at top of `run_from_goal()`.

### 5. Gateway endpoints (src/core/gateway.py)

Pydantic models:
```python
class MemoryEntryInfo(BaseModel):
    goal: str
    status: str
    timestamp: float
    duration_ms: float
    error_summary: str
    recipe_used: str

class MemoryStatsResponse(BaseModel):
    total: int
    success_rate: float
    top_goals: List[str]
    recent_failures: int
```

Routes inside `create_app()`:
```python
memory_store = MemoryStore()

@gateway.get("/memory/recent", response_model=List[MemoryEntryInfo])
def memory_recent(limit: int = 20): ...

@gateway.get("/memory/stats", response_model=MemoryStatsResponse)
def memory_stats(): ...

@gateway.get("/memory/search", response_model=List[MemoryEntryInfo])
def memory_search(q: str = ""): ...
```

### 6. CLI commands (src/main.py)

```python
memory_app = typer.Typer(help="Memory: execution history & learning")
app.add_typer(memory_app, name="memory")

@memory_app.command("list")
def memory_list(limit: int = 20): ...  # Table of recent entries

@memory_app.command("stats")
def memory_stats(): ...  # Success rate, total, top goals

@memory_app.command("clear")
def memory_clear(): ...  # Clear all memory with confirmation
```

### 7. Version bump
- `src/core/gateway.py`: `VERSION = "0.7.0"`
- `src/main.py`: Update version display string to "0.7.0"

### 8. Write tests

**tests/test_memory.py** — `class TestMemoryEntry(unittest.TestCase)`:
- `test_memory_entry_creation` — dataclass defaults
- `test_memory_entry_with_error` — error_summary populated
- `test_record_and_query` — record 3 entries, query by pattern
- `test_query_case_insensitive` — "Deploy" matches "deploy app"
- `test_success_rate_all` — 2 success + 1 fail = 66.7%
- `test_success_rate_filtered` — rate for specific goal pattern
- `test_get_last_failure` — returns most recent failed entry
- `test_suggest_fix_with_history` — returns error patterns
- `test_recent_default_limit` — returns last 20
- `test_stats_structure` — contains total, success_rate, top_goals, recent_failures
- `test_persistence_roundtrip` — save, new instance, verify loaded
- `test_fifo_eviction` — 501 entries -> oldest removed
- `test_clear` — empties store and file

**tests/test_learner.py** — `class TestPatternAnalyzer(unittest.TestCase)`:
- `test_analyze_no_failures` — empty result
- `test_analyze_repeated_failures` — 4 same-goal failures -> pattern
- `test_recipe_effectiveness` — tracks per-recipe success rate
- `test_time_patterns` — buckets into time slots
- `test_event_subscriber` — on_memory_recorded emits PATTERN_DETECTED
- `test_empty_memory` — handles gracefully

### 9. Run tests
```bash
python3 -m pytest tests/ -v --tb=short
```

## Todo List
- [ ] Add MEMORY_RECORDED, PATTERN_DETECTED to EventType
- [ ] Create src/core/memory.py with MemoryEntry + MemoryStore
- [ ] Create src/core/learner.py with PatternAnalyzer
- [ ] Hook MemoryStore into orchestrator.run_from_goal()
- [ ] Add gateway /memory/* endpoints
- [ ] Add CLI memory sub-app
- [ ] Bump version to 0.7.0
- [ ] Write tests/test_memory.py (13 tests)
- [ ] Write tests/test_learner.py (6 tests)
- [ ] Update src/core/__init__.py exports
- [ ] Run full test suite, verify 235+

## Success Criteria
- `python3 -m pytest tests/ -v` passes with 235+ tests
- `.mekong/memory.yaml` created after `mekong cook` execution
- `mekong memory list` shows recent entries
- `mekong memory stats` shows success rate
- GET /memory/recent returns JSON array
- Memory capped at 500 entries (FIFO)

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| YAML load slow for 500 entries | Low | Benchmark; switch to JSON if needed |
| Race condition on concurrent writes | Medium | File-level locking in _save() |
| Memory file corruption | Low | Try/except on load, default to empty |

## Security Considerations
- Memory file may contain goal strings with sensitive info — stored locally only
- No secrets in memory entries (error_summary truncated)
- Gateway /memory/* endpoints inherit existing token auth

## Next Steps
- L11 NLU Brain will use MemoryStore for smart routing decisions
- PatternAnalyzer feeds into L13 Self-Evolution recipe generation
