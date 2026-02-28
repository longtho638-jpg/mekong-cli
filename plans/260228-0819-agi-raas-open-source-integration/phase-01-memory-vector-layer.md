# Phase 01: Memory & Vector Layer — Mem0 + Qdrant

## Context Links
- [Research Report](research/researcher-01-agi-frameworks.md) — Mang 2: Agentic RAG & Memory
- Existing: `src/core/memory.py` (YAML-based MemoryStore, 136 lines)
- Existing: `src/core/memory_client.py` (NeuralMemory HTTP client, 124 lines)
- Existing: `apps/openclaw-worker/lib/vector-service.js` (LanceDB + proxy embedding)
- Existing: `packages/core/vibe-agents/` (BaseAgent types)

## Parallelization
- **SONG SONG** voi Phase 02-05 (khong overlap file)
- File ownership: `packages/memory/` (NEW), `src/core/memory.py`, `src/core/memory_client.py`
- KHONG cham: `src/core/orchestrator.py`, `src/core/telemetry.py`, `apps/openclaw-worker/lib/auto-cto-pilot.js`, `apps/agencyos-web/`

## Overview
- **Priority:** P0
- **Status:** pending
- **Mo ta:** Thay the Chroma/YAML memory bang Mem0 OSS + Qdrant persistent vector DB. Tao `packages/memory/` package lam shared memory abstraction cho toan bo monorepo.

## Key Insights
- MemoryStore hien tai: YAML file-based, 500 entry max, substring search — KHONG scale
- NeuralMemoryClient: HTTP client cho NeuralMemory server — co the co-exist
- Mem0 OSS: hierarchical memory (user/session/agent), graph + vector hybrid
- Qdrant: Rust-native, ACID, persistent, self-hostable, horizontal scale
- LanceDB dang dung trong openclaw-worker vector-service.js — se giu lai cho backward compat

## Requirements

### Functional
- FR1: Mem0 client wrapper tich hop vao Python core engine
- FR2: Qdrant lam backend storage cho Mem0 (thay default Chroma)
- FR3: Cross-session memory: agent nho context giua cac mission
- FR4: Memory hierarchy: user-level, session-level, agent-level
- FR5: Backward-compatible API: MemoryStore.record() / .query() van hoat dong

### Non-functional
- NFR1: Qdrant chay Docker local (M1 compatible, ARM64 image)
- NFR2: Memory query latency < 200ms cho top-10 results
- NFR3: Graceful degradation: neu Qdrant down → fallback YAML store
- NFR4: Package publishable doc lap: `packages/memory/`

## Architecture

```
┌──────────────────────────────────────────────────┐
│              packages/memory/                     │
│  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ mem0_client.py│  │ qdrant_provider.py      │   │
│  │ (Mem0 wrapper)│  │ (Qdrant connection mgr) │   │
│  └──────┬───────┘  └──────────┬──────────────┘   │
│         │                     │                   │
│  ┌──────▼─────────────────────▼──────────────┐   │
│  │        memory_facade.py                    │   │
│  │  Unified API: add() / search() / forget()  │   │
│  │  Graceful fallback: Qdrant → YAML          │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │  __init__.py — public exports               │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
   src/core/memory.py          src/core/memory_client.py
   (update imports,             (add Mem0 provider option,
    delegate to facade)          keep NeuralMemory compat)
```

### Data Flow
```
Agent call → memory_facade.add(content, metadata)
  → Mem0 client → extract entities → embed via Qdrant
  → Store: vector + metadata + hierarchy tag

Agent call → memory_facade.search(query, filters)
  → Mem0 client → semantic search Qdrant
  → Return ranked results with confidence scores
  → Fallback: YAML substring search if Qdrant unavailable
```

## Related Code Files

### Modify
| File | Changes |
|------|---------|
| `src/core/memory.py` | Refactor MemoryStore to delegate to memory_facade, keep API compat |
| `src/core/memory_client.py` | Add Mem0Provider alongside NeuralMemoryClient |

### Create
| File | Purpose |
|------|---------|
| `packages/memory/__init__.py` | Package exports |
| `packages/memory/mem0_client.py` | Mem0 OSS wrapper (add/search/forget) |
| `packages/memory/qdrant_provider.py` | Qdrant connection manager + health check |
| `packages/memory/memory_facade.py` | Unified API with fallback chain |
| `packages/memory/pyproject.toml` | Package metadata + deps (mem0ai, qdrant-client) |
| `docker/qdrant/docker-compose.yml` | Qdrant self-hosted config (ARM64) |

## Implementation Steps

1. **Tao package skeleton** `packages/memory/` voi `pyproject.toml`
   - deps: `mem0ai>=0.1.0`, `qdrant-client>=1.7.0`
   - Python 3.9+ compat

2. **Implement qdrant_provider.py** (~80 lines)
   - `QdrantProvider` class: connect, health_check, close
   - Docker URL default: `http://localhost:6333`
   - Collection name: `mekong_agent_memory`
   - Embedding dim: 1536 (match existing vector-service.js)

3. **Implement mem0_client.py** (~100 lines)
   - Wrap `mem0ai.Memory` with Qdrant config
   - Methods: `add(content, user_id, metadata)`, `search(query, user_id, limit)`, `forget(memory_id)`
   - Hierarchical: user_id = "{agent_name}:{session_id}"

4. **Implement memory_facade.py** (~80 lines)
   - `MemoryFacade` class: singleton pattern
   - `add()` → try Mem0/Qdrant → fallback YAML
   - `search()` → try Mem0/Qdrant → fallback substring
   - `get_provider_status()` → health check

5. **Update src/core/memory.py** (~30 lines change)
   - Import MemoryFacade
   - `MemoryStore.record()` → also call `facade.add()`
   - `MemoryStore.query()` → prefer `facade.search()`, fallback existing

6. **Update src/core/memory_client.py** (~20 lines change)
   - Add factory: `get_memory_provider()` returns Mem0 or NeuralMemory
   - Environment toggle: `MEMORY_PROVIDER=mem0|neural|yaml`

7. **Docker compose** cho Qdrant
   - ARM64 image: `qdrant/qdrant:latest`
   - Port: 6333 (HTTP) + 6334 (gRPC)
   - Volume: `./data/qdrant_storage`

## Todo List
- [ ] Tao `packages/memory/` package skeleton
- [ ] Implement `qdrant_provider.py`
- [ ] Implement `mem0_client.py`
- [ ] Implement `memory_facade.py`
- [ ] Update `src/core/memory.py` (backward compat)
- [ ] Update `src/core/memory_client.py` (provider toggle)
- [ ] Tao `docker/qdrant/docker-compose.yml`
- [ ] Test: Qdrant health check pass
- [ ] Test: add + search round-trip
- [ ] Test: fallback YAML khi Qdrant down

## Success Criteria
- `MemoryStore.record()` + `.query()` van pass existing tests
- Qdrant container start thanh cong tren M1
- `memory_facade.search()` return relevant results < 200ms
- Graceful fallback: tat Qdrant → YAML store van hoat dong
- `python3 -m pytest tests/test_memory.py` — ALL PASS

## Conflict Prevention
- **KHONG cham** `src/core/orchestrator.py` (Phase 02 owns)
- **KHONG cham** `src/core/telemetry.py` (Phase 03 owns)
- **KHONG cham** `apps/openclaw-worker/lib/` (Phase 04 owns)
- **KHONG cham** `apps/agencyos-web/` (Phase 05 owns)
- vector-service.js (LanceDB) giu nguyen — se deprecate sau

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Qdrant Docker khong chay tren M1 ARM64 | Qdrant co official ARM64 image, da verify |
| Mem0 OSS API thay doi | Pin version trong pyproject.toml |
| Memory latency cao voi Qdrant local | Index config: HNSW, ef=128 — benchmark truoc |
| Conflict voi NeuralMemory client | Co-exist: env var toggle MEMORY_PROVIDER |

## Security Considerations
- Qdrant chay localhost only (khong expose public)
- Khong store secrets/API keys trong memory
- Memory data encrypted at rest (Qdrant default)
- User isolation qua collection-level hoac metadata filter
