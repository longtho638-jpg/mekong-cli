# Research Report: n8n Architecture Patterns for Algo-Trader RaaS AGI

**Date:** 2026-03-01
**Sources:** n8n GitHub (n8n-io/n8n), Gemini deep research x3, codebase inspection
**Scope:** 8 architectural patterns, mapping each to algo-trader (`/Users/macbookprom1/mekong-cli/apps/algo-trader`)

---

## Executive Summary

n8n is a mature, production-grade workflow automation platform whose architecture solves the same core problems faced by an algo-trading engine: DAG-based execution, plugin isolation, credential security, retry reliability, and queue-based scaling. Its monorepo separates **definitions** (`packages/workflow`) from **execution** (`packages/core`) from **orchestration** (`packages/cli`). The algo-trader already mirrors several n8n patterns (IStrategy, BotEngine, ConfigLoader) but lacks: encrypted credential vaulting, error-workflow routing, queue-based parallel scanning, and a formal event bus contract. These gaps are the direct implementation targets.

---

## Pattern 1: Node-Based Workflow Architecture

**Core Concept:** n8n models workflows as a Directed Acyclic Graph (DAG). Each node is an `INode` instance (config + type), executed by the engine which traverses from trigger nodes outward. Data flows between nodes as `INodeExecutionData[]` arrays — each item contains a `json` payload plus optional `binary` fields.

```typescript
// packages/workflow/src/interfaces.ts
interface INodeExecutionData {
  json: IDataObject;             // { [key: string]: any }
  binary?: IBinaryKeyData;       // files, buffers
  pairedItem?: IPairedItemData;  // tracks item lineage across splits/merges
}

// Connections: source node → { main: [[{ node, type, index }]] }
type IConnections = {
  [sourceNode: string]: {
    [type: string]: Array<Array<{ node: string; type: string; index: number }>>
  }
}
```

**Algo-Trader Mapping:**
- `INodeExecutionData.json` → `ISignal` (type, price, timestamp, metadata)
- Connections graph → strategy pipeline: `SpreadDetector` → `RiskFilter` → `OrderExecutor`
- `pairedItem` → trade lineage tracking (signal ID → order ID → fill ID)

**Current gap:** `BotEngine` hardwires strategy→execution. A DAG model would allow composable pipelines (signal → ensemble → risk → execution) without code changes.

---

## Pattern 2: Plugin/Node System

**Core Concept:** Nodes are registered in `package.json` under `n8n.nodes[]`. At startup, `NodeLoader` (`packages/cli`) scans `node_modules` for packages with `n8n` metadata and `dynamic import()`s each `.node.js` file. Multiple versions of a node coexist via `typeVersion` field, enabling zero-downtime upgrades.

```typescript
// package.json of a plugin
{
  "n8n": {
    "nodes": ["dist/nodes/BinanceNode.node.js"],
    "credentials": ["dist/credentials/BinanceApi.credentials.js"]
  }
}

// INodeType — the contract every node must implement
interface INodeType {
  description: INodeTypeDescription;  // name, displayName, inputs, outputs, properties
  execute?(context: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  trigger?(context: ITriggerFunctions): Promise<ITriggerResponse | undefined>;
  poll?(context: IPollFunctions): Promise<INodeExecutionData[][] | null>;
}
```

**Algo-Trader Mapping:**
- `INodeType` → `IStrategy` (already exists, matches `execute` pattern)
- `trigger()` → WebSocket tick listener per exchange
- `poll()` → REST candle fetcher (current `BotEngine` polling loop)
- `NodeLoader` → `StrategyLoader` (already in `src/core/StrategyLoader.ts`, extend to scan `node_modules`)

**Key TypeScript pattern — versioned loading:**
```typescript
// StrategyLoader: load by typeVersion for backward compat
const mod = await import(`./strategies/${name}.v${version}.js`);
```

---

## Pattern 3: Execution Engine

**Core Concept:** `WorkflowExecute` (`packages/core/src/execution-engine/WorkflowExecute.ts`) traverses the DAG starting from trigger nodes. It maintains an `executionData` map (nodeId → outputs) and an execution stack. Each node receives its predecessor's output. Failed nodes check `continueOnFail`; if false, execution stops and the error workflow is triggered.

```typescript
// Simplified WorkflowExecute pattern
class WorkflowExecute {
  async run(workflow: Workflow, data: IWorkflowExecuteData): Promise<IRun> {
    const startNodes = workflow.getStartNodes();
    for (const node of startNodes) {
      await this.runNode(node, data);
    }
  }

  private async runNode(node: INode, data: IWorkflowExecuteData): Promise<void> {
    const nodeType = this.nodeTypes.getByName(node.type);
    const result = await nodeType.execute(this.getExecuteContext(node, data));
    data.executionData.nodeExecutionStack.push({ node, data: result });
    // Traverse to connected nodes
    const nextNodes = workflow.getConnectedNodes(node.name);
    await Promise.all(nextNodes.map(n => this.runNode(n, data)));
  }
}
```

**Algo-Trader Mapping:**
- `WorkflowExecute.run()` → `BotEngine.start()` main loop
- `executionData` map → trade context object passed through pipeline stages
- Error workflow → `EmergencyStopWorkflow` (close all positions on critical failure)

---

## Pattern 4: Credential Management

**Core Concept:** `ICredentialType` defines credential structure; credentials are AES-256 encrypted with `N8N_ENCRYPTION_KEY` before storage. Decryption happens in-memory only within the execution context, just before `execute()` is called. Never stored in plaintext; never logged.

```typescript
// packages/workflow/src/interfaces.ts
interface ICredentialType {
  name: string;
  displayName: string;
  properties: INodeProperties[];   // fields: apiKey, secret, passphrase
  test?: ICredentialTestFunction;  // "Test Connection" endpoint
}

// packages/core/src/Cipher.ts — AES-256 encrypt/decrypt
class Cipher {
  encrypt(data: string, key: string): string { /* crypto-js AES */ }
  decrypt(data: string, key: string): string { /* crypto-js AES */ }
}

// Injection at execution time only
const credentials = await context.getCredentials('binanceApi');
// → decrypted in memory, never persisted to logs
```

**Algo-Trader Mapping:**
- Replace plaintext `ConfigLoader` env-var pattern with encrypted vault
- `ICredentialType` → `IExchangeCredential { exchangeId, apiKey, secret, passphrase?, testnet? }`
- Use `ALGO_ENCRYPTION_KEY` env var; encrypt credentials at rest in `config/credentials.enc.json`
- `test()` → call `exchange.fetchBalance()` on credential save to validate

**Current gap:** `src/utils/config.ts` reads API keys from env in plaintext. No encryption at rest.

---

## Pattern 5: Error Handling & Retry Patterns

**Core Concept:** Nodes declare `retryOnFail: boolean`, `maxTries: number`, `waitBetweenTries: ms`. The engine wraps execution in a retry loop. Separately, an "Error Workflow" (a second workflow triggered on failure) receives `executionId`, `error`, and `workflowData` — enabling autonomous recovery actions.

```typescript
// Node settings
interface INodeExecutionSettings {
  continueOnFail?: boolean;    // ignore errors, pass null to next node
  retryOnFail?: boolean;
  maxTries?: number;           // default: 3
  waitBetweenTries?: number;   // ms, default: 1000
}

// Error taxonomy
class NodeOperationError extends Error {
  // Internal logic errors: invalid params, missing data
  constructor(node: INode, message: string) { ... }
}
class NodeApiError extends NodeOperationError {
  // External API failures; wraps HTTP response
  httpCode?: string;  // '429', '401', '500'
  description?: string;
}

// Error workflow trigger
interface IErrorWorkflowData {
  execution: { id: string; error: Error; mode: WorkflowExecuteMode };
  workflow: { id: string; name: string };
}
```

**Algo-Trader Mapping:**
- CCXT calls → wrap in retry with `maxTries: 3`, `waitBetweenTries: 1000` for `NetworkError`
- `NodeApiError.httpCode === '429'` → exponential backoff (respect rate limits)
- Error Workflow → `EmergencyStopHandler`: on `NodeApiError` from `OrderExecutor`, trigger position-close script + Telegram alert
- `continueOnFail: true` on `SignalGenerator` (bad candle data shouldn't kill the bot)

```typescript
// Recommended pattern for ExchangeClient
async executeWithRetry<T>(fn: () => Promise<T>, maxTries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxTries) throw new NodeApiError(err);
      await sleep(1000 * attempt); // linear backoff, or exponential
    }
  }
}
```

---

## Pattern 6: Queue-Based Execution

**Core Concept:** In "queue mode", the n8n main process (producer) pushes `ExecutionId` to a Redis/BullMQ queue (`n8n.workflows`). Worker processes (`WorkerService`) subscribe and execute jobs concurrently. `--concurrency` flag controls per-worker parallelism. BullMQ events (`completed`, `failed`, `stalled`) update the database.

```typescript
// packages/core/src/Queue.ts
interface IJobData {
  executionId: string;
  loadStaticData?: boolean;
}

// Worker registration
const queue = new Queue('n8n.workflows', { redis: REDIS_URL });
const worker = new Worker('n8n.workflows', async (job: Job<IJobData>) => {
  await workflowRunner.run(job.data.executionId);
}, { concurrency: N8N_CONCURRENCY });

// Priority jobs
await queue.add('execution', jobData, { priority: 1 }); // 1 = highest
```

**Algo-Trader Mapping:**
- BullMQ queue for parallel market scanning (50 pairs → 50 jobs, 5 workers)
- Priority: `LIQUIDATION_CHECK` (priority 1) > `ORDER_EXECUTION` (2) > `DATA_LOG` (10)
- Stalled job detection → treat as execution failure, trigger error workflow
- Redis key: `algo-trader.executions`

```typescript
// Proposed queue structure
type AlgoJobType = 'scan' | 'execute' | 'log' | 'emergency';
interface IAlgoJob {
  jobType: AlgoJobType;
  symbol: string;
  strategyId: string;
  triggeredAt: number;
}
```

---

## Pattern 7: Event-Driven Architecture

**Core Concept:** `WorkflowExecute` extends `EventEmitter`. Key events: `nodeExecuteAfter` (per-node completion, used for data trimming + UI push), `workflowExecuteAfter` (full workflow done). The `activeWorkflowRunner` manages long-running trigger workflows. UI receives real-time updates via WebSocket push; queue workers use Redis pull.

```typescript
// packages/core/src/execution-engine/WorkflowExecute.ts
class WorkflowExecute extends EventEmitter {
  async runNode(node: INode): Promise<void> {
    const result = await nodeType.execute(context);
    this.emit('nodeExecuteAfter', { node, data: result, executionId });
  }

  async run(): Promise<IRun> {
    // ... traverse DAG ...
    this.emit('workflowExecuteAfter', { executionId, data: this.runData });
    return this.runData;
  }
}

// IRunExecutionData — full execution state snapshot
interface IRunExecutionData {
  resultData: {
    runData: { [nodeName: string]: ITaskData[] }; // per-node output history
    error?: ExecutionError;
    lastNodeExecuted?: string;
  };
  executionData?: IExecutionData; // remaining nodes to execute
}
```

**Algo-Trader Mapping:**
- `AgentEventBus` already exists in `src/a2ui/` — extend with typed events:
  ```typescript
  enum AgentEventType {
    SIGNAL_GENERATED = 'signalGenerated',
    ORDER_PLACED     = 'orderPlaced',
    ORDER_FILLED     = 'orderFilled',
    RISK_BREACH      = 'riskBreach',
    ERROR            = 'error',
  }
  ```
- `nodeExecuteAfter` → `tradeExecuteAfter`: snapshot order book + risk params on every trade attempt
- `workflowExecuteAfter` → `sessionSummary`: emit PnL + drawdown at end of each trading session

---

## Pattern 8: Configuration Cascade

**Core Concept:** n8n loads config in priority order: (1) hardcoded defaults → (2) `.n8n/config` JSON/YAML file → (3) `N8N_*` env vars (highest priority). Validated with Joi schema on startup — invalid config crashes the process early. `GenericHelpers.getBaseUrl()` resolves URL by checking multiple env vars in priority order.

```typescript
// packages/cli/src/config/index.ts — Joi schema validation
const configSchema = Joi.object({
  port: Joi.number().default(5678),
  webhookUrl: Joi.string().uri().optional(),
  encryptionKey: Joi.string().min(32).required(),
  database: Joi.object({ type: Joi.string().valid('sqlite', 'postgres') }),
});

// GenericHelpers.getBaseUrl() — cascade URL resolution
function getBaseUrl(): string {
  return process.env.WEBHOOK_URL
    ?? process.env.N8N_EDITOR_BASE_URL
    ?? `http://localhost:${config.port}`;
}
```

**Algo-Trader Mapping:**
- `src/utils/config.ts` `ConfigLoader` already does (YAML file → env override) — **add Joi validation**
- Use `ALGO_` prefix for all env vars: `ALGO_EXCHANGE_ID`, `ALGO_ENCRYPTION_KEY`
- Config cascade:
  ```
  config/defaults.yaml       ← base
  config/{NODE_ENV}.yaml     ← env-specific (testing, production)
  process.env.ALGO_*         ← highest priority (CI/CD overrides)
  ```
- Fail-fast Joi validation: missing `ALGO_ENCRYPTION_KEY` or invalid `ALGO_EXCHANGE_ID` → process.exit(1)

```typescript
// Recommended Joi schema addition
import Joi from 'joi';
const configSchema = Joi.object({
  exchange: Joi.object({
    id:     Joi.string().valid('binance','bybit','okx','kraken').required(),
    apiKey: Joi.string().min(10).required(),
    secret: Joi.string().min(10).required(),
  }),
  risk: Joi.object({
    maxDailyLossUsd:   Joi.number().positive().required(),
    maxPositionSizePct: Joi.number().min(0.01).max(1.0).required(),
  }),
  encryptionKey: Joi.string().min(32).required(),
});
```

---

## TypeScript Patterns Summary

| Pattern | n8n Usage | Algo-Trader Application |
|---------|-----------|------------------------|
| **Branded types** | `type WorkflowId = string & { __brand: 'WorkflowId' }` | `type AssetPair = string & { __brand: 'AssetPair' }` — prevent BTC/USDT ↔ ETH/USDT swap bugs |
| **Discriminated unions** | `ExecutionStatus: 'success' \| 'error' \| 'waiting'` | `OrderStatus: 'pending' \| 'filled' \| 'cancelled' \| 'error'` |
| **Generics** | `INodeExecutionData<T>` | `ISignal<T extends ISignalMetadata>` — typed per strategy |
| **Strategy pattern** | `INodeType.execute/trigger/poll` | `IStrategy.onCandle/init` (already implemented) |
| **Observer pattern** | `WorkflowExecute extends EventEmitter` | `AgentEventBus` (already exists, extend with typed events) |
| **Command pattern** | Workflow JSON = executable command object | Trade plan JSON = serializable intent for audit log |

---

## Implementation Priority for Algo-Trader

| Priority | Pattern | Gap | Effort |
|----------|---------|-----|--------|
| P1 | Credential encryption | Plaintext API keys in config | Medium |
| P1 | Retry with `NodeApiError` taxonomy | No retry in ExchangeClient | Low |
| P1 | Joi config validation | No schema validation | Low |
| P2 | Error workflow routing | No emergency stop flow | Medium |
| P2 | Typed event bus contract | AgentEventBus untyped | Low |
| P3 | BullMQ queue for parallel scanning | Single-threaded | High |
| P3 | Branded types for AssetPair/ExchangeId | Loose strings | Low |
| P3 | Config cascade (env-specific YAML) | Single config file | Low |

---

## Key Source Files in n8n Repo

| File | Relevance |
|------|-----------|
| `packages/workflow/src/interfaces.ts` | All core interfaces (INode, INodeType, INodeExecutionData) |
| `packages/core/src/execution-engine/WorkflowExecute.ts` | DAG execution engine |
| `packages/core/src/Cipher.ts` | AES-256 credential encryption |
| `packages/core/src/Queue.ts` | BullMQ integration |
| `packages/core/src/NodeExecuteFunctions.ts` | Retry logic, error wrapping |
| `packages/cli/src/config/index.ts` | Joi config validation |
| `packages/cli/src/ActiveWorkflowRunner.ts` | Long-running workflow management |
| `packages/cli/src/commands/worker.ts` | Queue worker entry point |

---

## Unresolved Questions

1. **Credential store backend:** n8n uses SQLite/Postgres for encrypted credential storage. For algo-trader, should this be a local encrypted JSON file, or integrate with a secrets manager (Vault, AWS Secrets Manager)? Depends on deployment model (single VPS vs cloud).
2. **Queue mode necessity:** Current algo-trader is single-exchange. BullMQ queue adds Redis dependency — worth it only if scanning 10+ pairs in parallel or running multi-exchange arbitrage at scale.
3. **n8n's `pairedItem` equivalent:** When implementing DAG pipeline, tracking signal lineage (which candle → which signal → which order) requires a `correlationId` pattern. Design not yet specified.
4. **Trigger node for WebSocket ticks:** n8n's `trigger()` pattern requires the node to manage its own WebSocket lifecycle. How should this interact with CCXT's `watchOHLCV()` in the polling loop? Needs architecture decision.
