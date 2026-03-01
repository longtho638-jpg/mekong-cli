# n8n Core Architecture Research
_Date: 2026-03-01 | Researcher: researcher-01_

## 1. Workflow Engine — Execution Model

- **DAG-based**: Workflows stored as JSON graph (nodes + connections). Engine loads from DB, resolves dependency order.
- **Two execution modes**:
  - **Main process** (default): `WorkflowRunner.runMainProcess()` → instantiates `WorkflowExecute` → runs in-process. Simple, low-overhead.
  - **Queue mode**: `WorkflowRunner.enqueueExecution()` → pushes job to Bull/Redis queue → dedicated worker processes via `JobProcessor.processJob()`. Horizontal scale.
- **Stack-based execution**: nodes execute sequentially per branch; parallel branches run concurrently.
- **State store**: all results in `runData` map (node name → `ITaskData[]`). Nodes in loops accumulate multiple entries.

## 2. Node Types

| Type | Role | Activation |
|------|------|-----------|
| Trigger | Starts workflow | Webhook, cron, poll, manual |
| Action/Regular | Transforms/sends data | Runs after upstream node |
| Webhook | HTTP listener trigger | POST/GET from external systems |
| Code | Custom JS/Python logic | Inline code execution |

- Trigger nodes are **always-on** — registered with n8n's webhook registry or scheduler at workflow activation.
- Regular nodes only run when upstream produces output.

## 3. Credential System

- **Encryption at rest**: all credentials encrypted with `N8N_ENCRYPTION_KEY` (AES) before DB write. Plain text if key absent.
- **Decryption on-demand**: credentials decrypted only at execution time, never stored in workflow JSON.
- **External secrets**: enterprise feature — pull secrets from HashiCorp Vault / AWS Secrets Manager at runtime.
- **Credential types**: API key, OAuth2 (with token refresh), Basic Auth, custom.
- **Sharing**: credentials scoped to owner by default; sharable to specific users/teams (enterprise).
- **Credential files**: TypeScript class implementing `ICredentialType`, defines fields (password, hidden, required) and test endpoint.

## 4. Node System — Discovery & Loading

- **npm-based packaging**: each node (or group) is an npm package. Core nodes in `packages/nodes-base/`. Community nodes installed via `npm install`.
- **Node discovery**: n8n scans configured `N8N_CUSTOM_EXTENSIONS` dirs + `node_modules` for packages with `n8n` key in `package.json`.
- **Registration**: node metadata (name, displayName, icon, inputs/outputs) declared in class decorating `INodeType`. Loaded into in-memory registry at startup.
- **Versioning**: nodes support `version` field; multiple versions can coexist. Node class returns version-appropriate execute logic.
- **Hot reload**: NOT supported natively — service restart required to pick up new node packages.
- **Credentials linking**: node declares `credentials[]` array; UI auto-presents matching credential types.

## 5. Execution Engine — Queue, Retry, Concurrency

- **Queue backend**: Bull (Redis). Jobs serialized as JSON payloads containing workflow + execution context.
- **Workers**: stateless Node.js processes; pull jobs from Bull queue, execute, write results back to DB.
- **Concurrency control**: `EXECUTIONS_PROCESS` env controls max concurrent executions per worker.
- **Retry logic**: configurable per node — `maxTries`, `waitBetweenTries`. Failed items can re-enter node.
- **Error workflows**: each workflow can designate an "error workflow" triggered on failure, receives error context.
- **Webhook processing**: `WebhookService` registers routes at activation; incoming HTTP → resolves workflow → pushes to execution queue or runs inline (for sync webhooks).
- **Execution timeout**: configurable global + per-workflow timeout; hung executions killed.

## 6. Data Flow & Event System

- **Standardized item format**: nodes exchange `INodeExecutionData[]`. Each item: `{ json: object, binary?: BinaryData }`.
- **Binary data**: handled separately — stored on filesystem or S3 (configurable). Only reference/metadata passed in item; avoids memory bloat.
- **Item-level execution**: most nodes iterate over input items, producing one output item per input (map pattern). Aggregate nodes collapse N→1.
- **Branching**: nodes can output to multiple named outputs (e.g., IF node: `true`/`false`). Each branch is an independent execution path.
- **No event bus between nodes**: data is passed synchronously via function return; no message broker between nodes within a single workflow execution.
- **Expressions**: `{{ $json.field }}` — template expressions evaluated at runtime against current item context.

## 7. Key Architectural Patterns (Relevant for AGI Adaptation)

| Pattern | n8n Implementation | Algo-Trader Applicability |
|---------|-------------------|--------------------------|
| DAG execution | JSON workflow graph | Strategy pipeline as DAG |
| Trigger + Action split | Separate node types | Market event triggers → signal actions |
| Item-based data flow | `INodeExecutionData[]` | Bar/tick data as items |
| Queue-based workers | Bull + Redis | Parallel strategy backtests |
| Error workflow | Dedicated fallback workflow | Circuit breaker on execution failure |
| External secrets | Vault integration | Exchange API key management |

## Sources
- [DeepWiki: Workflow Execution Engine](https://deepwiki.com/n8n-io/n8n/2-workflow-execution-engine)
- [Jimmy Song: n8n Deep Dive](https://jimmysong.io/blog/n8n-deep-dive/)
- [n8n Docs: Credentials Files](https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/)
- [n8n Docs: External Secrets](https://docs.n8n.io/external-secrets/)
- [n8n GitHub](https://github.com/n8n-io/n8n)
- [Credential Management DeepWiki](https://deepwiki.com/n8n-io/n8n-docs/6.3-credential-management-and-sharing)

## Unresolved Questions
1. Exact Bull queue schema — job payload structure not confirmed from public docs.
2. Binary data storage backend config (filesystem vs S3) — referenced but not detailed in sources found.
3. Whether n8n's webhook registry uses in-memory or Redis for HA failover across multiple main instances.
4. Node versioning co-existence mechanics — how engine resolves which version to run for saved workflows.
