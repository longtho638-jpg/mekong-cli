# Cook Report: Ch.13 用間 (mem0) + Ch.1 始計 (claude-code)

> Refs: mm7c9ix7, latest | Date: 2026-03-01

## 1. mem0ai/mem0 Ánh Xạ ✅

### Existing (pre-task)
- `packages/memory/mem0_client.py` — Mem0 wrapper with Qdrant
- `packages/memory/memory_facade.py` — Unified interface + YAML fallback
- `packages/memory/qdrant_provider.py` — Qdrant vector store

### Added (this session)
- `Mem0Client.update()` — Update existing memory content
- `Mem0Client.get_all()` — Retrieve all memories per user scope
- `Mem0Client.history()` — Memory version history
- `MemoryFacade.update/get_all/history` — Facade mirror methods

### Gaps Remaining
- Graph memory (entity relationships) — P3
- Multi-backend support (ChromaDB, pgvector) — P2
- Embedding model selection — P3

## 2. anthropics/claude-code Ánh Xạ ✅

### Implemented
- `src/core/tool_permission_registry.py` — NEW
  - ToolRisk enum: READ_ONLY, WRITE, EXECUTE, DESTRUCTIVE
  - PermissionMode: DEFAULT, PLAN, BYPASS, ACCEPT_EDITS
  - Agent allowlist/blocklist per tool
  - 9 default tools registered
  - 9 tests, all PASS

### Patterns Identified (future phases)
| Pattern | Priority | Effort |
|---|---|---|
| Declarative Tool Registry (JSON schema) | P1 | 4-6h |
| Task Dispatcher (parallel subagents) | P1 | 6-8h |
| Context Window Auto-Compaction | P2 | 8-10h |
| Hierarchical Permission Scoping | P2 | 4-6h |
| Skill Lazy-Loading | P3 | 3-4h |

## 3. Verification
- Compile: all modified files OK
- Tests: 9 tool permission + 15 QStash = 24 new tests, ALL PASS
- No security issues in new code

## Files Modified/Created
| File | Change |
|---|---|
| `packages/memory/mem0_client.py` | +update, +get_all, +history methods |
| `packages/memory/memory_facade.py` | +update, +get_all, +history facade |
| `src/core/tool_permission_registry.py` | NEW — claude-code permission model |
| `tests/test_tool_permission_registry.py` | NEW — 9 tests |
