# AGI Hóa RaaS Platform — OSS Research Report
**Date:** 2026-02-28 | **Author:** researcher | **Scope:** AI Agent Frameworks, Agentic RAG/Memory, Self-Improving Agents

---

## Mảng 1: AI Agent Frameworks (Multi-Agent Orchestration)

| Framework | Stars | Kiến trúc | Production Ready | Ưu điểm | Nhược điểm |
|-----------|-------|-----------|-----------------|---------|------------|
| **LangGraph** | ~30k | Graph/DAG stateful | Cao (v1.0 Q4/2025) | Fine-grained state control, conditional branching, rollback, LangChain ecosystem | Học dốc, phải dùng LangChain |
| **CrewAI** | ~30k | Role-based team | Cao | Onboard nhanh, role abstraction gần gũi business, Flows cho production | Ít control hơn LangGraph khi cần stateful complex |
| **AutoGen (Microsoft)** | ~40k | Conversation-based | Cao (merge SK Q1/2026) | Conversational multi-agent, đã merge với Semantic Kernel → Microsoft Agent Framework | Phức tạp hóa khi không cần conversation model |
| **Semantic Kernel** | ~27k | Plugin/Planner | Enterprise (Azure) | .NET + Python + Java, Azure native, SOC2/HIPAA, SLA có, telemetry built-in | Vendor lock-in Azure, over-engineered cho non-MS stack |
| **OpenDevin/OpenHands** | ~35k | SWE-agent platform | Research→Prod | Multi-agent, 15+ benchmarks, model-agnostic, MIT license | Nặng hơn, thiên về SWE task hơn general orchestration |
| **SWE-agent** | ~13k | Code-exec loop | Research | Đơn giản, hiệu quả cho code task | Hẹp scope, không general |

**Phân tích RaaS:**
- **LangGraph** = backbone orchestration: kiểm soát state tốt nhất khi cần pipeline phức tạp (Plan→Execute→Verify của mekong)
- **CrewAI** = team orchestration layer: role-based phù hợp mô hình Tôm Hùm → CC CLI agents
- **Semantic Kernel** = chỉ cân nhắc nếu có Azure/MS enterprise requirement

---

## Mảng 2: Agentic RAG & Memory (Vector Store + Cross-session Memory)

| Tool | Loại | Cross-session | Self-host | Ưu điểm | Nhược điểm |
|------|------|--------------|-----------|---------|------------|
| **Mem0** | Memory layer | Tốt nhất | Có (OSS) | Hierarchical memory (user/session/agent), graph + vector hybrid, tích hợp CrewAI/LangChain/LlamaIndex, SOC2 | Managed cloud phải trả phí để scale |
| **LlamaIndex** | RAG framework | Trung bình | Có | End-to-end RAG pipeline, long-term memory flush, tích hợp rộng | Thiên về document Q&A hơn agent memory |
| **Haystack** | RAG pipeline | Trung bình | Có | Runtime pipeline mạnh, tích hợp Mem0 store, production-grade | Verbose config, learning curve cao |
| **Chroma** | Vector DB | Không (session-scoped) | Có | Dev-friendly, zero config, fast prototype | Không scale tốt multi-tenant, không ACID |
| **Qdrant** | Vector DB | Có (persistent) | Có (Rust, nhanh) | Hiệu năng cao nhất OSS, ACID, horizontal scale, hybrid search | Phức tạp hơn Chroma để setup |
| **Weaviate** | Vector DB + Graph | Có | Có | Knowledge graph + vector hybrid, GraphQL, multi-modal | Nặng hơn Qdrant, tài nguyên cao |

**Phân tích RaaS cross-session memory:**
- **Mem0 + Qdrant** = combo tối ưu: Mem0 làm memory abstraction layer (extraction + hierarchy), Qdrant làm storage backend (fast, persistent, self-hostable)
- **LlamaIndex** phù hợp nếu cần RAG trên document corpus (knowledge base của agents)
- **Chroma** chỉ dùng cho dev/prototype (đang dùng trong openclaw-worker hiện tại)

---

## Mảng 3: Self-Improving / Auto-Evolution Agents

| Tool | Cơ chế | GitHub Stars | Ưu điểm | Nhược điểm |
|------|--------|-------------|---------|------------|
| **OpenHands** | Sandboxed exec + multi-agent + self-reflection | ~35k | Model-agnostic, cloud native, 15+ benchmark, MIT, built-in auto-fix loop | Nặng, thiên SWE |
| **Aider** | Git-native pair programming + auto-commit | ~25k | Git first-class, test→fix loop, model-agnostic, CLI-native (phù hợp CC CLI pattern) | Chưa có full self-evolution |
| **AutoCodeRover** | AST-based code search + patch generation | ~5k | Efficient (38% resolve rate, 14.7 calls vs OpenHands 29), ít token hơn | Hẹp hơn OpenHands |
| **SWE-agent** | Tool-augmented LLM + trajectory | ~13k | Research-grade, benchmark-driven | Không production-ready |
| **OpenSage** | Self-programming agent generation | Research | Self-modify agent design | Chưa stable, arxiv only |
| **LIVE-SWE-AGENT** | Self-evolve on the fly | Research | Iterative self-modification | Chưa production |

**Phân tích RaaS self-healing:**
- **Aider** = phù hợp nhất tích hợp vào mekong-cli: CLI-native, Git-first, test→fix loop, model-agnostic → wrap vào auto-cto-pilot.js
- **AutoCodeRover** = efficient nhất cho automated bug resolution (ít token, high success rate)
- **OpenHands** = dùng làm sandboxed execution environment cho high-risk auto-fix

---

## Kết Luận: Top 5 Khuyến Nghị Tích Hợp

| Ưu tiên | Tool | Mảng | Vai trò trong RaaS | Effort |
|---------|------|------|-------------------|--------|
| **P0** | **Mem0 + Qdrant** | Memory | Thay Chroma bằng Qdrant persistent, Mem0 làm cross-session memory layer cho tất cả agents | Medium |
| **P1** | **LangGraph** | Orchestration | Wrap Plan→Execute→Verify engine thành stateful graph, hỗ trợ rollback + conditional branching | High |
| **P2** | **CrewAI** | Multi-agent | Model hóa Tôm Hùm team (researcher + planner + developer + reviewer) thành CrewAI crew | Medium |
| **P3** | **Aider** | Self-healing | Tích hợp vào auto-cto-pilot.js: khi test fail → Aider auto-fix → re-run tests | Low |
| **P4** | **AutoCodeRover** | Auto-fix | Dùng cho automated bug resolution task trong mission queue (efficient nhất, ít token) | Medium |

### Quick Wins (có thể làm ngay):
1. **Mem0 OSS** → drop-in replacement cho claude-mem Chroma, persistent cross-session memory
2. **Aider CLI** → tích hợp vào task-watcher.js như một execution mode cho code-fix missions
3. **Qdrant Docker** → self-host vector backend cho toàn bộ agent memory

---

## Câu Hỏi Chưa Giải Quyết

1. Microsoft Agent Framework (AutoGen + SK merge) GA Q1/2026 — có breaking changes không khi tích hợp?
2. Mem0 OSS vs managed: rate limits của OSS self-hosted khi scale multi-tenant RaaS?
3. LangGraph overhead vs mekong-cli Plan-Execute-Verify hiện tại: có đáng migrate không hay chỉ cần wrap?
4. Aider model compatibility: CC CLI đang dùng Anthropic proxy port 9191 — Aider có route qua proxy được không?

---

**Sources:**
- [AI Agent Frameworks Compared 2026 - Arsum](https://arsum.com/blog/posts/ai-agent-frameworks/)
- [CrewAI vs LangGraph vs AutoGen - DataCamp](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
- [Open Source AI Agent Frameworks Compared 2026 - OpenAgents](https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared)
- [Mem0 Graph Memory for AI Agents Jan 2026](https://mem0.ai/blog/graph-memory-solutions-ai-agents)
- [Mem0 vs Zep vs LangMem 2026 - DEV Community](https://dev.to/anajuliabit/mem0-vs-zep-vs-langmem-vs-memoclaw-ai-agent-memory-comparison-2026-1l1k)
- [Best Vector Databases 2026 - Firecrawl](https://www.firecrawl.dev/blog/best-vector-databases)
- [Qdrant vs Chroma vs Weaviate - LiquidMetal AI](https://liquidmetal.ai/casesAndBlogs/vector-comparison/)
- [OpenHands GitHub](https://github.com/OpenHands/OpenHands)
- [AutoCodeRover SWE-Effi research](https://arxiv.org/pdf/2509.09853)
- [LangGraph vs Semantic Kernel 2025 - Leanware](https://www.leanware.co/insights/langgraph-vs-semantic-kernel)
- [Microsoft Agent Framework announcement - Spaceo](https://www.spaceo.ai/blog/agentic-ai-frameworks/)
