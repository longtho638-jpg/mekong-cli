# Qdrant Architecture Research Report
**Date:** 2026-03-01 | **Focus:** Patterns for mekong-cli vector memory + RaaS AGI platform

---

## Executive Summary
Qdrant demonstrates **dual-protocol API design** (REST+gRPC), **segment-based storage**, **HNSW+filtering**, **Raft consensus**, and **transparent sharding**—all applicable to mekong-cli's distributed vector memory system.

---

## 1. STORAGE ENGINE PATTERN
**Pattern:** Segment-based modular storage.

- **Segmentation**: All data divided into self-contained segments (vector + payload + indexes + ID mapper)
- **Flexibility**: Each segment either appendable (write) or read-only (compaction)
- **Storage Options**: In-memory (speed) OR memmap (disk-backed with page caching)
- **Payload Strategy**: Dual approach—in-memory payloads (fast, RAM) or on-disk via RocksDB (space-efficient)
- **Durability**: Write-ahead-log (WAL) for crash recovery

**Mekong Application:** Store mission histories + accumulated insights as appendable segments. Compact old missions to read-only. Use memmap for large recipe libraries.

---

## 2. INDEXING ALGORITHM PATTERN
**Pattern:** Layered graph search + filter-aware indexing.

- **Dense Vector Index**: HNSW (hierarchical navigable small world) = O(log N) search via multi-layer graph traversal
- **Sparse Vector Index**: Inverted index-like structure for BM25/TF-IDF (high-proportion zeros)
- **Payload Indexing**: Traditional field indexes (keyword, numeric, geo, datetime, UUID, full-text)
- **Filterable HNSW**: Extend HNSW graph with edges based on indexed payload values → fast filtered search
- **ACORN Search**: Neighbors-of-neighbors exploration when direct neighbors filtered out

**Mekong Application:** Index recipes (dense vectors) + metadata (sparse: tags, status, priority). Enable filtered search: "recent HNSW recipes tagged 'ML' with success_rate > 0.9".

---

## 3. API DESIGN PATTERN
**Pattern:** Dual-protocol consistency (REST primary, gRPC performant).

- **REST API**: Port 6333, standard HTTP(S), JSON payloads
- **gRPC API**: Port 6334, high-performance internal peer communication + client option
- **Service Organization**: Distinct services per domain (collections, search, cluster, etc.)
- **Authentication**: API key-based via HTTP headers + RBAC
- **Principle**: Both protocols implement identical logic; client chooses transport

**Mekong Application:** REST for CC CLI (command-line-friendly). gRPC for Tôm Hùm daemon (low-latency inter-process). Single service schema maps to both.

---

## 4. DISTRIBUTED CONSENSUS PATTERN
**Pattern:** Raft for topology + collection structure consistency.

- **Consensus Algorithm**: Raft (requires ≥3 nodes) for cluster agreement
- **Scope**: Manages topology changes + collection schema (NOT data operations)
- **Checkpointing**: Periodic snapshots to simplify log truncation
- **Recovery**: Consensus triggers replication when nodes rejoin

**Mekong Application:** Use Raft to manage cluster membership (Tôm Hùm nodes joining/leaving). Collection schema (recipes, memory structures) protected by consensus.

---

## 5. SHARDING + REPLICATION PATTERN
**Pattern:** Transparent horizontal scaling via shard distribution + replica sets.

- **Sharding**: Collections split into shards (self-contained point stores)
- **Load Distribution**: Parallel query processing across shards
- **Replica Sets**: Multiple copies of each shard across nodes
- **Failover**: Failed node → other replicas take over; restart triggers async replication catch-up
- **Resharding**: Change shard count without downtime (transparent)
- **Recovery Constraint**: Need >50% healthy nodes to recover lost shards

**Mekong Application:** Shard missions by project/date range. Replica each shard across 3+ nodes. Transparent resharding when adding nodes. Enable CC CLI + Gemini read-only replicas.

---

## 6. QUANTIZATION PATTERN
**Pattern:** Flexible compression strategies for RAM optimization.

- **Scalar Quantization**: General-purpose compression
- **Binary Quantization**: Extreme compression for large-scale
- **Asymmetric Quantization**: Vectors compressed, queries full-precision (accuracy boost)
- **1.5 / 2-bit Quantization**: Recent additions for improved accuracy at extreme compression
- **Trade-off**: Memory ↓ vs Search quality ↔ tunable per collection

**Mekong Application:** Apply binary quantization to massive recipe embeddings (100M+ vectors). Asymmetric for real-time query performance (uncompressed query vectors).

---

## 7. SNAPSHOT/RECOVERY PATTERN
**Pattern:** Logical archive (tar) + version lockstep.

- **Snapshots**: Tar archives of collection data + config (not aliases)
- **Scope**: Per-node in distributed; create separately for each node
- **Storage**: Local filesystem OR S3-compatible
- **Version Lock**: Restore only to same minor version cluster
- **Use Case**: Migration, archiving, DR

**Mekong Application:** Snapshot mission history weekly → S3. Restore to new region if AGI cluster fails. Versioned snapshots tied to mekong-cli releases.

---

## 8. FILTERING ARCHITECTURE PATTERN
**Pattern:** Index-aware filter optimization.

- **Subgraph Construction**: Build payload-specific subgraphs, merge back to full HNSW
- **Filter During Traversal**: Check filters as graph traversal happens (not post-search)
- **Indexed Conditions**: HNSW + indexed payload = fast. Complex conditions = potential full scan
- **Composition**: Support `must`, `must_not`, `should` (AND, NOT, OR)

**Mekong Application:** Query like: "Find successful recipes (indexed status=success) similar to this vector WITH tags IN ['automation', 'ml']". No full scan.

---

## 9. INTERNAL P2P COMMUNICATION PATTERN
**Pattern:** Separate internal gRPC services.

- **Public API**: Ports 6333 (REST), 6334 (gRPC) for client requests
- **Internal P2P**: Separate gRPC services for cluster membership, replication, consensus
- **Network Isolation**: Can separate public/private networks

**Mekong Application:** Public REST API on 6333 (CC CLI, webhooks). Internal gRPC on 6334 (Tôm Hùm cluster sync, Gemini brain coordination).

---

## 10. TELEMETRY PATTERN
**Pattern:** Not detailed in docs, but inferred from OpenTelemetry + Prometheus integration.

- **Observable**: Metrics (query latency, throughput, shard health)
- **Tracing**: Distributed tracing of search/write ops across shards
- **Health**: Per-shard, per-node status exposed via metrics

**Mekong Application:** Expose shard health via `/metrics`. Track recipe search latency per domain. Alert on >50ms P99 (degraded consensus).

---

## 11. EXTENSION POINTS (Inferred)
**Pattern:** Plugin-style through custom payload indexers.

- **Payload Indexers**: Define custom field types → custom index logic
- **Distance Metrics**: Pluggable similarity functions (cosine, Euclidean, Manhattan, Jaccard)
- **Quantization Backends**: Hardware-specific quantization implementations

**Mekong Application:** Custom indexer for "recipe_domain" field (categorical multi-label). Custom distance metric for recipe similarity (blended: embedding + metadata).

---

## 12. TESTING ARCHITECTURE (Inferred)
**Pattern**: Property-based + integration testing.

- **Property Tests**: HNSW correctness (recall under various quantizations)
- **Integration Tests**: Multi-node cluster scenarios (failover, rebalance, resharding)
- **Chaos Engineering**: Kill nodes, simulate network partitions, verify consistency

**Mekong Application:** Property tests for recipe embeddings → similar vectors stay similar. Integration tests: Tôm Hùm node dies, Gemini brain fails over seamlessly.

---

## KEY PATTERNS FOR MEKONG-CLI

| Pattern | Mekong Mapping |
|---------|---|
| Segment Storage | Mission history archives + live recipe buffer |
| Dual API (REST/gRPC) | CC CLI REST + Tôm Hùm gRPC |
| Raft Consensus | Cluster topology (3+ node minimum) |
| Sharding by Date/Project | Missions shard by created_date + project |
| Asymmetric Quantization | Recipe vectors compressed, query vectors full-precision |
| Filter-Aware Search | "Recipes status=success AND tags CONTAINS 'ml'" |
| Snapshots → S3 | Weekly mission snapshots for DR |
| Reshape Transparent | Add nodes → auto-rebalance without downtime |

---

## UNRESOLVED QUESTIONS
1. Does Qdrant support custom distance metrics, or is it limited to built-in set?
2. What's the exact P50/P99 latency for filtered HNSW search at 10M vectors?
3. How does quantization interact with Raft consensus — quantized state deterministic?
4. Can Qdrant snapshot a shard subset, or only full collection?
5. Is there a streaming replication option, or only batch catch-up?

---

## REFERENCES
- [Qdrant: API & SDKs](https://qdrant.tech/documentation/interfaces/)
- [Qdrant: Distributed Deployment](https://qdrant.tech/documentation/guides/distributed_deployment/)
- [Qdrant: HNSW Indexing](https://qdrant.tech/course/essentials/day-2/what-is-hnsw/)
- [Qdrant: Snapshot/Backup](https://qdrant.tech/documentation/concepts/snapshots/)
- [Medium: Distributed Qdrant Cluster](https://medium.com/@vardhanam.daga/distributed-deployment-of-qdrant-cluster-with-sharding-replicas-e7923d483ebc)
- [DeepWiki: Qdrant Consensus Mechanism](https://deepwiki.com/qdrant/qdrant/6-consensus-mechanism)
