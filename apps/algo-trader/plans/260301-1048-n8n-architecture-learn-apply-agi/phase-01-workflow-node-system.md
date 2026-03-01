# Phase 01: Workflow Node System

## Context Links
- [n8n Core Architecture Research](./research/researcher-01-n8n-core-architecture.md)
- [Existing IStrategy interface](../../src/interfaces/IStrategy.ts)
- [SignalGenerator pipeline](../../src/core/SignalGenerator.ts)
- [SignalFilter pipeline](../../src/core/SignalFilter.ts)

## Overview
- **Date:** 2026-03-01
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h

Introduce a composable node abstraction for trading pipelines. Inspired by n8n's `INodeType` + `INodeExecutionData[]` pattern. Each node: typed input -> process -> typed output. Nodes are pure functions with metadata.

## Key Insights

1. n8n nodes exchange `INodeExecutionData[]` (array of `{json, binary}` items). For trading: items = market data snapshots, signals, orders.
2. n8n separates Trigger nodes (start workflow) from Action nodes (process data). Trading analog: DataSource triggers vs. Indicator/Signal/Risk/Execution action nodes.
3. Existing `IStrategy.onCandle()` is essentially a node: candle in -> signal out. Generalize this.
4. n8n's node metadata (name, description, inputs/outputs) enables composability. Add same to trading nodes.

## Requirements

### Functional
- Define `ITradingNode<TInput, TOutput>` generic interface
- Define `NodeContext` carrying runtime state (symbol, timeframe, credentials ref)
- Define standard data types: `MarketDataItem`, `SignalItem`, `OrderItem`, `RiskCheckItem`
- Create base node classes: `TriggerNode`, `ActionNode`
- Nodes must declare input/output types for pipeline validation

### Non-Functional
- Zero external dependencies (pure TypeScript)
- Each node file < 200 lines
- No `any` types
- Nodes must be stateless where possible (state in context)

## Architecture

```
src/nodes/
  interfaces/
    trading-node.ts        # ITradingNode<TIn, TOut>, NodeContext, NodeMetadata
    node-data-types.ts     # MarketDataItem, SignalItem, OrderItem, RiskCheckItem
  base/
    trigger-node.ts        # Abstract TriggerNode (starts pipeline)
    action-node.ts         # Abstract ActionNode (transforms data)
  sources/
    price-feed-node.ts     # TriggerNode: emits MarketDataItem from exchange/mock
    candle-stream-node.ts  # TriggerNode: emits candle batches
  indicators/
    rsi-node.ts            # ActionNode: MarketDataItem -> SignalItem
    sma-node.ts            # ActionNode: MarketDataItem -> MarketDataItem (enriched)
    macd-node.ts           # ActionNode: MarketDataItem -> SignalItem
  signals/
    signal-consensus-node.ts  # ActionNode: SignalItem[] -> ConsensusSignalItem
    signal-filter-node.ts     # ActionNode: ConsensusSignalItem -> FilteredSignalItem
  risk/
    position-sizer-node.ts    # ActionNode: FilteredSignalItem -> OrderItem
    drawdown-guard-node.ts    # ActionNode: OrderItem -> OrderItem | null
  execution/
    order-executor-node.ts    # ActionNode: OrderItem -> ExecutionResultItem
```

### Core Interfaces

```typescript
// trading-node.ts
interface NodeMetadata {
  name: string;
  description: string;
  category: 'trigger' | 'indicator' | 'signal' | 'risk' | 'execution';
  version: number;
}

interface NodeContext {
  symbol: string;
  timeframe: string;
  executionId: string;
  credentialRef?: string;
  state: Map<string, unknown>;  // Per-node mutable state
}

interface ITradingNode<TInput, TOutput> {
  metadata: NodeMetadata;
  execute(input: TInput, context: NodeContext): Promise<TOutput>;
  validate?(input: TInput): boolean;  // Optional pre-check
}

// Trigger variant (no input, produces output)
interface ITriggerNode<TOutput> {
  metadata: NodeMetadata;
  start(context: NodeContext): AsyncIterable<TOutput>;
  stop(): Promise<void>;
}
```

### Standard Data Types

```typescript
// node-data-types.ts
interface MarketDataItem {
  symbol: string;
  timestamp: number;
  candle: ICandle;
  enrichments?: Record<string, number>;  // indicator values
}

interface SignalItem {
  type: SignalType;
  price: number;
  timestamp: number;
  source: string;        // which node produced it
  confidence: number;    // 0-1
  metadata?: Record<string, unknown>;
}

interface OrderItem {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  type: 'market' | 'limit';
  riskChecked: boolean;
  metadata?: Record<string, unknown>;
}

interface ExecutionResultItem {
  orderId: string;
  status: 'filled' | 'partial' | 'failed';
  filledAmount: number;
  filledPrice: number;
  fee: number;
  timestamp: number;
  error?: string;
}
```

## Related Code Files

### Files to Create
- `src/nodes/interfaces/trading-node.ts`
- `src/nodes/interfaces/node-data-types.ts`
- `src/nodes/base/trigger-node.ts`
- `src/nodes/base/action-node.ts`
- `src/nodes/indicators/rsi-node.ts`
- `src/nodes/indicators/sma-node.ts`
- `src/nodes/signals/signal-consensus-node.ts`
- `src/nodes/risk/position-sizer-node.ts`
- `src/nodes/execution/order-executor-node.ts`

### Files to Reference (read-only)
- `src/interfaces/IStrategy.ts` — existing signal types
- `src/interfaces/ICandle.ts` — candle data format
- `src/core/SignalGenerator.ts` — consensus pattern to adapt
- `src/core/SignalFilter.ts` — filter pattern to adapt
- `src/core/RiskManager.ts` — position sizing to wrap
- `src/analysis/indicators.ts` — indicator math to reuse

## Implementation Steps

1. Create `src/nodes/interfaces/trading-node.ts` — `ITradingNode`, `ITriggerNode`, `NodeContext`, `NodeMetadata`
2. Create `src/nodes/interfaces/node-data-types.ts` — all item types
3. Create `src/nodes/base/action-node.ts` — abstract class implementing `ITradingNode`, adds logging/timing
4. Create `src/nodes/base/trigger-node.ts` — abstract class implementing `ITriggerNode`, manages lifecycle
5. Create `src/nodes/indicators/rsi-node.ts` — wraps existing `Indicators.rsi()` as ActionNode
6. Create `src/nodes/indicators/sma-node.ts` — wraps existing `Indicators.sma()`
7. Create `src/nodes/signals/signal-consensus-node.ts` — wraps `SignalGenerator` as node
8. Create `src/nodes/risk/position-sizer-node.ts` — wraps `RiskManager.calculatePositionSize()`
9. Create `src/nodes/execution/order-executor-node.ts` — wraps `ExchangeClient` order creation
10. Write unit tests for each node (pure function = easy to test)

## Todo List

- [ ] Define `ITradingNode<TIn, TOut>` interface
- [ ] Define `ITriggerNode<TOut>` interface
- [ ] Define all item data types
- [ ] Implement `ActionNode` abstract base
- [ ] Implement `TriggerNode` abstract base
- [ ] Implement RSI indicator node
- [ ] Implement SMA indicator node
- [ ] Implement signal consensus node
- [ ] Implement position sizer node
- [ ] Implement order executor node
- [ ] Write unit tests (>=80% coverage)
- [ ] Verify `npm run build` passes

## Success Criteria

- All node interfaces compile with TS strict mode
- At least 5 concrete node implementations
- Each node independently testable (no side effects in tests)
- Node execute() is pure: same input + context = same output
- Zero `any` types across all node files

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Over-abstraction (YAGNI) | Medium | Start with 5 nodes, add more only when pipeline builder needs them |
| Breaking existing IStrategy | High | Nodes are NEW layer, IStrategy untouched. Adapter wraps IStrategy as node |
| Performance overhead from generics | Low | Node overhead is one function call; trading latency is network-bound |

## Security Considerations

- Nodes must NOT store credentials internally; use `context.credentialRef` for vault lookup
- `NodeContext.state` must not leak between pipeline runs
- Order executor node must validate amount/price bounds before forwarding

## Next Steps

- Phase 2 consumes these interfaces to build the pipeline builder
- Consider adapter: `strategyToNode(strategy: IStrategy)` for backward compat
