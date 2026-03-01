# Research Report: n8n Execution Engine & Workflow Patterns → Algo-Trading Mapping

**Date:** 2026-03-01
**Scope:** n8n-io/n8n execution internals + algo-trading pattern mapping

---

## Executive Summary

n8n's execution engine is a stack-based, item-oriented workflow runner built in TypeScript. Data flows as `INodeExecutionData[]` arrays between nodes. Triggers (webhook, cron, polling) initiate executions that WorkflowExecute processes via a FIFO node stack. For scale, queue mode (BullMQ + Redis) distributes work across stateless workers — main process handles scheduling/webhooks, workers handle execution.

**For algo-trading:** n8n maps cleanly to market data pipeline architecture. Triggers = market feeds, Nodes = strategy evaluation, Sub-workflows = multi-strategy orchestration, Queue workers = parallel signal processing. Key constraint: n8n is optimized for 10-100ms latency workflows, NOT microsecond HFT — it's suited for position-sized algo trading, not co-located arbitrage.

---

## 1. Workflow Execution Model

### How WorkflowExecute Runs Step-by-Step

```
Trigger fires → WorkflowRunner.run() → WorkflowExecute.processRunExecutionData()
  └─ Loop:
      1. pop node from nodeExecutionStack
      2. check incomingConnectionIsEmpty() — if incomplete, move to waitingExecution map
      3. load credentials, build ExecuteContext
      4. node.execute() → INodeExecutionData[][]
      5. store results in runData[nodeName]
      6. route outputs to downstream nodes via addNodeToBeExecuted()
      7. repeat until stack empty
```

**Stack modes:**
- `v1` (default): FIFO via `push()/shift()` → siblings before children (breadth-first)
- `v0` (legacy): LIFO via `unshift()/shift()` → depth-first

**Execution state container:**
```typescript
interface IRunExecutionData {
  resultData: {
    runData: Record<string, ITaskData[]>;  // keyed by node name
    pinData?: Record<string, INodeExecutionData[]>;
    error?: ExecutionBaseError;
  };
  executionData: {
    nodeExecutionStack: IExecuteData[];   // the work queue
    waitingExecution: Record<string, ITaskData[]>;
    contextData: Record<string, IContextObject>;
  };
  startData?: {
    destinationNode?: string;
    runNodeFilter?: string[];
  };
}
```

**Each node invocation produces:**
```typescript
interface ITaskData {
  startTime: number;
  executionTime: number;
  executionStatus: 'success' | 'error' | 'skipped' | 'running';
  data?: ITaskDataConnections;  // output per connection type
  error?: ExecutionBaseError;
  source: ISourceData[][];      // upstream tracking
}
```

### Execution Lifecycle States

```
new → running → waiting (at Wait nodes) → success | error | canceled
```

Managed by `ActiveExecutions` — registers in memory, tracks concurrency capacity.

**Algo-trading mapping:**

| n8n Concept | Algo-Trading Equivalent |
|---|---|
| `nodeExecutionStack` | Signal processing pipeline queue |
| `waitingExecution` map | Pending orders waiting for confirmation |
| `runData[nodeName]` | Per-strategy execution log |
| `executionStatus` | Order state machine: pending/filled/rejected |
| `IRunExecutionData` | Trade session context |

---

## 2. Trigger Nodes

### Types of Triggers

```typescript
// 1. WEBHOOK TRIGGER — HTTP-activated
interface IWebhookFunctions {
  getBodyData(): IDataObject;
  getHeaderData(): IncomingHttpHeaders;
  getQueryData(): IDataObject;
  getParamsData(): Record<string, string>;
  getRequestObject(): Request;
  getResponseObject(): Response;
  getNodeWebhookUrl(name: string): string | undefined;
  prepareOutputData(outputData: INodeExecutionData[]): Promise<INodeExecutionData[][]>;
}

// 2. CRON/SCHEDULE TRIGGER — time-based
// Uses node-cron under the hood; managed by ActiveWorkflowManager
// Emits via ITriggerFunctions.emit()

// 3. POLLING TRIGGER — periodic check
interface IPollFunctions {
  getMode(): WorkflowExecuteMode;
  getActivationMode(): WorkflowActivateMode;
  helpers: {
    requestWithAuthentication(credentialsType: string, options: IRequestOptions): Promise<any>;
    returnJsonArray(jsonData: IDataObject | IDataObject[]): INodeExecutionData[];
  };
}

// 4. GENERIC TRIGGER
interface ITriggerFunctions {
  emit(
    data: INodeExecutionData[][],
    responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>,
    donePromise?: IDeferredPromise<IRun | undefined>
  ): void;
  emitError(error: Error, responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>): void;
}
```

**ActiveWorkflowManager** owns all trigger lifecycle: activation, deactivation, polling intervals.

**Algo-trading mapping:**

```typescript
// Price alert via Webhook trigger
// Exchange WebSocket → push to n8n webhook endpoint
interface PriceAlertPayload {
  symbol: string;       // "BTC/USDT"
  price: number;        // 67450.50
  volume: number;       // 1.23
  timestamp: number;    // unix ms
  exchange: string;     // "binance"
}

// Cron trigger for scheduled strategy re-evaluation
// cron: "0 */4 * * *" → every 4 hours rebalance check

// Poll trigger for exchange REST API (no WebSocket)
// interval: 60000ms → poll OHLCV every minute
interface OHLCVPollResult {
  open: number; high: number; low: number; close: number;
  volume: number; timestamp: number;
}
```

---

## 3. Data Passing Between Nodes

### INodeExecutionData — The Core Unit

```typescript
interface INodeExecutionData {
  json: IDataObject;           // main payload (any JSON-serializable object)
  binary?: IBinaryKeyData;     // keyed binary blobs (files, buffers)
  pairedItem?: IPairedItemData | IPairedItemData[] | number;
  error?: NodeApiError | NodeOperationError;
  metadata?: IDataItemMeta;
}

// json is IDataObject = Record<string, unknown>
// Every node receives: INodeExecutionData[] (array of items)
// Every node outputs: INodeExecutionData[][] (array per output connection)
```

### Data Flow Rules

1. **Item arrays** — nodes receive N items, can output N or M items (expand/filter)
2. **Binary data** — stored as metadata pointer in `binary` field; actual bytes managed by `BinaryDataService` (filesystem or S3)
3. **Expression access** in downstream nodes:
   - `$json.fieldName` — current item's json field
   - `$node["NodeName"].json.field` — specific upstream node output
   - `$execution.id` — execution ID
4. **Static data** — persists across executions via `getWorkflowStaticData()`

### Data Flow in Practice

```typescript
// Node outputs multiple connection branches (e.g., "true"/"false")
type INodeExecutionData[][] = [
  trueItems,   // index 0 → connected to "true" branch
  falseItems,  // index 1 → connected to "false" branch
];

// Example: Signal router node output
const signalRouterOutput: INodeExecutionData[][] = [
  // Branch 0: BUY signals
  [{ json: { signal: "BUY", symbol: "BTC/USDT", confidence: 0.87 } }],
  // Branch 1: SELL signals
  [{ json: { signal: "SELL", symbol: "ETH/USDT", confidence: 0.72 } }],
  // Branch 2: HOLD — empty, downstream nodes skip
  [],
];
```

**Algo-trading mapping:**

```typescript
// Market tick flowing through pipeline
interface AlgoTradeItem extends IDataObject {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  // Added by strategy node:
  signal?: "BUY" | "SELL" | "HOLD";
  confidence?: number;
  // Added by risk node:
  positionSize?: number;
  stopLoss?: number;
  takeProfit?: number;
  // Added by order node:
  orderId?: string;
  orderStatus?: "pending" | "filled" | "rejected";
}

// Each node enriches the same item as it flows downstream
// Risk node reads strategy output, adds position sizing
// Order node reads risk output, submits to exchange
```

---

## 4. Sub-Workflow Execution

### Execute Workflow Node

```typescript
// Parent → Child invocation
// n8n built-in: "Execute Workflow" node (n8n-nodes-base.executeWorkflow)
interface ExecuteWorkflowOptions {
  workflowId: string;          // target workflow ID
  mode: "once" | "each";       // once = all items together, each = per item
  waitForResult: boolean;      // sync vs fire-and-forget
  inputData?: INodeExecutionData[];
}
```

**Execution model:**
- Sync: parent waits for child, child output merges into parent's execution data
- Async (`waitForResult: false`): fire-and-forget, no result propagation
- In queue mode: **same worker handles both parent and all nested child workflows** (not distributed across workers per depth level)

**Sub-workflow data contract:**

```typescript
// Parent passes items to child via "When Executed by Another Workflow" trigger
// Child receives: INodeExecutionData[] (same format as any trigger)
// Child returns: INodeExecutionData[] (merged back into parent's execution)

// Multi-strategy orchestrator pattern:
interface StrategyOrchestrator {
  // Parent workflow: receives market data
  // → calls sub-workflow per strategy in parallel (Execute Workflow × N)
  // → aggregates signals (merge node)
  // → passes to risk/order execution
}
```

**Algo-trading mapping:**

```typescript
// Orchestrator workflow (parent)
// Input: market data for symbol
// Steps:
//   1. Split by strategy list
//   2. Execute Workflow (mode: "each") → 1 child per strategy
//   3. Each child workflow = isolated strategy evaluation
//   4. Merge node aggregates all strategy signals
//   5. Consensus/voting node → final signal
//   6. Risk node → position sizing
//   7. Order execution node

// Strategy sub-workflow interface
interface StrategySubWorkflow {
  input: {
    symbol: string;
    ohlcv: number[][];  // [timestamp, open, high, low, close, volume]
    params: Record<string, number>;  // strategy-specific params
  };
  output: {
    signal: "BUY" | "SELL" | "HOLD";
    confidence: number;
    metadata: Record<string, unknown>;
  };
}
```

---

## 5. Error Handling

### Three Levels

**Level 1: Node-level — continueOnFail**

```typescript
// If node has continueOnFail: true
// execution CONTINUES on error
// Error stored in item: { json: {}, error: "Error message" }
// Downstream nodes receive error item + can check $json.error

// Use case: exchange API timeout → continue, log error, skip order
```

**Level 2: Workflow-level — Error Trigger**

```typescript
// Special trigger node: "Error Trigger"
// Fires when ANY workflow in the account errors
// Receives execution context:
interface ErrorTriggerData {
  execution: {
    id: string;
    url: string;        // link to failed execution
    retryOf?: string;   // if this is a retry
    error: {
      message: string;
      stack?: string;
    };
    lastNodeExecuted: string;
    mode: WorkflowExecuteMode;
  };
  workflow: {
    id: string;
    name: string;
  };
}
// Connect: Error Trigger → Telegram alert node / PagerDuty / Slack
```

**Level 3: Retry Logic**

```typescript
// Per-node retry: not built-in at engine level
// Must implement via Loop/Wait nodes or custom retry node

// Queue mode: worker errors reported back via job progress
// Failed jobs enter "failed" state in Bull queue
// Can be retried from UI or via API

// Recommended pattern for exchange timeouts:
// HTTP Request node → On Error: "Continue (using Error Output)"
//   → Check $json.error → If timeout → Wait 1s → HTTP Request (retry)
```

**Algo-trading error patterns:**

```typescript
interface AlgoTradingErrorHandler {
  // Pattern 1: Exchange timeout with retry
  // HTTP Request (exchange API)
  //   continueOnFail: true
  //   → IF node: $json.error includes "timeout"
  //     → TRUE: Wait 2s → retry HTTP Request (max 3 loops)
  //     → FALSE: Continue normal flow

  // Pattern 2: Failed order recovery
  // Order Submission node (continueOnFail: true)
  //   → Check order status after N seconds
  //   → If rejected: cancel position, notify via Telegram
  //   → If filled: update portfolio state

  // Pattern 3: Strategy error isolation (sub-workflow)
  // Each strategy runs in sub-workflow with continueOnFail at sub-workflow level
  // Parent orchestrator receives empty output for failed strategy
  // Other strategies continue unaffected
}
```

---

## 6. Scaling Patterns

### Main vs Worker Architecture

```
┌─────────────────────────────────────────────┐
│  MAIN PROCESS (n8n main)                    │
│  - Webhook ingestion (Express/Fastify)      │
│  - Cron scheduler (ActiveWorkflowManager)   │
│  - UI/API serving                           │
│  - Job enqueuing to Redis via BullMQ        │
│  - Result collection from workers           │
└──────────────────────┬──────────────────────┘
                       │ Redis Queue (BullMQ)
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  WORKER 1    │ │  WORKER 2    │ │  WORKER N    │
│  n8n worker  │ │  n8n worker  │ │  n8n worker  │
│  concurrency:│ │  concurrency:│ │  concurrency:│
│  10 (default)│ │  10          │ │  10          │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Queue mode requirements:** PostgreSQL + Redis (SQLite not supported)

**Performance benchmark (c5.4xlarge):**
- Single mode: 23 req/s, 31% failure rate
- Queue mode: 162 req/s, 0% failure rate → **7x throughput**

**Key env vars:**
```bash
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis
QUEUE_BULL_REDIS_PORT=6379
N8N_CONCURRENCY_PRODUCTION=10  # per worker
QUEUE_WORKER_TIMEOUT=30        # seconds
```

**Sub-workflow + queue mode behavior:**
- A parent workflow and ALL its nested sub-workflows execute on the **same worker** for the full execution chain
- This prevents queue deadlocks but limits parallelism for nested structures
- Workaround: use "fire-and-forget" sub-workflows → each becomes an independent job on any worker

### Scaling for Algo-Trading Signal Processing

```typescript
// High-frequency signal processing topology:
// Main: receives exchange WebSocket events via webhook
//   → enqueues job per symbol tick (BullMQ)
// Workers (N): evaluate strategies per job
//   → each worker handles N concurrent evaluations

// Throughput math:
// 100ms evaluation per signal × 10 workers × 10 concurrency = 1000 signals/s theoretical
// Real-world: ~500-800/s accounting for I/O

// Queue mode config for algo-trading:
interface AlgoTradingQueueConfig {
  workers: number;        // 3-10 depending on strategy complexity
  concurrency: number;    // 5-20 per worker (CPU-bound = lower, IO-bound = higher)
  redisMaxMemory: string; // "2gb" — queue overflow protection
  jobTTL: number;         // 60000ms — expire stale signals
  jobAttempts: number;    // 1 — don't retry stale market signals
}
```

---

## 7. Algo-Trading Pattern Mapping — Full TypeScript

```typescript
// ============================================================
// COMPLETE PATTERN MAP: n8n → Algo-Trading
// ============================================================

// --- TRIGGER → Market Data Feed ---
interface MarketDataTrigger {
  // Webhook trigger receives from exchange WebSocket bridge
  payload: {
    event: "ticker" | "trade" | "orderbook";
    symbol: string;
    data: Record<string, number>;
    timestamp: number;
  };
  // OR: Poll trigger fetches OHLCV REST API every N seconds
  // OR: Schedule trigger runs strategy on OHLCV close (e.g., every 1h candle)
}

// --- NODE → Strategy Evaluation ---
interface StrategyNodeInput {
  json: {
    symbol: string;
    ohlcv: [number, number, number, number, number, number][];  // TOHLCV
    indicators: {
      rsi?: number; macd?: { value: number; signal: number; histogram: number };
      ema20?: number; ema50?: number; ema200?: number; atr?: number;
    };
  };
}
interface StrategyNodeOutput {
  json: {
    signal: "BUY" | "SELL" | "HOLD";
    confidence: number;   // 0-1
    strategy: string;
    reason: string;
  };
}

// --- NODE → Risk Check ---
interface RiskCheckInput {
  json: StrategyNodeOutput["json"] & {
    portfolioValue: number;
    openPositions: number;
    maxDrawdown: number;
  };
}
interface RiskCheckOutput {
  json: {
    approved: boolean;
    positionSize: number;     // USD value
    stopLoss: number;         // price level
    takeProfit: number;       // price level
    riskReason?: string;      // rejection reason
  };
}

// --- NODE → Order Execution ---
interface OrderExecutionInput {
  json: RiskCheckOutput["json"] & StrategyNodeOutput["json"] & {
    exchange: string;
    symbol: string;
    price: number;
  };
}
interface OrderExecutionOutput {
  json: {
    orderId: string;
    status: "submitted" | "filled" | "rejected";
    filledPrice?: number;
    filledQty?: number;
    fee?: number;
    timestamp: number;
  };
}

// --- SUB-WORKFLOW → Multi-Strategy Orchestration ---
// Parent: Orchestrator workflow
//   Receives: MarketDataTrigger
//   Executes: [MomentumStrategy, MeanReversionStrategy, MLStrategy] sub-workflows
//   Aggregates: votes/confidence-weighted signal
//   Passes to: Risk → Order

// --- ERROR → Failed Order Recovery ---
interface OrderErrorRecovery {
  // continueOnFail: true on Order Execution node
  // Error trigger workflow: monitors all execution failures
  // Pattern: if orderId exists but status=unknown → poll order status
  //          if exchange timeout → retry with same params
  //          if exchange rejection → halt and alert
  onTimeout: "retry_3x_with_backoff";
  onRejection: "cancel_and_alert";
  onPartialFill: "adjust_position_and_continue";
}

// --- QUEUE → High-Frequency Signal Processing ---
interface SignalQueueConfig {
  // Each symbol tick = one BullMQ job
  jobId: string;        // `${symbol}-${timestamp}` — deduplication key
  priority: number;     // 1=high (BTC), 10=low (altcoins)
  delay: number;        // 0 — immediate processing
  attempts: number;     // 1 — stale signals must NOT retry
  ttl: number;          // 5000ms — expire if not processed in 5s
  removeOnComplete: true;
  removeOnFail: false;  // keep failed for debugging
}
```

---

## 8. Custom Node Template for Algo-Trading

```typescript
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";

// Example: Exchange Order Execution Node
export class ExchangeOrderNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Exchange Order",
    name: "exchangeOrder",
    group: ["transform"],
    version: 1,
    description: "Submit order to exchange",
    defaults: { name: "Exchange Order" },
    inputs: ["main"],
    outputs: ["main", "main"],  // [success, error]
    outputNames: ["Filled", "Rejected"],
    properties: [
      { displayName: "Exchange", name: "exchange", type: "string", default: "binance" },
      { displayName: "Symbol", name: "symbol", type: "string", default: "BTC/USDT" },
      { displayName: "Side", name: "side", type: "options",
        options: [{ name: "Buy", value: "buy" }, { name: "Sell", value: "sell" }],
        default: "buy" },
      { displayName: "Amount", name: "amount", type: "number", default: 0 },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const filled: INodeExecutionData[] = [];
    const rejected: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const symbol = this.getNodeParameter("symbol", i) as string;
        const side = this.getNodeParameter("side", i) as string;
        const amount = this.getNodeParameter("amount", i) as number;

        // Call exchange API
        const result = await this.helpers.httpRequest({
          method: "POST",
          url: `https://api.exchange.com/v3/order`,
          body: { symbol, side, amount, type: "market" },
        });

        filled.push({ json: { ...items[i].json, orderId: result.orderId, status: "filled" } });
      } catch (error) {
        if (this.continueOnFail()) {
          rejected.push({ json: { ...items[i].json, status: "rejected", error: (error as Error).message } });
        } else {
          throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
        }
      }
    }

    return [filled, rejected];
  }
}
```

---

## 9. Production Deployment for Algo-Trading

```yaml
# docker-compose.yml — queue mode for algo-trader
services:
  n8n-main:
    image: n8nio/n8n:latest
    environment:
      - EXECUTIONS_MODE=queue
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - QUEUE_BULL_REDIS_HOST=redis
      - N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - WEBHOOK_URL=https://algo.yourdomain.com
    ports:
      - "5678:5678"

  n8n-worker:
    image: n8nio/n8n:latest
    command: n8n worker
    deploy:
      replicas: 3  # scale horizontally
    environment:
      - EXECUTIONS_MODE=queue
      - N8N_CONCURRENCY_PRODUCTION=10
      - QUEUE_BULL_REDIS_HOST=redis
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru

  postgres:
    image: postgres:15
```

---

## Key Constraints & Limitations for Algo-Trading

1. **Latency floor ~50-200ms** — n8n is not for HFT. Suitable for position trading, swing trading, automated rebalancing.
2. **Sub-workflow + queue mode deadlock risk** — deeply nested workflows block the same worker; use fire-and-forget for true parallelism.
3. **No built-in retry at node level** — must implement loop patterns manually.
4. **Webhook throughput** — main process handles ALL webhooks; at very high tick rates (~500+ tps), webhook ingestion becomes bottleneck. Use dedicated WebSocket bridge → batch → enqueue.
5. **Binary data in BinaryDataService** — not suitable for streaming time-series; use external TimescaleDB/InfluxDB and pass IDs in json.
6. **Static data** (`getWorkflowStaticData()`) survives across executions but is NOT shared across workers — cannot use for distributed state. Use Redis/PostgreSQL for shared strategy state.

---

## Unresolved Questions

1. **Worker assignment for parallel sub-workflows** — n8n docs say same worker handles all depths; unclear if this applies to async/fire-and-forget sub-workflows dispatched as independent jobs.
2. **Webhook deduplication** — if exchange sends duplicate tick events, no built-in dedup in n8n; needs external Redis SET check before enqueue.
3. **Dynamic concurrency per workflow** — unclear if queue mode allows per-workflow concurrency limits (e.g., limit order execution to 1 concurrent, but signal evaluation to 20).
4. **AI agent tool execution in queue mode** — `EngineRequest/EngineResponse` pattern for AI nodes; behavior when sub-tool is executed on same worker is not documented for queue mode.
5. **n8n version stability** — DeepWiki sourced from master branch; `v1` execution mode (FIFO) is the production default but version where it became default is unclear.

---

## References

- [n8n Workflow Execution Engine — DeepWiki](https://deepwiki.com/n8n-io/n8n/2-workflow-execution-engine)
- [n8n Execution Lifecycle — DeepWiki](https://deepwiki.com/n8n-io/n8n/2.1-execution-management)
- [n8n Data Access & Expression System — DeepWiki](https://deepwiki.com/n8n-io/n8n/2.3-workflow-data-access-and-expression-system)
- [workflow-execute.ts — GitHub source](https://github.com/n8n-io/n8n/blob/master/packages/core/src/execution-engine/workflow-execute.ts)
- [Execute Sub-workflow — n8n Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/)
- [Queue Mode Configuration — n8n Docs](https://docs.n8n.io/hosting/scaling/queue-mode/)
- [Queue Mode Guide — NextGrowth.ai](https://nextgrowth.ai/scaling-n8n-queue-mode-docker-compose/)
- [n8n Queue Mode — OpenCharts](https://community-charts.github.io/docs/charts/n8n/queue-mode)
- [Sub-workflows in queue mode — n8n Community](https://community.n8n.io/t/sub-workflows-in-queue-mode-are-all-depths-executed-by-the-same-worker/194272)
