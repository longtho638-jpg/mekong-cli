# Mem0 Features & Ecosystem Integration Patterns
**Date:** 2026-03-01 | **Researcher:** researcher-02

---

## 1. Multi-Level Memory Scoping

### Isolation Model
Three orthogonal scope dimensions — can coexist simultaneously:
- `user_id` — person-level (cross-session persistence)
- `agent_id` — agent-level (agent-specific knowledge)
- `run_id` / `session_id` — ephemeral conversation scope

Enforced via `_build_filters_and_metadata()` — at least one ID required, prevents orphaned memories. All three can be combined: a memory belongs to `user=X, agent=Y, session=Z`.

### Pattern Applicable to AGI Systems
- Separate vector store collections per scope prevents cross-tenant contamination
- Hierarchical query: session-first → user fallback → agent baseline
- Scope migration: NONE-action updates session_id without modifying memory content — "move" without copy

---

## 2. Memory API Design

### Core Method Surface
```
add(messages, user_id, agent_id, run_id, metadata, infer=True, memory_type, prompt)
  → {"results": [memory_items], "relations": [graph_entities]}

search(query, user_id, agent_id, run_id, limit=100, filters, threshold, rerank=True)
  → {"results": [{id, memory, score, categories, created_at}]}

get_all(user_id, agent_id, run_id)   → all memories in scope
get(memory_id)                        → single memory with metadata
history(memory_id)                    → change log per memory (SQLite)
delete(memory_id) / delete_all()      → cascade with validation
update(memory_id, data)               → preserves created_at, refreshes updated_at
```

### Advanced Filter Pattern
```python
filters = {
  "AND": [
    {"user_id": {"eq": "alice"}},
    {"categories": {"contains": "preferences"}}
  ]
}
```
Supports: `eq, ne, gt, in, contains, AND/OR/NOT` — full boolean composition.

### Key Design Insight
`infer=True` triggers LLM extraction pipeline. `infer=False` stores raw text directly — useful for deterministic facts (system knowledge vs. extracted observations).

---

## 3. LLM Integration Pipeline (3-Stage)

### Stage 1: Fact Extraction
- Messages → LLM with task-specific system prompt
- Prompt variant selected by: presence of `agent_id` + role of messages (assistant vs. user)
- Supports multimodal (vision message parsing)
- Output: structured list of atomic facts

### Stage 2: Similarity Search
- Each extracted fact → embedding → vector search within same scope
- Retrieves top-k similar existing memories
- Graph store queried in parallel (async gather)

### Stage 3: Action Determination (ADD/UPDATE/DELETE/NONE)
- LLM receives: [new facts] + [existing similar memories]
- UUID hallucination mitigation: UUIDs replaced with temp integers for LLM, mapped back post-generation
- Output: JSON action list per memory ID
- NONE = no change, UPDATE = merge/replace, DELETE = contradiction removed

### Conflict Resolution Pattern
Contradiction detection is LLM-driven at Stage 3. When new memory contradicts existing: old memory marked DELETE, new memory ADDed. No rule-based merging — fully semantic. Risk: LLM errors on edge cases.

---

## 4. Observability & Telemetry

### Internal Telemetry
- Dedicated vector store collection `"mem0migrations"` for system events (isolated from user data)
- Uses `_safe_deepcopy_config()` to handle non-serializable provider objects
- All memory changes tracked in SQLite history DB (`~/.mem0/history.db`)
- `history(memory_id)` returns full mutation log with timestamps

### Timestamp Convention
- `created_at` — immutable on updates
- `updated_at` — refreshed on every mutation (US/Pacific timezone — hardcoded, worth noting)
- History enables temporal reasoning: "what did the system believe at time T?"

### Production Observability (Platform tier)
- SOC 2 Type II + GDPR audit logs
- Workspace-level governance for multi-tenant deployments
- No built-in metrics/tracing hooks in open-source — telemetry is append-only history

---

## 5. Configuration System

### Pluggable Provider Architecture
```python
config = MemoryConfig(
    llm=LlmConfig(
        provider="openai|anthropic|ollama|...",
        config={"model": "gpt-4o", "api_key": "...", "temperature": 0.1}
    ),
    embedder=EmbedderConfig(
        provider="openai|huggingface|...",
        config={"model": "text-embedding-3-small"}
    ),
    vector_store=VectorStoreConfig(
        provider="qdrant|chroma|pinecone|memory|...",
        config={"collection_name": "mem0", "dimension": 1536}
    ),
    graph_store=GraphStoreConfig(      # Optional
        provider="neo4j",
        url="bolt://localhost:7687",
        username="neo4j", password="..."
    ),
    history_db_path="~/.mem0/history.db"
)
```

### Defaults (Zero-Config Path)
- LLM: `gpt-4.1-nano-2025-04-14`
- Embedder: `text-embedding-3-small` (1536 dims)
- Vector store: Qdrant on-disk at `/tmp/qdrant`
- History: SQLite at `~/.mem0/history.db`

### Custom Instructions
`customPrompt` / `prompt` parameter overrides fact extraction prompt — enables domain-specific memory extraction without forking core.

---

## 6. Self-Improving Memory Patterns

### Consolidation Flow
1. Every `add()` triggers similarity search against existing scope
2. Near-duplicate detected → UPDATE action (merge facts) rather than ADD
3. Direct contradictions → DELETE old + ADD new
4. Temporal updates auto-handled: "Alice likes X" + "Alice now hates X" → second wins

### Async Concurrency Pattern
Vector store + graph operations run in parallel via:
- Python: `asyncio.gather()` (AsyncMemory) or `ThreadPoolExecutor` (sync Memory)
- Node: Promise-based parallel execution

### Memory Metadata for Categorization
```json
{"category": "preferences", "source": "conversation", "actor_id": "user"}
```
Categories enable filtered retrieval without full scan — practical for: preferences vs. facts vs. skills.

### Graph Store for Relationship Memory
Optional Neo4j integration extracts entity relationships from memories:
- "Alice works with Bob at Acme" → nodes: Alice, Bob, Acme + edges: works_with, works_at
- Enables: "who does Alice know?" queries impossible with vector-only

---

## Key Patterns for AGI Memory Systems

| Pattern | mem0 Implementation | AGI Applicability |
|---------|--------------------|--------------------|
| Scope isolation | user/agent/session IDs | Per-context memory boundaries |
| Semantic dedup | 3-stage LLM pipeline | Prevent knowledge fragmentation |
| UUID safety | int proxy for LLM IDs | LLM can't hallucinate foreign keys |
| Immutable history | SQLite append-only | Temporal reasoning, auditability |
| Action vocabulary | ADD/UPDATE/DELETE/NONE | Minimal, closed action space |
| Hybrid storage | Vector + Graph + SQL | Different query patterns per layer |
| Async parallelism | gather() on store ops | Latency reduction critical for UX |

---

## Unresolved Questions

1. How does mem0 handle very long memory histories per user (pagination, archival)?
2. What happens when LLM action determination fails mid-batch — partial commits or rollback?
3. Graph store: is relationship extraction a separate LLM call from fact extraction?
4. Is there a memory TTL/expiry mechanism, or memories are permanent until explicit delete?
5. The US/Pacific timezone hardcode in `updated_at` — intentional or bug?
