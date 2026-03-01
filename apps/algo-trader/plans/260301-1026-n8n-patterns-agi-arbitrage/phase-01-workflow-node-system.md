## Phase 1: Workflow Node System

### Context
- Parent: [plan.md](plan.md)
- n8n pattern: `INodeType.execute(INodeExecutionData[])` — uniform interface, flat list with ID refs
- Docs: `docs/system-architecture.md`, `docs/code-standards.md`

### Overview
- Date: 2026-03-01
- Priority: P2
- Description: Create a workflow node abstraction for the AGI arbitrage engine. Each node processes market data and outputs trade signals. Nodes are composable into pipelines.
- Implementation status: pending
- Review status: pending

### Key Insights (from n8n)
- n8n nodes have uniform `execute()` interface → easy to swap/compose
- Flat component list with ID refs → LLM-friendly, easy serialization
- Node discovery via package.json scan → zero-config plugin system
- Data contract: `INodeExecutionData[]` flows between all nodes

### Requirements
- Uniform `IWorkflowNode` interface: `process(input: NodeInput): NodeOutput`
- Built-in node types: `PriceFeedNode`, `SpreadDetectorNode`, `SignalScorerNode`, `ExecutorNode`
- Pipeline builder: chain nodes into executable workflows
- Each node independent, testable in isolation

### Architecture
```
PriceFeedNode → SpreadDetectorNode → SignalScorerNode → ExecutorNode
     ↓                  ↓                   ↓                ↓
  MarketData      ArbitrageOpp        ScoredSignal      ExecutionResult
```

### Related Code Files
- NEW: `packages/vibe-arbitrage-engine/workflow-node-types.ts` — interfaces
- NEW: `packages/vibe-arbitrage-engine/workflow-pipeline-builder.ts` — pipeline builder
- NEW: `packages/vibe-arbitrage-engine/workflow-builtin-nodes.ts` — 4 built-in nodes

### Implementation Steps
1. Define `IWorkflowNode`, `NodeInput`, `NodeOutput` interfaces
2. Create `WorkflowPipelineBuilder` class with `addNode()`, `build()`, `execute()`
3. Implement 4 built-in nodes wrapping existing components
4. Export from package index

### Todo
- [ ] Define workflow node interfaces
- [ ] Implement WorkflowPipelineBuilder
- [ ] Implement 4 built-in nodes
- [ ] Export from index.ts

### Success Criteria
- Pipeline executes end-to-end with mock data
- Each node independently testable
- No breaking changes to existing code

### Risk Assessment
- LOW: Pure additive — no existing code modified
- MEDIUM: Over-abstraction risk → keep it simple, YAGNI

### Security
- Nodes must not hold credentials directly (delegate to CredentialVault)

### Next Steps
- Phase 2: Error workflow handler
