# Mem0 Core Architecture Research
**Date:** 2026-03-01 | **Source:** github.com/mem0ai/mem0, docs.mem0.ai

---

## 1. Core Architecture Overview

Mem0 is a **managed memory layer** for LLM agents providing persistent, contextual memory across sessions. Core principle: reduce prompt bloat by intelligently storing/retrieving facts instead of full conversation history.

**Three scopes:**
- `user_id` — persists across all conversations for a user
- `agent_id` — agent-specific context/behavior memory
- `run_id` — session/conversation-scoped ephemeral memory

**Mandatory scoping:** Every memory operation requires at least one of these identifiers — no orphaned memories allowed. Enforced via `_build_filters_and_metadata()`.

---

## 2. Dual-Store Architecture (Vector + Graph)

**Two parallel backends run concurrently:**

```
Input → Fact Extraction (LLM) → [Vector Store] + [Graph Store] (parallel, ThreadPoolExecutor)
                                        ↓               ↓
                                  Semantic Facts    Entity Relations
                                        └───────────────┘
                                        Merged Result
```

- **Vector Store**: Stores factual embeddings for semantic similarity search (Qdrant, ChromaDB, Pinecone, etc. via VectorStoreFactory)
- **Graph Store**: Stores entity-relationship triples (Neo4j) for structured relational queries
- Results merged: vector hits + `"relations"` key for graph hits

Both are **optional but complementary**. Graph adds structured reasoning; vector handles fuzzy semantic recall.

---

## 3. Memory Lifecycle (CRUD)

### Add Flow (Intelligent Inference Mode)
```
1. Parse messages (conversation history or raw text)
2. LLM extracts discrete facts (system prompt → structured JSON)
3. Embed each fact → search existing vector store for similar memories
4. LLM decides per-fact: ADD | UPDATE | DELETE | NONE
5. Execute atomic operations with UUID mapping
6. Parallel: Graph extraction (entities + relationships) → Neo4j upsert
7. History tracked in SQLite (audit trail)
```

**Raw mode** (no inference): stores message directly, skips LLM fact extraction.

**Procedural memory** (special case): `memory_type="procedural_memory"` → LLM generates agent behavioral summaries instead of facts.

### Search Flow
```
1. Embed query → vector similarity search
2. Apply filters (user_id, agent_id, etc.) + advanced operators (AND/OR/NOT)
3. Optional: reranker re-scores results
4. Optional: graph store queried for related entities
5. Return MemoryItem list + "relations" dict
```

### Update/Delete
- Preserve session metadata (user_id etc.) when modifying content
- All changes logged to SQLite history — full audit trail
- LLM-driven: during `add()`, conflicts with existing memories trigger auto-UPDATE or DELETE via LLM decision

---

## 4. Factory Pattern (Pluggable Backends)

All backends are swappable via factories:
- `EmbedderFactory` → embedding model (OpenAI, Azure, Ollama, HuggingFace, etc.)
- `VectorStoreFactory` → vector DB (Qdrant, ChromaDB, Pinecone, Weaviate, pgvector, etc.)
- `LlmFactory` → LLM for fact extraction (OpenAI, Anthropic, Gemini, Ollama, etc.)
- `GraphStoreFactory` → graph DB (Neo4j)

Config via dict/YAML, no code changes needed to swap backends.

---

## 5. Sync/Async Dual Interface

```python
Memory       # Synchronous — uses ThreadPoolExecutor for parallel ops
AsyncMemory  # Asynchronous — uses asyncio
```

Both inherit `MemoryBase`, identical logic. Choose based on runtime context.

---

## 6. LLM Agent Integration Pattern

Standard integration pattern:
```python
# Before LLM call: retrieve relevant memories
memories = memory.search(user_query, user_id=uid, limit=5)
context = "\n".join([m["memory"] for m in memories["results"]])

# Inject into system prompt
system_prompt = f"Relevant user context:\n{context}\n\n{base_prompt}"

# After LLM response: store new facts
memory.add(conversation_history, user_id=uid)
```

Supports: CrewAI, LangChain, LangGraph, MCP (Model Context Protocol) for universal agent integration.

---

## 7. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| LLM-driven CRUD | Merging/deduplication is semantic, not rule-based |
| Parallel vector+graph | Neither backend blocks the other |
| SQLite for history | Lightweight audit trail, no extra infra |
| Mandatory session scope | Prevents cross-user memory leakage |
| Reranker optional | Performance vs accuracy tradeoff per use case |
| Raw vs inference mode | Flexibility: simple storage OR intelligent extraction |

---

## 8. Applicability to Mekong-CLI

- **Pattern to adopt**: Dual-store (vector semantic + graph relational) with LLM-driven fact extraction
- **Session scoping**: Map to `user_id`/`agent_id`/`run_id` equivalents in mekong context
- **Backend choice**: ChromaDB (already in use via claude-mem) for vector; skip Neo4j unless graph relations needed
- **Key insight**: Memory ops should be async, non-blocking to agent main loop
- **Integration hook**: Before/after LLM calls in `orchestrator.py` (retrieve context → inject → store result)

---

## Unresolved Questions

1. Graph memory performance overhead — Neo4j adds infra complexity; worth it without structured entity queries?
2. Fact extraction quality depends heavily on LLM prompt quality — mem0's system prompts not fully documented publicly
3. Conflict resolution strategy when LLM decides UPDATE vs DELETE on ambiguous facts — deterministic?
4. ChromaDB vs Qdrant: mem0 recommends Qdrant for production — does current claude-mem ChromaDB suffice?
