# Phase 02: Strategy Pipeline Builder

## Context Links
- [Phase 01: Node System](./phase-01-workflow-node-system.md) (prerequisite)
- [n8n DAG execution model](./research/researcher-01-n8n-core-architecture.md#1-workflow-engine)
- [n8n Sub-workflow pattern](./research/researcher-02-n8n-scaling-ai-patterns.md#3-sub-workflow-pattern)
- [Existing StrategyEnsemble](../../src/core/StrategyEnsemble.ts)

## Overview
- **Date:** 2026-03-01
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Depends on:** Phase 01

DAG-based pipeline builder that chains trading nodes. Users compose workflows: `TriggerNode -> IndicatorNode[] -> SignalNode -> RiskNode -> ExecutionNode`. Engine resolves execution order, handles branching (IF/ELSE on signal type), parallel fan-out.

## Key Insights

1. n8n stores workflows as JSON DAG: `{nodes: [...], connections: {...}}`. For algo-trader: pipeline definition = TypeScript builder pattern (code-first, not JSON-first). JSON serialization optional later.
2. n8n's branching via named outputs (IF node: true/false). Trading analog: signal type routing (BUY branch, SELL branch, HOLD=skip).
3. n8n's sub-workflow = reusable pipeline fragment. Trading: sub-pipeline for "fetch + compute indicators" reusable across strategies.
4. Existing `StrategyEnsemble` is a parallel fan-out pattern already. Pipeline builder generalizes this.

## Requirements

### Functional
- `PipelineBuilder` fluent API: `.trigger(node).pipe(node).branch(condition, thenNode, elseNode).build()`
- `PipelineEngine` executes built pipeline, respecting DAG order
- Support linear chains, fan-out (parallel), fan-in (merge), conditional branching
- Pipeline validation at build time (type compatibility between connected nodes)
- `PipelineDefinition` serializable to JSON for storage/replay
- Adapter: `strategyToNode()` wraps existing IStrategy as node for backward compat

### Non-Functional
- Builder pattern validates at build time, not runtime
- Execution engine handles async nodes natively
- Pipeline execution produces audit trail (which nodes ran, timing, intermediate results)

## Architecture

```
src/pipeline/
  pipeline-builder.ts         # Fluent builder API
  pipeline-definition.ts      # DAG data structure (nodes + edges)
  pipeline-engine.ts          # Executes pipeline definition
  pipeline-validator.ts       # Pre-run type/connection validation
  adapters/
    strategy-adapter.ts       # Wraps IStrategy as ITradingNode
    ensemble-adapter.ts       # Wraps StrategyEnsemble as pipeline
```

### Pipeline Definition (DAG)

```typescript
// pipeline-definition.ts
interface PipelineEdge {
  fromNodeId: string;
  toNodeId: string;
  outputName: string;  // 'default', 'buy', 'sell', 'error'
}

interface PipelineNodeEntry {
  id: string;
  node: ITradingNode<unknown, unknown>;
  position: number;  // Execution order (topologically sorted)
}

interface PipelineDefinition {
  id: string;
  name: string;
  version: number;
  nodes: PipelineNodeEntry[];
  edges: PipelineEdge[];
  triggerNodeId: string;
}
```

### Builder API

```typescript
// pipeline-builder.ts
class PipelineBuilder {
  private nodes: Map<string, PipelineNodeEntry>;
  private edges: PipelineEdge[];

  trigger(node: ITriggerNode<unknown>): PipelineBuilder;
  pipe(node: ITradingNode<unknown, unknown>): PipelineBuilder;
  branch(
    condition: (output: unknown) => string, // returns output name
    branches: Record<string, ITradingNode<unknown, unknown>>
  ): PipelineBuilder;
  fanOut(nodes: ITradingNode<unknown, unknown>[]): PipelineBuilder;
  fanIn(mergeNode: ITradingNode<unknown[], unknown>): PipelineBuilder;
  build(): PipelineDefinition;
}

// Usage:
const pipeline = new PipelineBuilder()
  .trigger(priceFeedNode)
  .pipe(smaNode)
  .pipe(rsiNode)
  .pipe(signalConsensusNode)
  .branch(
    (signal) => signal.type === 'BUY' ? 'buy' : 'sell',
    {
      buy: positionSizerNode,
      sell: closePositionNode,
    }
  )
  .pipe(orderExecutorNode)
  .build();
```

### Engine Execution

```typescript
// pipeline-engine.ts
class PipelineEngine {
  constructor(private definition: PipelineDefinition);

  async run(context: NodeContext): Promise<PipelineResult> {
    // 1. Topological sort nodes
    // 2. Execute trigger, collect output
    // 3. For each downstream node in order:
    //    - Resolve input from upstream node's output
    //    - Execute node
    //    - Store result in runData map
    // 4. Return complete run data + audit trail
  }

  // Stream mode: trigger emits continuously, pipeline re-runs per item
  async *stream(context: NodeContext): AsyncIterable<PipelineResult>;
}
```

## Related Code Files

### Files to Create
- `src/pipeline/pipeline-definition.ts`
- `src/pipeline/pipeline-builder.ts`
- `src/pipeline/pipeline-engine.ts`
- `src/pipeline/pipeline-validator.ts`
- `src/pipeline/adapters/strategy-adapter.ts`
- `src/pipeline/adapters/ensemble-adapter.ts`

### Files to Reference
- `src/nodes/interfaces/trading-node.ts` (Phase 01)
- `src/core/StrategyEnsemble.ts` — parallel execution pattern
- `src/core/BotEngine.ts` — current orchestration (pipeline replaces this flow)

## Implementation Steps

1. Create `src/pipeline/pipeline-definition.ts` — DAG data structures
2. Create `src/pipeline/pipeline-validator.ts` — check edges connect compatible node types
3. Create `src/pipeline/pipeline-builder.ts` — fluent API with `trigger()`, `pipe()`, `branch()`, `fanOut()`, `fanIn()`, `build()`
4. Create `src/pipeline/pipeline-engine.ts` — topological sort + sequential execution with branch routing
5. Add stream mode to engine (AsyncIterable for continuous trigger)
6. Create `src/pipeline/adapters/strategy-adapter.ts` — wraps `IStrategy` as `ITradingNode<MarketDataItem, SignalItem>`
7. Create `src/pipeline/adapters/ensemble-adapter.ts` — wraps `StrategyEnsemble` as fan-out pipeline
8. Write integration test: build pipeline with 3 nodes, verify execution order + data flow
9. Write test: branch routing sends BUY signal to buy branch, SELL to sell branch

## Todo List

- [ ] Define `PipelineDefinition`, `PipelineEdge`, `PipelineNodeEntry`
- [ ] Implement `PipelineValidator` (type-check edges)
- [ ] Implement `PipelineBuilder` fluent API
- [ ] Implement `PipelineEngine.run()`
- [ ] Implement `PipelineEngine.stream()` (async iterable)
- [ ] Implement `strategyToNode()` adapter
- [ ] Implement `ensembleToPipeline()` adapter
- [ ] Write unit tests for builder
- [ ] Write integration test for full pipeline execution
- [ ] Verify `npm run build` passes

## Success Criteria

- Can build a 5-node pipeline using builder API (trigger -> indicator -> signal -> risk -> execution)
- Pipeline engine executes nodes in correct topological order
- Branch routing works (BUY/SELL paths)
- Existing IStrategy works via adapter without modification
- Pipeline result includes timing per node (audit trail)

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| DAG cycle detection | Medium | `pipeline-validator.ts` must detect cycles at build time |
| Type erasure in generic chains | Medium | Use runtime type tags on node metadata to validate connections |
| Over-engineering builder API | Low | Start with linear `.pipe()` only; add branching after core works |

## Security Considerations

- Pipeline definitions should not contain credentials; only `credentialRef` strings
- Serialized pipeline JSON must be validated before loading (schema check)
- Pipeline engine must timeout if any node hangs (configurable per-node timeout)

## Next Steps

- Phase 3 integrates queue to execute pipelines per symbol in parallel
- Consider CLI command: `algo-trader pipeline run <definition.json>`
