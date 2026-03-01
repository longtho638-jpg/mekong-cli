# Phase 02: Memory History & Audit Trail

## Context Links
- Research: [researcher-02-mem0-features-ecosystem.md](research/researcher-02-mem0-features-ecosystem.md) §4 Observability
- Depends on: [phase-01-memory-scope-model.md](phase-01-memory-scope-model.md) (needs `memory_id` UUID)
- Current code: `packages/memory/memory_facade.py`, `src/core/memory.py`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1h
- Add SQLite append-only history tracking for all memory mutations. Enables temporal reasoning: "what did the system believe at time T?" and provides audit trail for debugging AGI decisions.

## Key Insights
- mem0 stores history in `~/.mem0/history.db` (SQLite) — lightweight, no extra infra
- Two timestamps: `created_at` (immutable) and `updated_at` (refreshes on mutation)
- History is per `memory_id` — need stable UUIDs on `MemoryEntry`
- `history(memory_id)` returns full mutation log — useful for debugging consolidation decisions
- Timezone hardcode bug in mem0 (US/Pacific) — use `datetime.utcnow()` instead

## Requirements
- `MemoryEntry` gains `memory_id: str` field (UUID4, auto-generated)
- New module `packages/memory/memory-history-store.py` wraps SQLite history DB
- `MemoryHistoryStore.record_event(memory_id, event_type, old_content, new_content, scope)`
- Event types: `ADD`, `UPDATE`, `DELETE`
- `MemoryHistoryStore.get_history(memory_id)` → list of history rows
- `MemoryFacade.history(memory_id)` delegates to `MemoryHistoryStore`
- History DB path configurable via `MEMORY_HISTORY_DB_PATH` env var, default `~/.mekong/memory-history.db`
- History writes are best-effort — never block or raise on failure (same pattern as YAML fallback)

## Architecture

```
packages/memory/memory-history-store.py
  ────────────────────────────────────
  Table: memory_history
    id          INTEGER PRIMARY KEY AUTOINCREMENT
    memory_id   TEXT NOT NULL
    event_type  TEXT NOT NULL  -- ADD | UPDATE | DELETE
    old_content TEXT           -- NULL for ADD
    new_content TEXT           -- NULL for DELETE
    user_id     TEXT
    agent_id    TEXT
    session_id  TEXT
    created_at  TEXT           -- ISO 8601 UTC

  MemoryHistoryStore
    __init__(db_path)
    _init_db()               → CREATE TABLE IF NOT EXISTS
    record_event(memory_id, event_type, old_content, new_content, scope) → bool
    get_history(memory_id)   → List[Dict]
    get_events_since(ts)     → List[Dict]   # temporal reasoning hook

MemoryEntry (updated in Phase 01 modification)
  + memory_id: str = field(default_factory=lambda: str(uuid.uuid4()))
  + created_at: float = field(default_factory=time.time)   # immutable
  # timestamp → renamed to updated_at conceptually (keep field name for compat)

MemoryFacade
  + history(memory_id: str) → List[Dict]
  + _history_store: MemoryHistoryStore  (lazy init)
  Modified: add() records ADD event after success
  Modified: forget() records DELETE event before deletion
```

## Related Code Files
- **Create:** `packages/memory/memory-history-store.py` — SQLite history DB wrapper (~120 lines)
- **Modify:** `src/core/memory.py` — add `memory_id` UUID field to `MemoryEntry`
- **Modify:** `packages/memory/memory_facade.py` — add `.history()` method, record events on add/forget
- **Create:** `tests/test_memory_history.py` — unit tests for `MemoryHistoryStore`

## Implementation Steps

1. **Create `packages/memory/memory-history-store.py`**
   - Import `sqlite3`, `uuid`, `datetime`, `os`, `logging`
   - `MemoryHistoryStore.__init__(db_path)` — expand `~`, `mkdir parents`
   - `_init_db()` — `CREATE TABLE IF NOT EXISTS memory_history (...)`
   - `record_event(memory_id, event_type, old_content, new_content, scope)`:
     - `INSERT INTO memory_history VALUES (...)`
     - Wrap in `try/except Exception` — log warning, return `False` on failure
     - Return `True` on success
   - `get_history(memory_id)`:
     - `SELECT * FROM memory_history WHERE memory_id=? ORDER BY id ASC`
     - Return list of dicts (use `row_factory = sqlite3.Row`)
   - `get_events_since(iso_ts: str)`:
     - `SELECT * FROM memory_history WHERE created_at >= ? ORDER BY id ASC`
   - `close()` — close connection

2. **Update `src/core/memory.py` — `MemoryEntry`**
   - Add `import uuid`
   - Add `memory_id: str = field(default_factory=lambda: str(uuid.uuid4()))`
   - Add `created_at: float = field(default_factory=time.time)` (keep `timestamp` for compat, or alias)
   - NOTE: existing YAML files have no `memory_id` — handle via `__post_init__`: if `memory_id == ""`, generate one

3. **Update `packages/memory/memory_facade.py`**
   - Add `_history_store: Optional[MemoryHistoryStore] = None` instance var
   - Add `_get_history_store()` lazy init method (reads `MEMORY_HISTORY_DB_PATH` env)
   - Modify `add()`: after successful store, call `_get_history_store().record_event(memory_id, "ADD", None, content, scope)`
   - Modify `forget()`: before deletion, call `record_event(memory_id, "DELETE", old_content, None, scope)`
   - Add `history(memory_id: str) -> List[Dict]` — delegates to `_get_history_store().get_history(memory_id)`

4. **Create `tests/test_memory_history.py`**
   - Test `record_event` ADD/UPDATE/DELETE
   - Test `get_history` returns ordered events
   - Test `get_events_since` temporal filter
   - Test graceful failure (invalid DB path) returns `False`, doesn't raise

## Todo
- [ ] Create `packages/memory/memory-history-store.py`
- [ ] Add `memory_id` + `created_at` to `MemoryEntry` with backward-compat `__post_init__`
- [ ] Update `MemoryFacade` with history store lazy init
- [ ] Hook `record_event` into `MemoryFacade.add()` and `.forget()`
- [ ] Add `MemoryFacade.history()` public method
- [ ] Create `tests/test_memory_history.py`
- [ ] Run full test suite: `python3 -m pytest`

## Success Criteria
- `MemoryHistoryStore` records ADD/UPDATE/DELETE events to SQLite
- `MemoryFacade.history(memory_id)` returns ordered mutation log
- Existing `MemoryEntry` YAML files load without error (missing `memory_id` auto-generated)
- History failure (DB locked, disk full) never raises — only logs warning
- All 62 existing tests + new history tests pass

## Risk Assessment
- **Low:** SQLite is stdlib — no new dependencies
- **Medium:** YAML round-trip with new `memory_id` field — `MemoryEntry(**item)` will fail if YAML has extra unknown keys; add `**{k:v for k,v in item.items() if k in fields}` loading pattern
- **Low:** `memory_id` not returned by `MemoryFacade.add()` currently — need to either return it or generate before calling mem0

## Security Considerations
- History DB contains raw memory content — ensure `MEMORY_HISTORY_DB_PATH` is inside user home, not world-readable
- No PII scrubbing implemented — future concern

## Next Steps
- Phase 03 uses `memory_id` from history to track LLM extraction decisions
- Phase 05 (consolidation) reads history to detect temporal contradictions

## Unresolved Questions
1. Should `MemoryEntry.memory_id` be returned from `MemoryFacade.add()` (changes return type from `bool` to `str | None`)?
2. How to retrieve `old_content` before `forget()` when only `memory_id` is given — need a `get(memory_id)` method first?
