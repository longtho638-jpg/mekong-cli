# N8N Architecture Patterns → Algo-Trading Workflows

**Date:** 2026-03-01 | **Report:** N8N Execution Engine & Integration Patterns

---

## EXECUTION ENGINE ARCHITECTURE

**Stack-Based Model:** `WorkflowExecute` maintains `nodeExecutionStack` with pending nodes. Sequential processing routes data between nodes. Two modes:
- **Regular:** Direct in-process execution (single instance, ≤100 concurrent)
- **Queue:** Bull queue + Redis workers (72 req/s per C5.large instance)

**State Management:** `IRunExecutionData` tracks:
- `resultData.runData[nodeName]` — node outputs
- `executionData.nodeExecutionStack` — pending nodes
- `executionData.waitingExecution` — nodes awaiting upstream data

**Data Flow:** Pop node → create context → execute → collect output → route to downstream → repeat.

---

## TRIGGER MECHANISMS (FOR TRADING SIGNALS)

| Trigger Type | Mechanism | Latency | Use Case |
|---|---|---|---|
| **Webhook** | External push (price alerts) | <100ms | Price tick events, exchange webhooks |
| **Schedule (Cron)** | Time-based polling | Minutes | Daily reports, hourly risk checks |
| **Event-based** | App-native triggers | Varies | Exchange order fills, account updates |

**Mapping to Trading:** Webhook → price alert → risk check node → order execution node → report.

---

## ERROR HANDLING & RECOVERY

| Level | Pattern | Config |
|---|---|---|
| **Node-Level** | Retry On Fail + exponential backoff | 3–5 max retries, 2s–30s delay |
| **Workflow-Level** | Continue on fail / Stop on fail | Per-node or global |
| **Workflow-Level** | Error Workflow (dedicate handler) | Triggered on failure, must start with Error Trigger node |
| **Advanced** | Auto-Retry Engine | Scheduled checks + API re-run failed executions |

**For Trading:** Retry exchange API calls on timeout. Continue risk check on warning. Error Workflow → alert + rollback logic.

---

## CREDENTIAL MANAGEMENT (EXCHANGE API KEYS)

| Pattern | Security | Scalability |
|---|---|---|
| **Database Encrypted** | AES-256 at rest, workflows reference by ID | Single n8n instance, ≤10k workflows |
| **External Vault** | AWS/Azure/GCP/Vault integration | Multi-environment, team sharing |
| **API Key Scoping** | Min. permissions per credential | Read-only for price feeds, trade-only for orders |

**Best Practice:** Store Binance/Kraken API keys in external vault. Reference by credential ID in nodes. Rotate quarterly.

---

## WORKFLOW EXECUTION MODEL

**Sequential vs Parallel:**
- **Sequential (v1 default):** Breadth-first (FIFO), siblings before children
- **Depth-first (v0):** Children before siblings (legacy)
- **Branching:** Conditional nodes split → merge after parallel branches

**For Trading Workflow:**
```
Trigger (webhook price alert)
  → Signal Detection Node (parallel: 3 exchanges)
  → Risk Check (sequential: must complete)
  → Order Execution (if risk OK)
  → Report (parallel: email + Slack + database)
```

---

## MAPPED PATTERN: ALGO-TRADING WORKFLOW

```
┌─────────────────────────────────────────────┐
│ Trigger: Webhook (price > threshold)        │
├─────────────────────────────────────────────┤
│ Node 1: Signal Detection (parallel 3 sig.)  │ → resultData.runData['signal_1/2/3']
├─────────────────────────────────────────────┤
│ Node 2: Risk Validator (conditional)        │ → if passed, continue; else error workflow
├─────────────────────────────────────────────┤
│ Node 3: Order Execute (retry 3x on fail)    │ → catch timeout, retry with exp. backoff
├─────────────────────────────────────────────┤
│ Node 4: Report (parallel: email + DB)       │ → nodeExecutionStack pops, runs parallel
└─────────────────────────────────────────────┘
         ↓ ON ERROR
┌─────────────────────────────────────────────┐
│ Error Workflow: Alert + Remediate            │
│ - Credential vault: Exchange API keys        │
│ - Scoped: Read-only for price feeds          │
└─────────────────────────────────────────────┘
```

---

## KEY TAKEAWAYS

1. **Execution Stack:** n8n uses node stack (not DAG). Process breadth-first by default. Map to sequential trading steps.
2. **Data Routing:** Each node's output stored by name. Downstream nodes access via `$node.[name].json.*`. No explicit dependency graph.
3. **Error Recovery:** Retry at node level + workflow-level error handler. Use stop-and-error for circuit breaker patterns.
4. **Credentials:** External vault (AWS Secrets) scales better. Scoped API keys reduce attack surface for exchange integrations.
5. **Scaling:** Queue mode for high throughput. Single instance sufficient for <100 concurrent traders.

---

## SOURCES
- [Workflow Execution Engine](https://deepwiki.com/n8n-io/n8n/2-workflow-execution-engine)
- [Error Handling](https://docs.n8n.io/flow-logic/error-handling/)
- [Webhook Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [External Secrets](https://docs.n8n.io/external-secrets/)
- [Credential Management](https://logicworkflow.com/blog/n8n-credential-management/)
- [N8N Deep Dive 2026](https://jimmysong.io/blog/n8n-deep-dive/)
