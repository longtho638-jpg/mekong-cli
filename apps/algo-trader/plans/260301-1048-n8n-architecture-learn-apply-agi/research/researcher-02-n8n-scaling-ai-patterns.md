# n8n Advanced Patterns: Scaling, AI Agents, Sub-workflows, Error Handling, Community Nodes

**Date:** 2026-03-01 | **Scope:** Trading/AGI system applicability

---

## 1. Queue Mode & Scaling (Redis/BullMQ)

**Architecture:**
- Main n8n instance = dispatcher only (no execution)
- Workers = isolated Node.js processes that pull jobs from Redis via BullMQ
- Trigger: workflow execution → BullMQ job pushed to Redis → first free worker claims it
- Requires: PostgreSQL + Redis (SQLite not supported in queue mode)

**Key config:**
```
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis
N8N_CONCURRENCY_PRODUCTION_LIMIT=<int>  # per-worker parallelism
```

**Scaling levers:**
- Horizontal: add worker containers (stateless, scale to N)
- Vertical: increase `N8N_CONCURRENCY_PRODUCTION_LIMIT` per worker
- Kubernetes: worker Deployment with HPA on Redis queue depth

**Benchmark:** 23 RPS (single) → 162 RPS (queue mode workers), 7x throughput, 0 failures

**Trading relevance:** Critical. Signal fan-out (one trigger → N parallel symbol executions) maps directly to this pattern. Each symbol = one BullMQ job.

---

## 2. AI Agent Nodes (LangChain Integration)

**Node taxonomy:**
- **Root nodes** (orchestrators): `AI Agent`, `Tools Agent`, `Conversational Agent`
- **Sub-nodes** (plugged into root): LLMs, memory, tools, vector stores

**AI Agent node internals:**
- Wraps LangChain agent executor
- Tool selection: ReAct-style reasoning loop — agent reads tool descriptions, picks tool, executes, observes, repeats
- Autonomous chaining: HTTP Request tool → Code tool → summarize, all in one agent run

**Tool-use nodes (plug into AI Agent):**
- HTTP Request, Code, Sub-workflow caller, SQL, Calculator, Wikipedia, custom community tools
- `AI Agent Tool` node: lets one AI Agent call another AI Agent as a tool (nested agents)

**Memory nodes:**
- Window Buffer Memory (last N messages)
- Postgres/Redis-backed memory for persistent session context
- Vector store memory (Pinecone, Qdrant, Supabase pgvector)

**AGI/Trading relevance:** Regime-detection agent can use vector memory to recall past market regimes. Tool nodes map to: price fetcher, signal calculator, order executor.

---

## 3. Sub-workflow Pattern

**Execute Sub-workflow node:**
- Parent calls child workflow by ID or name
- Two modes: `wait` (synchronous, blocks parent) or `fire-and-forget`
- Data passing: parent sends JSON → child receives as trigger input → child returns JSON
- Error propagation: child error surfaces in parent (can catch with Error Trigger)

**Call n8n Workflow Tool node:**
- Special variant used INSIDE an AI Agent as a tool
- Lets AI Agent invoke entire workflows as tools → composable agent capabilities

**Sub-workflow use cases for algo-trader:**
```
Master orchestrator workflow
  ├── Sub-workflow: fetch-market-data (per exchange)
  ├── Sub-workflow: compute-signals (per strategy)
  ├── Sub-workflow: risk-check (Kelly sizing, drawdown guard)
  └── Sub-workflow: execute-order (per exchange adapter)
```

**Reusability:** Sub-workflows act as library functions — change once, all callers updated.

---

## 4. Error Handling & Circuit Breaking

**Node-level retry:**
- Max retries: configurable per node (1-5)
- Retry wait: configurable delay between attempts
- On final failure: route to error output pin OR throw to Error Trigger workflow

**Error Trigger workflow:**
- Separate workflow, starts on `Error Trigger` node
- Receives: `$execution.error`, `$workflow.id`, timestamp
- Use: alert Telegram/Slack, log to DB, write to dead-letter queue

**Dead letter queue pattern:**
```
Failed execution data → write to Postgres/Redis DLQ table
Retry worker workflow → polls DLQ, re-runs failed payloads
```

**Circuit breaker (community pattern):**
- Track consecutive failures in static variable or Redis key
- If failures >= threshold (e.g., 5): set `circuit_open=true`, skip API calls for N seconds
- Reset on first success
- n8n has no built-in circuit breaker node — must implement in Code node or sub-workflow

**Production topology (Orami guide):**
```
Worker → fail → Error Trigger workflow → DLQ write + alert
Scheduled retry workflow → read DLQ → re-execute → clear on success
```

---

## 5. Community Nodes & Plugin System

**Distribution:** npm packages prefixed `n8n-nodes-*`
- Example: `n8n-nodes-evolution-api`, `n8n-nodes-langchain-custom`
- Install: Settings → Community Nodes → Install (GUI) OR `npm install -g n8n-nodes-X` in worker image

**Discovery:** [n8n community nodes marketplace](https://www.npmjs.com/search?q=n8n-nodes)

**Node structure:**
```
n8n-nodes-mypackage/
  nodes/MyNode/MyNode.node.ts   # INodeType implementation
  credentials/MyApi.credentials.ts
  package.json: { "n8n": { "nodes": [...], "credentials": [...] } }
```

**Self-hosting install:** Community nodes go into `~/.n8n/nodes/` — workers must share this volume or bake into Docker image.

**Security:** Community nodes run with same privileges as n8n process — vet before production.

**Trading-relevant community nodes to check:**
- `n8n-nodes-ccxt` (if exists) — crypto exchange abstraction
- Custom CCXT node: implement as community node wrapping `ccxt` npm library

---

## Summary: Applicability to algo-trader AGI Architecture

| Pattern | Trading Use Case | Priority |
|---|---|---|
| Queue Mode + Workers | Parallel symbol execution, signal fan-out | HIGH |
| AI Agent + Tools | Regime detection LLM, autonomous strategy selection | HIGH |
| Sub-workflows | Exchange adapters, signal modules as reusable components | HIGH |
| Error Trigger + DLQ | Order failure recovery, exchange API outages | HIGH |
| Community Nodes | CCXT wrapper, custom exchange connectors | MEDIUM |
| Circuit Breaker (Code node) | Protect against exchange API rate limits | MEDIUM |

---

## Unresolved Questions

1. Does a native `n8n-nodes-ccxt` community package exist and is it maintained?
2. Queue mode: can workers be pinned to specific workflow types (e.g., dedicated order-execution workers vs. signal workers)?
3. AI Agent memory persistence: does Redis-backed memory survive worker restarts without data loss?
4. Sub-workflow error propagation: if child is fire-and-forget, does parent ever see child errors?
5. Circuit breaker state: Redis key approach works in queue mode — but what's the recommended TTL strategy to avoid stale open circuits?

---

**Sources:**
- [Configuring queue mode | n8n Docs](https://docs.n8n.io/hosting/scaling/queue-mode/)
- [n8n on K8s: Scalable Worker Setup with Redis Queue](https://magicorn.co/n8n-on-k8s-scalable-worker-setup-with-redis-queue/)
- [The n8n Scaling & Reliability Guide (Orami)](https://medium.com/@orami98/the-n8n-scaling-reliability-guide-queue-mode-topologies-error-handling-at-scale-and-production-9f33b13d2be8)
- [AI Agent node documentation | n8n Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [LangChain in n8n | n8n Docs](https://docs.n8n.io/advanced-ai/langchain/overview/)
- [Execute Sub-workflow | n8n Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/)
- [Sub-workflows | n8n Docs](https://docs.n8n.io/flow-logic/subworkflows/)
- [Error handling | n8n Docs](https://docs.n8n.io/flow-logic/error-handling/)
- [n8n Error Handling Patterns: Retry, Dead Letter, Circuit Breaker](https://www.pagelines.com/blog/n8n-error-handling-patterns)
- [Scaling n8n with Queue Mode (NextGrowth.AI)](https://medium.com/@nextgrowth.ai/scaling-n8n-with-queue-mode-automated-deployment-script-8ee5c317be6e)
