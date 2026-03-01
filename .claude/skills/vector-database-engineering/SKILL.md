---
name: vector-database-engineering
description: "Vector DB selection, embedding strategies, similarity search, hybrid search, RAG pipelines — activate when building semantic search, recommendation engines, or any LLM-powered retrieval system"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Vector Database Engineering — Skill

> Vector DBs became foundational infrastructure in 2025 as RAG pipelines replaced fine-tuning for most enterprise AI applications; hybrid search (dense + sparse) emerged as production standard.

## When to Activate
- Building a RAG (Retrieval-Augmented Generation) pipeline
- Implementing semantic search over documents, products, or code
- Designing recommendation systems with embedding-based similarity
- Migrating from keyword search (Elasticsearch) to hybrid vector search
- Selecting the right vector DB for scale, cost, and latency requirements
- Building multi-modal retrieval (text + image embeddings)
- Optimizing ANN (Approximate Nearest Neighbor) index parameters

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Embedding Generation | Text, image, code, multi-modal embeddings | OpenAI text-embedding-3, Cohere embed-v3, BGE-M3 |
| Similarity Search | Cosine, dot product, Euclidean ANN search | HNSW, IVF, ScaNN indexes |
| Hybrid Search | Dense vector + sparse BM25 combined scoring | Weaviate BM25+vector, Qdrant hybrid |
| Metadata Filtering | Pre/post-filter on structured fields alongside vector search | Pinecone metadata, Qdrant payload filters |
| RAG Pipeline | Chunk → Embed → Store → Retrieve → Augment → Generate | LangChain, LlamaIndex, custom |

## Architecture Patterns
```
[Document Ingestion]
      │ chunking strategy (fixed, semantic, recursive)
      ▼
[Embedding Model] → float32 vectors (768–3072 dims)
      │
      ▼
[Vector DB] ←→ [Metadata Store]
      │ ANN search (HNSW / IVF_FLAT)
      ▼
[Retrieval] → top-k chunks by cosine similarity
      │ optional: re-ranking (Cohere Rerank, cross-encoder)
      ▼
[LLM] → grounded generation with retrieved context
```

```python
# Qdrant hybrid search example
from qdrant_client import QdrantClient
from qdrant_client.models import SparseVector, NamedSparseVector, NamedVector

client = QdrantClient(url="http://localhost:6333")
results = client.query_points(
    collection_name="docs",
    prefetch=[
        {"query": sparse_vector, "using": "bm25", "limit": 20},
        {"query": dense_vector, "using": "dense", "limit": 20},
    ],
    query=dense_vector,  # RRF fusion
    using="dense",
    limit=5,
)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Pinecone | Managed, serverless, large-scale production RAG | $0.096/1M vectors/month (serverless) |
| Weaviate | Open-source + cloud, multi-modal, GraphQL API | Free OSS; cloud from $25/mo |
| Qdrant | High-performance OSS, Rust-based, payload filtering | Free OSS; cloud from $0/free tier |
| Milvus | Enterprise-grade, distributed, Kubernetes-native | Free OSS; Zilliz Cloud managed |
| pgvector | Postgres extension — no new infra for small scale | Free (runs on existing Postgres) |
| Chroma | Local-first, dev-friendly, Python-native | Free OSS |

## Related Skills
- `backend-development` — API layer for vector search services
- `databases` — pgvector setup, Postgres optimization for embeddings
- `llm-fine-tuning-mlops` — Embedding model selection and fine-tuning
