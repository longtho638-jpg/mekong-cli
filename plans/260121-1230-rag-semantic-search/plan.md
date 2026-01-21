# Phase 14: RAG & Semantic Search

**Status**: Planned
**Priority**: P2
**Goal**: Implement Retrieval-Augmented Generation (RAG) to allow agents to "chat" with the codebase and documentation using semantic understanding.

## Context
We have a Knowledge Graph (Phase 13) for structural relationships. Now we need vector embeddings to understand the *meaning* of code and docs. This will enable features like "Find similar code," "Explain this architecture," and "Suggest refactoring based on best practices."

## Objectives

1.  **Vector Database**
    - [ ] Add Vector Store to `docker-compose.yml` (ChromaDB or Qdrant).
    - [ ] Create `antigravity/core/rag/` module.
    - [ ] Implement `VectorClient`.

2.  **Embedding Pipeline**
    - [ ] Integrate embedding model (OpenAI `text-embedding-3-small` or local `sentence-transformers`).
    - [ ] Create `EmbeddingService` to chunk and embed code/docs.
    - [ ] Update `CodeIngestor` to generate embeddings for nodes during ingestion.

3.  **Context Retrieval**
    - [ ] Implement `HybridRetriever` (Graph + Vector).
    - [ ] Support query expansion (e.g., "auth" -> "authentication", "login", "sso").

4.  **Agent Capability**
    - [ ] Add `rag_search` tool to `BaseSwarmAgent`.
    - [ ] Create `ResearchAgent` specialized in codebase analysis.

## Execution Plan

### Step 1: Infrastructure
- [ ] Add ChromaDB service.
- [ ] Install dependencies (`chromadb`, `sentence-transformers`).

### Step 2: Core RAG Logic
- [ ] Implement `VectorStore` interface.
- [ ] Create `EmbeddingGenerator`.

### Step 3: Integration
- [ ] Hook into `CodeIngestor` to auto-embed functions and classes.
- [ ] Implement `SemanticSearch` API.

### Step 4: Verification
- [ ] Test retrieval accuracy.
- [ ] Verify Swarm integration.

## Deliverables
- Functional Vector DB.
- RAG Pipeline.
- `ResearchAgent`.
