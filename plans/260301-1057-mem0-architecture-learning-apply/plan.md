---
title: "Mem0 Architecture Patterns → Mekong Memory 2.0"
description: "Learn and apply mem0ai/mem0 patterns to upgrade mekong-cli memory layer"
status: pending
priority: P1
effort: 6h
branch: master
tags: [memory, agi, mem0, architecture]
created: 2026-03-01
---

# Mem0 Architecture → Mekong Memory 2.0

Apply 6 patterns from mem0ai/mem0 research into the existing mekong-cli memory layer.
Skip graph memory (Neo4j). No code copy — pattern adoption only.

## Phases

| # | Phase | File | Status | Effort |
|---|-------|------|--------|--------|
| 01 | Memory Scope Model | [phase-01-memory-scope-model.md](phase-01-memory-scope-model.md) | pending | 0.5h |
| 02 | Memory History & Audit | [phase-02-memory-history-audit.md](phase-02-memory-history-audit.md) | pending | 1h |
| 03 | LLM Fact Extraction Pipeline | [phase-03-llm-fact-extraction.md](phase-03-llm-fact-extraction.md) | pending | 1.5h |
| 04 | Memory Categories & Filters | [phase-04-memory-categories-filters.md](phase-04-memory-categories-filters.md) | pending | 1h |
| 05 | Self-Improving Consolidation | [phase-05-self-improving-consolidation.md](phase-05-self-improving-consolidation.md) | pending | 1h |
| 06 | Integration & Tests | [phase-06-integration-tests.md](phase-06-integration-tests.md) | pending | 1h |

## Key Dependencies

- Phase 01 must complete before Phases 02–05 (scope model is the foundation)
- Phase 03 depends on Phase 01 (needs scope fields for per-scope extraction)
- Phase 05 depends on Phase 03 (consolidation uses the fact extraction pipeline)
- Phase 06 depends on all prior phases

## Files Touched

- `src/core/memory.py` — MemoryEntry + MemoryStore (Phases 01, 04)
- `packages/memory/memory_facade.py` — MemoryFacade API (Phases 01, 03, 04, 05)
- `packages/memory/mem0_client.py` — Mem0Client thin wrapper (Phase 01)
- `packages/memory/memory_history.py` — NEW: SQLite audit trail (Phase 02)
- `packages/memory/fact_extractor.py` — NEW: 3-stage LLM pipeline (Phase 03)
- `packages/memory/memory_filter.py` — NEW: boolean filter engine (Phase 04)
- `tests/test_memory.py` — extend existing tests (Phase 06)
- `tests/test_memory_history.py` — NEW (Phase 02)
- `tests/test_fact_extractor.py` — NEW (Phase 03)
- `tests/test_memory_filter.py` — NEW (Phase 04)

## Constraints

- Python 3.9+ compatible
- All new files < 200 lines
- Must NOT break YAML fallback chain
- No Neo4j dependency
- MEMORY_PROVIDER env var continues to control backend selection
