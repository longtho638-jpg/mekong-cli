# Phase 01: Memory Scope Model

## Context Links
- Research: [researcher-01-mem0-core-architecture.md](research/researcher-01-mem0-core-architecture.md)
- Research: [researcher-02-mem0-features-ecosystem.md](research/researcher-02-mem0-features-ecosystem.md)
- Current code: `src/core/memory.py`, `packages/memory/memory_facade.py`, `packages/memory/mem0_client.py`

## Overview
- **Priority:** P0 — foundation for all other phases
- **Status:** pending
- **Effort:** 0.5h
- Add tri-dimensional scoping (`user_id` / `agent_id` / `session_id`) to `MemoryEntry` and all CRUD paths. Currently the system uses a flat `user_id` string in `{agent}:{session}` format — separate these into explicit fields.

## Key Insights
- mem0 enforces at least one scope ID per operation — prevents orphaned memories
- Current `user_id="mekong:memory"` in `memory.py:62` is a smell: mashes agent + session into one string
- `MemoryFacade.add()` and `.search()` accept `user_id: str = "default:session"` — needs to become structured
- Hierarchical query pattern: session → user → agent baseline (more specific scope searched first)
- Scope migration: changing `session_id` without touching memory content (NONE action)

## Requirements
- `MemoryEntry` dataclass gains: `user_id: str = ""`, `agent_id: str = ""`, `session_id: str = ""`
- At least one of the three IDs must be non-empty (enforce via `__post_init__`)
- All facade methods accept `user_id`, `agent_id`, `session_id` as explicit kwargs
- `Mem0Client.add()` / `.search()` pass scope to underlying mem0ai calls
- YAML store: `MemoryStore.record()` and `.query()` accept optional scope kwargs, filter by non-empty scope fields
- Backward compat: callers passing old `user_id="mekong:memory"` string still work (treat as `user_id` only)

## Architecture

```
MemoryEntry (dataclass)
  goal, status, timestamp, ...     ← existing fields (unchanged)
  user_id: str = ""                ← new
  agent_id: str = ""               ← new
  session_id: str = ""             ← new
  __post_init__: assert any(user_id, agent_id, session_id)  # at least one required

MemoryScope (dataclass or TypedDict)
  user_id: str = ""
  agent_id: str = ""
  session_id: str = ""

MemoryFacade.add(content, scope: MemoryScope, metadata)
MemoryFacade.search(query, scope: MemoryScope, limit)
MemoryFacade.forget(memory_id)       ← unchanged

Mem0Client.add(content, scope: MemoryScope, metadata)
  → calls self._mem0.add(content, user_id=scope.user_id,
                         agent_id=scope.agent_id or None,
                         run_id=scope.session_id or None, ...)
Mem0Client.search(query, scope: MemoryScope, limit)
```

## Related Code Files
- **Modify:** `src/core/memory.py` — `MemoryEntry` + `MemoryStore.record()` + `MemoryStore.query()`
- **Modify:** `packages/memory/memory_facade.py` — all public methods signature change
- **Modify:** `packages/memory/mem0_client.py` — pass scope to mem0ai
- **Create:** `packages/memory/memory_scope.py` — `MemoryScope` dataclass + `_build_scope_filter()` helper

## Implementation Steps

1. **Create `packages/memory/memory-scope.py`**
   - Define `MemoryScope(user_id, agent_id, session_id)` dataclass
   - Add `validate()` method: raises `ValueError` if all three are empty
   - Add `to_mem0_kwargs()` → dict with only non-empty keys (maps `session_id` → `run_id` for mem0ai)
   - Add `DEFAULT_SCOPE = MemoryScope(user_id="mekong:default")` for backward compat

2. **Update `src/core/memory.py`**
   - Add `user_id`, `agent_id`, `session_id` fields to `MemoryEntry` (all `str = ""`)
   - Add `__post_init__` validation — warn (not raise) if all empty, set `user_id="mekong:default"` as fallback
   - Update `MemoryStore.record()` to preserve scope fields when saving YAML
   - Update `MemoryStore.query()` to accept optional `scope: Optional[MemoryScope] = None`; if given, filter entries by matching non-empty scope fields

3. **Update `packages/memory/memory_facade.py`**
   - Replace `user_id: str` parameter with `scope: Optional[MemoryScope] = None` in `add()` and `search()`
   - If `scope` is None, use `DEFAULT_SCOPE`
   - Pass scope to `Mem0Client`
   - Keep old `user_id` string path as backward-compat shim via `scope = MemoryScope(user_id=user_id)` when string arg detected

4. **Update `packages/memory/mem0_client.py`**
   - `add(content, scope: MemoryScope, metadata)` — call `self._mem0.add(**scope.to_mem0_kwargs(), ...)`
   - `search(query, scope: MemoryScope, limit)` — same pattern
   - Update `_build_mem0_config()` to also embed scope in collection name for isolation (optional, low priority)

5. **Update `src/core/memory.py` facade call site (line 69)**
   - Replace `user_id="mekong:memory"` with `scope=MemoryScope(user_id="mekong", agent_id="memory-store")`

## Todo
- [ ] Create `packages/memory/memory-scope.py`
- [ ] Update `MemoryEntry` with scope fields + `__post_init__`
- [ ] Update `MemoryStore.record()` and `.query()` scope filtering
- [ ] Update `MemoryFacade` method signatures
- [ ] Update `Mem0Client` method signatures
- [ ] Update facade call site in `memory.py`
- [ ] Verify existing `tests/test_memory.py` still passes (no scope required — defaults kick in)

## Success Criteria
- All 62 existing tests pass without modification
- `MemoryScope` can be imported from `packages.memory`
- `MemoryFacade.add(content, scope=MemoryScope(agent_id="orchestrator"))` works
- `MemoryEntry(goal="x", status="success")` still works (default scope applied)
- `Mem0Client.add(content, scope)` passes `agent_id` to underlying mem0ai call

## Risk Assessment
- **Low:** YAML store doesn't enforce scope strictly — existing entries load fine with empty scope fields
- **Medium:** mem0ai `add()` param names differ by version — verify `run_id` vs `session_id` kwarg name before implementation
- **Low:** `__post_init__` warn-not-raise ensures zero breaking changes

## Security Considerations
- Scope isolation prevents cross-agent memory leakage — critical for multi-tenant RaaS use
- `session_id` must not be user-controllable without auth boundary (future concern, not in scope here)

## Next Steps
- Phase 02 (History) adds `memory_id` UUID to `MemoryEntry` — depends on Phase 01 scope fields
- Phase 03 (Fact Extraction) uses scope to determine per-agent extraction prompt variant

## Unresolved Questions
1. Does current mem0ai version use `run_id` or `session_id` as the kwarg name?
2. Should `MemoryScope.validate()` raise or warn-and-default when all fields empty?
