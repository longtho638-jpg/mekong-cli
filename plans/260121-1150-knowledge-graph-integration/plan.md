# Phase 13: Knowledge Graph Integration

**Status**: Planned
**Priority**: P2
**Goal**: Implement a persistent Knowledge Graph (KG) to serve as the long-term memory and context engine for the Agent Swarm.

## Context
Agents currently operate with ephemeral context. To enable "deep thinking" and continuity across sessions, we need a structured knowledge base that captures relationships between code, documentation, and business rules.

## Objectives

1.  **Graph Infrastructure**
    - [ ] Add Graph Database to `docker-compose.yml` (FalkorDB or Neo4j).
    - [ ] Create `antigravity/core/knowledge/` module.
    - [ ] Implement `GraphClient` for connection management.

2.  **Knowledge Modeling**
    - [ ] Define Node types (Concept, File, Function, Agent, Task).
    - [ ] Define Edge types (DEPENDS_ON, CREATED_BY, RELATES_TO).
    - [ ] Implement schema enforcement (Pydantic models for nodes/edges).

3.  **Ingestion Engine**
    - [ ] Create `CodeIngestor` to parse codebase and populate graph.
    - [ ] Create `DocIngestor` for markdown files.
    - [ ] Implement "Live Sync" to update graph on file changes.

4.  **Semantic Search & RAG**
    - [ ] Integrate vector embeddings (using `sentence-transformers` or OpenAI).
    - [ ] Implement `KnowledgeRetriever` for context lookups.
    - [ ] Expose retrieval API for agents.

## Execution Plan

### Step 1: Infrastructure Setup
- [ ] Update `docker-compose.yml` to include FalkorDB.
- [ ] Install python clients (`redis`, `falkordb`).
- [ ] Implement `GraphClient`.

### Step 2: Core Graph Logic
- [ ] Define `KnowledgeNode` and `KnowledgeEdge` classes.
- [ ] Implement CRUD operations for the graph.

### Step 3: Ingestion
- [ ] Build `CodeGraphBuilder` using `ast` (Python) and `tree-sitter` (others).
- [ ] Run initial ingestion of `mekong-cli` codebase.

### Step 4: Agent Integration
- [ ] Add `memory` tool to `BaseSwarmAgent`.
- [ ] Update `DevSwarm` to query graph before coding.

## Deliverables
- Functional Graph DB in Docker.
- `KnowledgeGraph` Python API.
- Fully indexed codebase in the graph.
- Agents capable of querying context.
