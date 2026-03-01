# Mem0 Architecture Analysis for Mekong-CLI

**Date:** 2026-03-01 13:01
**Researcher:** mem0ai/mem0 GitHub repo + installed mem0 package
**Context:** Upgrade mekong-cli memory system with patterns from mem0ai/mem0

---

## Executive Summary

Mem0 là universal memory layer cho AI agents với 3 tier: **user** → **agent** → **session**. Core architecture:
- **Memory class** (main.py): CRUD + semantic search via LLM fact extraction
- **Graph memory**: Entity relationships & knowledge graph (MemGraph, Kuzu)
- **Multi-storage**: Qdrant (vector), SQLite (history), Neo4j (graph)
- **User/Agent/Session isolation** via metadata filters + SQL WHERE clauses

**Top 5 patterns áp dụng cho mekong-cli:**
1. **Multi-level isolation** (user_id/agent_id/run_id) → session scoping
2. **LLM-driven fact extraction** → auto-contextualization of goals
3. **Graph entity relationships** → goal dependency mapping
4. **History tracking** → version control of memory evolution
5. **Reranker integration** → semantic relevance scoring post-search

---

## Part 1: Mem0 Core Architecture

### 1.1 Memory Class API (mem0/memory/main.py)

**Core CRUD Methods:**

```python
class Memory:
    # Store
    def add(self, messages, *, user_id, agent_id, run_id,
            metadata=None, infer=True, memory_type=None, prompt=None) -> dict

    # Retrieve by ID
    def get(self, memory_id) -> dict

    # Search
    def search(self, query, *, user_id, agent_id, run_id,
               limit=100, filters=None, threshold=None, rerank=True) -> list

    # Update
    def update(self, memory_id, data) -> dict

    # Delete
    def delete(self, memory_id)
    def delete_all(self, *, user_id, agent_id, run_id)

    # Listing
    def get_all(self, *, user_id, agent_id, run_id, filters=None, limit=100)

    # History
    def history(self, memory_id) -> list
```

**Key behaviors:**
- `infer=True` → LLM extracts facts, decides ADD/UPDATE/DELETE automatically
- `infer=False` → Raw message storage (no inference)
- `memory_type="procedural_memory"` → Special handling for agent procedures
- **Timeout protection:** Config `version="v1.1"` uses 60s timeout per operation

### 1.2 Config Structure (mem0/configs/base.py)

```python
MemoryConfig(
    vector_store=VectorStoreConfig(
        provider='qdrant',  # or chromadb, pgvector, pinecone
        config=QdrantConfig(
            collection_name='mem0',
            embedding_model_dims=1536,  # OpenAI text-embedding-ada-002
            path='/tmp/qdrant'  # or url= for remote
        )
    ),
    llm=LlmConfig(
        provider='openai',  # or anthropic, gemini, etc
        config={}  # API key from env
    ),
    embedder=EmbedderConfig(
        provider='openai',  # text-embedding-ada-002
        config={}
    ),
    graph_store=GraphStoreConfig(
        provider='neo4j',  # or kuzu, memgraph
        llm=None,  # Reuses main LLM
        threshold=0.7  # Similarity threshold for entity linking
    ),
    reranker=None,  # Optional: jina, cohere for post-search ranking
    history_db_path='~/.mem0/history.db'  # SQLite for versioning
)
```

---

## Part 2: Multi-Level Isolation (User/Agent/Session)

### 2.1 How Mem0 Separates Memories

**Three-level scoping via metadata filters:**

```python
# User-level: Shared across all agent sessions
m.add("User prefers Python", user_id="alice", agent_id=None, run_id=None)
# → Stored in vector DB with metadata: {user_id: "alice"}

# Agent-level: Per-agent memory, shared across runs
m.add("Agent learned K8s best practices", user_id="alice", agent_id="devops_agent", run_id=None)
# → metadata: {user_id: "alice", agent_id: "devops_agent"}

# Session-level: Single execution context
m.add("In this session, we chose TypeScript", user_id="alice", agent_id="devops_agent", run_id="run_123")
# → metadata: {user_id: "alice", agent_id: "devops_agent", run_id: "run_123"}

# Search filters by scope
results = m.search("Python preferences", user_id="alice", agent_id="devops_agent", run_id=None)
# → Only matches memories with matching user_id + agent_id, ignores run_id
```

**Implementation in Qdrant:**
- Vector stored with `payload` (metadata dict)
- Qdrant filter: `field: "user_id" must_equal "alice"`
- Combined filters via AND logic: `user_id AND agent_id AND run_id`

### 2.2 Isolation Benefits for Mekong-CLI

Current mekong-cli uses single-user YAML persistence. Mem0 pattern enables:

| Scope | Use Case | Example |
|-------|----------|---------|
| **User** | Cross-project learning | "Alice always uses Zod for validation" |
| **Agent** | Agent specialization | "ContentWriter learned keyword density=2%" |
| **Session** | Current execution context | "In this run, chose React over Vue" |

---

## Part 3: LLM-Driven Fact Extraction (Inference)

### 3.1 How mem0.add(infer=True) Works

When `infer=True` (default):

```python
m.add(
    messages="I prefer Python 3.11 for production",
    user_id="alice",
    infer=True,  # ← Enable fact extraction
)
```

**Pipeline:**
1. **Message parsing:** Extract role/content pairs if list format
2. **Fact extraction:** LLM reads message → outputs JSON facts:
   ```json
   [
     {"fact": "User Alice prefers Python 3.11", "type": "preference"},
     {"fact": "Context: Production environment", "type": "context"}
   ]
   ```
3. **Update decision:** LLM compares new facts to existing memories:
   - Duplicate → UPDATE existing memory
   - Similar but new detail → UPDATE with merged info
   - Totally new → ADD new memory
   - Contradictory → DELETE old + ADD new
4. **Embedding + storage:** Embed each fact, upsert to Qdrant

**Custom prompts:**
```python
m.add(
    messages="...",
    custom_fact_extraction_prompt="""
    Extract ONLY procedural steps.
    Focus on: pre-conditions, steps, post-conditions.
    """
)
```

### 3.2 Mekong-CLI Application

Currently mekong-cli's `MemoryStore.query()` does substring matching. With LLM inference:

```python
# Current (YAML):
entries = store.query("Python validation")
# → Case-insensitive substring search, low precision

# With mem0 inference:
results = mem0.search("How do we validate inputs?", user_id="mekong:default")
# → LLM understands intent, returns semantically similar memories
# Returns: ["Zod for schemas", "Input validation with Pydantic", "Type checking with TypeScript"]
```

---

## Part 4: Graph Memory (Entity Relationships)

### 4.1 Graph Store Types in Mem0

```
Graph DB Options:
├── Neo4j (production-grade, complex queries)
├── Kuzu (lightweight, SQL-like API)
└── MemGraph (in-memory, dev-friendly)
```

**Entity relationships tracked:**
```
[User: Alice] --uses--> [Tool: Python]
[Project: MekongCLI] --has-component--> [Memory: MemoryStore]
[Goal: "Add OAuth"] --depends-on--> [Goal: "Database setup"]
[Agent: ContentWriter] --learned--> [Skill: "Keyword optimization"]
```

### 4.2 Graph Retrieval (Knowledge Graph Queries)

```python
# Instead of vector search, query graph relationships:
# "Find all tools Alice uses"
cypher_query = """
MATCH (user:User {name: 'alice'})-[:uses]->(tool:Tool)
RETURN tool.name
"""

# "Find all goals that depend on 'Database setup'"
cypher_query = """
MATCH (goal:Goal)-[:depends_on]->(dep:Goal {name: 'Database setup'})
RETURN goal.name
"""
```

### 4.3 Mekong-CLI Graph Use Cases

Current system has flat goal list. Graph patterns enable:

| Query | Current | With Graph |
|-------|---------|-----------|
| "What's the history of goal X?" | MemoryEntry linear list | Entity version history |
| "Which goals depend on this task?" | Manual search | MATCH dependencies |
| "Learn from similar past goals?" | Substring match | Entity type clustering |
| "Auto-generate task checklist?" | Manual | Traverse dependency graph |

---

## Part 5: Reranker Integration (Semantic Relevance)

### 5.1 Post-Search Ranking

`search(rerank=True)` invokes reranker AFTER vector search:

```python
# Step 1: Vector search (Qdrant)
candidates = vector_store.search(query, top_k=100)  # 100 candidates

# Step 2: Rerank (if enabled)
if rerank:
    reranker = JinaReranker()  # or CohereReranker
    final_results = reranker.rank(
        query=query,
        documents=candidates,
        top_k=5  # Return top 5 after reranking
    )
```

**Reranker benefits:**
- Vector distance ≈ broad relevance
- Reranker ≈ precise relevance to exact query
- Example: "How to deploy to AWS?"
  - Vector finds: 100 AWS-related memories
  - Reranker narrows: Top 5 deployment-specific

### 5.2 Mekong-CLI: When to Use Reranking

| Scenario | Rerank | Why |
|----------|--------|-----|
| Goal suggestion (broad) | No | First-pass search sufficient |
| Error fix lookup (precise) | Yes | Need exact error match, not similar errors |
| Recipe recommendation | No | Vector diversity more valuable |
| Security vulnerability search | Yes | False positives costly |

---

## Part 6: Current Mekong-CLI Memory System

### 6.1 Existing Implementations

**YAML Persistence (src/core/memory.py):**
```python
class MemoryStore:
    MAX_ENTRIES = 500

    def record(self, entry: MemoryEntry) -> None
    def query(self, goal_pattern: str) -> List[MemoryEntry]
    def get_success_rate(self, goal_pattern: str = "") -> float
    def suggest_fix(self, goal: str) -> str
    def recent(self, limit: int = 20) -> List[MemoryEntry]
    def stats(self) -> Dict[str, Any]
```

**MemoryEntry:**
```python
@dataclass
class MemoryEntry:
    goal: str
    status: str  # "success" | "failed" | "partial" | "rolled_back"
    timestamp: float
    duration_ms: float
    error_summary: str = ""
    recipe_used: str = ""
```

**Vector Store (src/core/vector_memory_store.py):**
```python
class VectorMemoryStore:
    # Collections with fixed dimensionality
    def create_collection(self, name: str, dimension: int)
    def upsert(self, collection, id, vector, payload)
    def search(self, collection, query_vector, top_k) -> List[(VectorEntry, score)]
```

**Memory Facade (packages/memory/memory_facade.py):**
```python
class MemoryFacade:
    # Priority: Mem0 + Qdrant → YAML fallback
    def add(self, content: str, user_id: str, metadata: Dict)
    def search(self, query: str, user_id: str, limit: int)
    def update(self, memory_id: str, content: str)
    def forget(self, memory_id: str)
```

---

## Part 7: What's Missing in Mekong-CLI

### 7.1 Gaps Analysis

| Feature | Mem0 | Mekong-CLI | Gap |
|---------|------|------------|-----|
| **Multi-level isolation** | ✓ user/agent/session | ✗ single user | Can't isolate agent memories |
| **LLM fact extraction** | ✓ infer=True | ✗ raw goals | Goals not semantically normalized |
| **Graph relationships** | ✓ Neo4j/Kuzu | ✗ flat list | Can't track goal dependencies |
| **History/versioning** | ✓ SQLite history table | ✗ YAML overwrites | Can't audit memory changes |
| **Reranking** | ✓ post-search ranking | ✗ cosine similarity | Search precision limited |
| **Memory types** | ✓ procedural_memory | ✗ only MemoryEntry | Can't categorize memory intent |
| **Metadata filters** | ✓ rich metadata query | ✗ goal substring match | Can't filter by status/recipe |
| **Graph queries** | ✓ Cypher/SQL | ✗ linear search | Can't find dependency chains |

### 7.2 Priority (YAGNI Principle)

**Must-have (V1):**
1. Multi-level isolation (user_id/agent_id/run_id)
2. Metadata filters (status, recipe, timestamp)
3. LLM fact extraction for goal normalization

**Should-have (V2):**
4. History/versioning via SQLite
5. Reranker integration

**Nice-to-have (V3):**
6. Graph memory for dependency tracking
7. Advanced Cypher querying

---

## Implementation Plan (Files & Functions)

### Phase 1: Upgrade MemoryEntry + Isolation

**File: `src/core/memory.py` (expand)**

```python
# NEW: Add isolation fields
@dataclass
class MemoryEntry:
    goal: str
    status: str
    user_id: str = "default:user"  # ← NEW
    agent_id: str = "default:agent"  # ← NEW
    run_id: str = ""  # ← NEW (optional)
    timestamp: float = field(default_factory=time.time)
    duration_ms: float = 0.0
    error_summary: str = ""
    recipe_used: str = ""
    memory_type: str = "episodic"  # ← NEW: episodic|procedural|semantic

# NEW: Add scoped query method
class MemoryStore:
    def query_scoped(
        self,
        goal_pattern: str,
        user_id: str = "default:user",
        agent_id: str = "default:agent",
        run_id: str = "",
    ) -> List[MemoryEntry]:
        """Query with multi-level isolation filters."""
        results = self.query(goal_pattern)
        return [
            e for e in results
            if e.user_id == user_id
            and e.agent_id == agent_id
            and (not run_id or e.run_id == run_id)
        ]
```

### Phase 2: Add SQLite History Layer

**File: `src/core/memory_history.py` (NEW)**

```python
import sqlite3
from datetime import datetime

class MemoryHistory:
    """SQLite backend for memory version tracking."""

    def __init__(self, db_path: str = ".mekong/memory_history.db"):
        self._db = sqlite3.connect(db_path)
        self._init_schema()

    def _init_schema(self):
        self._db.execute("""
            CREATE TABLE IF NOT EXISTS memory_versions (
                id TEXT PRIMARY KEY,
                memory_id TEXT NOT NULL,
                content TEXT NOT NULL,
                version INT DEFAULT 1,
                changed_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (memory_id) REFERENCES memories(id)
            )
        """)

    def record_change(self, memory_id: str, old_content: str, new_content: str, changed_by: str = "system"):
        """Record memory mutation."""
        version = self._db.execute(
            "SELECT MAX(version) FROM memory_versions WHERE memory_id=?",
            (memory_id,)
        ).fetchone()[0] or 0
        self._db.execute(
            "INSERT INTO memory_versions (memory_id, content, version, changed_by) VALUES (?,?,?,?)",
            (memory_id, new_content, version + 1, changed_by)
        )
        self._db.commit()

    def get_history(self, memory_id: str, limit: int = 10) -> List[Dict]:
        """Retrieve version history for a memory."""
        rows = self._db.execute(
            "SELECT id, version, content, changed_by, created_at FROM memory_versions WHERE memory_id=? ORDER BY version DESC LIMIT ?",
            (memory_id, limit)
        ).fetchall()
        return [
            {"id": r[0], "version": r[1], "content": r[2], "changed_by": r[3], "timestamp": r[4]}
            for r in rows
        ]
```

### Phase 3: LLM Fact Extraction

**File: `src/core/fact_extractor.py` (NEW)**

```python
from typing import List, Dict, Any
from .llm_client import LLMClient

class FactExtractor:
    """Extract normalized facts from raw goal strings using LLM."""

    def __init__(self, llm_client: LLMClient):
        self._llm = llm_client

    def extract_facts(self, goal: str, context: str = "") -> List[Dict[str, str]]:
        """
        Extract key facts from goal string.

        Returns:
            List of {"fact": "...", "type": "objective|constraint|dependency"}
        """
        prompt = f"""
Extract key facts from this goal. Return JSON array.

Goal: {goal}
Context: {context}

Extract facts as: [
  {{"fact": "normalized fact", "type": "objective|constraint|dependency|context"}},
  ...
]
Return ONLY JSON, no markdown.
"""
        response = self._llm.chat([{"role": "user", "content": prompt}])
        try:
            import json
            return json.loads(response.strip())
        except:
            return [{"fact": goal, "type": "objective"}]

    def normalize_goal(self, goal: str) -> str:
        """
        Normalize goal text for consistency.

        Example: "add oauth" → "Add OAuth authentication"
        """
        prompt = f"""Normalize this goal to standard form: {goal}
Return ONLY the normalized goal string, no quotes."""
        return self._llm.chat([{"role": "user", "content": prompt}]).strip()
```

### Phase 4: Metadata Filtering

**File: `src/core/memory.py` (extend MemoryStore)**

```python
class MemoryStore:
    def query_with_filters(
        self,
        goal_pattern: str = "",
        user_id: str = "default:user",
        agent_id: str = "default:agent",
        status: Optional[str] = None,  # "success", "failed", etc
        memory_type: Optional[str] = None,  # "episodic", "procedural", etc
        recipe_used: Optional[str] = None,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
        limit: int = 20,
    ) -> List[MemoryEntry]:
        """Query with rich metadata filters (like Mem0 + Qdrant)."""
        results = self.query(goal_pattern)

        # Apply all filters
        for entry in results:
            if entry.user_id != user_id or entry.agent_id != agent_id:
                continue
            if status and entry.status != status:
                continue
            if memory_type and entry.memory_type != memory_type:
                continue
            if recipe_used and entry.recipe_used != recipe_used:
                continue
            if start_time and entry.timestamp < start_time:
                continue
            if end_time and entry.timestamp > end_time:
                continue
            yield entry
            if limit > 0:
                limit -= 1
                if limit == 0:
                    break
```

### Phase 5: Mem0 Integration Update (packages/memory/)

**File: `packages/memory/mem0_client.py` (enhance)**

```python
# Add session scoping to add() calls
def add(
    self,
    content: str,
    user_id: str,
    agent_id: Optional[str] = None,  # ← NEW param
    run_id: Optional[str] = None,    # ← NEW param
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """Store memory with multi-level isolation."""
    if not self.is_available:
        return False
    try:
        # Format user_id as per mem0 expectations
        scoped_user_id = f"{user_id}:{agent_id or 'default'}"

        metadata = metadata or {}
        metadata["agent_id"] = agent_id
        metadata["run_id"] = run_id

        self._mem0.add(
            content,
            user_id=scoped_user_id,
            agent_id=agent_id,
            run_id=run_id,
            metadata=metadata,
            infer=True,  # Enable LLM fact extraction
        )
        return True
    except Exception as e:
        logger.warning(f"Mem0 add failed: {e}")
        return False
```

---

## Top 5 Mem0 Patterns for Mekong-CLI

| Pattern | Mem0 | Mekong-CLI Implementation | File |
|---------|------|--------------------------|------|
| **1. Multi-level isolation** | `user_id/agent_id/run_id` | Add fields to MemoryEntry + `query_scoped()` | `src/core/memory.py` |
| **2. Fact extraction** | `infer=True` LLM call | Create `FactExtractor` class | `src/core/fact_extractor.py` |
| **3. Metadata filters** | Qdrant payload filters | Add rich filter params to query | `src/core/memory.py` |
| **4. History tracking** | SQLite version table | Implement `MemoryHistory` class | `src/core/memory_history.py` |
| **5. Semantic search** | Post-reranking | Upgrade facade to use Mem0 search | `packages/memory/mem0_client.py` |

---

## Unresolved Questions

1. **Graph memory priority?** Mem0 graph_store config requires Neo4j/Kuzu. For V1, should we skip and focus on vector + history?

2. **LLM model for fact extraction?** Current mekong-cli uses claude-opus-4-6 via Antigravity Proxy. Use same LLM for facts, or cheaper model (gemini-3-flash)?

3. **History DB location?** Keep `.mekong/memory_history.db` or merge into existing YAML persistence structure?

4. **Reranker cost?** Jina/Cohere rerankers add ~20ms per query. Enable by default or opt-in?

5. **Backward compatibility?** Existing `.mekong/memory.yaml` entries don't have isolation fields. Migration script needed?

---

**Report saved:** `/Users/macbookprom1/mekong-cli/plans/reports/researcher-260301-1301-mem0-architecture-analysis.md`
