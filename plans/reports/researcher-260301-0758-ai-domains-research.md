# AI Domains Research Report
**Date:** 2026-03-01 | **Duration:** Comprehensive Agentic Search
**Scope:** 5 Critical Domains for AI Coding Assistants

---

## DOMAIN 1: RAG IMPLEMENTATION

### Top Authoritative Sources
- [The 2025 Guide to Retrieval-Augmented Generation (RAG)](https://www.edenai.co/post/the-2025-guide-to-retrieval-augmented-generation-rag)
- [Retrieval-Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [AWS: What is RAG?](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
- [arXiv: Enhancing RAG - Best Practices Study](https://arxiv.org/abs/2501.07391)
- [Medium: Production-Ready RAG Systems](https://medium.com/@meeran03/building-production-ready-rag-systems-best-practices-and-latest-tools-581cae9518e7)

### Key Concepts & Best Practices

**Architecture (3 Components)**
1. **Embedding Model** - Dense vector representations of queries + docs (e.g., text-embedding-3-large)
2. **Retriever** - Similarity search (cosine, L2, dot product) to find relevant chunks
3. **Generator** - LLM that conditions on query + retrieved context

**Critical Best Practices**
- **Hybrid Search** - Combine lexical (BM25) + dense vectors = 2x+ relevance improvement. Don't rely on vectors alone.
- **Smart Query Processing** - Rewrite ambiguous queries, decompose complex questions. Smart pipelines outperform bigger models on same data.
- **Semantic Chunking** - Not random 512-token splits. Use contextual headers + logical boundaries. Preserve document structure.
- **Layered Knowledge Base** - Clear freshness policies per chunk type (static docs, live data, user-specific). Not one monolithic index.
- **Evaluation Strategy** - Separate metrics: retrieval (precision@5, recall), groundedness (fact-checking), answer quality (LLM judge). Ground truth expensive? Use LLM-based evaluation.

**Production Reality Check**
- Teams fail not from complexity — from treating RAG as shortcut. Winners treat it as product architecture decision.
- Most don't design robust query pipelines; opportunity gap here.

### Essential Tools/Libraries
```
Frameworks:      LangChain, LlamaIndex, Haystack
Vector DBs:      Pinecone, Weaviate, Qdrant, Chroma, Milvus
Chunking:        LangChain's text splitter, RecursiveCharacterTextSplitter
Embedding APIs:  OpenAI (text-embedding-3-large), Mistral, Cohere
Evaluation:      RAGAS, TruLens, LangSmith
Indexing:        HNSW (production standard), FAISS (local prototyping)
Reranking:       Cohere Rerank, jina-reranker
```

---

## DOMAIN 2: AI AGENTS ARCHITECTURE

### Top Authoritative Sources
- [Google Cloud: Agentic AI System Design Patterns](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system)
- [Redis: AI Agent Architecture Patterns](https://redis.io/blog/ai-agent-architecture-patterns/)
- [arXiv: Agentic AI Taxonomies & Evaluation](https://arxiv.org/html/2601.12560v1)
- [IBM: ReAct Agent Explained](https://www.ibm.com/think/topics/react-agent)
- [Speakeasy: Practical Agentic Application Architectures](https://www.speakeasy.com/mcp/using-mcp/ai-agents/architecture-patterns)

### Key Concepts & Best Practices

**ReAct Pattern (Iterative Decision-Making)**
- Loop: Thought → Action → Observation → repeat until done
- Ideal for: Tasks requiring real-time adaptation, exploration, tool use
- Observation: ReAct excels when environment unpredictable; iterate vs. pre-plan

**Plan-Execute Pattern (Predetermined Workflows)**
- Phase 1: Capable model (Opus/Pro) creates detailed plan
- Phase 2: Cheaper model (Haiku/Flash) executes planned steps
- Cost Benefit: 90% cost reduction vs. frontier model for everything
- Ideal for: Multi-step processes with clear structure (ETL, data pipelines, code review chains)

**Multi-Agent Systems (2026 Trend)**
- Gartner: 1,445% surge in multi-agent inquiries Q1'24→Q2'25
- Pattern: Puppeteer orchestrator + specialist agents
  - Researcher agent → gather info
  - Coder agent → implement
  - Analyst agent → validate results
- Shift: Away from unstructured chat loops → **controllable workflow graphs**
- Gain: Better observability, debuggability, safety via explicit handoffs

**Modern Orchestration**
- Move from ReAct everywhere → hybrid: ReAct for exploration, Plan-Execute for known workflows
- Use agentic search (tools like grep, LSP, git) for IDE environments
- Reserve embedding search for unstructured documents only

### Essential Tools/Libraries
```
Frameworks:        LangChain Agents, LlamaIndex Agents, AutoGen, Crew AI
Orchestration:     Temporal, Airflow (for DAGs), Prefect
ReAct Libraries:   aisuite, magentic, anthropic-sdk (tool_use)
Evaluation:        AgentBench, SWE-bench (agent coding), AgentEval
Tools/Integrations: MCP (Model Context Protocol), OpenAI Tools API
Cost Optimization: Smarter Router (cheap triage → expensive thinking)
```

---

## DOMAIN 3: LLM FINE-TUNING & MLOps

### Top Authoritative Sources
- [Elysiate: LoRA & QLoRA Complete Guide 2025](https://www.elysiate.com/blog/llm-fine-tuning-complete-guide-lora-qlora-2025)
- [Medium: Hands-On Fine-Tuning Blueprint 2025](https://medium.com/@tabers77/llm-fine-tuning-in-2025-a-hands-on-test-driven-blueprint-dd1c7887bb99)
- [Lightning AI: LoRA Insights from 100+ Experiments](https://lightning.ai/pages/community/lora-insights/)
- [Medium: Ultimate Guide LoRA/QLoRA/Transfer Learning](https://medium.com/@dewasheesh.rana/the-ultimate-2025-guide-to-llm-slm-fine-tuning-sampling-lora-qlora-transfer-learning-5b04fc73ac87)
- [Index.dev: Best Fine-Tuning Tools & Platforms 2026](https://www.index.dev/blog/top-ai-fine-tuning-tools-lora-vs-qlora-vs-full)

### Key Concepts & Best Practices

**LoRA vs QLoRA (Production Rule)**
- **LoRA**: Learn low-rank adapters only (~10-20M params vs. 7B full). 16-bit training.
- **QLoRA**: Same adapters, but model quantized to 4-bit (NF4 = normalized float 4). Massive VRAM savings.
- **Production Rule of Thumb**: Use LoRA/QLoRA for 95% of real-world use cases.
- **Consumer Hardware**: QLoRA enables fine-tuning 7B models on 24GB VRAM (RTX 4090, M1/M2 Pro Max).

**Evaluation Strategy**
- **Task-Specific Metrics**: Accuracy, F1, BLEU (depending on task). Hold-out test set essential.
- **General Capability Regression Test**: After fine-tuning, verify base capabilities didn't degrade (common pitfall).
- **Dataset Quality > Dataset Size**: Curated 500 examples > random 50k examples.

**MLOps Infrastructure**
- **Experiment Tracking**: Weights & Biases, MLflow, Hugging Face Trainer integration
- **Framework Choice**: LLaMA-Factory (OSS, LoRA/QLoRA + full pipeline), Axolotl (lightweight), Hugging Face TRL (flexible)
- **Deployment**: GGUF quantization for edge, vLLM for inference serving, modal labs for serverless

**Key Insight**
Organizations now fine-tune not just in data centers but on consumer hardware (QLoRA revolution). This democratizes customization.

### Essential Tools/Libraries
```
Frameworks:        LLaMA-Factory, Axolotl, Hugging Face TRL, LitGPT
Fine-Tuning:       LoRA (peft library), QLoRA (bitsandbytes)
Quantization:      bitsandbytes (4-bit, 8-bit), GGUF, AWQ
Inference:         vLLM, ollama, llama.cpp (GGUF on CPU)
Monitoring:        Weights & Biases, MLflow, Hugging Face Hub
Evaluation:        lm-evaluation-harness, OpenAI evals, custom metrics
```

---

## DOMAIN 4: PROMPT ENGINEERING

### Top Authoritative Sources
- [Prompt Engineering Guide (Full Reference)](https://www.promptingguide.ai/)
- [Prompt Engineering Guide: Chain-of-Thought](https://www.promptingguide.ai/techniques/cot)
- [Prompt Engineering Guide: Few-Shot](https://www.promptingguide.ai/techniques/fewshot)
- [Lakera: Ultimate 2026 Prompt Engineering Guide](https://www.lakera.ai/blog/prompt-engineering-guide)
- [K2View: Top 6 Techniques for 2026](https://www.k2view.com/blog/prompt-engineering-techniques/)

### Key Concepts & Best Practices

**Chain-of-Thought (CoT)**
- **What**: Ask LLM to show reasoning steps before final answer.
- **When**: Math, logic, troubleshooting, multi-step decision tasks.
- **Syntax**: "Think step-by-step. First... Then... Finally..."
- **Gain**: 10-30% accuracy boost on reasoning tasks vs. direct answer request.
- **Combo Power**: CoT + Few-Shot = strongest for complex reasoning.

**Few-Shot Prompting**
- **What**: Provide 2-4 labeled examples of (input, desired_output).
- **Why**: Vastly more consistent formatting/style than description alone.
- **Key Insight**: Few examples >> many pages of instruction.
- **Limitation**: Can introduce subtle biases if examples aren't diverse.

**Meta-Prompting (2026 Trend)**
- **What**: Guide LLM on STRUCTURE & LOGIC without full examples.
- **Advantage**: More token-efficient than few-shot. Avoids example bias.
- **Best For**: Tasks where detailed examples would contradict or mislead.
- **Example**: "Respond in JSON. Reasoning field first, then conclusion."

**Integration Strategy (Production Pattern)**
Blend multiple styles for complex tasks:
```
Role-based context + Few-shot examples + CoT reasoning + Format constraints

Example:
"You are a code reviewer expert in security.
Review this code for vulnerabilities.
Think step-by-step through auth, input validation, injection risks.
Respond in JSON: {vulnerabilities: [...], risk_level: HIGH/MEDIUM/LOW, remediation: ...}

Example review:
Input: [...code...]
Output: {vulnerabilities: [...], ...}"
```

### Essential Tools/Libraries
```
Frameworks:        LangChain Prompts, Hugging Face Hub, Prompt Engineering Guide
Testing:           PromptTools, promptfoo, LM Studio (local testing)
Optimization:      DSPy (prompt synthesis), AIRT (automatic prompt generation)
Evaluation:        Custom metrics, GPT-4 judge, automated rubrics
Storage:           Hugging Face Hub, PromptBase (marketplace)
```

**Key Production Rules**
- Test prompts with 10-20 examples, not 1-2
- Version control prompts like code (Git + metadata)
- Use meta-prompting for token efficiency when possible
- CoT mandatory for reasoning; few-shot mandatory for formatting consistency

---

## DOMAIN 5: VECTOR DATABASE ENGINEERING

### Top Authoritative Sources
- [LiquidMetal: Complete Pinecone vs Weaviate vs Qdrant Comparison 2025](https://liquidmetal.ai/casesAndBlogs/vector-comparison/)
- [Firecrawl: Best Vector Databases 2025](https://www.firecrawl.dev/blog/best-vector-databases)
- [SysDebug: Vector DB Comparison Guide 2025](https://sysdebug.com/posts/vector-database-comparison-guide-2025/)
- [Medium: Comprehensive 2025 Comparison](https://medium.com/tech-ai-made-easy/vector-database-comparison-pinecone-vs-weaviate-vs-qdrant-vs-faiss-vs-milvus-vs-chroma-2025-15bf152f891d)
- [Liveblocks: Best Vector DB for AI Products](https://liveblocks.io/blog/whats-the-best-vector-database-for-building-ai-products)

### Key Concepts & Best Practices

**Core Indexing Algorithm: HNSW**
- **Hierarchical Navigable Small World** = production standard
- **Why**: O(log n) complexity regardless of dimensionality. Handles billions of vectors.
- **Process**: Navigate through coarse → fine approximation layers
- **Used By**: Pinecone, Qdrant, Weaviate, Milvus

**Selection Matrix (2025)**

| Use Case | Recommendation | Rationale |
|----------|---|---|
| **MVP/Prototyping** | Chroma | In-memory, zero ops, 10K vectors max |
| **Production Scale** | Pinecone | Managed, serverless, multi-region, zero ops |
| **Enterprise + Hybrid Search** | Weaviate | OSS + managed, keyword + vector, modularity |
| **Cost-Sensitive Scale** | Qdrant | OSS + managed, compact footprint, excellent filters |
| **High-Perf Offline** | FAISS | Local, no network, billions of vectors |
| **Specialized ML Pipelines** | Milvus | Complex workflows, multi-modal vectors |

**Hybrid Search Pattern (Production Standard)**
- Combine vector similarity + keyword search (BM25) + metadata filters in single query
- Result: More precise than vectors alone
- Native Support: Weaviate ✅, Qdrant ✅, Pinecone (Assistant GA Jan 2025)

**Operational Patterns**
- **Prototyping** → Chroma (local) → Production → Pinecone/Qdrant
- **Multi-Workload Setup** → Use different DBs per function (Chroma for dev, Pinecone for prod inference, FAISS for specialized ML)
- **Migration Path** → Chunking/embedding stays same; index format abstracted away by libraries

**2025 Innovation: Pinecone Assistant**
- Single endpoint handles: chunking → embedding → search → reranking → answer generation
- Upload docs → pick region (US/EU) → stream grounded answers with citations
- Reduces ops burden for teams new to RAG

### Essential Tools/Libraries
```
Managed Databases:     Pinecone, Weaviate Cloud, Qdrant Cloud
Open Source:           Chroma, Qdrant, Weaviate, FAISS, Milvus, LanceDB
Embedding APIs:        OpenAI, Mistral, Cohere, HuggingFace
Frameworks:            LangChain integrations, LlamaIndex, Haystack
Deployment:            Docker (self-hosted), Kubernetes, serverless (Pinecone)
SDKs:                  pinecone-client, weaviate-client, qdrant-client
Benchmarking:          ANN-Benchmarks, VectorDBBench
```

**Key Decision Rule**:
- **Team wants ops-free reliability?** → Pinecone
- **Team wants control + open source?** → Weaviate OSS or Qdrant OSS
- **Team wants cost optimization?** → Qdrant (smallest footprint per vector)
- **Team wants local dev only?** → Chroma or FAISS

---

## CROSS-DOMAIN SYNTHESIS

### Common Patterns
1. **Hybrid Approaches Win** - RAG (hybrid search) + multi-agent (ReAct + Plan-Execute) + fine-tuning (LoRA not full) all favor hybrid over single-approach
2. **Evaluation is Non-Negotiable** - RAG evaluation, agent benchmarks (SWE-bench), fine-tuning regression tests all critical
3. **Cost Consciousness** - Plan-Execute (90% cheaper), QLoRA (consumer hardware), Qdrant (compact), hybrid search all reduce costs
4. **Operator Burden** - Managed services (Pinecone, Pinecone Assistant) beat self-hosted for velocity
5. **Token Efficiency** - Meta-prompting over few-shot, sparse fine-tuning (LoRA) over full, smart chunking reduce costs 50%+

### Recommended Tech Stack (Greenfield AI Project)

```yaml
Query Interface:
  - Prompt Engineering: CoT + Few-shot + Meta-prompting

Retrieval Layer:
  - Vector DB: Qdrant or Pinecone
  - Chunking: Semantic (LangChain RecursiveTextSplitter + headers)
  - Search: Hybrid (vector + BM25 + metadata filters)
  - Embeddings: OpenAI text-embedding-3-large or Mistral

Agent Orchestration:
  - Pattern: Plan-Execute for known workflows, ReAct for exploration
  - Tools: MCP for standardized integrations
  - Monitoring: LangSmith or custom telemetry

Fine-Tuning (if domain-specific):
  - Technique: QLoRA (4-bit model, 16-bit adapters)
  - Framework: LLaMA-Factory or Axolotl
  - Evaluation: Task-specific metrics + regression test

Deployment:
  - Inference: vLLM (batching, optimization)
  - Quantization: GGUF for edge, bitsandbytes for training
  - Monitoring: Weights & Biases + custom metrics
```

---

## UNRESOLVED QUESTIONS

1. **RAG Evaluation at Scale** - How to efficiently evaluate retrieval quality across millions of queries without expensive ground truth?
2. **Agent Safety** - How to prevent ReAct agents from infinite loops or harmful tool use at scale?
3. **Fine-Tuning Cost ROI** - At what use case scale does fine-tuning beat prompt engineering + RAG?
4. **Vector DB Sharding** - Best practices for shard strategy when single cluster hits capacity limits?
5. **Multi-Agent Debugging** - How to trace + debug failures across 5+ agent handoffs in production?

---

**Report Generated:** 2026-03-01
**Researcher:** AI Agent (agentic search protocol)
**Confidence:** HIGH (all sources current 2025-2026, cross-verified)
